import { AlertTriangle, Lock, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ValidationBlocker } from '@/hooks/usePreSaveValidation';

interface PreSaveValidationAlertProps {
  blockers: ValidationBlocker[];
  warnings?: ValidationBlocker[];
  onDismissWarnings?: () => void;
  className?: string;
}

export function PreSaveValidationAlert({
  blockers,
  warnings = [],
  onDismissWarnings,
  className,
}: PreSaveValidationAlertProps) {
  if (blockers.length === 0 && warnings.length === 0) {
    return null;
  }

  const getIcon = (blocker: ValidationBlocker) => {
    switch (blocker.type) {
      case 'stage_locked':
        return <Lock className="h-4 w-4" />;
      case 'cross_tool':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      {/* Critical blockers - prevents saving */}
      {blockers.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cannot Save - {blockers.length} Issue{blockers.length > 1 ? 's' : ''} Found</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2">
              {blockers.map((blocker) => (
                <li key={blocker.id} className="flex items-start gap-2">
                  {getIcon(blocker)}
                  <div>
                    <p className="font-medium">{blocker.message}</p>
                    {blocker.details && (
                      <p className="text-sm opacity-80">{blocker.details}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings - can still save but user should be aware */}
      {warnings.length > 0 && (
        <Alert className="mb-4 border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">
            {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {warnings.map((warning) => (
                <li key={warning.id} className="flex items-start gap-2 text-warning">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{warning.message}</span>
                </li>
              ))}
            </ul>
            {onDismissWarnings && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onDismissWarnings}
              >
                Dismiss Warnings
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
