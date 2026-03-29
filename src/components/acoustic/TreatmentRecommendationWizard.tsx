import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MapPin,
  DollarSign,
  Target,
  Package,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTreatmentWizard, WizardStep } from '@/hooks/useTreatmentWizard';
import { ZoneSelectionStep } from './wizard/ZoneSelectionStep';
import { BudgetConstraintsStep } from './wizard/BudgetConstraintsStep';
import { PerformanceRequirementsStep } from './wizard/PerformanceRequirementsStep';
import { PackageComparisonStep } from './wizard/PackageComparisonStep';
import { PackageReviewStep } from './wizard/PackageReviewStep';
import { toast } from 'sonner';

interface TreatmentRecommendationWizardProps {
  projectId: string | undefined;
  projectName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS: { step: WizardStep; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Zones', icon: MapPin },
  { step: 2, label: 'Budget', icon: DollarSign },
  { step: 3, label: 'Performance', icon: Target },
  { step: 4, label: 'Packages', icon: Package },
  { step: 5, label: 'Review', icon: FileCheck },
];

export function TreatmentRecommendationWizard({
  projectId,
  projectName,
  open,
  onOpenChange,
}: TreatmentRecommendationWizardProps) {
  const wizard = useTreatmentWizard(projectId);

  const handleClose = () => {
    onOpenChange(false);
    wizard.resetWizard();
  };

  const handleExportPDF = () => {
    toast.success('PDF export coming soon');
  };

  const handleExportExcel = () => {
    toast.success('Excel export coming soon');
  };

  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return (
          <ZoneSelectionStep
            allZones={wizard.allZones}
            selectedZoneIds={wizard.selectedZoneIds}
            selectionSummary={wizard.selectionSummary}
            onToggleZone={wizard.toggleZone}
            onSelectAllExceeding={wizard.selectAllExceeding}
            onSelectAllMarginal={wizard.selectAllMarginal}
            onClearSelection={wizard.clearSelection}
          />
        );
      case 2:
        return (
          <BudgetConstraintsStep
            constraints={wizard.constraints}
            onConstraintsChange={wizard.setConstraints}
          />
        );
      case 3:
        return (
          <PerformanceRequirementsStep
            requirements={wizard.requirements}
            onRequirementsChange={wizard.setRequirements}
            selectionSummary={wizard.selectionSummary}
          />
        );
      case 4:
        return wizard.packages ? (
          <PackageComparisonStep
            packages={wizard.packages}
            selectedPackageId={wizard.selectedPackageId}
            onSelectPackage={wizard.selectPackage}
            isGenerating={wizard.isGenerating}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        );
      case 5:
        return wizard.selectedPackage ? (
          <PackageReviewStep
            selectedPackage={wizard.selectedPackage}
            projectName={projectName}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Please select a package first
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Acoustic Treatment Wizard
          </DialogTitle>
          <DialogDescription>
            Generate optimized treatment packages based on your zones, budget, and performance requirements.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
          {STEPS.map(({ step, label, icon: Icon }, index) => {
            const isActive = wizard.currentStep === step;
            const isComplete = wizard.currentStep > step;
            const isClickable = step < wizard.currentStep || wizard.canProceedToStep(step);

            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => isClickable && wizard.goToStep(step)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isComplete && 'text-primary',
                    !isActive && !isComplete && 'text-muted-foreground',
                    isClickable && !isActive && 'hover:bg-muted cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden md:inline">{label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-2',
                      isComplete ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={wizard.goBack}
            disabled={wizard.currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {wizard.currentStep === 5 ? (
              <Button onClick={handleClose}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done
              </Button>
            ) : (
              <Button
                onClick={wizard.goNext}
                disabled={!wizard.canProceedToStep((wizard.currentStep + 1) as WizardStep)}
              >
                {wizard.currentStep === 3 ? 'Generate Packages' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
