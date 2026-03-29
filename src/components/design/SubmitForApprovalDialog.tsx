import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSubmitForApproval, type ApprovalPriority } from '@/hooks/useDesignApprovals';
import { CalendarIcon, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SubmitForApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  revisionId?: string;
}

export function SubmitForApprovalDialog({
  open,
  onOpenChange,
  projectId,
  entityType,
  entityId,
  entityName,
  revisionId,
}: SubmitForApprovalDialogProps) {
  const [priority, setPriority] = useState<ApprovalPriority>('normal');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  const { mutate: submitForApproval, isPending } = useSubmitForApproval();

  const handleSubmit = () => {
    submitForApproval(
      {
        projectId,
        entityType,
        entityId,
        revisionId,
        priority,
        dueDate: dueDate?.toISOString(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setPriority('normal');
          setDueDate(undefined);
          setNotes('');
        },
      }
    );
  };

  const formatEntityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for Approval</DialogTitle>
          <DialogDescription>
            Submit "{entityName || formatEntityType(entityType)}" for review by your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ApprovalPriority)}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Review Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Reviewer (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or context for the reviewer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
