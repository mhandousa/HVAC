import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'revision_requested';
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface DesignApproval {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  revision_id: string | null;
  status: ApprovalStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  priority: ApprovalPriority;
  due_date: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  submitter?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  reviewer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  project?: {
    name: string;
  };
}

export interface SubmitForApprovalParams {
  projectId: string;
  entityType: string;
  entityId: string;
  revisionId?: string;
  priority?: ApprovalPriority;
  dueDate?: string;
  notes?: string;
}

export interface ReviewApprovalParams {
  approvalId: string;
  status: 'approved' | 'rejected' | 'revision_requested';
  comments?: string;
}

// Get approval status for a specific design entity
export function useDesignApproval(entityType: string, entityId: string | undefined) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['design-approval', entityType, entityId],
    queryFn: async () => {
      if (!entityId || !organizationId) return null;

      const { data, error } = await supabase
        .from('design_approvals')
        .select(`
          *,
          submitter:profiles!design_approvals_submitted_by_fkey(full_name, avatar_url),
          reviewer:profiles!design_approvals_reviewed_by_fkey(full_name, avatar_url)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching design approval:', error);
        return null;
      }

      return data as DesignApproval | null;
    },
    enabled: !!entityId && !!organizationId,
  });
}

// Get all approvals for a project
export function useProjectApprovals(projectId: string | undefined) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['project-approvals', projectId],
    queryFn: async () => {
      if (!projectId || !organizationId) return [];

      const { data, error } = await supabase
        .from('design_approvals')
        .select(`
          *,
          submitter:profiles!design_approvals_submitted_by_fkey(full_name, avatar_url),
          reviewer:profiles!design_approvals_reviewed_by_fkey(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project approvals:', error);
        return [];
      }

      return data as DesignApproval[];
    },
    enabled: !!projectId && !!organizationId,
  });
}

// Get all pending reviews for the current user's organization
export function usePendingApprovals() {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['pending-approvals', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('design_approvals')
        .select(`
          *,
          submitter:profiles!design_approvals_submitted_by_fkey(full_name, avatar_url),
          reviewer:profiles!design_approvals_reviewed_by_fkey(full_name, avatar_url),
          project:projects(name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending_review')
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }

      return data as DesignApproval[];
    },
    enabled: !!organizationId,
  });
}

// Get all approvals (for dashboard)
export function useAllApprovals(statusFilter?: ApprovalStatus) {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: ['all-approvals', organizationId, statusFilter],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('design_approvals')
        .select(`
          *,
          submitter:profiles!design_approvals_submitted_by_fkey(full_name, avatar_url),
          reviewer:profiles!design_approvals_reviewed_by_fkey(full_name, avatar_url),
          project:projects(name)
        `)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all approvals:', error);
        return [];
      }

      return data as DesignApproval[];
    },
    enabled: !!organizationId,
  });
}

// Get approvals submitted by current user
export function useMySubmissions() {
  const { data: profile } = useProfile();
  const organizationId = profile?.organization_id;
  const userId = profile?.user_id;

  return useQuery({
    queryKey: ['my-submissions', organizationId, userId],
    queryFn: async () => {
      if (!organizationId || !userId) return [];

      const { data, error } = await supabase
        .from('design_approvals')
        .select(`
          *,
          submitter:profiles!design_approvals_submitted_by_fkey(full_name, avatar_url),
          reviewer:profiles!design_approvals_reviewed_by_fkey(full_name, avatar_url),
          project:projects(name)
        `)
        .eq('organization_id', organizationId)
        .eq('submitted_by', userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching my submissions:', error);
        return [];
      }

      return data as DesignApproval[];
    },
    enabled: !!organizationId && !!userId,
  });
}

// Submit a design for approval
export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: SubmitForApprovalParams) => {
      if (!profile?.organization_id || !profile?.user_id) {
        throw new Error('User not authenticated');
      }

      // Check for existing approval record
      const { data: existing } = await supabase
        .from('design_approvals')
        .select('id, status')
        .eq('entity_type', params.entityType)
        .eq('entity_id', params.entityId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('design_approvals')
          .update({
            status: 'pending_review',
            submitted_by: profile.user_id,
            submitted_at: new Date().toISOString(),
            revision_id: params.revisionId || null,
            priority: params.priority || 'normal',
            due_date: params.dueDate || null,
            review_comments: params.notes || null,
            reviewed_by: null,
            reviewed_at: null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new approval record
        const { data, error } = await supabase
          .from('design_approvals')
          .insert({
            project_id: params.projectId,
            entity_type: params.entityType,
            entity_id: params.entityId,
            revision_id: params.revisionId || null,
            status: 'pending_review',
            submitted_by: profile.user_id,
            submitted_at: new Date().toISOString(),
            priority: params.priority || 'normal',
            due_date: params.dueDate || null,
            organization_id: profile.organization_id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async (data, params) => {
      queryClient.invalidateQueries({ queryKey: ['design-approval', params.entityType, params.entityId] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['all-approvals'] });

      // Send email notification to reviewers
      try {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name')
          .eq('id', params.projectId)
          .single();

        await supabase.functions.invoke('send-approval-notification', {
          body: {
            approvalId: data.id,
            submitterName: profile?.full_name || profile?.email || 'A team member',
            projectName: projectData?.name || 'Unknown Project',
            entityType: params.entityType,
            priority: params.priority || 'normal',
            dueDate: params.dueDate,
            notes: params.notes,
            approvalUrl: `${window.location.origin}/design/approvals?id=${data.id}`,
          },
        });
      } catch (error) {
        console.error('Failed to send approval notification:', error);
        // Don't fail the mutation if notification fails
      }

      toast.success('Design submitted for approval');
    },
    onError: (error) => {
      console.error('Error submitting for approval:', error);
      toast.error('Failed to submit for approval');
    },
  });
}

// Review an approval (approve, reject, or request revision)
export function useReviewApproval() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: ReviewApprovalParams) => {
      if (!profile?.user_id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('design_approvals')
        .update({
          status: params.status,
          reviewed_by: profile.user_id,
          reviewed_at: new Date().toISOString(),
          review_comments: params.comments || null,
        })
        .eq('id', params.approvalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-approval'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['all-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['project-approvals'] });
      toast.success('Review submitted successfully');
    },
    onError: (error) => {
      console.error('Error reviewing approval:', error);
      toast.error('Failed to submit review');
    },
  });
}

// Helper to get status display info
export function getApprovalStatusInfo(status: ApprovalStatus) {
  const statusMap: Record<ApprovalStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    pending_review: { label: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
    revision_requested: { label: 'Revision Requested', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  };
  return statusMap[status] || statusMap.draft;
}

// Helper to get priority display info
export function getApprovalPriorityInfo(priority: ApprovalPriority) {
  const priorityMap: Record<ApprovalPriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'text-slate-600' },
    normal: { label: 'Normal', color: 'text-blue-600' },
    high: { label: 'High', color: 'text-orange-600' },
    urgent: { label: 'Urgent', color: 'text-red-600' },
  };
  return priorityMap[priority] || priorityMap.normal;
}

// Helper to format entity type for display
export function formatEntityType(entityType: string): string {
  const typeMap: Record<string, string> = {
    // Core design tools
    load_calculation: 'Load Calculation',
    equipment_selection: 'Equipment Selection',
    duct_sizing: 'Duct Sizing',
    pipe_sizing: 'Pipe Sizing',
    diffuser_selection: 'Diffuser Selection',
    terminal_unit: 'Terminal Unit',
    economizer: 'Economizer',
    control_valve: 'Control Valve',
    ahu_configuration: 'AHU Configuration',
    chiller_selection: 'Chiller Selection',
    boiler_selection: 'Boiler Selection',
    // Phase 2+ entity types
    acoustic_calculation: 'Acoustic Analysis',
    erv_sizing: 'ERV/HRV Sizing',
    ventilation_calculation: 'Ventilation (ASHRAE 62.1)',
    smoke_control: 'Smoke Control',
    thermal_comfort: 'Thermal Comfort',
    silencer_selection: 'Silencer Selection',
    vibration_isolation: 'Vibration Isolation',
    expansion_tank: 'Expansion Tank',
    chw_plant: 'Chilled Water Plant',
    hw_plant: 'Hot Water Plant',
    cooling_tower: 'Cooling Tower',
    fan_selection: 'Fan Selection',
    pump_selection: 'Pump Selection',
    coil_selection: 'Coil Selection',
    filter_selection: 'Filter Selection',
    insulation_calculation: 'Insulation Calculation',
    sequence_of_operations: 'Sequence of Operations',
    vrf_system: 'VRF System',
    psychrometric_analysis: 'Psychrometric Analysis',
    sbc_compliance: 'SBC Compliance',
    ashrae_90_1_compliance: 'ASHRAE 90.1 Compliance',
    // Additional specialty tools
    duct_lining: 'Duct Lining',
    room_acoustics: 'Room Acoustics',
    noise_path: 'Noise Path Analysis',
    bas_points: 'BAS Points Schedule',
    equipment_schedule: 'Equipment Schedule',
    material_takeoff: 'Material Takeoff',
    air_balance_report: 'Air Balance Report',
    water_balance_report: 'Water Balance Report',
    unified_design_report: 'Unified Design Report',
  };
  return typeMap[entityType] || entityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
