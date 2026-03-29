import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, 
  Settings, 
  RefreshCw, 
  HelpCircle, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWizardState } from '@/hooks/useWizardState';
import { useProjects } from '@/hooks/useProjects';
import { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';
import { WizardNavigation } from '@/components/design/wizard/WizardNavigation';
import { WizardStageContent } from '@/components/design/wizard/WizardStageContent';
import { WizardValidationGate } from '@/components/design/wizard/WizardValidationGate';
import { WizardDataSummary } from '@/components/design/wizard/WizardDataSummary';
import { WizardZoneSelector } from '@/components/design/wizard/WizardZoneSelector';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { WorkflowTemplateSelector } from '@/components/design/WorkflowTemplateSelector';
import type { WorkflowTemplate } from '@/hooks/useWorkflowTemplates';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const OPTIONAL_STAGES: WorkflowStageId[] = ['psychrometric', 'erv'];

export default function DesignWorkflowWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useProjects();

  const {
    state,
    isLoading,
    stages,
    currentStageIndex,
    isFirstStage,
    isLastStage,
    overallProgress,
    currentValidation,
    zones,
    goToStage,
    goToNextStage,
    goToPreviousStage,
    skipStage,
    selectZones,
    openToolForStage,
    resetWizard,
    applyTemplate,
  } = useWizardState(projectId);

  // Handle no project selected
  React.useEffect(() => {
    if (!projectsLoading && !projectId && projects?.length) {
      navigate(`/design/wizard?project=${projects[0].id}`, { replace: true });
    }
  }, [projectId, projects, projectsLoading, navigate]);

  const handleClose = () => {
    if (overallProgress > 0 && overallProgress < 100) {
      setShowCloseConfirm(true);
    } else {
      navigate(`/design?project=${projectId}`);
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    navigate(`/design?project=${projectId}`);
  };

  const handleOpenTool = (stageId: WorkflowStageId) => {
    openToolForStage(stageId);
  };

  const handleComplete = () => {
    navigate(`/design-completeness?project=${projectId}`);
  };

  const isOptionalStage = OPTIONAL_STAGES.includes(state.currentStage);

  // Map stage to tool type for validation alerts
  const getToolTypeForStage = (stageId: WorkflowStageId) => {
    const mapping: Record<WorkflowStageId, string> = {
      'load': 'load-calculation',
      'ventilation': 'ventilation',
      'psychrometric': 'psychrometric',
      'ahu': 'ahu',
      'terminal': 'terminal',
      'equipment': 'equipment-selection',
      'distribution': 'duct-system',
      'diffuser': 'diffuser',
      'erv': 'erv',
      'plant': 'equipment-selection',
      'compliance': 'equipment-selection',
    };
    return mapping[stageId] || null;
  };

  if (isLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Design Workflow Wizard</h1>
              <p className="text-sm text-muted-foreground">
                {state.projectName || 'Select Project'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Workflow Template Selector */}
            <WorkflowTemplateSelector 
              onApply={(template: WorkflowTemplate) => {
                applyTemplate({
                  id: template.id,
                  name: template.name,
                  required_stages: template.required_stages as WorkflowStageId[] | undefined,
                  optional_stages: template.optional_stages as WorkflowStageId[] | undefined,
                });
                toast.success(`Applied "${template.name}" template - ${(template.required_stages as string[] | undefined)?.length || 'all'} stages configured`);
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowZoneSelector(!showZoneSelector)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zone Selection</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={resetWizard}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Wizard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Documentation</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Stage navigation */}
        <aside className="w-72 border-r bg-muted/30 flex-shrink-0 hidden lg:flex flex-col">
          <WizardNavigation
            stages={stages}
            currentStage={state.currentStage}
            completedStages={state.completedStages}
            skippedStages={state.skippedStages}
            overallProgress={overallProgress}
            onStageSelect={goToStage}
            projectId={projectId}
            className="flex-1"
          />
        </aside>

        {/* Center content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {/* Zone selector (collapsible) */}
              {showZoneSelector && (
                <WizardZoneSelector
                  zones={zones}
                  selectedZoneIds={state.selectedZoneIds}
                  onSelectionChange={selectZones}
                  className="mb-6"
                />
              )}

              {/* Cross-tool validation alerts */}
              <CrossToolValidationAlert
                projectId={projectId}
                currentTool={getToolTypeForStage(state.currentStage) as any}
                variant="card"
              />

              {/* Previous stages summary */}
              <WizardDataSummary
                currentStage={state.currentStage}
                stageData={state.stageData}
                completedStages={state.completedStages}
                skippedStages={state.skippedStages}
              />

              {/* Stage content */}
              <WizardStageContent
                stageId={state.currentStage}
                projectId={projectId}
                stageData={state.stageData}
                selectedZoneIds={state.selectedZoneIds}
                onOpenTool={handleOpenTool}
                onNext={isLastStage ? handleComplete : goToNextStage}
                onSkip={skipStage}
                isLastStage={isLastStage}
              />

              {/* Validation gate */}
              <WizardValidationGate
                stageId={state.currentStage}
                validation={currentValidation}
                onProceed={isLastStage ? handleComplete : goToNextStage}
                onSkip={skipStage}
                onFix={() => handleOpenTool(state.currentStage)}
                isOptionalStage={isOptionalStage}
              />
            </div>
          </ScrollArea>

          {/* Footer navigation */}
          <footer className="border-t bg-card p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousStage}
                disabled={isFirstStage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Stage {currentStageIndex + 1} of {stages.length}
                </span>
                {/* Stage dots for mobile */}
                <div className="flex gap-1 lg:hidden">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.stageId}
                      className={`w-2 h-2 rounded-full ${
                        index === currentStageIndex
                          ? 'bg-primary'
                          : index < currentStageIndex
                          ? 'bg-primary/50'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={isLastStage ? handleComplete : goToNextStage}
                disabled={!currentValidation.canProceed}
              >
                {isLastStage ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </footer>
        </main>
      </div>

      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Wizard?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is automatically saved. You can resume from where you left off
              by reopening the wizard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Close Wizard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
