import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings, RefreshCw, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { WorkflowStageId } from './DesignWorkflowNextStep';
import { WizardNavigation } from './wizard/WizardNavigation';
import { WizardStageContent } from './wizard/WizardStageContent';
import { WizardValidationGate } from './wizard/WizardValidationGate';
import { WizardDataSummary } from './wizard/WizardDataSummary';
import { WizardZoneSelector } from './wizard/WizardZoneSelector';
import { WorkflowTemplateSelector } from './WorkflowTemplateSelector';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowTemplate } from '@/hooks/useWorkflowTemplates';

const OPTIONAL_STAGES: WorkflowStageId[] = ['psychrometric', 'erv'];

interface DesignWorkflowWizardProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DesignWorkflowWizard({
  projectId,
  isOpen,
  onClose,
}: DesignWorkflowWizardProps) {
  const navigate = useNavigate();
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showZoneSelector, setShowZoneSelector] = React.useState(false);
  const [appliedTemplate, setAppliedTemplate] = React.useState<string | null>(null);

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

  const handleApplyTemplate = (template: WorkflowTemplate) => {
    // Use the applyTemplate function from the hook
    applyTemplate({
      id: template.id,
      name: template.name,
      required_stages: template.required_stages as WorkflowStageId[],
      optional_stages: template.optional_stages as WorkflowStageId[],
    });
    
    setAppliedTemplate(template.name);
    toast.success(`Applied template: ${template.name}`, {
      description: `${template.required_stages.length} required stages, ${template.optional_stages.length} optional stages configured`,
    });
  };

  const handleClose = () => {
    if (overallProgress > 0 && overallProgress < 100) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleOpenTool = (stageId: WorkflowStageId) => {
    openToolForStage(stageId);
    onClose();
  };

  const handleComplete = () => {
    navigate(`/design-completeness?project=${projectId}`);
    onClose();
  };

  const isOptionalStage = OPTIONAL_STAGES.includes(state.currentStage);

  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-5xl p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                Design Workflow Wizard
                <span className="text-sm font-normal text-muted-foreground">
                  — {state.projectName || 'Select Project'}
                </span>
              </SheetTitle>
              <div className="flex items-center gap-2">
                <WorkflowTemplateSelector
                  onApply={handleApplyTemplate}
                  trigger={
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Apply Template</TooltipContent>
                    </Tooltip>
                  }
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
          </SheetHeader>

          {/* Main content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar - Stage navigation */}
            <WizardNavigation
              stages={stages}
              currentStage={state.currentStage}
              completedStages={state.completedStages}
              skippedStages={state.skippedStages}
              overallProgress={overallProgress}
              onStageSelect={goToStage}
              projectId={projectId}
              className="w-64 flex-shrink-0 hidden md:flex"
            />

            {/* Center content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Zone selector (collapsible) */}
                {showZoneSelector && (
                  <WizardZoneSelector
                    zones={zones}
                    selectedZoneIds={state.selectedZoneIds}
                    onSelectionChange={selectZones}
                    className="mb-6"
                  />
                )}

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
          </div>

          {/* Footer navigation (mobile) */}
          <div className="p-4 border-t flex items-center justify-between md:hidden flex-shrink-0">
            <Button
              variant="outline"
              onClick={goToPreviousStage}
              disabled={isFirstStage}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Stage {currentStageIndex + 1} of {stages.length}
            </div>
            <Button
              onClick={isLastStage ? handleComplete : goToNextStage}
              disabled={!currentValidation.canProceed}
            >
              {isLastStage ? 'Complete' : 'Next'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
