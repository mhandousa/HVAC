import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

// Tolerance constants
const TOLERANCES = {
  AIRFLOW_PERCENT: 5,        // ±5% CFM tolerance
  CAPACITY_MIN_PERCENT: 100, // Equipment must meet 100% of load
  CAPACITY_MAX_PERCENT: 130, // Equipment shouldn't exceed 130%
  FLOW_PERCENT: 5,           // ±5% GPM tolerance
  PRESSURE_WARN_PERCENT: 10, // Warn at 10% over
  PRESSURE_FAIL_PERCENT: 20, // Fail at 20% over
  DELTA_T_DEFAULT: 10,       // Default ΔT for GPM calculations
  NC_MARGIN_WARN: 5,         // Warn if margin < 5 dB below target
  NC_MARGIN_FAIL: 0,         // Fail if NC exceeds target
  // Cross-tool validation tolerances
  TERMINAL_CFM_PERCENT: 10,  // ±10% terminal CFM tolerance
  AHU_CAPACITY_MIN: 100,     // AHU must meet 100% of loads
  AHU_CAPACITY_MAX: 130,     // AHU shouldn't exceed 130%
  VRF_RATIO_MIN: 50,         // VRF minimum ratio %
  VRF_RATIO_MAX: 130,        // VRF maximum ratio %
  TERMINAL_TOTAL_VS_AHU: 5,  // ±5% terminal sum vs AHU
};

// Saudi NC standards by space type
const SAUDI_NC_STANDARDS: Record<string, { target: number; description: string }> = {
  office: { target: 40, description: 'Private Office' },
  open_office: { target: 45, description: 'Open Plan Office' },
  conference: { target: 30, description: 'Conference Room' },
  hospital_patient: { target: 35, description: 'Hospital Patient Room' },
  classroom: { target: 35, description: 'Classroom' },
  hotel_room: { target: 35, description: 'Hotel Guest Room' },
  retail: { target: 45, description: 'Retail Space' },
  restaurant: { target: 45, description: 'Restaurant' },
  auditorium: { target: 25, description: 'Auditorium/Theater' },
  library: { target: 35, description: 'Library' },
  mosque: { target: 30, description: 'Mosque/Place of Worship' },
};

export type ValidationStatus = 'pass' | 'fail' | 'warning' | 'info';
export type ValidationCategory = 'airflow' | 'capacity' | 'hydronic' | 'sizing' | 'equipment' | 'linkage' | 'acoustic';

export interface ValidationCheck {
  id: string;
  category: ValidationCategory;
  name: string;
  description: string;
  status: ValidationStatus;
  expected: number | string;
  actual: number | string;
  deviation?: number;
  unit: string;
  source: string;
  target: string;
  recommendation?: string;
}

export interface ZoneValidation {
  zoneId: string;
  zoneName: string;
  buildingName?: string;
  floorName?: string;
  checks: ValidationCheck[];
  overallStatus: ValidationStatus;
  passCount: number;
  failCount: number;
  warningCount: number;
}

export interface SystemValidation {
  systemId: string;
  systemName: string;
  systemType: 'duct' | 'pipe' | 'ahu' | 'vrf'; // Extended with ahu and vrf
  checks: ValidationCheck[];
  overallStatus: ValidationStatus;
  passCount: number;
  failCount: number;
  warningCount: number;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  affectedItems: string[];
}

export interface CrossToolValidationSummary {
  zoneLoadVsTerminal: { pass: number; fail: number; warning: number };
  terminalVsAhu: { pass: number; fail: number; warning: number };
  vrfCapacityRatio: { pass: number; fail: number; warning: number };
  diffuserAcoustic: { pass: number; fail: number; warning: number };
  // Equipment selection tool validations
  ahuVsCoil: { pass: number; fail: number; warning: number };
  ahuVsFilter: { pass: number; fail: number; warning: number };
  equipmentVsTower: { pass: number; fail: number; warning: number };
  chwPlantVsChiller: { pass: number; fail: number; warning: number };
}

export interface DesignValidationReport {
  projectId: string;
  projectName: string;
  generatedAt: string;
  overallStatus: ValidationStatus;
  summary: {
    totalChecks: number;
    passCount: number;
    failCount: number;
    warningCount: number;
    infoCount: number;
    completionScore: number;
  };
  stageStatus: {
    loadCalculations: { count: number; hasData: boolean };
    equipmentSelections: { count: number; hasData: boolean; linkedToLoads: number };
    terminalUnits: { count: number; hasData: boolean };
    ahuConfigurations: { count: number; hasData: boolean };
    vrfSystems: { count: number; hasData: boolean };
    ductSystems: { count: number; hasData: boolean; linkedToLoads: number };
    pipeSystems: { count: number; hasData: boolean; linkedToLoads: number };
    // Equipment selection tools
    coilSelections: { count: number; hasData: boolean; linkedToAhu: number };
    filterSelections: { count: number; hasData: boolean; linkedToAhu: number };
    coolingTowerSelections: { count: number; hasData: boolean; linkedToPlant: number };
    chillerSelections: { count: number; hasData: boolean; linkedToPlant: number };
  };
  zoneValidations: ZoneValidation[];
  systemValidations: SystemValidation[];
  recommendations: Recommendation[];
  crossToolValidation: CrossToolValidationSummary;
}

function calculateDeviation(expected: number, actual: number): number {
  if (expected === 0) return actual === 0 ? 0 : 100;
  return ((actual - expected) / expected) * 100;
}

function getStatusFromDeviation(
  deviation: number,
  tolerancePercent: number,
  isCapacity = false
): ValidationStatus {
  const absDeviation = Math.abs(deviation);
  
  if (isCapacity) {
    // For capacity, undersizing is a fail, oversizing up to 130% is pass
    if (deviation < 0) return 'fail';
    if (deviation > 30) return 'warning';
    return 'pass';
  }
  
  if (absDeviation <= tolerancePercent) return 'pass';
  if (absDeviation <= tolerancePercent * 2) return 'warning';
  return 'fail';
}

export function useDesignValidation(projectId: string | undefined) {
  const { data: organization } = useOrganization();

  // Fetch load calculations
  const { data: loadCalculations, isLoading: loadCalcsLoading } = useQuery({
    queryKey: ['load-calculations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('load_calculations')
        .select(`
          *,
          zone:zones(id, name, floor_id, floors(id, name, building_id, buildings(id, name)))
        `)
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch equipment selections
  const { data: equipmentSelections, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment-selections', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('equipment_selections')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch duct systems with segments
  const { data: ductSystems, isLoading: ductLoading } = useQuery({
    queryKey: ['duct-systems-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('duct_systems')
        .select(`
          *,
          segments:duct_segments(*)
        `)
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch pipe systems with segments
  const { data: pipeSystems, isLoading: pipeLoading } = useQuery({
    queryKey: ['pipe-systems-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('pipe_systems')
        .select(`
          *,
          segments:pipe_segments(*)
        `)
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch project info
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-validation', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch diffuser/grilles for acoustic validation
  const { data: diffuserGrilles, isLoading: diffuserLoading } = useQuery({
    queryKey: ['diffuser-grilles-acoustic', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      // Get diffusers through duct systems for this project
      const { data: ductSystemsData, error: ductError } = await supabase
        .from('duct_systems')
        .select('id')
        .eq('project_id', projectId);
      if (ductError) throw ductError;
      
      if (!ductSystemsData || ductSystemsData.length === 0) return [];
      
      const ductSystemIds = ductSystemsData.map(ds => ds.id);
      const { data, error } = await supabase
        .from('diffuser_grilles')
        .select('*, zone:zones(id, name, space_type)')
        .in('duct_system_id', ductSystemIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch terminal unit selections for cross-tool validation
  const { data: terminalUnits, isLoading: terminalLoading } = useQuery({
    queryKey: ['terminal-unit-selections-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('terminal_unit_selections')
        .select('*, zone:zones(id, name, space_type)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch AHU configurations for cross-tool validation
  const { data: ahuConfigurations, isLoading: ahuLoading } = useQuery({
    queryKey: ['ahu-configurations-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('ahu_configurations')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch VRF systems for cross-tool validation
  const { data: vrfSystems, isLoading: vrfLoading } = useQuery({
    queryKey: ['vrf-systems-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('vrf_systems')
        .select('*, indoor_units:vrf_indoor_units(*)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch coil selections for cross-tool validation
  const { data: coilSelections, isLoading: coilLoading } = useQuery({
    queryKey: ['coil-selections-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('coil_selections')
        .select('*, ahu:ahu_configurations(id, ahu_name, design_cfm)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch filter selections for cross-tool validation
  const { data: filterSelections, isLoading: filterLoading } = useQuery({
    queryKey: ['filter-selections-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('filter_selections')
        .select('*, ahu:ahu_configurations(id, ahu_name, design_cfm)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch cooling tower selections for cross-tool validation
  const { data: coolingTowerSelections, isLoading: coolingTowerLoading } = useQuery({
    queryKey: ['cooling-tower-selections-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('cooling_tower_selections')
        .select('*, plant:chilled_water_plants(id, plant_name, total_installed_capacity_tons)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch chiller selections for cross-tool validation
  const { data: chillerSelections, isLoading: chillerLoading } = useQuery({
    queryKey: ['chiller-selections-validation', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('chiller_selections')
        .select('*, plant:chilled_water_plants(id, plant_name, design_cooling_load_tons)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const isLoading = loadCalcsLoading || equipmentLoading || ductLoading || pipeLoading || projectLoading || diffuserLoading || terminalLoading || ahuLoading || vrfLoading || coilLoading || filterLoading || coolingTowerLoading || chillerLoading;

  // Generate validation report
  const validationReport = useMemo<DesignValidationReport | null>(() => {
    if (!projectId || !project) return null;

    const allChecks: ValidationCheck[] = [];
    const zoneValidations: ZoneValidation[] = [];
    const systemValidations: SystemValidation[] = [];
    const recommendations: Recommendation[] = [];

    // Stage status
    const linkedEquipment = (equipmentSelections || []).filter(es => es.load_calculation_id);
    const linkedDuct = (ductSystems || []).filter(ds => ds.load_calculation_id);
    const linkedPipe = (pipeSystems || []).filter(ps => ps.load_calculation_id);

    // Equipment selection tool linkage counts
    const linkedCoils = (coilSelections || []).filter(c => c.ahu_configuration_id);
    const linkedFilters = (filterSelections || []).filter(f => f.ahu_configuration_id);
    const linkedTowers = (coolingTowerSelections || []).filter(ct => ct.chw_plant_id);
    const linkedChillers = (chillerSelections || []).filter(cs => cs.chw_plant_id);

    const stageStatus = {
      loadCalculations: {
        count: loadCalculations?.length || 0,
        hasData: (loadCalculations?.length || 0) > 0,
      },
      equipmentSelections: {
        count: equipmentSelections?.length || 0,
        hasData: (equipmentSelections?.length || 0) > 0,
        linkedToLoads: linkedEquipment.length,
      },
      terminalUnits: {
        count: terminalUnits?.length || 0,
        hasData: (terminalUnits?.length || 0) > 0,
      },
      ahuConfigurations: {
        count: ahuConfigurations?.length || 0,
        hasData: (ahuConfigurations?.length || 0) > 0,
      },
      vrfSystems: {
        count: vrfSystems?.length || 0,
        hasData: (vrfSystems?.length || 0) > 0,
      },
      ductSystems: {
        count: ductSystems?.length || 0,
        hasData: (ductSystems?.length || 0) > 0,
        linkedToLoads: linkedDuct.length,
      },
      pipeSystems: {
        count: pipeSystems?.length || 0,
        hasData: (pipeSystems?.length || 0) > 0,
        linkedToLoads: linkedPipe.length,
      },
      // Equipment selection tools
      coilSelections: {
        count: coilSelections?.length || 0,
        hasData: (coilSelections?.length || 0) > 0,
        linkedToAhu: linkedCoils.length,
      },
      filterSelections: {
        count: filterSelections?.length || 0,
        hasData: (filterSelections?.length || 0) > 0,
        linkedToAhu: linkedFilters.length,
      },
      coolingTowerSelections: {
        count: coolingTowerSelections?.length || 0,
        hasData: (coolingTowerSelections?.length || 0) > 0,
        linkedToPlant: linkedTowers.length,
      },
      chillerSelections: {
        count: chillerSelections?.length || 0,
        hasData: (chillerSelections?.length || 0) > 0,
        linkedToPlant: linkedChillers.length,
      },
    };

    // Cross-tool validation counters
    const crossToolCounters = {
      zoneLoadVsTerminal: { pass: 0, fail: 0, warning: 0 },
      terminalVsAhu: { pass: 0, fail: 0, warning: 0 },
      vrfCapacityRatio: { pass: 0, fail: 0, warning: 0 },
      diffuserAcoustic: { pass: 0, fail: 0, warning: 0 },
      // Equipment selection tool counters
      ahuVsCoil: { pass: 0, fail: 0, warning: 0 },
      ahuVsFilter: { pass: 0, fail: 0, warning: 0 },
      equipmentVsTower: { pass: 0, fail: 0, warning: 0 },
      chwPlantVsChiller: { pass: 0, fail: 0, warning: 0 },
    };

    // Zone-level validations
    (loadCalculations || []).forEach((loadCalc) => {
      const zoneChecks: ValidationCheck[] = [];
      const zoneName = (loadCalc as any).zone?.name || loadCalc.calculation_name;
      const buildingName = (loadCalc as any).zone?.floors?.buildings?.name;
      const floorName = (loadCalc as any).zone?.floors?.name;

      // 1. Equipment capacity check
      const matchingEquipment = (equipmentSelections || []).find(
        es => es.load_calculation_id === loadCalc.id
      );
      
      if (matchingEquipment) {
        const expectedTons = loadCalc.cooling_load_tons || 0;
        const actualTons = matchingEquipment.required_capacity_tons || 0;
        const deviation = calculateDeviation(expectedTons, actualTons);
        const status = getStatusFromDeviation(deviation, TOLERANCES.CAPACITY_MAX_PERCENT - 100, true);

        zoneChecks.push({
          id: `capacity-${loadCalc.id}`,
          category: 'capacity',
          name: 'Equipment Capacity',
          description: 'Equipment capacity vs calculated load',
          status,
          expected: expectedTons,
          actual: actualTons,
          deviation,
          unit: 'tons',
          source: 'Load Calculation',
          target: matchingEquipment.selection_name,
          recommendation: status === 'fail' 
            ? `Equipment undersized. Increase capacity from ${actualTons.toFixed(1)} to at least ${expectedTons.toFixed(1)} tons.`
            : status === 'warning'
            ? `Equipment oversized by ${deviation.toFixed(0)}%. Consider smaller unit for efficiency.`
            : undefined,
        });
      } else if (loadCalc.cooling_load_tons) {
        zoneChecks.push({
          id: `capacity-missing-${loadCalc.id}`,
          category: 'linkage',
          name: 'Equipment Selection Missing',
          description: 'No equipment selection linked to this load calculation',
          status: 'info',
          expected: loadCalc.cooling_load_tons,
          actual: 'Not selected',
          unit: 'tons',
          source: 'Load Calculation',
          target: 'Equipment Selection',
          recommendation: 'Create equipment selection linked to this load calculation.',
        });
      }

      // 2. Airflow (CFM) check - duct segments for this zone
      if (loadCalc.cfm_required) {
        const zoneId = loadCalc.zone_id;
        let zoneDuctCfm = 0;
        let ductSystemName = '';
        
        (ductSystems || []).forEach(ds => {
          const segments = (ds as any).segments || [];
          segments.forEach((seg: any) => {
            if (seg.zone_id === zoneId) {
              zoneDuctCfm += seg.cfm || 0;
              ductSystemName = ds.system_name;
            }
          });
        });

        if (zoneDuctCfm > 0) {
          const deviation = calculateDeviation(loadCalc.cfm_required, zoneDuctCfm);
          const status = getStatusFromDeviation(deviation, TOLERANCES.AIRFLOW_PERCENT);

          zoneChecks.push({
            id: `airflow-${loadCalc.id}`,
            category: 'airflow',
            name: 'Zone Airflow',
            description: 'Duct terminal CFM vs calculated requirement',
            status,
            expected: loadCalc.cfm_required,
            actual: zoneDuctCfm,
            deviation,
            unit: 'CFM',
            source: 'Load Calculation',
            target: ductSystemName || 'Duct System',
            recommendation: status === 'fail'
              ? `Airflow deficit of ${Math.abs(deviation).toFixed(1)}%. Resize duct branch to deliver ${loadCalc.cfm_required} CFM.`
              : undefined,
          });
        } else if ((ductSystems || []).length > 0) {
          zoneChecks.push({
            id: `airflow-missing-${loadCalc.id}`,
            category: 'airflow',
            name: 'Zone Not Connected',
            description: 'Zone has no duct segments assigned',
            status: 'warning',
            expected: loadCalc.cfm_required,
            actual: 'Not connected',
            unit: 'CFM',
            source: 'Load Calculation',
            target: 'Duct System',
            recommendation: 'Assign duct segments to this zone in the duct designer.',
          });
        }
      }

      // 3. Hydronic flow (GPM) check - pipe segments for this zone
      if (loadCalc.cooling_load_btuh) {
        const expectedGpm = loadCalc.cooling_load_btuh / (500 * TOLERANCES.DELTA_T_DEFAULT);
        const zoneId = loadCalc.zone_id;
        let zonePipeGpm = 0;
        let pipeSystemName = '';
        
        (pipeSystems || []).forEach(ps => {
          const segments = (ps as any).segments || [];
          segments.forEach((seg: any) => {
            if (seg.zone_id === zoneId) {
              zonePipeGpm += seg.flow_gpm || 0;
              pipeSystemName = ps.system_name;
            }
          });
        });

        if (zonePipeGpm > 0) {
          const deviation = calculateDeviation(expectedGpm, zonePipeGpm);
          const status = getStatusFromDeviation(deviation, TOLERANCES.FLOW_PERCENT);

          zoneChecks.push({
            id: `hydronic-${loadCalc.id}`,
            category: 'hydronic',
            name: 'Zone Hydronic Flow',
            description: 'Pipe terminal GPM vs calculated requirement',
            status,
            expected: Math.round(expectedGpm * 10) / 10,
            actual: Math.round(zonePipeGpm * 10) / 10,
            deviation,
            unit: 'GPM',
            source: 'Load Calculation',
            target: pipeSystemName || 'Pipe System',
            recommendation: status === 'fail'
              ? `Flow deficit of ${Math.abs(deviation).toFixed(1)}%. Resize pipe branch to deliver ${expectedGpm.toFixed(1)} GPM.`
              : undefined,
          });
        } else if ((pipeSystems || []).length > 0) {
          zoneChecks.push({
            id: `hydronic-missing-${loadCalc.id}`,
            category: 'hydronic',
            name: 'Zone Not Connected',
            description: 'Zone has no pipe segments assigned',
            status: 'warning',
            expected: Math.round(expectedGpm * 10) / 10,
            actual: 'Not connected',
            unit: 'GPM',
            source: 'Load Calculation',
            target: 'Pipe System',
            recommendation: 'Assign pipe segments to this zone in the pipe designer.',
          });
        }
      }

      // 4. Acoustic NC compliance check
      const spaceType = (loadCalc as any).zone?.space_type;
      const ncStandard = spaceType ? SAUDI_NC_STANDARDS[spaceType] : null;

      if (ncStandard && diffuserGrilles) {
        const zoneDiffusers = diffuserGrilles.filter(
          (dg: any) => dg.zone_id === loadCalc.zone_id
        );
        
        if (zoneDiffusers.length > 0) {
          // Find worst-case (highest) NC rating among diffusers
          const diffuserNCs = zoneDiffusers
            .map((dg: any) => dg.noise_nc || 0)
            .filter((nc: number) => nc > 0);
          
          if (diffuserNCs.length > 0) {
            const worstCaseNC = Math.max(...diffuserNCs);
            const targetNC = ncStandard.target;
            const margin = targetNC - worstCaseNC;
            
            let status: ValidationStatus = 'pass';
            if (margin < TOLERANCES.NC_MARGIN_FAIL) {
              status = 'fail';
            } else if (margin < TOLERANCES.NC_MARGIN_WARN) {
              status = 'warning';
            }

            zoneChecks.push({
              id: `acoustic-${loadCalc.id}`,
              category: 'acoustic',
              name: 'Zone Noise Level',
              description: `Diffuser NC vs ${ncStandard.description} target (NC-${targetNC})`,
              status,
              expected: targetNC,
              actual: worstCaseNC,
              deviation: -margin,
              unit: 'NC',
              source: 'Saudi Acoustic Standards',
              target: zoneName,
              recommendation: status === 'fail'
                ? `Noise level NC-${worstCaseNC} exceeds target NC-${targetNC} by ${Math.abs(margin)} dB. Consider adding silencers, duct lining, or selecting quieter diffusers.`
                : status === 'warning'
                ? `Noise margin of only ${margin} dB below NC-${targetNC}. Consider acoustic treatment for safety factor.`
                : undefined,
            });
          }
        } else if (spaceType) {
          // Zone has a space type but no diffusers assigned
          zoneChecks.push({
            id: `acoustic-missing-${loadCalc.id}`,
            category: 'acoustic',
            name: 'Diffusers Not Assigned',
            description: 'No diffusers linked for acoustic analysis',
            status: 'info',
            expected: ncStandard.target,
            actual: 'Not assigned',
            unit: 'NC',
            source: 'Saudi Acoustic Standards',
            target: zoneName,
            recommendation: 'Assign diffusers to this zone in the Duct System Designer.',
          });
        }
      }

      // Add to zone validations
      if (zoneChecks.length > 0) {
        const passCount = zoneChecks.filter(c => c.status === 'pass').length;
        const failCount = zoneChecks.filter(c => c.status === 'fail').length;
        const warningCount = zoneChecks.filter(c => c.status === 'warning').length;

        zoneValidations.push({
          zoneId: loadCalc.zone_id || loadCalc.id,
          zoneName,
          buildingName,
          floorName,
          checks: zoneChecks,
          overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
          passCount,
          failCount,
          warningCount,
        });

        allChecks.push(...zoneChecks);
      }
    });

    // System-level validations
    // Duct systems
    (ductSystems || []).forEach(ds => {
      const systemChecks: ValidationCheck[] = [];
      
      // Total airflow check
      if (ds.load_calculation_id) {
        const linkedLoad = (loadCalculations || []).find(lc => lc.id === ds.load_calculation_id);
        if (linkedLoad && linkedLoad.cfm_required && ds.total_airflow_cfm) {
          const deviation = calculateDeviation(linkedLoad.cfm_required, ds.total_airflow_cfm);
          const status = getStatusFromDeviation(deviation, TOLERANCES.AIRFLOW_PERCENT);

          systemChecks.push({
            id: `duct-total-cfm-${ds.id}`,
            category: 'airflow',
            name: 'System Total Airflow',
            description: 'Total system CFM vs load requirement',
            status,
            expected: linkedLoad.cfm_required,
            actual: ds.total_airflow_cfm,
            deviation,
            unit: 'CFM',
            source: 'Load Calculation',
            target: ds.system_name,
          });
        }
      }

      // Pressure analysis
      if (ds.system_static_pressure_pa && ds.critical_path_pressure_pa) {
        const deviation = calculateDeviation(ds.system_static_pressure_pa, ds.critical_path_pressure_pa);
        let status: ValidationStatus = 'pass';
        if (deviation > TOLERANCES.PRESSURE_FAIL_PERCENT) status = 'fail';
        else if (deviation > TOLERANCES.PRESSURE_WARN_PERCENT) status = 'warning';

        systemChecks.push({
          id: `duct-pressure-${ds.id}`,
          category: 'sizing',
          name: 'System Pressure',
          description: 'Critical path pressure vs system design',
          status,
          expected: ds.system_static_pressure_pa,
          actual: ds.critical_path_pressure_pa,
          deviation,
          unit: 'Pa',
          source: 'System Design',
          target: ds.system_name,
          recommendation: status !== 'pass'
            ? 'Consider fan upgrade or reduce duct equivalent lengths.'
            : undefined,
        });
      }

      if (systemChecks.length > 0) {
        const passCount = systemChecks.filter(c => c.status === 'pass').length;
        const failCount = systemChecks.filter(c => c.status === 'fail').length;
        const warningCount = systemChecks.filter(c => c.status === 'warning').length;

        systemValidations.push({
          systemId: ds.id,
          systemName: ds.system_name,
          systemType: 'duct',
          checks: systemChecks,
          overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
          passCount,
          failCount,
          warningCount,
        });

        allChecks.push(...systemChecks);
      }
    });

    // Pipe systems
    (pipeSystems || []).forEach(ps => {
      const systemChecks: ValidationCheck[] = [];
      
      // Total flow check
      if (ps.load_calculation_id) {
        const linkedLoad = (loadCalculations || []).find(lc => lc.id === ps.load_calculation_id);
        if (linkedLoad && linkedLoad.cooling_load_btuh && ps.total_flow_gpm) {
          const expectedGpm = linkedLoad.cooling_load_btuh / (500 * TOLERANCES.DELTA_T_DEFAULT);
          const deviation = calculateDeviation(expectedGpm, ps.total_flow_gpm);
          const status = getStatusFromDeviation(deviation, TOLERANCES.FLOW_PERCENT);

          systemChecks.push({
            id: `pipe-total-gpm-${ps.id}`,
            category: 'hydronic',
            name: 'System Total Flow',
            description: 'Total system GPM vs load requirement',
            status,
            expected: Math.round(expectedGpm * 10) / 10,
            actual: ps.total_flow_gpm,
            deviation,
            unit: 'GPM',
            source: 'Load Calculation',
            target: ps.system_name,
          });
        }
      }

      // Head analysis - if critical path head is available
      if (ps.critical_path_head_ft) {
        // For now, just report the critical path head as info
        systemChecks.push({
          id: `pipe-head-${ps.id}`,
          category: 'sizing',
          name: 'Critical Path Head',
          description: 'System critical path head loss',
          status: 'pass',
          expected: 'N/A',
          actual: ps.critical_path_head_ft,
          unit: 'ft',
          source: 'System Analysis',
          target: ps.system_name,
        });
      }

      if (systemChecks.length > 0) {
        const passCount = systemChecks.filter(c => c.status === 'pass').length;
        const failCount = systemChecks.filter(c => c.status === 'fail').length;
        const warningCount = systemChecks.filter(c => c.status === 'warning').length;

        systemValidations.push({
          systemId: ps.id,
          systemName: ps.system_name,
          systemType: 'pipe',
          checks: systemChecks,
          overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
          passCount,
          failCount,
          warningCount,
        });

        allChecks.push(...systemChecks);
      }
    });

    // ================================
    // CROSS-TOOL CAPACITY VALIDATIONS
    // ================================

    // 1. Zone Load vs Terminal Unit CFM validation
    (loadCalculations || []).forEach((loadCalc) => {
      const zoneName = (loadCalc as any).zone?.name || loadCalc.calculation_name;
      const zoneTerminalUnits = (terminalUnits || []).filter(
        (tu: any) => tu.zone_id === loadCalc.zone_id
      );

      if (zoneTerminalUnits.length > 0 && loadCalc.cfm_required) {
        const totalTerminalCfm = zoneTerminalUnits.reduce(
          (sum: number, tu: any) => sum + (tu.supply_cfm || tu.max_cfm || 0), 0
        );
        const deviation = calculateDeviation(loadCalc.cfm_required, totalTerminalCfm);
        let status: ValidationStatus = 'pass';
        if (Math.abs(deviation) > TOLERANCES.TERMINAL_CFM_PERCENT * 2) status = 'fail';
        else if (Math.abs(deviation) > TOLERANCES.TERMINAL_CFM_PERCENT) status = 'warning';

        // Update counter
        crossToolCounters.zoneLoadVsTerminal[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

        allChecks.push({
          id: `cross-terminal-cfm-${loadCalc.id}`,
          category: 'airflow',
          name: 'Terminal Unit CFM vs Zone Load',
          description: `Terminal units in ${zoneName} vs zone CFM requirement`,
          status,
          expected: loadCalc.cfm_required,
          actual: totalTerminalCfm,
          deviation,
          unit: 'CFM',
          source: 'Load Calculation',
          target: `${zoneTerminalUnits.length} Terminal Unit(s)`,
          recommendation: status === 'fail'
            ? `Terminal units provide ${totalTerminalCfm} CFM but zone requires ${loadCalc.cfm_required} CFM. Resize or add terminal units.`
            : status === 'warning'
            ? `Terminal CFM deviation of ${Math.abs(deviation).toFixed(1)}% - verify design intent.`
            : undefined,
        });
      }
    });

    // 2. AHU Configuration validations
    (ahuConfigurations || []).forEach(ahu => {
      const ahuChecks: ValidationCheck[] = [];
      
      // Total Terminal Units CFM vs AHU Design CFM
      const projectTerminalUnits = terminalUnits || [];
      const totalTerminalCfm = projectTerminalUnits.reduce(
        (sum: number, tu: any) => sum + (tu.supply_cfm || tu.max_cfm || 0), 0
      );
      
      if (ahu.design_cfm && totalTerminalCfm > 0) {
        const deviation = calculateDeviation(totalTerminalCfm, ahu.design_cfm);
        let status: ValidationStatus = 'pass';
        if (Math.abs(deviation) > TOLERANCES.TERMINAL_TOTAL_VS_AHU * 2) status = 'fail';
        else if (Math.abs(deviation) > TOLERANCES.TERMINAL_TOTAL_VS_AHU) status = 'warning';
        
        // Update counter
        crossToolCounters.terminalVsAhu[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

        ahuChecks.push({
          id: `ahu-cfm-balance-${ahu.id}`,
          category: 'airflow',
          name: 'AHU vs Terminal Units CFM',
          description: 'AHU design CFM vs sum of terminal unit airflows',
          status,
          expected: totalTerminalCfm,
          actual: ahu.design_cfm,
          deviation,
          unit: 'CFM',
          source: 'Terminal Units Total',
          target: ahu.ahu_name,
          recommendation: deviation < -5 
            ? `AHU undersized: ${ahu.design_cfm} CFM vs ${totalTerminalCfm} CFM required by terminals.`
            : deviation > 15
            ? `AHU oversized by ${deviation.toFixed(0)}%. May result in poor part-load performance.`
            : undefined,
        });
      }
      
      // AHU Cooling Capacity vs Total Zone Loads
      const totalProjectCoolingTons = (loadCalculations || []).reduce(
        (sum, lc) => sum + (lc.cooling_load_tons || 0), 0
      );
      
      if (ahu.total_cooling_capacity_tons && totalProjectCoolingTons > 0) {
        const deviation = calculateDeviation(totalProjectCoolingTons, ahu.total_cooling_capacity_tons);
        const status = getStatusFromDeviation(deviation, 30, true);
        
        ahuChecks.push({
          id: `ahu-cooling-capacity-${ahu.id}`,
          category: 'capacity',
          name: 'AHU Cooling Capacity',
          description: 'AHU cooling capacity vs project zone loads total',
          status,
          expected: totalProjectCoolingTons,
          actual: ahu.total_cooling_capacity_tons,
          deviation,
          unit: 'tons',
          source: 'Zone Loads Total',
          target: ahu.ahu_name,
          recommendation: status === 'fail'
            ? `AHU cooling capacity undersized. Requires ${totalProjectCoolingTons.toFixed(1)} tons.`
            : undefined,
        });
      }
      
      // Add AHU to system validations
      if (ahuChecks.length > 0) {
        const passCount = ahuChecks.filter(c => c.status === 'pass').length;
        const failCount = ahuChecks.filter(c => c.status === 'fail').length;
        const warningCount = ahuChecks.filter(c => c.status === 'warning').length;

        systemValidations.push({
          systemId: ahu.id,
          systemName: ahu.ahu_name,
          systemType: 'ahu',
          checks: ahuChecks,
          overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
          passCount,
          failCount,
          warningCount,
        });
        allChecks.push(...ahuChecks);
      }
    });

    // 3. VRF System Capacity Ratio validation
    (vrfSystems || []).forEach((vrf: any) => {
      const vrfChecks: ValidationCheck[] = [];
      
      // Capacity ratio check (indoor vs outdoor)
      if (vrf.capacity_ratio) {
        const ratio = vrf.capacity_ratio * 100;
        let status: ValidationStatus = 'pass';
        if (ratio < TOLERANCES.VRF_RATIO_MIN || ratio > TOLERANCES.VRF_RATIO_MAX) {
          status = 'fail';
        } else if (ratio < 70 || ratio > 120) {
          status = 'warning';
        }
        
        // Update counter
        crossToolCounters.vrfCapacityRatio[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

        vrfChecks.push({
          id: `vrf-capacity-ratio-${vrf.id}`,
          category: 'capacity',
          name: 'VRF Capacity Ratio',
          description: 'Indoor/outdoor unit capacity ratio (50-130% typical)',
          status,
          expected: '100%',
          actual: `${ratio.toFixed(0)}%`,
          unit: '%',
          source: 'Manufacturer Guidelines',
          target: vrf.system_name,
          recommendation: status !== 'pass'
            ? ratio < TOLERANCES.VRF_RATIO_MIN 
              ? 'Capacity ratio too low. Add indoor units or select smaller outdoor unit.'
              : 'Capacity ratio exceeds maximum. System may not perform properly.'
            : undefined,
        });
      }

      // Indoor unit count validation
      const indoorUnits = vrf.indoor_units || [];
      if (indoorUnits.length > 0) {
        // Calculate total indoor capacity vs outdoor capacity
        const totalIndoorCapacity = indoorUnits.reduce(
          (sum: number, iu: any) => sum + (iu.cooling_capacity_kw || 0), 0
        );
        if (vrf.outdoor_unit_capacity_kw && totalIndoorCapacity > 0) {
          const ratio = (totalIndoorCapacity / vrf.outdoor_unit_capacity_kw) * 100;
          let status: ValidationStatus = 'pass';
          if (ratio > 130 || ratio < 50) status = 'fail';
          else if (ratio > 120 || ratio < 70) status = 'warning';

          vrfChecks.push({
            id: `vrf-idu-odu-ratio-${vrf.id}`,
            category: 'capacity',
            name: 'VRF IDU/ODU Capacity',
            description: `${indoorUnits.length} indoor units vs outdoor unit capacity`,
            status,
            expected: vrf.outdoor_unit_capacity_kw,
            actual: totalIndoorCapacity,
            deviation: ratio - 100,
            unit: 'kW',
            source: 'VRF Design',
            target: vrf.system_name,
          });
        }
      }
      
      // Add VRF to system validations
      if (vrfChecks.length > 0) {
        const passCount = vrfChecks.filter(c => c.status === 'pass').length;
        const failCount = vrfChecks.filter(c => c.status === 'fail').length;
        const warningCount = vrfChecks.filter(c => c.status === 'warning').length;

        systemValidations.push({
          systemId: vrf.id,
          systemName: vrf.system_name,
          systemType: 'vrf',
          checks: vrfChecks,
          overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
          passCount,
          failCount,
          warningCount,
        });
        allChecks.push(...vrfChecks);
      }
    });

    // 4. Update diffuser acoustic counters from zone validations
    zoneValidations.forEach(zv => {
      zv.checks.forEach(check => {
        if (check.category === 'acoustic') {
          if (check.status === 'pass') crossToolCounters.diffuserAcoustic.pass++;
          else if (check.status === 'warning') crossToolCounters.diffuserAcoustic.warning++;
          else if (check.status === 'fail') crossToolCounters.diffuserAcoustic.fail++;
        }
      });
    });

    // ================================
    // EQUIPMENT SELECTION TOOL VALIDATIONS
    // ================================

    // 5. AHU vs Coil Selection Validation
    (ahuConfigurations || []).forEach(ahu => {
      const linkedCoils = (coilSelections || []).filter(
        (c: any) => c.ahu_configuration_id === ahu.id
      );

      if (linkedCoils.length > 0) {
        // Check cooling coil capacity vs AHU cooling requirement
        const coolingCoils = linkedCoils.filter((c: any) => c.coil_type === 'cooling');
        const totalCoilCfm = coolingCoils.reduce((sum: number, c: any) => sum + (c.design_cfm || 0), 0);
        const ahuCfm = ahu.design_cfm || 0;

        if (ahuCfm > 0 && totalCoilCfm > 0) {
          const deviation = calculateDeviation(ahuCfm, totalCoilCfm);
          const absDeviation = Math.abs(deviation);
          let status: ValidationStatus = 'pass';
          if (absDeviation > 20) status = 'fail';
          else if (absDeviation > 10) status = 'warning';

          crossToolCounters.ahuVsCoil[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

          allChecks.push({
            id: `ahu-coil-cfm-${ahu.id}`,
            category: 'airflow',
            name: 'AHU vs Coil CFM',
            description: `Coil design CFM vs AHU ${ahu.ahu_name} design CFM`,
            status,
            expected: ahuCfm,
            actual: totalCoilCfm,
            deviation,
            unit: 'CFM',
            source: 'AHU Configuration',
            target: `${coolingCoils.length} Cooling Coil(s)`,
            recommendation: status !== 'pass'
              ? `Coil CFM deviation of ${absDeviation.toFixed(1)}%. Verify coil selection matches AHU requirements.`
              : undefined,
          });
        }

        // Check cooling coil capacity (tons)
        const totalCoilTons = coolingCoils.reduce((sum: number, c: any) => sum + (c.capacity_tons || 0), 0);
        const ahuTons = ahu.total_cooling_capacity_tons || 0;

        if (ahuTons > 0 && totalCoilTons > 0) {
          const deviation = calculateDeviation(ahuTons, totalCoilTons);
          const status = getStatusFromDeviation(deviation, 15, true);

          allChecks.push({
            id: `ahu-coil-capacity-${ahu.id}`,
            category: 'capacity',
            name: 'AHU vs Coil Capacity',
            description: `Coil cooling capacity vs AHU ${ahu.ahu_name} requirement`,
            status,
            expected: ahuTons,
            actual: totalCoilTons,
            deviation,
            unit: 'tons',
            source: 'AHU Configuration',
            target: `${coolingCoils.length} Cooling Coil(s)`,
            recommendation: status === 'fail'
              ? `Coil capacity undersized. AHU requires ${ahuTons.toFixed(1)} tons, coils provide ${totalCoilTons.toFixed(1)} tons.`
              : undefined,
          });
        }
      }
    });

    // 6. AHU vs Filter Selection Validation
    (ahuConfigurations || []).forEach(ahu => {
      const linkedFilters = (filterSelections || []).filter(
        (f: any) => f.ahu_configuration_id === ahu.id
      );

      if (linkedFilters.length > 0) {
        // Check filter CFM capacity vs AHU design CFM
        const totalFilterCfm = linkedFilters.reduce((sum: number, f: any) => sum + (f.rated_cfm || 0), 0);
        const ahuCfm = ahu.design_cfm || 0;

        if (ahuCfm > 0 && totalFilterCfm > 0) {
          const deviation = calculateDeviation(ahuCfm, totalFilterCfm);
          let status: ValidationStatus = 'pass';
          // Filter capacity should be >= AHU CFM (undersizing is fail)
          if (totalFilterCfm < ahuCfm * 0.95) status = 'fail';
          else if (totalFilterCfm < ahuCfm) status = 'warning';

          crossToolCounters.ahuVsFilter[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

          allChecks.push({
            id: `ahu-filter-cfm-${ahu.id}`,
            category: 'airflow',
            name: 'AHU vs Filter CFM',
            description: `Filter rated CFM vs AHU ${ahu.ahu_name} design CFM`,
            status,
            expected: ahuCfm,
            actual: totalFilterCfm,
            deviation,
            unit: 'CFM',
            source: 'AHU Configuration',
            target: `${linkedFilters.length} Filter(s)`,
            recommendation: status !== 'pass'
              ? `Filter CFM undersized. AHU requires ${ahuCfm} CFM, filters rated for ${totalFilterCfm} CFM.`
              : undefined,
          });
        }
      }
    });

    // 7. Equipment vs Cooling Tower Validation
    // Validate cooling tower capacity against chiller/equipment loads
    const totalChillerTons = (equipmentSelections || [])
      .filter((e: any) => e.equipment_type?.toLowerCase().includes('chiller'))
      .reduce((sum: number, e: any) => sum + (e.required_capacity_tons || 0), 0);

    (coolingTowerSelections || []).forEach((tower: any) => {
      if (tower.total_capacity_tons) {
        // Cooling tower should handle ~115% of chiller capacity (heat of compression)
        const expectedTowerTons = totalChillerTons > 0 ? totalChillerTons * 1.15 : 0;

        if (expectedTowerTons > 0) {
          const deviation = calculateDeviation(expectedTowerTons, tower.total_capacity_tons);
          let status: ValidationStatus = 'pass';
          if (tower.total_capacity_tons < expectedTowerTons * 0.95) status = 'fail';
          else if (tower.total_capacity_tons < expectedTowerTons) status = 'warning';

          crossToolCounters.equipmentVsTower[status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'fail']++;

          allChecks.push({
            id: `equipment-tower-${tower.id}`,
            category: 'capacity',
            name: 'Chiller vs Cooling Tower',
            description: `Cooling tower capacity vs chiller heat rejection requirement`,
            status,
            expected: Math.round(expectedTowerTons * 10) / 10,
            actual: tower.total_capacity_tons,
            deviation,
            unit: 'tons',
            source: 'Chiller Load + Heat of Compression',
            target: tower.name,
            recommendation: status !== 'pass'
              ? `Cooling tower undersized. Chillers require ${expectedTowerTons.toFixed(1)} tons heat rejection, tower provides ${tower.total_capacity_tons} tons.`
              : undefined,
          });
        }
      }
    });

    // Generate recommendations from failed/warning checks
    allChecks
      .filter(c => c.status === 'fail' || c.status === 'warning')
      .forEach(check => {
        if (check.recommendation) {
          recommendations.push({
            priority: check.status === 'fail' ? 'high' : 'medium',
            category: check.category,
            message: check.recommendation,
            affectedItems: [check.target],
          });
        }
      });

    // Add linkage recommendations
    if (stageStatus.equipmentSelections.count > 0 && stageStatus.equipmentSelections.linkedToLoads === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'linkage',
        message: 'Equipment selections are not linked to load calculations. Link them for accurate validation.',
        affectedItems: ['Equipment Selections'],
      });
    }

    // Calculate summary
    const passCount = allChecks.filter(c => c.status === 'pass').length;
    const failCount = allChecks.filter(c => c.status === 'fail').length;
    const warningCount = allChecks.filter(c => c.status === 'warning').length;
    const infoCount = allChecks.filter(c => c.status === 'info').length;
    const totalChecks = allChecks.length;
    const completionScore = totalChecks > 0 
      ? Math.round((passCount / (totalChecks - infoCount)) * 100) || 0
      : 0;

    return {
      projectId,
      projectName: project.name,
      generatedAt: new Date().toISOString(),
      overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
      summary: {
        totalChecks,
        passCount,
        failCount,
        warningCount,
        infoCount,
        completionScore,
      },
      stageStatus,
      zoneValidations,
      systemValidations,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      crossToolValidation: crossToolCounters,
    };
  }, [projectId, project, loadCalculations, equipmentSelections, ductSystems, pipeSystems, diffuserGrilles, terminalUnits, ahuConfigurations, vrfSystems, coilSelections, filterSelections, coolingTowerSelections]);

  return {
    report: validationReport,
    isLoading,
    loadCalculations,
    equipmentSelections,
    ductSystems,
    pipeSystems,
    terminalUnits,
    ahuConfigurations,
    vrfSystems,
    coilSelections,
    filterSelections,
    coolingTowerSelections,
  };
}
