import { useState, useMemo } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeficiencyItem } from '@/hooks/useDeficiencyDashboard';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useCreateAssignment, useUpdateAssignment, AssignmentPriority, DeficiencyAssignment } from '@/hooks/useDeficiencyAssignments';
import { useTechnicianAvailability } from '@/hooks/useTechnicianAvailability';
import { useAllTechnicianSkillsMap } from '@/hooks/useTechnicianSkills';
import { getSeverityInfo } from '@/lib/deficiency-types';
import { calculateSkillMatchScore, extractEquipmentTypeFromTag } from '@/lib/technician-skills';
import { SkillMatchIndicator } from '@/components/workload/SkillMatchBadge';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addMonths } from 'date-fns';
import { CalendarIcon, Mail, UserPlus, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeficiencyAssignmentDialogProps {
  deficiency: DeficiencyItem | null;
  existingAssignment?: DeficiencyAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeficiencyAssignmentDialog({
  deficiency,
  existingAssignment,
  open,
  onOpenChange,
  onSuccess,
}: DeficiencyAssignmentDialogProps) {
  const { data: technicians, isLoading: techLoading } = useTechnicians();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const monthEnd = useMemo(() => addMonths(new Date(), 1), []);
  const { checkAvailabilityConflict, technicianAvailability } = useTechnicianAvailability(weekStart, monthEnd);
  const { data: skillsMap } = useAllTechnicianSkillsMap();

  // Extract deficiency categories and equipment type for skill matching
  const deficiencyCategories = useMemo(() => {
    // Use deficiency_tags from the deficiency item if available
    return (deficiency as any)?.deficiency_tags || ['installation'];
  }, [deficiency]);

  const equipmentType = useMemo(() => {
    return extractEquipmentTypeFromTag(deficiency?.equipmentTag || null);
  }, [deficiency]);

  const [assignedTo, setAssignedTo] = useState(existingAssignment?.assignedTo || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    existingAssignment?.dueDate ? new Date(existingAssignment.dueDate) : undefined
  );
  const [priority, setPriority] = useState<AssignmentPriority>(
    existingAssignment?.priority || 'medium'
  );
  const [notes, setNotes] = useState(existingAssignment?.notes || '');
  const [sendNotification, setSendNotification] = useState(true);

  const isEdit = !!existingAssignment;
  const isSubmitting = createAssignment.isPending || updateAssignment.isPending;

  // Check if selected technician is unavailable on the due date
  const selectedTechnicianName = useMemo(() => {
    if (!assignedTo) return null;
    const tech = technicians?.find(t => t.id === assignedTo);
    return tech?.full_name || tech?.email || null;
  }, [assignedTo, technicians]);

  const hasAvailabilityConflict = useMemo(() => {
    if (!assignedTo || !dueDate) return false;
    return checkAvailabilityConflict(assignedTo, dueDate);
  }, [assignedTo, dueDate, checkAvailabilityConflict]);

  const techCapacityStatus = useMemo(() => {
    if (!assignedTo) return null;
    const tech = technicianAvailability.find(t => t.id === assignedTo);
    return tech?.capacityStatus || null;
  }, [assignedTo, technicianAvailability]);

  const handleSubmit = async () => {
    if (!assignedTo) {
      toast.error('Please select a technician');
      return;
    }

    if (!deficiency) return;

    try {
      if (isEdit && existingAssignment) {
        await updateAssignment.mutateAsync({
          id: existingAssignment.id,
          assignedTo,
          dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          priority,
          notes,
        });
        toast.success('Assignment updated');
      } else {
        await createAssignment.mutateAsync({
          photoMetadataId: deficiency.id,
          assignedTo,
          dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          priority,
          notes,
          sendNotification,
        });
        toast.success('Deficiency assigned');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setAssignedTo(existingAssignment?.assignedTo || '');
      setDueDate(existingAssignment?.dueDate ? new Date(existingAssignment.dueDate) : undefined);
      setPriority(existingAssignment?.priority || 'medium');
      setNotes(existingAssignment?.notes || '');
      setSendNotification(true);
    }
    onOpenChange(newOpen);
  };

  if (!deficiency) return null;

  const severityInfo = getSeverityInfo(deficiency.severity);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isEdit ? 'Edit Assignment' : 'Assign Deficiency'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono">{deficiency.equipmentTag}</span>
            <Badge
              variant="outline"
              className={cn('ml-2', severityInfo.bgColor, severityInfo.color, severityInfo.borderColor)}
            >
              {severityInfo.label}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Technician Select */}
          <div className="space-y-2">
            <Label htmlFor="technician">Assign To *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={techLoading}>
              <SelectTrigger id="technician">
                <SelectValue placeholder={techLoading ? 'Loading...' : 'Select technician'} />
              </SelectTrigger>
              <SelectContent>
                {technicians?.map((tech) => {
                  const techSkills = skillsMap?.get(tech.id) || [];
                  const skillScore = calculateSkillMatchScore(techSkills, deficiencyCategories, equipmentType);
                  
                  return (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={tech.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(tech.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{tech.full_name || tech.email}</span>
                        {techSkills.length > 0 && <SkillMatchIndicator score={skillScore} />}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
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
                  {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
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

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <ToggleGroup
              type="single"
              value={priority}
              onValueChange={(val) => val && setPriority(val as AssignmentPriority)}
              className="justify-start"
            >
              <ToggleGroupItem value="low" className="data-[state=on]:bg-muted">
                Low
              </ToggleGroupItem>
              <ToggleGroupItem value="medium" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
                Medium
              </ToggleGroupItem>
              <ToggleGroupItem value="high" className="data-[state=on]:bg-warning/20 data-[state=on]:text-warning">
                High
              </ToggleGroupItem>
              <ToggleGroupItem value="urgent" className="data-[state=on]:bg-destructive/20 data-[state=on]:text-destructive">
                Urgent
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Instructions for the technician..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Availability Conflict Warning */}
          {hasAvailabilityConflict && selectedTechnicianName && (
            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {selectedTechnicianName} is scheduled for time-off on the selected due date.
                Consider choosing a different date or technician.
              </AlertDescription>
            </Alert>
          )}

          {/* Capacity Warning */}
          {techCapacityStatus === 'overloaded' && selectedTechnicianName && (
            <Alert variant="default" className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {selectedTechnicianName} is currently overloaded. Consider assigning to another technician.
              </AlertDescription>
            </Alert>
          )}

          {techCapacityStatus === 'full' && selectedTechnicianName && (
            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {selectedTechnicianName} is at full capacity. This assignment may cause delays.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Notification */}
          {!isEdit && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="notify"
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(checked === true)}
              />
              <Label htmlFor="notify" className="flex items-center gap-2 cursor-pointer font-normal">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Send email notification to assignee
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !assignedTo}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
