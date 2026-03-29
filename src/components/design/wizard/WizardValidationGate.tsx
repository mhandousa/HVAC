import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationResult } from '@/hooks/useWizardState';
import { WorkflowStageId } from '../DesignWorkflowNextStep';

interface WizardValidationGateProps {
  stageId: WorkflowStageId;
  validation: ValidationResult;
  onProceed: () => void;
  onSkip: () => void;
  onFix?: () => void;
  isOptionalStage: boolean;
}

export function WizardValidationGate({
  stageId,
  validation,
  onProceed,
  onSkip,
  onFix,
  isOptionalStage,
}: WizardValidationGateProps) {
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const hasSuggestions = validation.suggestions.length > 0;

  if (validation.isValid && !hasWarnings && !hasSuggestions) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-600 dark:text-green-400">
          Stage Complete
        </AlertTitle>
        <AlertDescription>
          All requirements met. Ready to proceed to the next stage.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-warning/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {hasErrors ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Validation Issues</span>
            </>
          ) : hasWarnings ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600 dark:text-yellow-400">Warnings</span>
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400">Suggestions</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Errors */}
        {hasErrors && (
          <div className="space-y-2">
            {validation.errors.map((error, i) => (
              <Alert key={i} variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div className="space-y-2">
            {validation.warnings.map((warning, i) => (
              <Alert key={i} className="py-2 border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {hasSuggestions && (
          <div className="space-y-2">
            {validation.suggestions.map((suggestion, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded"
              >
                <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {hasErrors && onFix && (
            <Button size="sm" variant="destructive" onClick={onFix}>
              Fix Issues
            </Button>
          )}

          {validation.canProceed && (
            <Button 
              size="sm" 
              variant={hasErrors ? "outline" : "default"}
              onClick={onProceed}
            >
              {hasErrors ? 'Proceed Anyway' : 'Continue'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}

          {isOptionalStage && (
            <Button size="sm" variant="ghost" onClick={onSkip}>
              Skip Stage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
