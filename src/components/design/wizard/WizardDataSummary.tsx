import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '../DesignWorkflowNextStep';
import { WizardStageData } from '@/hooks/useWizardState';

interface WizardDataSummaryProps {
  currentStage: WorkflowStageId;
  stageData: Partial<WizardStageData>;
  completedStages: WorkflowStageId[];
  skippedStages: WorkflowStageId[];
}

interface StageSummary {
  stageId: WorkflowStageId;
  title: string;
  status: 'completed' | 'skipped' | 'pending';
  summary: string;
}

function getStageSummary(
  stageId: WorkflowStageId, 
  stageData: Partial<WizardStageData>,
  completedStages: WorkflowStageId[],
  skippedStages: WorkflowStageId[]
): StageSummary {
  const stage = DESIGN_WORKFLOW_STAGES.find(s => s.id === stageId);
  const status = completedStages.includes(stageId) 
    ? 'completed' 
    : skippedStages.includes(stageId) 
    ? 'skipped' 
    : 'pending';

  let summary = 'Not started';

  switch (stageId) {
    case 'load':
      if (stageData.loadCalculation) {
        summary = `${stageData.loadCalculation.totalCoolingTons.toFixed(1)} tons, ${stageData.loadCalculation.zonesCalculated} zones`;
      }
      break;
    case 'ventilation':
      if (stageData.ventilation) {
        summary = `${stageData.ventilation.systemCfm.toLocaleString()} CFM, OA: ${stageData.ventilation.outdoorAirCfm.toLocaleString()} CFM`;
      }
      break;
    case 'psychrometric':
      if (stageData.psychrometric?.hasAnalysis) {
        summary = `Supply: ${stageData.psychrometric.supplyAirTemp}°F, Return: ${stageData.psychrometric.returnAirTemp}°F`;
      }
      break;
    case 'equipment':
      if (stageData.equipment) {
        summary = `${stageData.equipment.equipmentCount} units, ${stageData.equipment.totalCapacityTons.toFixed(1)} tons`;
      }
      break;
    case 'distribution':
      if (stageData.distribution) {
        summary = `${stageData.distribution.ductSystemsCount} systems, ${stageData.distribution.zonesWithDistribution} zones`;
      }
      break;
    case 'erv':
      if (stageData.erv) {
        summary = `${stageData.erv.ervUnitsCount} units, ${(stageData.erv.recoveryEffectiveness * 100).toFixed(0)}% effectiveness`;
      }
      break;
    case 'compliance':
      if (stageData.compliance) {
        summary = `${stageData.compliance.checksPassed}/${stageData.compliance.checksTotal} checks, ${stageData.compliance.compliancePercent}%`;
      }
      break;
  }

  return {
    stageId,
    title: stage?.name || stageId,
    status,
    summary,
  };
}

export function WizardDataSummary({
  currentStage,
  stageData,
  completedStages,
  skippedStages,
}: WizardDataSummaryProps) {
  const currentStageIndex = DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
  
  // Only show summaries for stages before current
  const previousStages = DESIGN_WORKFLOW_STAGES
    .slice(0, currentStageIndex)
    .map(stage => getStageSummary(
      stage.id as WorkflowStageId, 
      stageData, 
      completedStages, 
      skippedStages
    ));

  if (previousStages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Previous Stages Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {previousStages.map((stage) => (
          <div 
            key={stage.stageId}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-2">
              {stage.status === 'completed' ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              ) : stage.status === 'skipped' ? (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <Minus className="h-3 w-3 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <X className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">{stage.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{stage.summary}</span>
              {stage.status === 'skipped' && (
                <Badge variant="outline" className="text-[10px]">Skipped</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
