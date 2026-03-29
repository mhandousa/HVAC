import { useState } from 'react';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, GitCompare, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EditConflictWarningProps {
  entityType: string;
  entityId: string | null;
  currentRevisionNumber: number;
  onReload: () => void;
  onViewDiff?: () => void;
  onForceSave?: () => void;
  className?: string;
}

export function EditConflictWarning({
  entityType,
  entityId,
  currentRevisionNumber,
  onReload,
  onViewDiff,
  onForceSave,
  className,
}: EditConflictWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType,
    entityId,
    currentRevisionNumber,
    enabled: !!entityId,
  });

  if (!hasConflict || isDismissed || !latestRevision) {
    return null;
  }

  const timeAgo = latestRevision.created_at
    ? formatDistanceToNow(new Date(latestRevision.created_at), { addSuffix: true })
    : 'recently';

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleReload = () => {
    onReload();
    clearConflict();
    setIsDismissed(false);
  };

  const handleForceSave = () => {
    onForceSave?.();
    clearConflict();
    setIsDismissed(false);
  };

  return (
    <Alert
      variant="destructive"
      className={cn(
        'border-warning/50 bg-warning/10 animate-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning-foreground flex items-center justify-between">
        <span>Design Modified by Another User</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-foreground">
        <p className="mb-3">
          <strong>{latestRevision.creatorName || 'Someone'}</strong> saved changes{' '}
          {timeAgo}.
          {latestRevision.change_summary && (
            <span className="block text-sm mt-1 text-muted-foreground">
              "{latestRevision.change_summary}"
            </span>
          )}
          <span className="block text-sm mt-1">
            Your unsaved changes may overwrite their work.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-border hover:bg-muted"
            onClick={handleReload}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Latest
          </Button>
          {onViewDiff && (
            <Button
              size="sm"
              variant="outline"
              className="border-border hover:bg-muted"
              onClick={onViewDiff}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              View Diff
            </Button>
          )}
          {onForceSave && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleForceSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Keep Mine (Override)
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Standalone hook wrapper for simpler usage
export function useEditConflict(
  entityType: string,
  entityId: string | null,
  currentRevisionNumber: number
) {
  return useConflictDetection({
    entityType,
    entityId,
    currentRevisionNumber,
    enabled: !!entityId,
  });
}
