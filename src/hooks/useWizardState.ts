import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignWorkflowProgress, WorkflowStageProgress } from './useDesignWorkflowProgress';
import { useDesignCompleteness } from './useDesignCompleteness';
import { useLoadCalculations } from './useLoadCalculations';
import { useZones } from './useZones';
import { useAHUConfigurations } from './useAHUConfigurations';
import { useVRFSystems } from './useVRFSystems';
import { useDuctSystems } from './useDuctSystems';
import { usePipeSystems } from './usePipeSystems';
import { useHotWaterPlants } from './useHotWaterPlants';
import { useBoilerSelections } from './useBoilerSelections';
import { useChillerSelections } from './useChillerSelections';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

const WIZARD_STORAGE_KEY = 'design-wizard-state';
const WIZARD_STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Stage dependency map - each stage lists its prerequisites
export const STAGE_DEPENDENCIES: Record<WorkflowStageId, WorkflowStageId[]> = {
  load: [],                                    // No dependencies - starting point
  ventilation: ['load'],                       // Needs zone CFM from load
  psychrometric: ['load'],                     // Needs load conditions
  ahu: ['load', 'ventilation', 'psychrometric'], // Needs CFM, OA, and coil conditions
  terminal: ['load'],                          // Needs zone loads
  equipment: ['load'],                         // Needs load data
  distribution: ['terminal', 'equipment'],     // Needs equipment selections
  diffuser: ['distribution'],                  // Needs duct layout
  erv: ['ventilation'],                        // Needs OA calculations
  plant: ['equipment'],                        // Needs equipment loads
  compliance: ['load', 'equipment', 'distribution'], // Final validation
};

export interface WizardStageData {
  loadCalculation?: {
    totalCoolingTons: number;
    totalHeatingMbh: number;
    totalCfm: number;
    zonesCalculated: number;
  };
  ventilation?: {
    systemCfm: number;
    outdoorAirCfm: number;
    zonesConfigured: number;
  };
  psychrometric?: {
    supplyAirTemp: number;
    returnAirTemp: number;
    hasAnalysis: boolean;
  };
  ahu?: {
    ahuCount: number;
    totalDesignCfm: number;
    configuredAhus: number;
  };
  terminal?: {
    terminalUnitCount: number;
    zonesWithTerminals: number;
    totalCapacity: number;
  };
  equipment?: {
    equipmentCount: number;
    totalCapacityTons: number;
    zonesWithEquipment: number;
    vrfSystemCount?: number;
  };
  distribution?: {
    ductSystemsCount: number;
    pipeSystemsCount: number;
    zonesWithDistribution: number;
  };
  diffuser?: {
    diffuserCount: number;
    totalQuantity: number;
    zonesWithDiffusers: number;
  };
  erv?: {
    ervUnitsCount: number;
    recoveryEffectiveness: number;
  };
  plant?: {
    hasChwPlant: boolean;
    hasHwPlant: boolean;
    totalPlantCapacity: number;
  };
  hwPlant?: {
    hasPlant: boolean;
    totalHeatingMbh: number;
    boilerCount: number;
    pumpCount: number;
  };
  boilerSelection?: {
    boilerCount: number;
    totalCapacityMbh: number;
    avgAfue: number;
    condensingCount: number;
    nonCondensingCount: number;
  };
  chillerSelection?: {
    chillerCount: number;
    totalCapacityTons: number;
    avgCop: number;
    avgIplv: number;
  };
  compliance?: {
    checksTotal: number;
    checksPassed: number;
    compliancePercent: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  canProceed: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface WizardState {
  projectId: string;
  projectName: string;
  selectedZoneIds: string[];
  currentStage: WorkflowStageId;
  stageData: Partial<WizardStageData>;
  skippedStages: WorkflowStageId[];
  completedStages: WorkflowStageId[];
  lastUpdated: number;
  // Template support
  templateId?: string;
  templateName?: string;
  activeStages: WorkflowStageId[];
}

interface StoredWizardState extends WizardState {
  timestamp: number;
}

export function useWizardState(projectId: string | null) {
  const navigate = useNavigate();
  const { data: workflowProgress, isLoading: isLoadingProgress } = useDesignWorkflowProgress(projectId);
  const { data: completeness, isLoading: isLoadingCompleteness } = useDesignCompleteness(projectId ?? undefined);
  const { data: loadCalcs } = useLoadCalculations(projectId ?? undefined);
  const { data: zones } = useZones(projectId ?? undefined);
  const { data: ahuConfigs } = useAHUConfigurations(projectId ?? undefined);
  const { data: vrfSystems } = useVRFSystems(projectId ?? undefined);
  const { data: ductSystems } = useDuctSystems(projectId ?? undefined);
  const { data: pipeSystems } = usePipeSystems(projectId ?? undefined);
  const { data: hotWaterPlants } = useHotWaterPlants(projectId ?? undefined);
  const { data: boilerSelections } = useBoilerSelections(projectId ?? undefined);
  const { data: chillerSelections } = useChillerSelections(projectId ?? undefined);

  const [state, setState] = useState<WizardState>(() => ({
    projectId: projectId ?? '',
    projectName: '',
    selectedZoneIds: [],
    currentStage: 'load' as WorkflowStageId,
    stageData: {},
    skippedStages: [],
    completedStages: [],
    lastUpdated: Date.now(),
    activeStages: DESIGN_WORKFLOW_STAGES.map(s => s.id), // All stages active by default
  }));

  // Load saved state from localStorage
  useEffect(() => {
    if (!projectId) return;
    
    const saved = localStorage.getItem(`${WIZARD_STORAGE_KEY}-${projectId}`);
    if (saved) {
      try {
        const parsed: StoredWizardState = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < WIZARD_STORAGE_TTL) {
          setState(prev => ({
            ...parsed,
            projectId,
            lastUpdated: parsed.timestamp,
          }));
        } else {
          localStorage.removeItem(`${WIZARD_STORAGE_KEY}-${projectId}`);
        }
      } catch (e) {
        console.error('Failed to parse wizard state:', e);
      }
    }
  }, [projectId]);

  // Sync with workflow progress
  useEffect(() => {
    if (workflowProgress) {
      setState(prev => ({
        ...prev,
        projectName: workflowProgress.projectName,
        completedStages: workflowProgress.stages
          .filter(s => s.isComplete)
          .map(s => s.stageId),
      }));
    }
  }, [workflowProgress]);

  // Auto-select all zones if none selected
  useEffect(() => {
    if (zones && zones.length > 0 && state.selectedZoneIds.length === 0) {
      setState(prev => ({
        ...prev,
        selectedZoneIds: zones.map(z => z.id),
      }));
    }
  }, [zones, state.selectedZoneIds.length]);

  // Build stage data from completeness
  useEffect(() => {
    if (!completeness) return;

    const stageData: Partial<WizardStageData> = {};

    // Load calculation data
    if (loadCalcs && loadCalcs.length > 0) {
      const totalCooling = loadCalcs.reduce((sum, lc) => sum + (lc.cooling_load_btuh || 0), 0);
      const totalHeating = loadCalcs.reduce((sum, lc) => sum + (lc.heating_load_btuh || 0), 0);
      const totalCfm = loadCalcs.reduce((sum, lc) => sum + (lc.cfm_required || 0), 0);
      
      stageData.loadCalculation = {
        totalCoolingTons: totalCooling / 12000,
        totalHeatingMbh: totalHeating / 1000,
        totalCfm,
        zonesCalculated: loadCalcs.length,
      };
    }

    // Zone completeness data for other stages
    if (completeness.zones) {
      const zonesWithVent = completeness.zones.filter(z => z.hasVentilationCalc).length;
      const zonesWithEquip = completeness.zones.filter(z => z.hasEquipmentSelection).length;
      const zonesWithDist = completeness.zones.filter(z => z.hasDistributionSystem).length;
      const zonesWithErv = completeness.zones.filter(z => z.hasERVSizing).length;
      const zonesWithTerminals = completeness.zones.filter(z => z.hasTerminalUnitSelection).length;
      const zonesWithDiffusers = completeness.zones.filter(z => z.hasDiffuserSelection).length;

      stageData.ventilation = {
        systemCfm: stageData.loadCalculation?.totalCfm || 0,
        outdoorAirCfm: Math.round((stageData.loadCalculation?.totalCfm || 0) * 0.2),
        zonesConfigured: zonesWithVent,
      };

      stageData.ahu = {
        ahuCount: ahuConfigs?.length || 0,
        totalDesignCfm: ahuConfigs?.reduce((sum, ahu) => sum + (ahu.designCfm || 0), 0) || 0,
        configuredAhus: ahuConfigs?.length || 0,
      };

      stageData.terminal = {
        terminalUnitCount: completeness.totalTerminalUnitCount || 0,
        zonesWithTerminals,
        totalCapacity: stageData.loadCalculation?.totalCoolingTons || 0,
      };

      stageData.equipment = {
        equipmentCount: zonesWithEquip,
        totalCapacityTons: stageData.loadCalculation?.totalCoolingTons || 0,
        zonesWithEquipment: zonesWithEquip,
        vrfSystemCount: vrfSystems?.length || 0,
      };

      // Distribution - use actual system counts from dedicated hooks
      stageData.distribution = {
        ductSystemsCount: ductSystems?.length || 0,
        pipeSystemsCount: pipeSystems?.length || 0,
        zonesWithDistribution: zonesWithDist,
      };

      stageData.diffuser = {
        diffuserCount: completeness.totalDiffuserCount || 0,
        totalQuantity: completeness.zones.reduce((sum, z) => sum + (z.diffuserTotalQuantity || 0), 0),
        zonesWithDiffusers,
      };

      stageData.erv = {
        ervUnitsCount: zonesWithErv,
        recoveryEffectiveness: 0.75,
      };

      stageData.plant = {
        hasChwPlant: completeness.hasChilledWaterPlant,
        hasHwPlant: completeness.hasHotWaterPlant,
        totalPlantCapacity: (completeness.chilledWaterPlantCount || 0) * 100, // Estimate
      };
    }

    // HW Plant metrics
    if (hotWaterPlants && hotWaterPlants.length > 0) {
      const totalHeatingMbh = hotWaterPlants.reduce(
        (sum, p) => sum + ((p.heating_load_btuh || 0) / 1000), 0
      );
      stageData.hwPlant = {
        hasPlant: true,
        totalHeatingMbh,
        boilerCount: hotWaterPlants.reduce((sum, p) => sum + (p.boiler_count || 0), 0),
        pumpCount: hotWaterPlants.reduce((sum, p) => {
          // Count pumps from primary_pump_config if available
          const config = p.primary_pump_config as { quantity?: number } | null;
          return sum + (config?.quantity || 1);
        }, 0),
      };
    }

    // Boiler Selection metrics
    if (boilerSelections && boilerSelections.length > 0) {
      const totalCapacityMbh = boilerSelections.reduce(
        (sum, b) => sum + ((b.selected_capacity_btuh || 0) / 1000), 0
      );
      const condensing = boilerSelections.filter(b => b.boiler_type?.toLowerCase().includes('condensing')).length;
      const totalAfue = boilerSelections.reduce((sum, b) => sum + (b.afue || 0), 0);
      
      stageData.boilerSelection = {
        boilerCount: boilerSelections.length,
        totalCapacityMbh,
        avgAfue: boilerSelections.length > 0 ? totalAfue / boilerSelections.length : 0,
        condensingCount: condensing,
        nonCondensingCount: boilerSelections.length - condensing,
      };
    }

    // Chiller Selection metrics
    if (chillerSelections && chillerSelections.length > 0) {
      const totalCapacityTons = chillerSelections.reduce(
        (sum, c) => sum + (c.rated_capacity_tons || 0), 0
      );
      const totalCop = chillerSelections.reduce((sum, c) => sum + (c.rated_cop || 0), 0);
      const totalIplv = chillerSelections.reduce((sum, c) => sum + (c.rated_iplv || 0), 0);
      
      stageData.chillerSelection = {
        chillerCount: chillerSelections.length,
        totalCapacityTons,
        avgCop: chillerSelections.length > 0 ? totalCop / chillerSelections.length : 0,
        avgIplv: chillerSelections.length > 0 ? totalIplv / chillerSelections.length : 0,
      };
    }

    // Compliance data from project-level tools
    const complianceToolCount = [
      completeness.hasChilledWaterPlant,
      completeness.hasHotWaterPlant,
      completeness.hasSmokeControl,
      completeness.hasThermalComfort,
      completeness.hasSBCCompliance,
      completeness.hasASHRAE90_1Compliance,
    ].filter(Boolean).length;
    
    stageData.compliance = {
      checksTotal: 6,
      checksPassed: complianceToolCount,
      compliancePercent: Math.round((complianceToolCount / 6) * 100),
    };

    setState(prev => ({
      ...prev,
      stageData,
    }));
  }, [completeness, loadCalcs, ahuConfigs, vrfSystems, ductSystems, pipeSystems, hotWaterPlants, boilerSelections, chillerSelections]);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!projectId) return;
    
    const toSave: StoredWizardState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${WIZARD_STORAGE_KEY}-${projectId}`, JSON.stringify(toSave));
  }, [state, projectId]);

  // Validate current stage with dependency enforcement
  const validateStage = useCallback((stageId: WorkflowStageId): ValidationResult => {
    const result: ValidationResult = {
      isValid: false,
      canProceed: false,
      warnings: [],
      errors: [],
      suggestions: [],
    };

    // Check dependencies first
    const dependencies = STAGE_DEPENDENCIES[stageId] || [];
    const unmetDependencies = dependencies.filter(
      dep => !state.completedStages.includes(dep) && !state.skippedStages.includes(dep)
    );
    
    if (unmetDependencies.length > 0) {
      const depNames = unmetDependencies.map(
        d => DESIGN_WORKFLOW_STAGES.find(s => s.id === d)?.name || d
      );
      result.errors.push(`Prerequisites not met: ${depNames.join(', ')}`);
      result.suggestions.push(`Complete ${depNames[0]} first`);
      return result; // Cannot proceed without dependencies
    }

    const totalZones = zones?.length || 0;
    const selectedZones = state.selectedZoneIds.length;

    switch (stageId) {
      case 'load':
        const loadZones = state.stageData.loadCalculation?.zonesCalculated || 0;
        if (loadZones === 0) {
          result.errors.push('No load calculations completed');
          result.suggestions.push('Complete load calculations for at least one zone');
        } else if (loadZones < totalZones) {
          result.warnings.push(`${totalZones - loadZones} zones missing load calculations`);
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'ventilation':
        const ventZones = state.stageData.ventilation?.zonesConfigured || 0;
        if (ventZones === 0) {
          result.warnings.push('No ventilation calculations configured');
          result.suggestions.push('Configure ventilation for zones with occupancy');
          result.canProceed = true; // Can skip if not needed
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'psychrometric':
        // Optional stage
        result.isValid = true;
        result.canProceed = true;
        if (!state.stageData.psychrometric?.hasAnalysis) {
          result.suggestions.push('Psychrometric analysis helps optimize coil selection');
        }
        break;

      case 'ahu':
        const ahuCount = state.stageData.ahu?.ahuCount || 0;
        if (ahuCount === 0) {
          result.warnings.push('No AHU configurations created');
          result.suggestions.push('Configure at least one AHU for the project');
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'terminal':
        const terminalZones = state.stageData.terminal?.zonesWithTerminals || 0;
        if (terminalZones === 0) {
          result.warnings.push('No terminal units sized');
          result.suggestions.push('Size terminal units for zones with loads');
          result.canProceed = true;
        } else if (terminalZones < selectedZones * 0.8) {
          result.warnings.push(`Only ${terminalZones}/${selectedZones} zones have terminals`);
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'equipment':
        const equipZones = state.stageData.equipment?.zonesWithEquipment || 0;
        if (equipZones === 0) {
          result.errors.push('No equipment selected');
          result.suggestions.push('Select equipment for zones with load calculations');
        } else if (equipZones < selectedZones * 0.8) {
          result.warnings.push(`Only ${equipZones}/${selectedZones} zones have equipment`);
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'distribution':
        const distZones = state.stageData.distribution?.zonesWithDistribution || 0;
        if (distZones === 0) {
          result.warnings.push('No distribution systems designed');
          result.suggestions.push('Design duct/pipe systems for equipment');
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'diffuser':
        const diffuserZones = state.stageData.diffuser?.zonesWithDiffusers || 0;
        if (diffuserZones === 0) {
          result.warnings.push('No diffusers or grilles selected');
          result.suggestions.push('Select diffusers for zones with duct systems');
          result.canProceed = true;
        } else {
          result.isValid = true;
          result.canProceed = true;
        }
        break;

      case 'erv':
        // Optional stage
        result.isValid = true;
        result.canProceed = true;
        const oaCfm = state.stageData.ventilation?.outdoorAirCfm || 0;
        if (oaCfm > 1000 && !state.stageData.erv?.ervUnitsCount) {
          result.suggestions.push('Consider ERV for energy recovery with high outdoor air');
        }
        break;

      case 'plant':
        // Optional stage - track both CHW and HW plant completeness
        result.isValid = true;
        result.canProceed = true;
        
        const totalCapacity = state.stageData.equipment?.totalCapacityTons || 0;
        const heatingMbh = state.stageData.loadCalculation?.totalHeatingMbh || 0;
        
        // CHW plant suggestion
        if (totalCapacity > 100 && !state.stageData.plant?.hasChwPlant) {
          result.suggestions.push('Consider central CHW plant for projects over 100 tons');
        }
        
        // HW plant suggestion
        if (heatingMbh > 500 && !state.stageData.hwPlant?.hasPlant) {
          result.suggestions.push('Consider central HW plant for projects over 500 MBH heating');
        }
        
        // Boiler selection validation
        if (state.stageData.hwPlant?.hasPlant && !state.stageData.boilerSelection?.boilerCount) {
          result.warnings.push('HW plant configured but no boilers selected');
        }
        
        // Chiller selection validation
        if (state.stageData.plant?.hasChwPlant && !state.stageData.chillerSelection?.chillerCount) {
          result.warnings.push('CHW plant configured but no chillers selected');
        }
        break;

      case 'compliance':
        const compPercent = state.stageData.compliance?.compliancePercent || 0;
        if (compPercent < 50) {
          result.warnings.push('Less than 50% compliance checks completed');
        }
        result.isValid = compPercent >= 80;
        result.canProceed = true; // Final stage
        break;
    }

    return result;
  }, [zones, state.selectedZoneIds, state.stageData, state.completedStages, state.skippedStages]);

  // Navigation functions
  const goToStage = useCallback((stageId: WorkflowStageId) => {
    setState(prev => ({
      ...prev,
      currentStage: stageId,
      lastUpdated: Date.now(),
    }));
  }, []);

  const goToNextStage = useCallback(() => {
    const currentIndex = DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === state.currentStage);
    if (currentIndex < DESIGN_WORKFLOW_STAGES.length - 1) {
      const nextStage = DESIGN_WORKFLOW_STAGES[currentIndex + 1];
      goToStage(nextStage.id as WorkflowStageId);
    }
  }, [state.currentStage, goToStage]);

  const goToPreviousStage = useCallback(() => {
    const currentIndex = DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === state.currentStage);
    if (currentIndex > 0) {
      const prevStage = DESIGN_WORKFLOW_STAGES[currentIndex - 1];
      goToStage(prevStage.id as WorkflowStageId);
    }
  }, [state.currentStage, goToStage]);

  const skipStage = useCallback(() => {
    setState(prev => ({
      ...prev,
      skippedStages: [...prev.skippedStages, prev.currentStage],
    }));
    goToNextStage();
  }, [goToNextStage]);

  const selectZones = useCallback((zoneIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedZoneIds: zoneIds,
    }));
  }, []);

  const openToolForStage = useCallback((stageId: WorkflowStageId) => {
    const stage = DESIGN_WORKFLOW_STAGES.find(s => s.id === stageId);
    if (stage) {
      const url = `${stage.path}?project=${projectId}`;
      navigate(url);
    }
  }, [projectId, navigate]);

  const resetWizard = useCallback(() => {
    if (projectId) {
      localStorage.removeItem(`${WIZARD_STORAGE_KEY}-${projectId}`);
    }
    setState({
      projectId: projectId ?? '',
      projectName: workflowProgress?.projectName || '',
      selectedZoneIds: zones?.map(z => z.id) || [],
      currentStage: 'load' as WorkflowStageId,
      stageData: {},
      skippedStages: [],
      completedStages: [],
      lastUpdated: Date.now(),
      activeStages: DESIGN_WORKFLOW_STAGES.map(s => s.id),
    });
  }, [projectId, workflowProgress?.projectName, zones]);

  // Apply template to wizard
  const applyTemplate = useCallback((template: { 
    id: string; 
    name: string; 
    required_stages?: WorkflowStageId[]; 
    optional_stages?: WorkflowStageId[];
  }) => {
    const requiredStages = template.required_stages || DESIGN_WORKFLOW_STAGES.map(s => s.id);
    const optionalStages = template.optional_stages || [];
    
    setState(prev => ({
      ...prev,
      templateId: template.id,
      templateName: template.name,
      activeStages: requiredStages,
      // Remove required stages from skipped list
      skippedStages: prev.skippedStages.filter(s => !requiredStages.includes(s)),
      lastUpdated: Date.now(),
    }));
  }, []);

  // Compute derived state
  const currentStageIndex = useMemo(() => 
    DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === state.currentStage),
    [state.currentStage]
  );

  const isFirstStage = currentStageIndex === 0;
  const isLastStage = currentStageIndex === DESIGN_WORKFLOW_STAGES.length - 1;

  const overallProgress = useMemo(() => {
    if (!workflowProgress) return 0;
    return workflowProgress.overallProgress;
  }, [workflowProgress]);

  const currentValidation = useMemo(() => 
    validateStage(state.currentStage),
    [state.currentStage, validateStage]
  );

  return {
    // State
    state,
    isLoading: isLoadingProgress || isLoadingCompleteness,
    
    // Computed
    stages: workflowProgress?.stages || [],
    currentStageIndex,
    isFirstStage,
    isLastStage,
    overallProgress,
    currentValidation,
    zones: zones || [],
    
    // Actions
    goToStage,
    goToNextStage,
    goToPreviousStage,
    skipStage,
    selectZones,
    validateStage,
    openToolForStage,
    resetWizard,
    applyTemplate,
  };
}
