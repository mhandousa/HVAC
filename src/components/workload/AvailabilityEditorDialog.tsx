import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCreateTechnicianSchedule, useUpdateTechnicianSchedule } from '@/hooks/useTechnicianSchedules';
import { AvailabilityType, DailyScheduleEntry } from '@/hooks/useTechnicianAvailability';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { CalendarIcon, Loader2, Palmtree, Thermometer, GraduationCap, Phone, Briefcase, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AvailabilityEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianId: string;
  technicianName: string;
  date: Date;
  existingSchedule?: DailyScheduleEntry | null;
}

const availabilityTypes: { value: AvailabilityType; label: string; icon: React.ReactNode }[] = [
  { value: 'working', label: 'Working', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'vacation', label: 'Vacation', icon: <Palmtree className="w-4 h-4" /> },
  { value: 'sick_leave', label: 'Sick Leave', icon: <Thermometer className="w-4 h-4" /> },
  { value: 'training', label: 'Training', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'on_call', label: 'On-Call', icon: <Phone className="w-4 h-4" /> },
];

export function AvailabilityEditorDialog({
  open,
  onOpenChange,
  technicianId,
  technicianName,
  date,
  existingSchedule,
}: AvailabilityEditorDialogProps) {
  const queryClient = useQueryClient();
  const createSchedule = useCreateTechnicianSchedule();
  const updateSchedule = useUpdateTechnicianSchedule();

  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('working');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [repeatMultiple, setRepeatMultiple] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isSubmitting = createSchedule.isPending || updateSchedule.isPending;
  const isWorking = availabilityType === 'working';
  const hasExisting = !!existingSchedule?.scheduleId;

  useEffect(() => {
    if (existingSchedule) {
      setAvailabilityType(existingSchedule.availabilityType);
      setStartTime(existingSchedule.startTime || '08:00');
      setEndTime(existingSchedule.endTime || '17:00');
      setNotes(existingSchedule.notes || '');
    } else {
      setAvailabilityType('working');
      setStartTime('08:00');
      setEndTime('17:00');
      setNotes('');
    }
    setRepeatMultiple(false);
    setRepeatUntil(undefined);
  }, [existingSchedule, date, open]);

  const handleSubmit = async () => {
    try {
      const isAvailable = availabilityType === 'working' || availabilityType === 'on_call';

      if (repeatMultiple && repeatUntil) {
        // Create schedules for multiple days
        const dates = eachDayOfInterval({ start: date, end: repeatUntil });
        
        for (const d of dates) {
          await createSchedule.mutateAsync({
            technician_id: technicianId,
            schedule_date: format(d, 'yyyy-MM-dd'),
            start_time: isAvailable ? startTime : undefined,
            end_time: isAvailable ? endTime : undefined,
            is_available: isAvailable,
            availability_type: availabilityType,
            notes: notes || undefined,
          });
        }
        toast.success(`Schedule created for ${dates.length} days`);
      } else if (hasExisting && existingSchedule?.scheduleId) {
        // Update existing
        await updateSchedule.mutateAsync({
          id: existingSchedule.scheduleId,
          start_time: isAvailable ? startTime : null,
          end_time: isAvailable ? endTime : null,
          is_available: isAvailable,
          availability_type: availabilityType,
          notes: notes || null,
        });
        toast.success('Schedule updated');
      } else {
        // Create new
        await createSchedule.mutateAsync({
          technician_id: technicianId,
          schedule_date: format(date, 'yyyy-MM-dd'),
          start_time: isAvailable ? startTime : undefined,
          end_time: isAvailable ? endTime : undefined,
          is_available: isAvailable,
          availability_type: availabilityType,
          notes: notes || undefined,
        });
        toast.success('Schedule created');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async () => {
    if (!existingSchedule?.scheduleId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('technician_schedules')
        .delete()
        .eq('id', existingSchedule.scheduleId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['technician-schedules'] });
      toast.success('Schedule deleted');
      onOpenChange(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasExisting ? 'Edit Availability' : 'Set Availability'}
          </DialogTitle>
          <DialogDescription>
            {technicianName} • {format(date, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Availability Type */}
          <div className="space-y-2">
            <Label>Availability Type</Label>
            <ToggleGroup
              type="single"
              value={availabilityType}
              onValueChange={(val) => val && setAvailabilityType(val as AvailabilityType)}
              className="flex flex-wrap justify-start gap-2"
            >
              {availabilityTypes.map(type => (
                <ToggleGroupItem
                  key={type.value}
                  value={type.value}
                  className={cn(
                    'gap-1.5',
                    availabilityType === type.value && type.value === 'working' && 'data-[state=on]:bg-green-100 data-[state=on]:text-green-700',
                    availabilityType === type.value && type.value === 'vacation' && 'data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700',
                    availabilityType === type.value && type.value === 'sick_leave' && 'data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700',
                    availabilityType === type.value && type.value === 'training' && 'data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700',
                    availabilityType === type.value && type.value === 'on_call' && 'data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700',
                  )}
                >
                  {type.icon}
                  {type.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Working Hours */}
          {(isWorking || availabilityType === 'on_call') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Repeat for multiple days */}
          {!hasExisting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="repeat"
                  checked={repeatMultiple}
                  onCheckedChange={(checked) => setRepeatMultiple(checked === true)}
                />
                <Label htmlFor="repeat" className="font-normal cursor-pointer">
                  Repeat for multiple days
                </Label>
              </div>

              {repeatMultiple && (
                <div className="space-y-2 pl-6">
                  <Label>Until</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !repeatUntil && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {repeatUntil ? format(repeatUntil, 'PPP') : 'Select end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={repeatUntil}
                        onSelect={setRepeatUntil}
                        disabled={(d) => d <= date}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasExisting && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="mr-auto"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (repeatMultiple && !repeatUntil)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasExisting ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
