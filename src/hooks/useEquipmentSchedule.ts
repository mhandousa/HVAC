import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ScheduleColumn {
  id: string;
  key: string;
  label: string;
  width?: number;
  enabled: boolean;
}

export interface ScheduleHeader {
  title?: string;
  revision?: string;
  date?: string;
  preparedBy?: string;
  checkedBy?: string;
  projectNumber?: string;
  includeLogo?: boolean;
}

export interface EquipmentSchedule {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  schedule_type: string;
  equipment_ids: string[];
  grouping_mode: string;
  columns_config: ScheduleColumn[];
  custom_header: ScheduleHeader;
  notes: string | null;
  status: string;
  revision: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  project_id?: string;
  name: string;
  schedule_type?: string;
  equipment_ids?: string[];
  grouping_mode?: string;
  columns_config?: ScheduleColumn[];
  custom_header?: ScheduleHeader;
  notes?: string;
  status?: string;
  revision?: string;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string;
}

export const DEFAULT_COLUMNS: ScheduleColumn[] = [
  { id: 'tag', key: 'tag', label: 'Equipment Tag', enabled: true, width: 100 },
  { id: 'name', key: 'name', label: 'Description', enabled: true, width: 150 },
  { id: 'equipment_type', key: 'equipment_type', label: 'Type', enabled: true, width: 80 },
  { id: 'manufacturer', key: 'manufacturer', label: 'Manufacturer', enabled: true, width: 100 },
  { id: 'model', key: 'model', label: 'Model', enabled: true, width: 100 },
  { id: 'capacity_value', key: 'capacity_value', label: 'Capacity', enabled: true, width: 80 },
  { id: 'capacity_unit', key: 'capacity_unit', label: 'Unit', enabled: true, width: 60 },
  { id: 'location', key: 'location', label: 'Location', enabled: true, width: 150 },
  { id: 'serial_number', key: 'serial_number', label: 'Serial No.', enabled: false, width: 120 },
  { id: 'install_date', key: 'install_date', label: 'Install Date', enabled: false, width: 100 },
  { id: 'warranty_expiry', key: 'warranty_expiry', label: 'Warranty Exp.', enabled: false, width: 100 },
  { id: 'status', key: 'status', label: 'Status', enabled: false, width: 80 },
];

export type GroupingMode = 'by_building' | 'by_floor' | 'by_type' | 'by_zone' | 'flat';

export function useEquipmentScheduleList(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['equipment-schedules', organization?.id, projectId],
    queryFn: async () => {
      let query = supabase
        .from('equipment_schedules')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(mapRowToSchedule);
    },
    enabled: !!organization?.id,
  });
}

export function useEquipmentScheduleById(id: string | null) {
  return useQuery({
    queryKey: ['equipment-schedule', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('equipment_schedules')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return mapRowToSchedule(data);
    },
    enabled: !!id,
  });
}

export function useCreateEquipmentSchedule() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('equipment_schedules')
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          name: input.name,
          schedule_type: input.schedule_type || 'mechanical',
          equipment_ids: input.equipment_ids || [],
          grouping_mode: input.grouping_mode || 'by_building',
          columns_config: (input.columns_config || DEFAULT_COLUMNS) as unknown as Json,
          custom_header: (input.custom_header || {}) as unknown as Json,
          notes: input.notes,
          status: input.status || 'draft',
          revision: input.revision || 'A',
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToSchedule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-schedules'] });
      toast.success('Equipment schedule created');
    },
    onError: (error) => {
      toast.error('Failed to create schedule: ' + error.message);
    },
  });
}

export function useUpdateEquipmentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateScheduleInput) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.schedule_type !== undefined) updateData.schedule_type = updates.schedule_type;
      if (updates.equipment_ids !== undefined) updateData.equipment_ids = updates.equipment_ids;
      if (updates.grouping_mode !== undefined) updateData.grouping_mode = updates.grouping_mode;
      if (updates.columns_config !== undefined) updateData.columns_config = updates.columns_config as unknown as Json;
      if (updates.custom_header !== undefined) updateData.custom_header = updates.custom_header as unknown as Json;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.revision !== undefined) updateData.revision = updates.revision;

      const { data, error } = await supabase
        .from('equipment_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToSchedule(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-schedule', data.id] });
      toast.success('Equipment schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });
}

export function useDeleteEquipmentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-schedules'] });
      toast.success('Equipment schedule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete schedule: ' + error.message);
    },
  });
}

function mapRowToSchedule(row: Record<string, unknown>): EquipmentSchedule {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    project_id: row.project_id as string | null,
    name: row.name as string,
    schedule_type: row.schedule_type as string,
    equipment_ids: row.equipment_ids as string[] || [],
    grouping_mode: row.grouping_mode as string,
    columns_config: row.columns_config as ScheduleColumn[] || DEFAULT_COLUMNS,
    custom_header: row.custom_header as ScheduleHeader || {},
    notes: row.notes as string | null,
    status: row.status as string,
    revision: row.revision as string,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
