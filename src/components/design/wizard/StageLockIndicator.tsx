import { Lock, LockOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { StageLock } from '@/hooks/useStageLocking';

interface StageLockIndicatorProps {
  lock: StageLock | null;
  stageName: string;
  onUnlock?: () => void;
  onRequestUnlock?: () => void;
  canUnlock?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StageLockIndicator({
  lock,
  stageName,
  onUnlock,
  onRequestUnlock,
  canUnlock = false,
  showDetails = true,
  size = 'md',
  className,
}: StageLockIndicatorProps) {
  if (!lock) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const hasUnlockRequest = !!lock.unlock_requested_at;

  const LockIcon = (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        hasUnlockRequest
          ? 'bg-yellow-500/20 text-yellow-600'
          : 'bg-destructive/20 text-destructive',
        size === 'sm' ? 'p-1' : 'p-1.5',
        className
      )}
    >
      <Lock className={iconSize} />
    </div>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {LockIcon}
          </TooltipTrigger>
          <TooltipContent>
            <p>{stageName} is locked</p>
            {lock.reason && <p className="text-xs opacity-75">{lock.reason}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          {LockIcon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-destructive" />
            <span className="font-medium">{stageName} Locked</span>
            {hasUnlockRequest && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                Unlock Requested
              </Badge>
            )}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Locked by</span>
              <span>{lock.locked_by_profile?.full_name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Locked at</span>
              <span>{format(new Date(lock.locked_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {lock.reason && (
              <div className="pt-1">
                <span className="text-muted-foreground block mb-1">Reason</span>
                <p className="text-sm bg-muted/50 p-2 rounded">{lock.reason}</p>
              </div>
            )}
          </div>

          {(canUnlock || onRequestUnlock) && (
            <>
              <Separator />
              <div className="flex gap-2">
                {canUnlock && onUnlock && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={onUnlock}
                  >
                    <LockOpen className="h-3 w-3 mr-1" />
                    Unlock
                  </Button>
                )}
                {!canUnlock && onRequestUnlock && !hasUnlockRequest && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={onRequestUnlock}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Request Unlock
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
