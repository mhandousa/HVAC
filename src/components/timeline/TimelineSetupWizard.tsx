import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGenerateProjectMilestones } from '@/hooks/useProjectMilestones';
import { STAGE_TIMING_CONFIGS, TOTAL_DEFAULT_DURATION } from '@/lib/timeline-utils';
import { Loader2, Calendar, Wand2 } from 'lucide-react';

interface TimelineSetupWizardProps {
  projectId: string;
  organizationId: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimelineSetupWizard({
  projectId,
  organizationId,
  projectStartDate,
  projectEndDate,
  open,
  onOpenChange,
}: TimelineSetupWizardProps) {
  const generateMilestones = useGenerateProjectMilestones();
  
  const defaultStartDate = projectStartDate 
    ? new Date(projectStartDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  const defaultEndDate = projectEndDate
    ? new Date(projectEndDate).toISOString().split('T')[0]
    : '';
  
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  const handleGenerate = async () => {
    await generateMilestones.mutateAsync({
      projectId,
      organizationId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Setup Project Timeline
          </DialogTitle>
          <DialogDescription>
            Generate milestones for all {STAGE_TIMING_CONFIGS.length} design stages based on your project dates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Project Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_date">
              Target End Date <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If not specified, default duration of {TOTAL_DEFAULT_DURATION} business days will be used.
            </p>
          </div>
          
          <div className="rounded-lg bg-muted p-3">
            <h4 className="text-sm font-medium mb-2">Default Stage Durations</h4>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {STAGE_TIMING_CONFIGS.map((stage) => (
                <div key={stage.stageId} className="flex justify-between">
                  <span>{stage.name}</span>
                  <span>{stage.defaultDurationDays}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!startDate || generateMilestones.isPending}>
            {generateMilestones.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Generate Milestones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
