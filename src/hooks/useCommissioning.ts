import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface CommissioningProject {
  id: string;
  project_id: string | null;
  organization_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'on_hold';
  building_id: string | null;
  contractor_name: string | null;
  contractor_contact: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: { id: string; name: string };
  building?: { id: string; name: string };
  checklists_count?: number;
  tests_passed?: number;
  tests_total?: number;
}

export interface CommissioningChecklist {
  id: string;
  commissioning_project_id: string;
  equipment_id: string | null;
  equipment_tag: string | null;
  checklist_type: 'erv' | 'ahu' | 'chiller' | 'vav' | 'fcu' | 'pump' | 'cooling_tower' | 'boiler' | 'vrf';
  design_data: Json | null;
  installed_data: Json | null;
  variance_summary: Json | null;
  overall_status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'na';
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: { id: string; name: string; tag: string };
  tests?: CommissioningTest[];
}

export interface CommissioningTest {
  id: string;
  checklist_id: string;
  test_name: string;
  test_category: string | null;
  expected_value: string | null;
  actual_value: string | null;
  tolerance_percent: number | null;
  variance_percent: number | null;
  result: 'pending' | 'pass' | 'fail' | 'marginal' | 'na';
  test_date: string | null;
  technician_id: string | null;
  technician_name: string | null;
  notes: string | null;
  photos_urls: string[] | null;
  created_at: string;
}

export function useCommissioningProjects(projectId?: string) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['commissioning-projects', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('commissioning_projects')
        .select(`
          *,
          project:project_id (id, name),
          building:building_id (id, name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get checklist counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const { data: checklists } = await supabase
            .from('commissioning_checklists')
            .select('id, overall_status')
            .eq('commissioning_project_id', project.id);

          const { count: testsTotal } = await supabase
            .from('commissioning_tests')
            .select('id', { count: 'exact', head: true })
            .in('checklist_id', (checklists || []).map(c => c.id));

          const { count: testsPassed } = await supabase
            .from('commissioning_tests')
            .select('id', { count: 'exact', head: true })
            .in('checklist_id', (checklists || []).map(c => c.id))
            .eq('result', 'pass');

          return {
            ...project,
            checklists_count: checklists?.length || 0,
            tests_passed: testsPassed || 0,
            tests_total: testsTotal || 0,
          } as CommissioningProject;
        })
      );

      return projectsWithCounts;
    },
    enabled: !!organization?.id,
  });

  const createProject = useMutation({
    mutationFn: async (project: Partial<CommissioningProject>) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('commissioning_projects')
        .insert({
          name: project.name || 'New Project',
          organization_id: organization.id,
          project_id: project.project_id,
          description: project.description,
          status: project.status || 'draft',
          building_id: project.building_id,
          contractor_name: project.contractor_name,
          start_date: project.start_date,
          target_completion_date: project.target_completion_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-projects'] });
      toast({ title: 'Commissioning project created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating project', description: error.message, variant: 'destructive' });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissioningProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('commissioning_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-projects'] });
      toast({ title: 'Project updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating project', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissioning_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-projects'] });
      toast({ title: 'Project deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting project', description: error.message, variant: 'destructive' });
    },
  });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useCommissioningChecklists(commissioningProjectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['commissioning-checklists', commissioningProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissioning_checklists')
        .select(`
          *,
          equipment:equipment_id (id, name, tag)
        `)
        .eq('commissioning_project_id', commissioningProjectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get tests for each checklist
      const checklistsWithTests = await Promise.all(
        (data || []).map(async (checklist) => {
          const { data: tests } = await supabase
            .from('commissioning_tests')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('created_at', { ascending: true });

          return {
            ...checklist,
            tests: tests || [],
          } as CommissioningChecklist;
        })
      );

      return checklistsWithTests;
    },
    enabled: !!commissioningProjectId,
  });

  const createChecklist = useMutation({
    mutationFn: async (checklist: Partial<CommissioningChecklist>) => {
      const { data, error } = await supabase
        .from('commissioning_checklists')
        .insert({
          commissioning_project_id: commissioningProjectId,
          checklist_type: checklist.checklist_type || 'erv',
          equipment_id: checklist.equipment_id,
          equipment_tag: checklist.equipment_tag,
          design_data: checklist.design_data,
          installed_data: checklist.installed_data,
          overall_status: checklist.overall_status || 'pending',
          notes: checklist.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists', commissioningProjectId] });
      toast({ title: 'Checklist created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating checklist', description: error.message, variant: 'destructive' });
    },
  });

  const updateChecklist = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissioningChecklist> & { id: string }) => {
      const { data, error } = await supabase
        .from('commissioning_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists', commissioningProjectId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating checklist', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissioning_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists', commissioningProjectId] });
      toast({ title: 'Checklist deleted' });
    },
  });

  return {
    checklists,
    isLoading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
  };
}

export function useCommissioningTests(checklistId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tests, isLoading } = useQuery({
    queryKey: ['commissioning-tests', checklistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissioning_tests')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CommissioningTest[];
    },
    enabled: !!checklistId,
  });

  const createTest = useMutation({
    mutationFn: async (test: Partial<CommissioningTest> & { photos_urls?: string[] }) => {
      const { data, error } = await supabase
        .from('commissioning_tests')
        .insert({
          checklist_id: checklistId,
          test_name: test.test_name || 'New Test',
          test_category: test.test_category,
          expected_value: test.expected_value,
          actual_value: test.actual_value,
          tolerance_percent: test.tolerance_percent,
          variance_percent: test.variance_percent,
          result: test.result || 'pending',
          notes: test.notes,
          technician_name: test.technician_name,
          photos_urls: test.photos_urls,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      toast({ title: 'Test added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding test', description: error.message, variant: 'destructive' });
    },
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissioningTest> & { id: string }) => {
      // Calculate variance if both expected and actual values are provided
      let variance_percent = updates.variance_percent;
      if (updates.expected_value && updates.actual_value) {
        const expected = parseFloat(updates.expected_value);
        const actual = parseFloat(updates.actual_value);
        if (!isNaN(expected) && !isNaN(actual) && expected !== 0) {
          variance_percent = Math.round(((actual - expected) / expected) * 100 * 10) / 10;
        }
      }

      // Auto-determine result based on variance and tolerance
      let result = updates.result;
      if (variance_percent !== undefined && updates.tolerance_percent !== undefined) {
        const absVariance = Math.abs(variance_percent);
        if (absVariance <= updates.tolerance_percent) {
          result = 'pass';
        } else if (absVariance <= updates.tolerance_percent * 1.5) {
          result = 'marginal';
        } else {
          result = 'fail';
        }
      }

      const { data, error } = await supabase
        .from('commissioning_tests')
        .update({ ...updates, variance_percent, result })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating test', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissioning_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      toast({ title: 'Test deleted' });
    },
  });

  const bulkCreateTests = useMutation({
    mutationFn: async (tests: Partial<CommissioningTest>[]) => {
      const { data, error } = await supabase
        .from('commissioning_tests')
        .insert(tests.map(t => ({ 
          checklist_id: checklistId,
          test_name: t.test_name || 'Test',
          test_category: t.test_category,
          expected_value: t.expected_value,
          tolerance_percent: t.tolerance_percent,
          result: 'pending' as const,
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      toast({ title: 'Tests created from protocol' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating tests', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    bulkCreateTests,
  };
}
