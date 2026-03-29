import { useMemo } from 'react';
import { useLoadCalculations } from './useLoadCalculations';
import { useDuctSystems } from './useDuctSystems';
import { usePipeSystems } from './usePipeSystems';
import { useEquipmentSelections } from './useEquipmentSelections';
import { useVRFSystems } from './useVRFSystems';

export interface DesignWarning {
  id: string;
  category: 'capacity' | 'airflow' | 'linkage' | 'acoustic' | 'completeness';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedTool: string;
  affectedToolPath: string;
  recommendation: string;
  zoneId?: string;
  zoneName?: string;
}

interface UseDesignWarningsOptions {
  projectId: string | null;
  zoneId?: string | null;
  currentTool?: string;
}

export function useDesignWarnings({ projectId, zoneId, currentTool }: UseDesignWarningsOptions) {
  // Fetch design data
  const { data: loadCalculations = [], isLoading: loadCalcLoading } = useLoadCalculations(projectId || undefined);
  const { data: ductSystems = [], isLoading: ductLoading } = useDuctSystems();
  const { data: pipeSystems = [], isLoading: pipeLoading } = usePipeSystems();
  const { data: equipmentSelections = [], isLoading: equipLoading } = useEquipmentSelections(projectId || undefined);
  const { data: vrfSystems = [], isLoading: vrfLoading } = useVRFSystems();

  const isLoading = loadCalcLoading || ductLoading || pipeLoading || equipLoading || vrfLoading;

  // Filter data by project and optionally zone
  const projectLoadCalcs = useMemo(() => {
    let filtered = loadCalculations.filter(lc => lc.project_id === projectId);
    if (zoneId) {
      filtered = filtered.filter(lc => lc.zone_id === zoneId);
    }
    return filtered;
  }, [loadCalculations, projectId, zoneId]);

  const projectDuctSystems = useMemo(() => {
    return ductSystems.filter(ds => ds.project_id === projectId);
  }, [ductSystems, projectId]);

  const projectPipeSystems = useMemo(() => {
    return pipeSystems.filter(ps => ps.project_id === projectId);
  }, [pipeSystems, projectId]);

  const projectEquipment = useMemo(() => {
    return equipmentSelections.filter(eq => eq.project_id === projectId);
  }, [equipmentSelections, projectId]);

  const projectVRF = useMemo(() => {
    return vrfSystems.filter(vrf => vrf.project_id === projectId);
  }, [vrfSystems, projectId]);

  // Generate warnings
  const warnings = useMemo<DesignWarning[]>(() => {
    if (!projectId) return [];
    
    const result: DesignWarning[] = [];

    // Check 1: Load calculations without equipment selection
    projectLoadCalcs.forEach(lc => {
      const hasEquipment = projectEquipment.some(eq => eq.zone_id === lc.zone_id);
      if (!hasEquipment && lc.cooling_load_btuh && lc.cooling_load_btuh > 0) {
        result.push({
          id: `missing-equipment-${lc.id}`,
          category: 'linkage',
          severity: 'warning',
          message: `Zone "${lc.calculation_name}" has load calculation but no equipment selected`,
          affectedTool: 'Equipment Selection',
          affectedToolPath: '/equipment-selection',
          recommendation: 'Select equipment for this zone to complete the design workflow',
          zoneId: lc.zone_id || undefined,
          zoneName: lc.calculation_name,
        });
      }
    });

    // Check 2: Equipment capacity mismatch with load calculations
    projectEquipment.forEach(eq => {
      const loadCalc = projectLoadCalcs.find(lc => lc.zone_id === eq.zone_id);
      if (loadCalc && eq.required_capacity_tons && loadCalc.cooling_load_btuh) {
        const requiredTons = loadCalc.cooling_load_btuh / 12000;
        const selectedTons = eq.required_capacity_tons;
        const ratio = selectedTons / requiredTons;
        
        if (ratio < 0.95) {
          result.push({
            id: `undersized-equipment-${eq.id}`,
            category: 'capacity',
            severity: 'error',
            message: `Equipment undersized by ${Math.round((1 - ratio) * 100)}% for zone "${loadCalc.calculation_name}"`,
            affectedTool: 'Equipment Selection',
            affectedToolPath: '/equipment-selection',
            recommendation: `Required: ${requiredTons.toFixed(1)} tons, Selected: ${selectedTons.toFixed(1)} tons. Consider upsizing.`,
            zoneId: eq.zone_id || undefined,
            zoneName: loadCalc.calculation_name,
          });
        } else if (ratio > 1.25) {
          result.push({
            id: `oversized-equipment-${eq.id}`,
            category: 'capacity',
            severity: 'info',
            message: `Equipment oversized by ${Math.round((ratio - 1) * 100)}% for zone "${loadCalc.calculation_name}"`,
            affectedTool: 'Equipment Selection',
            affectedToolPath: '/equipment-selection',
            recommendation: `Required: ${requiredTons.toFixed(1)} tons, Selected: ${selectedTons.toFixed(1)} tons. Check if intentional.`,
            zoneId: eq.zone_id || undefined,
            zoneName: loadCalc.calculation_name,
          });
        }
      }
    });

    // Check 3: Duct system airflow mismatch
    projectDuctSystems.forEach(ds => {
      if (ds.total_airflow_cfm) {
        const linkedLoadCalcs = projectLoadCalcs.filter(lc => {
          // Check if any load calc references this duct system or if the zone is served
          return lc.project_id === ds.project_id;
        });
        
        const totalRequiredCFM = linkedLoadCalcs.reduce((sum, lc) => 
          sum + ((lc.cfm_required as number) || 0), 0
        );
        
        if (totalRequiredCFM > 0 && ds.total_airflow_cfm < totalRequiredCFM * 0.9) {
          result.push({
            id: `duct-airflow-mismatch-${ds.id}`,
            category: 'airflow',
            severity: 'warning',
            message: `Duct system "${ds.system_name}" airflow may be insufficient`,
            affectedTool: 'Duct Designer',
            affectedToolPath: '/duct-designer',
            recommendation: `System: ${ds.total_airflow_cfm.toFixed(0)} CFM, Project zones require: ${totalRequiredCFM.toFixed(0)} CFM`,
          });
        }
      }
    });

    // Check 4: VRF system capacity ratio
    projectVRF.forEach(vrf => {
      if (vrf.capacity_ratio && (vrf.capacity_ratio < 50 || vrf.capacity_ratio > 130)) {
        result.push({
          id: `vrf-capacity-ratio-${vrf.id}`,
          category: 'capacity',
          severity: vrf.capacity_ratio < 50 ? 'error' : 'warning',
          message: `VRF system "${vrf.system_name}" has ${vrf.capacity_ratio < 50 ? 'low' : 'high'} capacity ratio (${vrf.capacity_ratio.toFixed(0)}%)`,
          affectedTool: 'VRF Designer',
          affectedToolPath: '/vrf-designer',
          recommendation: vrf.capacity_ratio < 50 
            ? 'Add more indoor units or select smaller outdoor unit' 
            : 'Reduce indoor unit capacity or add more outdoor units',
        });
      }
    });

    // Check 5: Missing distribution design
    if (projectLoadCalcs.length > 0 && projectDuctSystems.length === 0 && projectPipeSystems.length === 0 && projectVRF.length === 0) {
      result.push({
        id: 'missing-distribution',
        category: 'completeness',
        severity: 'warning',
        message: 'Load calculations exist but no distribution systems designed',
        affectedTool: 'Duct Designer',
        affectedToolPath: '/duct-designer',
        recommendation: 'Design duct, pipe, or VRF systems to complete distribution design',
      });
    }

    return result;
  }, [projectId, projectLoadCalcs, projectEquipment, projectDuctSystems, projectPipeSystems, projectVRF]);

  // Filter warnings by current tool if specified
  const filteredWarnings = useMemo(() => {
    if (!currentTool) return warnings;
    return warnings.filter(w => 
      w.affectedToolPath.includes(currentTool) || 
      w.category === 'completeness'
    );
  }, [warnings, currentTool]);

  // Calculate counts
  const criticalCount = warnings.filter(w => w.severity === 'error').length;
  const warningCount = warnings.filter(w => w.severity === 'warning').length;
  const infoCount = warnings.filter(w => w.severity === 'info').length;

  return {
    warnings,
    filteredWarnings,
    criticalCount,
    warningCount,
    infoCount,
    totalCount: warnings.length,
    isLoading,
  };
}
