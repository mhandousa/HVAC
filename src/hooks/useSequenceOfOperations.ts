import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { 
  SystemType, 
  OperatingMode, 
  ControlParameters, 
  GeneratedSequence,
  generateSequence,
  DEFAULT_CONTROL_PARAMS 
} from '@/lib/soo-templates';
import { useCallback } from 'react';
import { Json } from '@/integrations/supabase/types';

export interface SequenceOfOperations {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  system_type: SystemType;
  equipment_ids: string[];
  zone_ids: string[];
  operating_mode: OperatingMode;
  control_strategy: ControlParameters;
  generated_sequence: GeneratedSequence;
  custom_sections: Record<string, string>;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'superseded';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSOOInput {
  name: string;
  project_id?: string;
  system_type: SystemType;
  equipment_ids?: string[];
  zone_ids?: string[];
  operating_mode?: OperatingMode;
  control_strategy?: ControlParameters;
  equipment_tag?: string;
  zone_names?: string[];
}

export interface UpdateSOOInput {
  id: string;
  name?: string;
  control_strategy?: ControlParameters;
  custom_sections?: Record<string, string>;
  status?: 'draft' | 'review' | 'approved' | 'superseded';
}

export interface SOOTemplate {
  id: string;
  organization_id: string | null;
  system_type: string;
  template_name: string;
  template_content: Record<string, unknown>;
  is_system_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to convert DB row to typed object
function mapRowToSOO(row: {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  system_type: string;
  equipment_ids: string[];
  zone_ids: string[];
  operating_mode: string;
  control_strategy: Json;
  generated_sequence: Json;
  custom_sections: Json;
  version: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}): SequenceOfOperations {
  return {
    ...row,
    system_type: row.system_type as SystemType,
    operating_mode: row.operating_mode as OperatingMode,
    control_strategy: row.control_strategy as unknown as ControlParameters,
    generated_sequence: row.generated_sequence as unknown as GeneratedSequence,
    custom_sections: (row.custom_sections as Record<string, string>) || {},
    status: row.status as 'draft' | 'review' | 'approved' | 'superseded',
  };
}

// Fetch all SOO documents for the organization
export function useSOOList(projectId?: string) {
  const { data: orgData } = useOrganization();

  return useQuery({
    queryKey: ['sequence-of-operations', orgData?.id, projectId],
    queryFn: async () => {
      let query = supabase
        .from('sequence_of_operations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapRowToSOO);
    },
    enabled: !!orgData?.id,
  });
}

// Fetch single SOO document by ID
export function useSOOById(id: string | undefined) {
  return useQuery({
    queryKey: ['sequence-of-operations', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('sequence_of_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapRowToSOO(data);
    },
    enabled: !!id,
  });
}

// Create new SOO document
export function useCreateSOO() {
  const queryClient = useQueryClient();
  const { data: orgData } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateSOOInput) => {
      if (!orgData?.id) throw new Error('No organization found');

      // Get default parameters for the system type
      const defaultParams = DEFAULT_CONTROL_PARAMS[input.system_type] || {};
      const controlStrategy = { ...defaultParams, ...input.control_strategy };

      // Generate the sequence
      const generatedSequence = generateSequence(
        input.system_type,
        controlStrategy,
        input.equipment_tag || input.name,
        input.zone_names || []
      );

      const { data, error } = await supabase
        .from('sequence_of_operations')
        .insert({
          organization_id: orgData.id,
          project_id: input.project_id || null,
          name: input.name,
          system_type: input.system_type,
          equipment_ids: input.equipment_ids || [],
          zone_ids: input.zone_ids || [],
          operating_mode: input.operating_mode || 'cooling_only',
          control_strategy: controlStrategy as unknown as Json,
          generated_sequence: generatedSequence as unknown as Json,
          custom_sections: {},
          version: 1,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToSOO(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations'] });
    },
  });
}

// Update SOO document
export function useUpdateSOO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSOOInput) => {
      const updateData: Record<string, unknown> = {};

      if (input.name) updateData.name = input.name;
      if (input.control_strategy) updateData.control_strategy = input.control_strategy as unknown as Json;
      if (input.custom_sections) updateData.custom_sections = input.custom_sections as unknown as Json;
      if (input.status) updateData.status = input.status;

      const { data, error } = await supabase
        .from('sequence_of_operations')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToSOO(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations', data.id] });
    },
  });
}

// Regenerate sequence with updated parameters
export function useRegenerateSOO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      controlStrategy,
      equipmentTag,
      zoneNames 
    }: { 
      id: string; 
      controlStrategy: ControlParameters;
      equipmentTag: string;
      zoneNames: string[];
    }) => {
      // First get the current document
      const { data: current, error: fetchError } = await supabase
        .from('sequence_of_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Regenerate the sequence
      const generatedSequence = generateSequence(
        current.system_type as SystemType,
        controlStrategy,
        equipmentTag,
        zoneNames
      );

      // Update with new sequence
      const { data, error } = await supabase
        .from('sequence_of_operations')
        .update({
          control_strategy: controlStrategy as unknown as Json,
          generated_sequence: generatedSequence as unknown as Json,
          version: (current.version || 1) + 1,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToSOO(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations', data.id] });
    },
  });
}

// Delete SOO document
export function useDeleteSOO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sequence_of_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-of-operations'] });
    },
  });
}

// Fetch templates
export function useSOOTemplates(systemType?: SystemType) {
  return useQuery({
    queryKey: ['soo-templates', systemType],
    queryFn: async () => {
      let query = supabase
        .from('soo_templates')
        .select('*')
        .eq('is_active', true);

      if (systemType) {
        query = query.eq('system_type', systemType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SOOTemplate[];
    },
  });
}

// Hook to get sequence generation function
export function useSequenceGenerator() {
  const generateSOOSequence = useCallback(
    (
      systemType: SystemType,
      controlStrategy: ControlParameters,
      equipmentTag: string,
      zoneNames: string[]
    ): GeneratedSequence => {
      const defaultParams = DEFAULT_CONTROL_PARAMS[systemType] || {};
      const mergedParams = { ...defaultParams, ...controlStrategy };
      return generateSequence(systemType, mergedParams, equipmentTag, zoneNames);
    },
    []
  );

  return { generateSOOSequence, DEFAULT_CONTROL_PARAMS };
}

// Export types
export type { SystemType, OperatingMode, ControlParameters, GeneratedSequence };
export { SYSTEM_TYPE_LABELS, OPERATING_MODE_LABELS } from '@/lib/soo-templates';
