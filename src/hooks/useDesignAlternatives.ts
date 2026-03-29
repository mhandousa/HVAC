import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface DesignAlternative {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string | null;
  name: string;
  description: string | null;
  data: Record<string, unknown>;
  is_primary: boolean;
  tags: string[];
  created_by: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateAlternativeParams {
  projectId: string;
  entityType: string;
  entityId?: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  isPrimary?: boolean;
  tags?: string[];
}

export interface UpdateAlternativeParams {
  id: string;
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
  isPrimary?: boolean;
  tags?: string[];
}

// Fetch alternatives for a specific design entity
export function useDesignAlternatives(entityType: string, entityId?: string) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['design-alternatives', entityType, entityId, organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('design_alternatives')
        .select(`
          *,
          profile:profiles!design_alternatives_created_by_fkey(full_name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching design alternatives:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        data: (item.data as Record<string, unknown>) || {},
        tags: item.tags || [],
        is_primary: item.is_primary || false,
      })) as DesignAlternative[];
    },
    enabled: !!organizationId && !!entityType,
  });
}

// Fetch all alternatives for a project
export function useProjectAlternatives(projectId?: string) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['project-alternatives', projectId, organizationId],
    queryFn: async () => {
      if (!organizationId || !projectId) return [];

      const { data, error } = await supabase
        .from('design_alternatives')
        .select(`
          *,
          profile:profiles!design_alternatives_created_by_fkey(full_name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('entity_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project alternatives:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        data: (item.data as Record<string, unknown>) || {},
        tags: item.tags || [],
        is_primary: item.is_primary || false,
      })) as DesignAlternative[];
    },
    enabled: !!organizationId && !!projectId,
  });
}

// Create a new alternative
export function useCreateAlternative() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: CreateAlternativeParams) => {
      if (!profile?.organization_id || !profile?.user_id) {
        throw new Error('User profile not available');
      }

      const { data, error } = await supabase
        .from('design_alternatives')
        .insert({
          project_id: params.projectId,
          entity_type: params.entityType,
          entity_id: params.entityId || null,
          name: params.name,
          description: params.description || null,
          data: params.data as Json,
          is_primary: params.isPrimary || false,
          tags: params.tags || [],
          created_by: profile.user_id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-alternatives'] });
      queryClient.invalidateQueries({ queryKey: ['project-alternatives'] });
      toast.success(`Alternative "${data.name}" saved`);
    },
    onError: (error) => {
      console.error('Error creating alternative:', error);
      toast.error('Failed to save alternative');
    },
  });
}

// Update an existing alternative
export function useUpdateAlternative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateAlternativeParams) => {
      const updates: Record<string, unknown> = {};
      
      if (params.name !== undefined) updates.name = params.name;
      if (params.description !== undefined) updates.description = params.description;
      if (params.data !== undefined) updates.data = params.data as Json;
      if (params.isPrimary !== undefined) updates.is_primary = params.isPrimary;
      if (params.tags !== undefined) updates.tags = params.tags;

      const { data, error } = await supabase
        .from('design_alternatives')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-alternatives'] });
      queryClient.invalidateQueries({ queryKey: ['project-alternatives'] });
      toast.success('Alternative updated');
    },
    onError: (error) => {
      console.error('Error updating alternative:', error);
      toast.error('Failed to update alternative');
    },
  });
}

// Delete an alternative
export function useDeleteAlternative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_alternatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-alternatives'] });
      queryClient.invalidateQueries({ queryKey: ['project-alternatives'] });
      toast.success('Alternative deleted');
    },
    onError: (error) => {
      console.error('Error deleting alternative:', error);
      toast.error('Failed to delete alternative');
    },
  });
}

// Set an alternative as primary (and unset others for same entity)
export function useSetPrimaryAlternative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      entityType, 
      entityId,
      organizationId 
    }: { 
      id: string; 
      entityType: string; 
      entityId?: string;
      organizationId: string;
    }) => {
      // First, unset all other primaries for this entity type/id
      let unselectQuery = supabase
        .from('design_alternatives')
        .update({ is_primary: false })
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType);

      if (entityId) {
        unselectQuery = unselectQuery.eq('entity_id', entityId);
      }

      await unselectQuery;

      // Then set the selected one as primary
      const { data, error } = await supabase
        .from('design_alternatives')
        .update({ is_primary: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-alternatives'] });
      queryClient.invalidateQueries({ queryKey: ['project-alternatives'] });
      toast.success(`"${data.name}" set as primary`);
    },
    onError: (error) => {
      console.error('Error setting primary alternative:', error);
      toast.error('Failed to set primary alternative');
    },
  });
}

// Fetch multiple alternatives for comparison
export function useAlternativeComparison(alternativeIds: string[]) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['alternative-comparison', alternativeIds, organizationId],
    queryFn: async () => {
      if (!organizationId || alternativeIds.length === 0) return [];

      const { data, error } = await supabase
        .from('design_alternatives')
        .select(`
          *,
          profile:profiles!design_alternatives_created_by_fkey(full_name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .in('id', alternativeIds);

      if (error) {
        console.error('Error fetching alternatives for comparison:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        data: (item.data as Record<string, unknown>) || {},
        tags: item.tags || [],
        is_primary: item.is_primary || false,
      })) as DesignAlternative[];
    },
    enabled: !!organizationId && alternativeIds.length > 0,
  });
}

// Get the primary alternative for an entity
export function usePrimaryAlternative(entityType: string, entityId?: string) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['primary-alternative', entityType, entityId, organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      let query = supabase
        .from('design_alternatives')
        .select(`
          *,
          profile:profiles!design_alternatives_created_by_fkey(full_name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType)
        .eq('is_primary', true);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching primary alternative:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        data: (data.data as Record<string, unknown>) || {},
        tags: data.tags || [],
        is_primary: data.is_primary || false,
      } as DesignAlternative;
    },
    enabled: !!organizationId && !!entityType,
  });
}
