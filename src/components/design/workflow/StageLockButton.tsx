import { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLockStage, useUnlockStage, type StageLock } from '@/hooks/useStageLocking';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

interface StageLockButtonProps {
  projectId: string;
  stageId: WorkflowStageId;
  stageName: string;
  currentLock: StageLock | null;
  canLock?: boolean;
  canUnlock?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
}

export function StageLockButton({
  projectId,
  stageId,
  stageName,
  currentLock,
  canLock = true,
  canUnlock = true,
  variant = 'outline',
  size = 'sm',
  className,
}: StageLockButtonProps) {
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [lockReason, setLockReason] = useState('');

  const lockStage = useLockStage();
  const unlockStage = useUnlockStage();

  const isLocked = !!currentLock;
  const isLoading = lockStage.isPending || unlockStage.isPending;

  const handleLock = () => {
    lockStage.mutate(
      { projectId, stageId, reason: lockReason || undefined },
      {
        onSuccess: () => {
          setShowLockDialog(false);
          setLockReason('');
        },
      }
    );
  };

  const handleUnlock = () => {
    unlockStage.mutate(
      { projectId, stageId },
      {
        onSuccess: () => {
          setShowUnlockDialog(false);
        },
      }
    );
  };

  if (isLocked) {
    if (!canUnlock) return null;

    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowUnlockDialog(true)}
          disabled={isLoading}
        >
          <LockOpen className="h-4 w-4 mr-1" />
          Unlock Stage
        </Button>

        <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlock {stageName}?</DialogTitle>
              <DialogDescription>
                This will allow modifications to the {stageName.toLowerCase()} stage.
                Are you sure you want to unlock it?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUnlockDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUnlock} disabled={isLoading}>
                {isLoading ? 'Unlocking...' : 'Unlock Stage'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (!canLock) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowLockDialog(true)}
        disabled={isLoading}
      >
        <Lock className="h-4 w-4 mr-1" />
        Lock Stage
      </Button>

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock {stageName}</DialogTitle>
            <DialogDescription>
              Locking this stage will prevent any modifications until it is unlocked.
              This is recommended after design review is complete.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="lock-reason">Reason (optional)</Label>
            <Textarea
              id="lock-reason"
              placeholder="e.g., Design review completed, approved for construction"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLockDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={isLoading}>
              {isLoading ? 'Locking...' : 'Lock Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
