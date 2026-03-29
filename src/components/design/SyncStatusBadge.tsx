import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

export type SyncStatus = 'synced' | 'stale' | 'sync_required' | 'unknown';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  sourceLabel?: string;
  sourceUpdatedAt?: string;
  lastSyncedAt?: string;
  onSync?: () => void;
  isSyncing?: boolean;
  className?: string;
}

export function SyncStatusBadge({
  status,
  sourceLabel = 'source data',
  sourceUpdatedAt,
  lastSyncedAt,
  onSync,
  isSyncing,
  className,
}: SyncStatusBadgeProps) {
  const config = {
    synced: {
      icon: CheckCircle2,
      label: 'Up to date',
      variant: 'default' as const,
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
    },
    stale: {
      icon: Clock,
      label: 'May be stale',
      variant: 'secondary' as const,
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
    },
    sync_required: {
      icon: AlertTriangle,
      label: 'Sync required',
      variant: 'destructive' as const,
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
    unknown: {
      icon: Clock,
      label: 'Unknown',
      variant: 'outline' as const,
      className: '',
    },
  };

  const { icon: Icon, label, className: statusClassName } = config[status];

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'unknown time';
    }
  };

  const formatFullTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1', className)}>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 font-normal',
                statusClassName
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Badge>
            {onSync && (status === 'stale' || status === 'sync_required') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[280px]">
          <div className="space-y-1 text-sm">
            {status === 'synced' && (
              <p>This data is synchronized with {sourceLabel}.</p>
            )}
            {status === 'stale' && (
              <p>The {sourceLabel} may have changed since this was last updated.</p>
            )}
            {status === 'sync_required' && (
              <p>The {sourceLabel} has been updated. Please re-sync to get the latest values.</p>
            )}
            {sourceUpdatedAt && (
              <p className="text-muted-foreground">
                Source updated: {formatTime(sourceUpdatedAt)}
                <br />
                <span className="text-xs">{formatFullTime(sourceUpdatedAt)}</span>
              </p>
            )}
            {lastSyncedAt && (
              <p className="text-muted-foreground">
                Last synced: {formatTime(lastSyncedAt)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to determine sync status based on timestamps
export function determineSyncStatus(
  sourceUpdatedAt: string | null | undefined,
  lastSyncedAt: string | null | undefined
): SyncStatus {
  if (!sourceUpdatedAt || !lastSyncedAt) {
    return 'unknown';
  }

  try {
    const sourceDate = new Date(sourceUpdatedAt);
    const syncDate = new Date(lastSyncedAt);

    if (sourceDate > syncDate) {
      // Source is newer than last sync - need to re-sync
      const diffMs = sourceDate.getTime() - syncDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // If source was updated more than 1 hour after last sync, it's critical
      if (diffHours > 1) {
        return 'sync_required';
      }
      return 'stale';
    }

    return 'synced';
  } catch {
    return 'unknown';
  }
}
