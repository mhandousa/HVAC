import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { addDays, format } from 'date-fns';
import { 
  useERVMaintenanceSchedules, 
  MAINTENANCE_TYPES,
  type ERVMaintenanceSchedule 
} from '@/hooks/useERVMaintenance';

const scheduleSchema = z.object({
  erv_name: z.string().min(1, 'ERV name is required'),
  maintenance_type: z.string().min(1, 'Maintenance type is required'),
  frequency_days: z.coerce.number().min(1, 'Frequency must be at least 1 day'),
  reminder_days_before: z.coerce.number().min(1, 'Reminder days must be at least 1'),
  next_due_at: z.string().min(1, 'Next due date is required'),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ERVMaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ERVMaintenanceSchedule | null;
  onClose: () => void;
}

export function ERVMaintenanceScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onClose,
}: ERVMaintenanceScheduleDialogProps) {
  const { createSchedule, updateSchedule, deleteSchedule } = useERVMaintenanceSchedules();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      erv_name: '',
      maintenance_type: 'filter_replacement',
      frequency_days: 90,
      reminder_days_before: 14,
      next_due_at: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (schedule) {
      form.reset({
        erv_name: schedule.erv_name,
        maintenance_type: schedule.maintenance_type,
        frequency_days: schedule.frequency_days,
        reminder_days_before: schedule.reminder_days_before,
        next_due_at: format(new Date(schedule.next_due_at), 'yyyy-MM-dd'),
        notes: schedule.notes || '',
        is_active: schedule.is_active,
      });
    } else {
      form.reset({
        erv_name: '',
        maintenance_type: 'filter_replacement',
        frequency_days: 90,
        reminder_days_before: 14,
        next_due_at: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        notes: '',
        is_active: true,
      });
    }
  }, [schedule, form]);

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (schedule) {
        await updateSchedule.mutateAsync({
          id: schedule.id,
          ...data,
          next_due_at: new Date(data.next_due_at).toISOString(),
        });
      } else {
        await createSchedule.mutateAsync({
          ...data,
          next_due_at: new Date(data.next_due_at).toISOString(),
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const handleDelete = async () => {
    if (schedule && confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule.mutateAsync(schedule.id);
      onClose();
    }
  };

  const handleMaintenanceTypeChange = (value: string) => {
    form.setValue('maintenance_type', value);
    const type = MAINTENANCE_TYPES.find(t => t.value === value);
    if (type) {
      form.setValue('frequency_days', type.defaultFrequency);
      form.setValue('next_due_at', format(addDays(new Date(), type.defaultFrequency), 'yyyy-MM-dd'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Edit Maintenance Schedule' : 'New ERV Maintenance Schedule'}
          </DialogTitle>
          <DialogDescription>
            Set up recurring maintenance reminders for your ERV equipment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="erv_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ERV Unit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AHU-1 ERV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenance_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleMaintenanceTypeChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (Every {type.defaultFrequency} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_days_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remind Before (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="next_due_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or notes..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Schedule</FormLabel>
                    <FormDescription>
                      Receive reminders for this schedule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              {schedule && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSchedule.isPending || updateSchedule.isPending}>
                {schedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
