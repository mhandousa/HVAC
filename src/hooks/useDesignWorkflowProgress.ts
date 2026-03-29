import { useDesignCompleteness, ProjectCompleteness } from './useDesignCompleteness';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

export interface WorkflowStageProgress {
  stageId: WorkflowStageId;
  stageName: string;
  isComplete: boolean;
  progress: number; // 0-100
  hasData: boolean;
  itemCount: number;
  description: string;
  primaryPath: string;
}

export interface WorkflowProgress {
  projectId: string;
  projectName: string;
  stages: WorkflowStageProgress[];
  currentStage: WorkflowStageId | null;
  overallProgress: number;
  nextRecommendedStage: WorkflowStageId | null;
  completedStages: number;
  totalStages: number;
}

function calculateStageProgress(
  stageId: WorkflowStageId,
  completeness: ProjectCompleteness
): { progress: number; hasData: boolean; itemCount: number } {
  if (completeness.totalZones === 0) {
    return { progress: 0, hasData: false, itemCount: 0 };
  }

  switch (stageId) {
    case 'load':
      return {
        progress: Math.round((completeness.zonesWithLoadCalc / completeness.totalZones) * 100),
        hasData: completeness.zonesWithLoadCalc > 0,
        itemCount: completeness.zonesWithLoadCalc,
      };
    case 'ventilation':
      return {
        progress: Math.round((completeness.zonesWithVentilation / completeness.totalZones) * 100),
        hasData: completeness.zonesWithVentilation > 0,
        itemCount: completeness.zonesWithVentilation,
      };
    case 'psychrometric':
      // Psychrometric is optional, count zones with psychrometric analysis
      const zonesWithPsychro = completeness.zones.filter(z => z.hasPsychrometricAnalysis).length;
      return {
        progress: Math.round((zonesWithPsychro / completeness.totalZones) * 100),
        hasData: zonesWithPsychro > 0,
        itemCount: zonesWithPsychro,
      };
    case 'ahu':
      // AHU is project-level - check actual AHU configurations
      const ahuCount = completeness.ahuConfigurationCount || 0;
      return {
        progress: ahuCount > 0 ? 100 : 0,
        hasData: ahuCount > 0,
        itemCount: ahuCount,
      };
    case 'terminal':
      return {
        progress: Math.round((completeness.zonesWithTerminalUnits / completeness.totalZones) * 100),
        hasData: completeness.zonesWithTerminalUnits > 0,
        itemCount: completeness.totalTerminalUnitCount,
      };
    case 'equipment':
      return {
        progress: Math.round((completeness.zonesWithEquipment / completeness.totalZones) * 100),
        hasData: completeness.zonesWithEquipment > 0,
        itemCount: completeness.zonesWithEquipment,
      };
    case 'distribution':
      return {
        progress: Math.round((completeness.zonesWithDistribution / completeness.totalZones) * 100),
        hasData: completeness.zonesWithDistribution > 0,
        itemCount: completeness.zonesWithDistribution,
      };
    case 'diffuser':
      return {
        progress: Math.round((completeness.zonesWithDiffusers / completeness.totalZones) * 100),
        hasData: completeness.zonesWithDiffusers > 0,
        itemCount: completeness.totalDiffuserCount,
      };
    case 'erv':
      return {
        progress: Math.round((completeness.zonesWithERV / completeness.totalZones) * 100),
        hasData: completeness.zonesWithERV > 0,
        itemCount: completeness.zonesWithERV,
      };
    case 'plant':
      // Plant is optional, project-level
      const hasPlant = completeness.hasChilledWaterPlant || completeness.hasHotWaterPlant;
      const plantCount = (completeness.chilledWaterPlantCount || 0) + (completeness.hotWaterPlantCount || 0);
      return {
        progress: hasPlant ? 100 : 0,
        hasData: hasPlant,
        itemCount: plantCount,
      };
    case 'compliance':
      // Compliance is based on specialized tools score
      const complianceTools = [
        completeness.hasSBCCompliance,
        completeness.hasASHRAE90_1Compliance,
        completeness.hasThermalComfort,
        completeness.hasSmokeControl,
      ];
      const completedComplianceTools = complianceTools.filter(Boolean).length;
      return {
        progress: Math.round((completedComplianceTools / complianceTools.length) * 100),
        hasData: completedComplianceTools > 0,
        itemCount: completedComplianceTools,
      };
    default:
      return { progress: 0, hasData: false, itemCount: 0 };
  }
}

export function useDesignWorkflowProgress(projectId: string | null): {
  data: WorkflowProgress | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: completeness, isLoading, error } = useDesignCompleteness(projectId);

  if (!completeness || !projectId) {
    return { data: null, isLoading, error: error as Error | null };
  }

  const stages: WorkflowStageProgress[] = DESIGN_WORKFLOW_STAGES.map(stage => {
    const { progress, hasData, itemCount } = calculateStageProgress(stage.id, completeness);
    
    // A stage is "complete" if progress >= 80% (most zones covered)
    const isComplete = progress >= 80;

    return {
      stageId: stage.id,
      stageName: stage.name,
      isComplete,
      progress,
      hasData,
      itemCount,
      description: stage.description,
      primaryPath: stage.path,
    };
  });

  // Find current stage (first incomplete stage that has some data, or first incomplete)
  let currentStage: WorkflowStageId | null = null;
  let nextRecommendedStage: WorkflowStageId | null = null;

  for (const stage of stages) {
    if (!stage.isComplete) {
      if (stage.hasData && !currentStage) {
        currentStage = stage.stageId;
      }
      if (!nextRecommendedStage) {
        nextRecommendedStage = stage.stageId;
      }
    }
  }

  // If no current stage found, use next recommended
  if (!currentStage) {
    currentStage = nextRecommendedStage;
  }

  // Calculate overall progress (excluding optional stages)
  const optionalStageIds = ['psychrometric', 'erv', 'plant'];
  const mainStages = stages.filter(s => !optionalStageIds.includes(s.stageId) && s.stageId !== 'compliance');
  const overallProgress = mainStages.length > 0
    ? Math.round(mainStages.reduce((sum, s) => sum + s.progress, 0) / mainStages.length)
    : 0;

  const completedStages = stages.filter(s => s.isComplete).length;

  return {
    data: {
      projectId,
      projectName: completeness.projectName,
      stages,
      currentStage,
      overallProgress,
      nextRecommendedStage,
      completedStages,
      totalStages: stages.length,
    },
    isLoading,
    error: error as Error | null,
  };
}
