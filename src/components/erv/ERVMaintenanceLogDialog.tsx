import React from 'react';
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
import { format } from 'date-fns';
import { useERVMaintenanceLogs, MAINTENANCE_TYPES } from '@/hooks/useERVMaintenance';

const logSchema = z.object({
  performed_at: z.string().min(1, 'Date is required'),
  technician_name: z.string().optional(),
  maintenance_type: z.string().min(1, 'Maintenance type is required'),
  filter_type: z.string().optional(),
  filter_part_number: z.string().optional(),
  labor_hours: z.coerce.number().optional(),
  parts_cost_sar: z.coerce.number().optional(),
  labor_cost_sar: z.coerce.number().optional(),
  pre_maintenance_efficiency: z.coerce.number().min(0).max(100).optional(),
  post_maintenance_efficiency: z.coerce.number().min(0).max(100).optional(),
  pressure_drop_before_pa: z.coerce.number().optional(),
  pressure_drop_after_pa: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type LogFormData = z.infer<typeof logSchema>;

interface ERVMaintenanceLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string | null;
  onClose: () => void;
}

export function ERVMaintenanceLogDialog({
  open,
  onOpenChange,
  scheduleId,
  onClose,
}: ERVMaintenanceLogDialogProps) {
  const { logMaintenance } = useERVMaintenanceLogs(scheduleId || undefined);

  const form = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      performed_at: format(new Date(), 'yyyy-MM-dd'),
      technician_name: '',
      maintenance_type: 'filter_replacement',
      filter_type: '',
      filter_part_number: '',
      labor_hours: undefined,
      parts_cost_sar: undefined,
      labor_cost_sar: undefined,
      pre_maintenance_efficiency: undefined,
      post_maintenance_efficiency: undefined,
      pressure_drop_before_pa: undefined,
      pressure_drop_after_pa: undefined,
      notes: '',
    },
  });

  const maintenanceType = form.watch('maintenance_type');

  const onSubmit = async (data: LogFormData) => {
    if (!scheduleId) return;
    
    try {
      await logMaintenance.mutateAsync({
        schedule_id: scheduleId,
        performed_at: new Date(data.performed_at).toISOString(),
        technician_name: data.technician_name || null,
        maintenance_type: data.maintenance_type,
        filter_type: data.filter_type || null,
        filter_part_number: data.filter_part_number || null,
        labor_hours: data.labor_hours || null,
        parts_cost_sar: data.parts_cost_sar || null,
        labor_cost_sar: data.labor_cost_sar || null,
        pre_maintenance_efficiency: data.pre_maintenance_efficiency || null,
        post_maintenance_efficiency: data.post_maintenance_efficiency || null,
        pressure_drop_before_pa: data.pressure_drop_before_pa || null,
        pressure_drop_after_pa: data.pressure_drop_after_pa || null,
        notes: data.notes || null,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to log maintenance:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Maintenance Completed</DialogTitle>
          <DialogDescription>
            Record the maintenance details and any performance measurements.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="performed_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Performed</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technician_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technician Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Who performed the work" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maintenance_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {maintenanceType === 'filter_replacement' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="filter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select filter type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MERV-8">MERV-8</SelectItem>
                          <SelectItem value="MERV-11">MERV-11</SelectItem>
                          <SelectItem value="MERV-13">MERV-13</SelectItem>
                          <SelectItem value="MERV-14">MERV-14</SelectItem>
                          <SelectItem value="HEPA">HEPA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filter_part_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 20x25x4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="labor_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parts_cost_sar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parts Cost (SAR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labor_cost_sar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Cost (SAR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Performance Measurements (Optional)</h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="pre_maintenance_efficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency Before (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="e.g., 65" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="post_maintenance_efficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency After (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.1" placeholder="e.g., 75" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pressure_drop_before_pa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pressure Drop Before (Pa)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 250" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pressure_drop_after_pa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pressure Drop After (Pa)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any observations, issues found, or recommendations..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={logMaintenance.isPending}>
                Log Maintenance
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
