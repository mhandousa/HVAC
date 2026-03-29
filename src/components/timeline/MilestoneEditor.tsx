import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectStageMilestone, useUpdateMilestone } from '@/hooks/useProjectMilestones';
import { getStageConfig } from '@/lib/timeline-utils';
import { Loader2 } from 'lucide-react';

interface MilestoneEditorProps {
  milestone: ProjectStageMilestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MilestoneEditor({ milestone, open, onOpenChange }: MilestoneEditorProps) {
  const updateMilestone = useUpdateMilestone();
  
  const [formData, setFormData] = useState({
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    status: 'pending' as ProjectStageMilestone['status'],
    notes: '',
  });
  
  useEffect(() => {
    if (milestone) {
      setFormData({
        planned_start_date: milestone.planned_start_date || '',
        planned_end_date: milestone.planned_end_date || '',
        actual_start_date: milestone.actual_start_date || '',
        actual_end_date: milestone.actual_end_date || '',
        status: milestone.status,
        notes: milestone.notes || '',
      });
    }
  }, [milestone]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestone) return;
    
    await updateMilestone.mutateAsync({
      id: milestone.id,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      actual_start_date: formData.actual_start_date || null,
      actual_end_date: formData.actual_end_date || null,
      status: formData.status,
      notes: formData.notes || null,
    });
    
    onOpenChange(false);
  };
  
  const stageConfig = milestone ? getStageConfig(milestone.stage_id as any) : null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit Milestone: {stageConfig?.name || milestone?.stage_id}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_start">Planned Start</Label>
              <Input
                id="planned_start"
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_end">Planned End</Label>
              <Input
                id="planned_end"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_end_date: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_start">Actual Start</Label>
              <Input
                id="actual_start"
                type="date"
                value={formData.actual_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_end">Actual End</Label>
              <Input
                id="actual_end"
                type="date"
                value={formData.actual_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_end_date: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about delays, blockers, etc."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMilestone.isPending}>
              {updateMilestone.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
