import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ProjectDesignDataItem {
  id: string;
  organization_id: string;
  project_id: string;
  building_id: string | null;
  data_type: 'psychrometric' | 'pipe_sizing' | 'pressure_drop';
  name: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDesignSummary {
  loadCalculations: number;
  ductSystems: number;
  pipeSystems: number;
  equipmentSelections: number;
  psychrometricAnalyses: number;
  otherDesignData: number;
  completed: number;
  inProgress: number;
  total: number;
}

export interface WorkflowStage {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started';
  count: number;
}

export interface DesignItem {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  zone_name?: string;
  building_name?: string;
  capacity?: string;
  total_airflow?: number;
  total_flow?: number;
}

export function useProjectDesignData(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['project-design-data', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_design_data')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectDesignDataItem[];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

export function useProjectDesignSummary(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['project-design-summary', projectId],
    queryFn: async (): Promise<{
      summary: ProjectDesignSummary;
      workflowStages: WorkflowStage[];
      recentItems: DesignItem[];
      allItems: {
        loadCalculations: DesignItem[];
        ductSystems: DesignItem[];
        pipeSystems: DesignItem[];
        vrfSystems: DesignItem[];
        equipmentSelections: DesignItem[];
        psychrometricAnalyses: DesignItem[];
      };
      specializedTools: {
        hasCHWPlant: boolean;
        hasHWPlant: boolean;
        hasSmokeControl: boolean;
        hasThermalComfort: boolean;
        hasSBCCompliance: boolean;
        hasASHRAECompliance: boolean;
      };
    }> => {
      if (!projectId || !organization?.id) {
        return {
          summary: {
            loadCalculations: 0,
            ductSystems: 0,
            pipeSystems: 0,
            equipmentSelections: 0,
            psychrometricAnalyses: 0,
            otherDesignData: 0,
            completed: 0,
            inProgress: 0,
            total: 0,
          },
          workflowStages: [],
          recentItems: [],
          allItems: {
            loadCalculations: [],
            ductSystems: [],
            pipeSystems: [],
            vrfSystems: [],
            equipmentSelections: [],
            psychrometricAnalyses: [],
          },
          specializedTools: {
            hasCHWPlant: false,
            hasHWPlant: false,
            hasSmokeControl: false,
            hasThermalComfort: false,
            hasSBCCompliance: false,
            hasASHRAECompliance: false,
          },
        };
      }

      // Fetch all design data in parallel
      const [loadCalcs, ductSystems, pipeSystems, vrfSystems, equipSelections, psychAnalyses, otherData, chwPlants, hwPlants, smokeCalcs, thermalCalcs, sbcChecks, ashraeChecks] = await Promise.all([
        supabase
          .from('load_calculations')
          .select('id, calculation_name, status, created_at, cooling_load_tons, zone:zones(name), building:buildings(name)')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('duct_systems')
          .select('id, system_name, status, created_at, total_airflow_cfm, system_type')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('pipe_systems')
          .select('id, system_name, status, created_at, total_flow_gpm, system_type')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('vrf_systems')
          .select('id, system_name, system_tag, status, created_at, total_indoor_capacity_kw, system_type, refrigerant_type')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('equipment_selections')
          .select('id, selection_name, status, created_at, required_capacity_tons, zone:zones(name)')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('psychrometric_analyses')
          .select('id, name, status, created_at, hvac_preset, zone:zones(name)')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id),
        supabase
          .from('project_design_data')
          .select('id, name, data_type, status, created_at')
          .eq('project_id', projectId),
        // Specialized Tools
        supabase
          .from('chilled_water_plants')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
        supabase
          .from('hot_water_plants')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
        supabase
          .from('smoke_control_calculations')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
        supabase
          .from('thermal_comfort_analyses')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
        supabase
          .from('sbc_compliance_checks')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
        supabase
          .from('ashrae_90_1_compliance_checks')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organization.id)
          .limit(1),
      ]);

      const loadCalcsData = (loadCalcs.data || []).map(i => ({
        id: i.id,
        name: i.calculation_name,
        type: 'load_calculation',
        status: i.status || 'draft',
        created_at: i.created_at,
        zone_name: (i.zone as any)?.name,
        building_name: (i.building as any)?.name,
        capacity: i.cooling_load_tons ? `${i.cooling_load_tons} tons` : undefined,
      }));

      const ductSystemsData = (ductSystems.data || []).map(i => ({
        id: i.id,
        name: i.system_name,
        type: 'duct_system',
        status: i.status || 'draft',
        created_at: i.created_at,
        total_airflow: i.total_airflow_cfm,
      }));

      const pipeSystemsData = (pipeSystems.data || []).map(i => ({
        id: i.id,
        name: i.system_name,
        type: 'pipe_system',
        status: i.status || 'draft',
        created_at: i.created_at,
        total_flow: i.total_flow_gpm,
      }));

      const vrfSystemsData = (vrfSystems.data || []).map(i => ({
        id: i.id,
        name: i.system_tag || i.system_name,
        type: 'vrf_system',
        status: i.status || 'draft',
        created_at: i.created_at,
        capacity: i.total_indoor_capacity_kw ? `${i.total_indoor_capacity_kw.toFixed(1)} kW` : undefined,
      }));

      const equipSelectionsData = (equipSelections.data || []).map(i => ({
        id: i.id,
        name: i.selection_name,
        type: 'equipment_selection',
        status: i.status || 'draft',
        created_at: i.created_at,
        zone_name: (i.zone as any)?.name,
        capacity: i.required_capacity_tons ? `${i.required_capacity_tons} tons` : undefined,
      }));

      const psychAnalysesData = (psychAnalyses.data || []).map(i => ({
        id: i.id,
        name: i.name,
        type: 'psychrometric',
        status: i.status || 'draft',
        created_at: i.created_at,
        zone_name: (i.zone as any)?.name,
      }));

      const otherDesignData = (otherData.data || []).map(i => ({
        id: i.id,
        name: i.name,
        type: i.data_type,
        status: i.status || 'draft',
        created_at: i.created_at,
      }));

      // Specialized tools status
      const specializedTools = {
        hasCHWPlant: (chwPlants.data || []).length > 0,
        hasHWPlant: (hwPlants.data || []).length > 0,
        hasSmokeControl: (smokeCalcs.data || []).length > 0,
        hasThermalComfort: (thermalCalcs.data || []).length > 0,
        hasSBCCompliance: (sbcChecks.data || []).length > 0,
        hasASHRAECompliance: (ashraeChecks.data || []).length > 0,
      };

      // Count statuses
      const allItems = [
        ...loadCalcsData,
        ...ductSystemsData,
        ...pipeSystemsData,
        ...vrfSystemsData,
        ...equipSelectionsData,
        ...psychAnalysesData,
        ...otherDesignData,
      ];

      const completed = allItems.filter(i => 
        i.status === 'completed' || i.status === 'approved' || i.status === 'finalized'
      ).length;
      const inProgress = allItems.filter(i => 
        i.status === 'draft' || i.status === 'in_progress' || i.status === 'pending'
      ).length;

      // Build workflow stages
      const workflowStages: WorkflowStage[] = [
        {
          id: 'load_calculation',
          name: 'Load Calculation',
          status: loadCalcsData.length === 0 ? 'not_started' : 
            loadCalcsData.some(l => l.status === 'completed' || l.status === 'finalized') ? 'completed' : 'in_progress',
          count: loadCalcsData.length,
        },
        {
          id: 'psychrometric',
          name: 'Psychrometric',
          status: psychAnalysesData.length === 0 ? 'not_started' :
            psychAnalysesData.some(d => d.status === 'completed') ? 'completed' : 'in_progress',
          count: psychAnalysesData.length,
        },
        {
          id: 'equipment_selection',
          name: 'Equipment',
          status: equipSelectionsData.length === 0 ? 'not_started' :
            equipSelectionsData.some(e => e.status === 'approved') ? 'completed' : 'in_progress',
          count: equipSelectionsData.length,
        },
        {
          id: 'distribution',
          name: 'Distribution',
          status: (ductSystemsData.length === 0 && pipeSystemsData.length === 0 && vrfSystemsData.length === 0) ? 'not_started' :
            (ductSystemsData.some(d => d.status === 'completed' || d.status === 'finalized') ||
             pipeSystemsData.some(p => p.status === 'completed' || p.status === 'finalized') ||
             vrfSystemsData.some(v => v.status === 'approved' || v.status === 'issued')) ? 'completed' : 'in_progress',
          count: ductSystemsData.length + pipeSystemsData.length + vrfSystemsData.length,
        },
      ];

      // Get recent items (last 5)
      const recentItems = allItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        summary: {
          loadCalculations: loadCalcsData.length,
          ductSystems: ductSystemsData.length,
          pipeSystems: pipeSystemsData.length,
          equipmentSelections: equipSelectionsData.length,
          psychrometricAnalyses: psychAnalysesData.length,
          otherDesignData: otherDesignData.length,
          completed,
          inProgress,
          total: allItems.length,
        },
        workflowStages,
        recentItems,
        allItems: {
          loadCalculations: loadCalcsData,
          ductSystems: ductSystemsData,
          pipeSystems: pipeSystemsData,
          vrfSystems: vrfSystemsData,
          equipmentSelections: equipSelectionsData,
          psychrometricAnalyses: psychAnalysesData,
        },
        specializedTools,
      };
    },
    enabled: !!projectId && !!organization?.id,
  });
}

export function useCreateProjectDesignData() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      building_id?: string;
      data_type: 'psychrometric' | 'pipe_sizing' | 'pressure_drop';
      name: string;
      input_data?: Record<string, unknown>;
      output_data?: Record<string, unknown>;
      notes?: string;
      status?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const { data: result, error } = await supabase
        .from('project_design_data')
        .insert([{
          organization_id: organization.id,
          project_id: data.project_id,
          building_id: data.building_id || null,
          data_type: data.data_type,
          name: data.name,
          input_data: (data.input_data || {}) as Json,
          output_data: (data.output_data || {}) as Json,
          notes: data.notes || null,
          status: data.status || 'draft',
          created_by: profile?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-design-data', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-design-summary', variables.project_id] });
      toast.success('Design data saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProjectDesignData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: Partial<ProjectDesignDataItem> & { id: string; project_id: string }) => {
      const { data, error } = await supabase
        .from('project_design_data')
        .update({
          ...updates,
          input_data: updates.input_data as Json,
          output_data: updates.output_data as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-design-data', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-design-summary', variables.project_id] });
      toast.success('Design data updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProjectDesignData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('project_design_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-design-data', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-design-summary', variables.project_id] });
      toast.success('Design data deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
