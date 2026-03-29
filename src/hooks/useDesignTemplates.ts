import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface DesignTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  template_type: string;
  template_data: Json;
  is_public: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  templateType: string;
  templateData: Record<string, unknown>;
  isPublic?: boolean;
}

export interface UpdateTemplateParams {
  id: string;
  name?: string;
  description?: string;
  templateData?: Record<string, unknown>;
  isPublic?: boolean;
}

/**
 * Template type definitions with metadata
 */
export const TEMPLATE_TYPES = {
  load_calculation: {
    label: 'Load Calculation',
    description: 'Envelope defaults, internal load assumptions',
    icon: 'Calculator',
  },
  equipment_selection: {
    label: 'Equipment Selection',
    description: 'Preferred manufacturers, efficiency targets',
    icon: 'Settings2',
  },
  ahu_configuration: {
    label: 'AHU Configuration',
    description: 'System type, component preferences',
    icon: 'Wind',
  },
  zone_defaults: {
    label: 'Zone Defaults',
    description: 'Space type defaults by building category',
    icon: 'LayoutGrid',
  },
  ventilation: {
    label: 'Ventilation',
    description: 'Outdoor air rates and standards',
    icon: 'Leaf',
  },
  acoustic: {
    label: 'Acoustic',
    description: 'NC targets and criteria',
    icon: 'Volume2',
  },
  project: {
    label: 'Full Project',
    description: 'Complete project configuration template',
    icon: 'FolderOpen',
  },
} as const;

export type TemplateType = keyof typeof TEMPLATE_TYPES;

/**
 * Hook to fetch templates by type
 */
export function useDesignTemplates(templateType?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['design_templates', templateType, profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('design_templates')
        .select('*')
        .or(`organization_id.eq.${profile.organization_id},is_public.eq.true`);

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return (data || []) as DesignTemplate[];
    },
    enabled: !!profile?.organization_id,
  });
}

/**
 * Hook to fetch a single template
 */
export function useDesignTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['design_template', templateId],
    queryFn: async () => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data as DesignTemplate;
    },
    enabled: !!templateId,
  });
}

/**
 * Hook to fetch organization templates only
 */
export function useOrganizationTemplates(templateType?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['design_templates', 'org', templateType, profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('design_templates')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DesignTemplate[];
    },
    enabled: !!profile?.organization_id,
  });
}

/**
 * Hook to fetch public templates
 */
export function usePublicTemplates(templateType?: string) {
  return useQuery({
    queryKey: ['design_templates', 'public', templateType],
    queryFn: async () => {
      let query = supabase
        .from('design_templates')
        .select('*')
        .eq('is_public', true);

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return (data || []) as DesignTemplate[];
    },
  });
}

/**
 * Hook to create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('design_templates')
        .insert({
          organization_id: profile.organization_id,
          name: params.name,
          description: params.description || null,
          template_type: params.templateType,
          template_data: params.templateData as Json,
          is_public: params.isPublic || false,
          created_by: profile.user_id,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DesignTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design_templates'] });
      toast.success(`Template "${data.name}" created successfully`);
    },
    onError: (error) => {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    },
  });
}

/**
 * Hook to update a template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateTemplateParams) => {
      const updates: Partial<DesignTemplate> = {};
      
      if (params.name !== undefined) updates.name = params.name;
      if (params.description !== undefined) updates.description = params.description;
      if (params.templateData !== undefined) updates.template_data = params.templateData as Json;
      if (params.isPublic !== undefined) updates.is_public = params.isPublic;

      const { data, error } = await supabase
        .from('design_templates')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data as DesignTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design_templates'] });
      queryClient.invalidateQueries({ queryKey: ['design_template', data.id] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    },
  });
}

/**
 * Hook to delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('design_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design_templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    },
  });
}

/**
 * Hook to apply a template and increment usage count
 */
export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // First, get the template
      const { data: template, error: fetchError } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Increment usage count
      const { error: updateError } = await supabase
        .from('design_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      if (updateError) {
        console.error('Failed to update usage count:', updateError);
        // Don't throw - this is non-critical
      }

      return template as DesignTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design_templates'] });
      toast.success(`Applied template "${data.name}"`);
    },
    onError: (error) => {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply template');
    },
  });
}

/**
 * Hook to duplicate a template
 */
export function useDuplicateTemplate() {
  const createTemplate = useCreateTemplate();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Fetch the original template
      const { data: original, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Create a copy
      return createTemplate.mutateAsync({
        name: `${original.name} (Copy)`,
        description: original.description || undefined,
        templateType: original.template_type,
        templateData: original.template_data as Record<string, unknown>,
        isPublic: false, // Copies are always private
      });
    },
    onError: (error) => {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    },
  });
}

/**
 * Helper to extract template data structure for a given type
 */
export function getTemplateDataSchema(templateType: TemplateType): string[] {
  switch (templateType) {
    case 'load_calculation':
      return [
        'envelope.wallRValue',
        'envelope.roofRValue',
        'envelope.windowUValue',
        'envelope.windowShgc',
        'internal.lightingWPerSqft',
        'internal.equipmentWPerSqft',
        'internal.peoplePerSqft',
        'schedules.occupied',
        'schedules.unoccupied',
      ];
    case 'equipment_selection':
      return [
        'preferences.preferredManufacturers',
        'preferences.efficiencyTier',
        'preferences.redundancyMode',
        'sizing.safetyFactor',
        'sizing.diversityFactor',
      ];
    case 'ahu_configuration':
      return [
        'system.type',
        'system.supplyAirTempSetpoint',
        'system.ductStaticSetpoint',
        'components.filterType',
        'components.coolingCoilRows',
        'components.heatingCoilType',
        'controls.sequence',
        'controls.economizer',
      ];
    case 'ventilation':
      return [
        'standard',
        'occupancyCategory',
        'ratePerPerson',
        'ratePerArea',
        'zoneAirDistributionEffectiveness',
      ];
    case 'acoustic':
      return [
        'targetNC',
        'criteria',
        'allowableExceedance',
      ];
    case 'zone_defaults':
      return [
        'spaceType',
        'designCoolingDeltaT',
        'designHeatingDeltaT',
        'minVentilation',
        'thermostatSetpoints',
      ];
    case 'project':
      return [
        'climateZone',
        'buildingType',
        'codeCompliance',
        'designConditions',
        'systemTypes',
      ];
    default:
      return [];
  }
}
