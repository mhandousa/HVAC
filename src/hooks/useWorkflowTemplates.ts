import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

export interface WorkflowTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  building_type: string;
  stage_config: Record<string, { priority?: number; notes?: string }>;
  required_stages: WorkflowStageId[];
  optional_stages: WorkflowStageId[];
  typical_durations: Record<string, number> | null;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowTemplateParams {
  name: string;
  description?: string;
  building_type: string;
  required_stages: WorkflowStageId[];
  optional_stages: WorkflowStageId[];
  stage_config?: Record<string, { priority?: number; notes?: string }>;
  typical_durations?: Record<string, number>;
}

// Building type display labels
export const BUILDING_TYPE_LABELS: Record<string, string> = {
  office: 'Commercial Office',
  hospital: 'Healthcare Facility',
  retail: 'Retail Store',
  warehouse: 'Industrial Warehouse',
  residential: 'Residential Tower',
  hotel: 'Hotel / Hospitality',
  school: 'Educational',
  datacenter: 'Data Center',
  laboratory: 'Laboratory',
};

// Stage display info
export const STAGE_INFO: Record<WorkflowStageId, { label: string; description: string }> = {
  load: { label: 'Load Calculation', description: 'Building cooling and heating load analysis' },
  ventilation: { label: 'Ventilation', description: 'ASHRAE 62.1 outdoor air requirements' },
  psychrometric: { label: 'Psychrometric', description: 'Air conditioning process analysis' },
  ahu: { label: 'AHU Configuration', description: 'Air handling unit sizing and selection' },
  equipment: { label: 'Equipment Selection', description: 'HVAC equipment sizing and selection' },
  distribution: { label: 'Distribution', description: 'Duct and pipe system design' },
  erv: { label: 'Energy Recovery', description: 'Heat/energy recovery ventilation' },
  plant: { label: 'Central Plant', description: 'Chiller and boiler plant design' },
  compliance: { label: 'Compliance', description: 'Code and standard compliance checks' },
  diffuser: { label: 'Diffuser Selection', description: 'Air distribution terminal selection' },
  terminal: { label: 'Terminal Units', description: 'VAV/FCU terminal unit selection' },
};

/**
 * Fetch all available workflow templates (org + system defaults)
 */
export function useWorkflowTemplates() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['workflow-templates', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('is_system_default', { ascending: false })
        .order('building_type')
        .order('name');

      if (error) throw error;
      return data as WorkflowTemplate[];
    },
    enabled: !!profile?.organization_id,
  });
}

/**
 * Fetch a single workflow template by ID
 */
export function useWorkflowTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['workflow-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data as WorkflowTemplate;
    },
    enabled: !!templateId,
  });
}

/**
 * Fetch templates grouped by building type
 */
export function useWorkflowTemplatesByBuildingType() {
  const { data: templates, isLoading, error } = useWorkflowTemplates();

  const grouped = templates?.reduce((acc, template) => {
    const type = template.building_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, WorkflowTemplate[]>) || {};

  return { grouped, isLoading, error };
}

/**
 * Create a new workflow template for the organization
 */
export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: CreateWorkflowTemplateParams) => {
      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          organization_id: profile.organization_id,
          name: params.name,
          description: params.description || null,
          building_type: params.building_type,
          required_stages: params.required_stages,
          optional_stages: params.optional_stages,
          stage_config: params.stage_config || {},
          typical_durations: params.typical_durations || null,
          is_system_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkflowTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Workflow template created');
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

/**
 * Update an existing workflow template
 */
export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<CreateWorkflowTemplateParams> & { id: string }) => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as WorkflowTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-template', data.id] });
      toast.success('Workflow template updated');
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

/**
 * Delete a workflow template
 */
export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('workflow_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Workflow template deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

/**
 * Duplicate a template (for customization)
 */
export function useDuplicateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ templateId, newName }: { templateId: string; newName: string }) => {
      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      // Fetch the source template
      const { data: source, error: fetchError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          organization_id: profile.organization_id,
          name: newName,
          description: source.description,
          building_type: source.building_type,
          required_stages: source.required_stages,
          optional_stages: source.optional_stages,
          stage_config: source.stage_config,
          typical_durations: source.typical_durations,
          is_system_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkflowTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      toast.success('Template duplicated');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate template: ${error.message}`);
    },
  });
}
