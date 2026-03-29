import { FlaskConical, Play, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSandbox } from '@/contexts/SandboxContext';
import { cn } from '@/lib/utils';

interface SandboxModeToggleProps {
  currentData: Record<string, unknown>;
  onExitWithSave?: (data: Record<string, unknown>) => void;
  className?: string;
}

export function SandboxModeToggle({
  currentData,
  onExitWithSave,
  className,
}: SandboxModeToggleProps) {
  const { state, activateSandbox, deactivateSandbox, getMergedData } = useSandbox();

  const handleActivate = () => {
    activateSandbox(currentData);
  };

  const handleDeactivate = (save: boolean) => {
    if (save && onExitWithSave) {
      onExitWithSave(getMergedData());
    }
    deactivateSandbox();
  };

  if (!state.isActive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            className={cn('gap-2', className)}
          >
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">What-If Mode</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Enter sandbox mode to explore design alternatives without saving</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant="outline" 
        className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700 animate-pulse"
      >
        <FlaskConical className="h-3 w-3 mr-1" />
        Sandbox Active
      </Badge>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Exit Sandbox Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have {state.scenarios.length - 1} scenario(s) with unsaved changes.
              Choose how to proceed:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeactivate(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard All
            </AlertDialogAction>
            {onExitWithSave && (
              <AlertDialogAction
                onClick={() => handleDeactivate(true)}
                className="bg-primary"
              >
                <Play className="h-4 w-4 mr-1" />
                Save Active Scenario
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Banner component for displaying sandbox state at top of page
export function SandboxModeBanner() {
  const { state } = useSandbox();

  if (!state.isActive) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-amber-800 dark:text-amber-200">
        <FlaskConical className="h-4 w-4" />
        <span>
          <strong>Sandbox Mode:</strong> Changes are temporary and won't be saved until you exit.
        </span>
        <span className="text-amber-600 dark:text-amber-400">
          ({state.scenarios.length - 1} scenario{state.scenarios.length !== 2 ? 's' : ''})
        </span>
      </div>
    </div>
  );
}
