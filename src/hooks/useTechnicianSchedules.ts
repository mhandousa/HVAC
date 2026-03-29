import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface TechnicianSchedule {
  id: string;
  organization_id: string;
  technician_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  availability_type: string;
  notes: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
  clock_in_location_lat: number | null;
  clock_in_location_lng: number | null;
  break_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useTechnicianSchedules(date?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['technician-schedules', organization?.id, date],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('technician_schedules')
        .select('*')
        .eq('organization_id', organization.id)
        .order('schedule_date', { ascending: true });

      if (date) {
        query = query.eq('schedule_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TechnicianSchedule[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateTechnicianSchedule() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (schedule: {
      technician_id: string;
      schedule_date: string;
      start_time?: string;
      end_time?: string;
      is_available?: boolean;
      availability_type?: string;
      notes?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('technician_schedules')
        .insert({
          ...schedule,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-schedules'] });
      toast.success('Schedule created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTechnicianSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TechnicianSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('technician_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-schedules'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async ({ technicianId, scheduleDate, lat, lng }: { 
      technicianId: string; 
      scheduleDate: string;
      lat?: number;
      lng?: number;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      // Try to find existing schedule or create one
      const { data: existing } = await supabase
        .from('technician_schedules')
        .select('id')
        .eq('technician_id', technicianId)
        .eq('schedule_date', scheduleDate)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('technician_schedules')
          .update({
            clock_in_time: new Date().toISOString(),
            clock_in_location_lat: lat,
            clock_in_location_lng: lng,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('technician_schedules')
          .insert({
            organization_id: organization.id,
            technician_id: technicianId,
            schedule_date: scheduleDate,
            clock_in_time: new Date().toISOString(),
            clock_in_location_lat: lat,
            clock_in_location_lng: lng,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-schedules'] });
      toast.success('Clocked in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId }: { scheduleId: string }) => {
      const { data, error } = await supabase
        .from('technician_schedules')
        .update({
          clock_out_time: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-schedules'] });
      toast.success('Clocked out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSchedulesForDateRange(technicianId: string, startDate: string, endDate: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['technician-schedules-range', organization?.id, technicianId, startDate, endDate],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('technician_schedules')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('technician_id', technicianId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date', { ascending: true });

      if (error) throw error;
      return data as TechnicianSchedule[];
    },
    enabled: !!organization?.id && !!technicianId,
  });
}

export function useUpcomingTimeOff(days: number = 14) {
  const { data: organization } = useOrganization();
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return useQuery({
    queryKey: ['upcoming-time-off', organization?.id, days],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('technician_schedules')
        .select('*, profiles:technician_id(full_name, email)')
        .eq('organization_id', organization.id)
        .eq('is_available', false)
        .neq('availability_type', 'working')
        .gte('schedule_date', today.toISOString().split('T')[0])
        .lte('schedule_date', futureDate.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}
