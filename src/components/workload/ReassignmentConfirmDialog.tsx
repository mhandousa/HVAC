import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ReassignmentSuggestion, useBatchReassignment } from '@/hooks/useWorkloadBalancing';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReassignmentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: ReassignmentSuggestion[];
  onSuccess: () => void;
}

export function ReassignmentConfirmDialog({
  open,
  onOpenChange,
  suggestions,
  onSuccess,
}: ReassignmentConfirmDialogProps) {
  const [sendNotifications, setSendNotifications] = useState(true);
  const batchReassignment = useBatchReassignment();

  const handleConfirm = async () => {
    try {
      await batchReassignment.mutateAsync(suggestions);
      toast.success(`Successfully reassigned ${suggestions.length} item${suggestions.length > 1 ? 's' : ''}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to apply reassignments');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Reassignment{suggestions.length > 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to reassign {suggestions.length} deficienc{suggestions.length > 1 ? 'ies' : 'y'}:
              </p>

              <ul className="space-y-2 max-h-48 overflow-auto">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="truncate">{s.fromTechnicianName}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate font-medium">{s.toTechnicianName}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="notifications"
                  checked={sendNotifications}
                  onCheckedChange={(checked) => setSendNotifications(checked === true)}
                />
                <Label htmlFor="notifications" className="text-sm font-normal">
                  Send notification emails to technicians
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                ⚠️ This will update the assignments and notify the relevant technicians.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={batchReassignment.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={batchReassignment.isPending}
            className="gap-2"
          >
            {batchReassignment.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm & Apply
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
