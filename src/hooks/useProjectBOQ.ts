import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import {
  ProjectBOQ,
  TerminalUnitBOQItem,
  EquipmentBOQItem,
  AHUComponentBOQItem,
  DiffuserGrilleBOQItem,
  ActualDuctFitting,
  ActualPipeFitting,
  EnhancedBOQSummary,
  DuctMaterialItem,
  PipeMaterialItem,
  InsulationItem,
} from '@/types/boq';
import {
  deriveAccessoriesFromTerminalUnits,
  deriveAccessoriesFromAHUs,
  estimateDuctSupports,
  estimatePipeSupports,
  aggregateAccessoriesByCategory,
  aggregateFittingsByType,
} from '@/lib/boq-calculations';
import {
  INSULATION_MATERIALS,
  SAUDI_CLIMATE_DATA,
  SERVICE_TYPES,
  pipeOD,
  calculateMinInsulationThickness,
  roundToStandardThickness,
  calculateDewPoint,
} from '@/lib/thermal-calculations';

const GAUGE_WEIGHTS: Record<number, number> = {
  16: 2.656, 18: 2.156, 20: 1.656, 22: 1.406, 24: 1.156, 26: 0.906, 28: 0.781,
};

const PIPE_WEIGHTS_LB_PER_FT: Record<number, number> = {
  0.5: 0.85, 0.75: 1.13, 1: 1.68, 1.25: 2.27, 1.5: 2.72, 2: 3.65,
  2.5: 5.79, 3: 7.58, 4: 10.79, 5: 14.62, 6: 18.97, 8: 28.55, 10: 40.48, 12: 49.56,
};

export interface InsulationSettings {
  includeInsulation: boolean;
  serviceTypeId: string;
  climateId: string;
  insulationMaterialId: string;
}

interface UseProjectBOQOptions {
  projectId: string | null;
  insulationSettings: InsulationSettings;
}

export function useProjectBOQ({ projectId, insulationSettings }: UseProjectBOQOptions) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['project-boq', projectId, organizationId, insulationSettings],
    queryFn: async (): Promise<ProjectBOQ | null> => {
      if (!projectId || !organizationId) return null;

      const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (!project) return null;

      const [ductSystemsResult, pipeSystemsResult, terminalUnitsResult, diffusersResult, equipmentResult, ahusResult] = await Promise.all([
        supabase.from('duct_systems').select(`id, system_name, system_type, total_airflow_cfm, duct_material, duct_segments (id, segment_name, cfm, length_ft, duct_shape, diameter_in, width_in, height_in, gauge_thickness_mm, material_type, fittings_equivalent_length_ft)`).eq('organization_id', organizationId).eq('project_id', projectId),
        supabase.from('pipe_systems').select(`id, system_name, system_type, pipe_material, pipe_segments (id, segment_name, length_ft, nominal_size_in, material_type, schedule_class, fittings_equivalent_length_ft)`).eq('organization_id', organizationId).eq('project_id', projectId),
        supabase.from('terminal_unit_selections').select(`id, unit_tag, unit_type, manufacturer, model_number, selected_size, supply_cfm, has_reheat, reheat_type, has_damper, has_flow_station, zones (name)`).eq('project_id', projectId),
        supabase.from('diffuser_grilles').select(`id, terminal_type, style, model, neck_size, airflow_cfm, quantity, location_description, zones (name), duct_systems!inner (project_id)`).eq('duct_systems.project_id', projectId),
        supabase.from('equipment_selections').select(`id, equipment_category, selection_name, selected_equipment, status, comparison_notes`).eq('project_id', projectId),
        supabase.from('ahu_configurations').select(`id, ahu_tag, ahu_name, design_cfm, total_cooling_capacity_tons, total_heating_capacity_mbh, cooling_coil_config, heating_coil_config, preheat_coil_config, supply_fan_bhp, return_fan_bhp, filter_config, humidifier_config, erv_config, economizer_type`).eq('organization_id', organizationId).eq('project_id', projectId),
      ]);

      // Process duct systems
      const ductSystems = (ductSystemsResult.data || []).map(system => {
        const segments = (system.duct_segments || []) as any[];
        const processedSegments: DuctMaterialItem[] = segments.map(seg => {
          const surfaceAreaSqFt = calculateDuctSurfaceArea(seg);
          const gauge = getGaugeFromSegment(seg);
          return {
            segmentId: seg.id, segmentName: seg.segment_name,
            shape: seg.duct_shape === 'round' ? 'round' as const : 'rectangular' as const,
            dimensions: formatDuctDimensions(seg), lengthFt: seg.length_ft || 0, surfaceAreaSqFt,
            weightLbs: calculateDuctWeight(surfaceAreaSqFt, gauge), gauge,
            material: seg.material_type || system.duct_material || 'Galvanized Steel',
          };
        });
        const insulation = calculateDuctInsulation(segments, insulationSettings);
        const fittings: ActualDuctFitting[] = segments.filter(seg => seg.fittings_equivalent_length_ft > 0).map(seg => ({
          id: `est-${seg.id}`, ductSegmentId: seg.id, segmentName: seg.segment_name,
          fittingType: '90° Elbow (Estimated)', fittingDescription: 'Estimated from equivalent length',
          lossCoefficient: null, equivalentLengthFt: seg.fittings_equivalent_length_ft,
          quantity: Math.ceil(seg.fittings_equivalent_length_ft / 15),
        }));
        return { systemId: system.id, systemName: system.system_name, systemType: system.system_type, totalCfm: system.total_airflow_cfm, segments: processedSegments, fittings, insulation };
      });

      // Process pipe systems
      const pipeSystems = (pipeSystemsResult.data || []).map(system => {
        const segments = (system.pipe_segments || []) as any[];
        const processedSegments: PipeMaterialItem[] = segments.map(seg => {
          const sizeInches = seg.nominal_size_in || 2;
          const lengthFt = seg.length_ft || 0;
          const perFt = PIPE_WEIGHTS_LB_PER_FT[sizeInches] || sizeInches * 2;
          return { segmentId: seg.id, segmentName: seg.segment_name, nominalSize: `${sizeInches}"`, lengthFt, material: seg.material_type || system.pipe_material || 'Carbon Steel', schedule: seg.schedule_class || 'Sch 40', weightLbsPerFt: perFt, totalWeightLbs: perFt * lengthFt };
        });
        const insulation = calculatePipeInsulation(segments, insulationSettings);
        const fittings: ActualPipeFitting[] = segments.filter(seg => seg.fittings_equivalent_length_ft > 0).map(seg => ({
          id: `est-${seg.id}`, pipeSegmentId: seg.id, segmentName: seg.segment_name,
          fittingType: '90° Elbow (Estimated)', fittingDescription: 'Estimated from equivalent length',
          kFactor: null, size: null, quantity: Math.ceil(seg.fittings_equivalent_length_ft / 10),
        }));
        return { systemId: system.id, systemName: system.system_name, systemType: system.system_type, segments: processedSegments, fittings, insulation };
      });

      // Process terminal units
      const terminalUnits: TerminalUnitBOQItem[] = (terminalUnitsResult.data || []).map((tu: any) => ({
        unitTag: tu.unit_tag, unitType: tu.unit_type, manufacturer: tu.manufacturer || 'TBD',
        model: tu.model_number || 'TBD', size: tu.selected_size || 'N/A', airflowCfm: tu.supply_cfm || 0,
        quantity: 1, hasReheat: tu.has_reheat || false, reheatType: tu.reheat_type,
        hasDamper: tu.has_damper !== false, hasFlowStation: tu.has_flow_station || false,
        zoneName: tu.zones?.name || 'Unassigned',
      }));

      // Process diffusers
      const diffusersGrilles: DiffuserGrilleBOQItem[] = (diffusersResult.data || []).map((d: any) => ({
        id: d.id, terminalType: d.terminal_type || 'Supply Diffuser', style: d.style, model: d.model,
        neckSize: d.neck_size, airflowCfm: d.airflow_cfm, quantity: d.quantity || 1,
        zoneName: d.zones?.name || null, locationDescription: d.location_description,
      }));

      // Process equipment
      const equipmentSelections: EquipmentBOQItem[] = (equipmentResult.data || []).map((eq: any) => {
        const sel = eq.selected_equipment as any;
        return {
          category: eq.equipment_category || 'Equipment', name: sel?.name || eq.selection_name || 'Unknown',
          tag: sel?.tag || 'N/A', manufacturer: sel?.manufacturer || 'TBD', model: sel?.model || 'TBD',
          capacity: sel?.capacity ? `${sel.capacity} ${sel.capacityUnit || ''}` : 'N/A',
          quantity: 1, status: eq.status || 'draft', notes: eq.comparison_notes,
        };
      });

      // Process AHUs
      const ahuComponents: AHUComponentBOQItem[] = (ahusResult.data || []).map((ahu: any) => ({
        ahuTag: ahu.ahu_tag, ahuName: ahu.ahu_name, cfm: ahu.design_cfm,
        coolingTons: ahu.total_cooling_capacity_tons, heatingMBH: ahu.total_heating_capacity_mbh,
        hasCoolingCoil: !!ahu.cooling_coil_config, hasHeatingCoil: !!ahu.heating_coil_config,
        hasPreheatCoil: !!ahu.preheat_coil_config, supplyFanHP: ahu.supply_fan_bhp, returnFanHP: ahu.return_fan_bhp,
        filterType: (ahu.filter_config as any)?.type || null, hasHumidifier: !!ahu.humidifier_config,
        hasERV: !!ahu.erv_config, economizer: ahu.economizer_type,
      }));

      // Derive accessories and supports
      const accessories = [...deriveAccessoriesFromTerminalUnits(terminalUnits), ...deriveAccessoriesFromAHUs(ahuComponents)];
      const allDuctSegments = ductSystems.flatMap(s => (ductSystemsResult.data?.find(d => d.id === s.systemId)?.duct_segments || []) as any[]);
      const allPipeSegments = pipeSystems.flatMap(s => (pipeSystemsResult.data?.find(p => p.id === s.systemId)?.pipe_segments || []) as any[]);
      const supports = [...estimateDuctSupports(allDuctSegments), ...estimatePipeSupports(allPipeSegments)];

      const allDuctFittings = ductSystems.flatMap(s => s.fittings);
      const allPipeFittings = pipeSystems.flatMap(s => s.fittings);
      const fittingsByType = aggregateFittingsByType(allDuctFittings, allPipeFittings);
      const accessoriesByCat = aggregateAccessoriesByCategory(accessories);

      const summary: EnhancedBOQSummary = {
        totalDuctAreaSqFt: ductSystems.flatMap(s => s.segments).reduce((sum, seg) => sum + seg.surfaceAreaSqFt, 0),
        totalDuctWeightLbs: ductSystems.flatMap(s => s.segments).reduce((sum, seg) => sum + seg.weightLbs, 0),
        totalDuctLengthFt: ductSystems.flatMap(s => s.segments).reduce((sum, seg) => sum + seg.lengthFt, 0),
        totalPipeLengthFt: pipeSystems.flatMap(s => s.segments).reduce((sum, seg) => sum + seg.lengthFt, 0),
        totalPipeWeightLbs: pipeSystems.flatMap(s => s.segments).reduce((sum, seg) => sum + seg.totalWeightLbs, 0),
        totalInsulationAreaSqM: [...ductSystems.flatMap(s => s.insulation), ...pipeSystems.flatMap(s => s.insulation)].reduce((sum, i) => sum + i.surfaceAreaSqM, 0),
        totalInsulationCostSAR: [...ductSystems.flatMap(s => s.insulation), ...pipeSystems.flatMap(s => s.insulation)].reduce((sum, i) => sum + i.surfaceAreaSqM * i.costPerM2, 0),
        totalDiffusers: diffusersGrilles.reduce((sum, d) => sum + d.quantity, 0),
        totalTerminalUnits: terminalUnits.length,
        totalEquipmentPieces: equipmentSelections.length,
        totalAHUs: ahuComponents.length,
        totalDuctFittings: allDuctFittings.reduce((sum, f) => sum + f.quantity, 0),
        totalPipeFittings: allPipeFittings.reduce((sum, f) => sum + f.quantity, 0),
        totalAccessories: accessories.reduce((sum, a) => sum + a.quantity, 0),
        totalSupports: supports.reduce((sum, s) => sum + s.estimatedQuantity, 0),
        fittingsByType,
        accessoriesByCategory: accessoriesByCat,
        terminalsByType: aggregateByType(terminalUnits, 'unitType'),
        equipmentByCategory: aggregateByType(equipmentSelections, 'category').map(item => ({ category: item.type, count: item.count })),
      };

      return {
        projectId: project.id, projectName: project.name, generatedDate: new Date().toISOString(),
        ductSystems, pipeSystems, diffusersGrilles, terminalUnits, equipmentSelections, ahuComponents,
        accessories, supports, summary,
        dataSources: { ductSystemsCount: ductSystems.length, pipeSystemsCount: pipeSystems.length, hasTerminalUnits: terminalUnits.length > 0, hasDiffusers: diffusersGrilles.length > 0, hasEquipment: equipmentSelections.length > 0, hasAHUs: ahuComponents.length > 0 },
      };
    },
    enabled: !!projectId && !!organizationId,
  });
}

function calculateDuctSurfaceArea(segment: any): number {
  const lengthFt = segment.length_ft || 0;
  if (segment.duct_shape === 'round' && segment.diameter_in) return (Math.PI * segment.diameter_in * lengthFt) / 144;
  if (segment.width_in && segment.height_in) return (2 * (segment.width_in + segment.height_in) * lengthFt) / 144;
  return 0;
}

function calculateDuctWeight(surfaceAreaSqFt: number, gauge: number): number {
  return surfaceAreaSqFt * (GAUGE_WEIGHTS[gauge] || GAUGE_WEIGHTS[24]);
}

function getGaugeFromSegment(segment: any): number {
  const maxDim = Math.max(segment.width_in || 0, segment.height_in || 0, segment.diameter_in || 0);
  if (maxDim > 30) return 20;
  if (maxDim > 18) return 22;
  if (maxDim > 12) return 24;
  return 26;
}

function formatDuctDimensions(segment: any): string {
  if (segment.duct_shape === 'round' && segment.diameter_in) return `Ø${segment.diameter_in}"`;
  if (segment.width_in && segment.height_in) return `${segment.width_in}"×${segment.height_in}"`;
  return 'N/A';
}

function calculateDuctInsulation(segments: any[], settings: InsulationSettings): InsulationItem[] {
  if (!settings.includeInsulation) return [];
  const material = INSULATION_MATERIALS.find(m => m.id === settings.insulationMaterialId);
  const service = SERVICE_TYPES.find(s => s.id === settings.serviceTypeId);
  if (!material) return [];
  return segments.map(segment => {
    const surfaceAreaSqM = calculateDuctSurfaceArea(segment) * 0.0929;
    return { application: 'duct' as const, segmentId: segment.id, segmentName: segment.segment_name, insulationType: material.name, thicknessMm: service?.category === 'cold' ? 25 : 19, surfaceAreaSqM, costPerM2: material.costPerM2 };
  });
}

function calculatePipeInsulation(segments: any[], settings: InsulationSettings): InsulationItem[] {
  if (!settings.includeInsulation) return [];
  const material = INSULATION_MATERIALS.find(m => m.id === settings.insulationMaterialId);
  const climate = SAUDI_CLIMATE_DATA.find(c => c.id === settings.climateId);
  const service = SERVICE_TYPES.find(s => s.id === settings.serviceTypeId);
  if (!material || !climate || !service) return [];
  const dewPoint = calculateDewPoint(climate.summerDB, climate.summerRH);
  return segments.map(segment => {
    const lengthM = (segment.length_ft || 0) * 0.3048;
    const pipeODmm = pipeOD(segment.nominal_size_in || 2);
    const minThickness = calculateMinInsulationThickness({ fluidTempC: service.typicalTemp, ambientTempC: climate.summerDB, dewPointC: dewPoint, pipeODmm, kValueInsulation: material.kValue });
    const thicknessMm = roundToStandardThickness(minThickness);
    const surfaceAreaSqM = Math.PI * ((pipeODmm + 2 * thicknessMm) / 1000) * lengthM;
    return { application: 'pipe' as const, segmentId: segment.id, segmentName: segment.segment_name, insulationType: material.name, thicknessMm, surfaceAreaSqM, linearM: lengthM, costPerM2: material.costPerM2 };
  });
}

function aggregateByType<T>(items: T[], typeKey: keyof T): { type: string; count: number }[] {
  const typeMap = new Map<string, number>();
  items.forEach(item => { const type = String(item[typeKey]); typeMap.set(type, (typeMap.get(type) || 0) + 1); });
  return Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}
