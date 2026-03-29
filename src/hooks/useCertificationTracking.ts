import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { 
  LEED_IEQ_CREDITS, 
  WELL_AIR_FEATURES, 
  WELL_THERMAL_FEATURES,
  MOSTADAM_IEQ_CREDITS,
  calculateCompliancePercentage,
  getLEEDLevel,
  getWELLLevel,
  getMostadamLevel,
} from '@/lib/green-building-standards';

export interface CertificationProject {
  id: string;
  project_id: string | null;
  organization_id: string;
  certification_type: 'leed_v4' | 'leed_v4.1' | 'well_v2' | 'estidama' | 'mostadam';
  target_level: string | null;
  status: 'registered' | 'in_progress' | 'submitted' | 'achieved' | 'expired';
  registration_date: string | null;
  target_certification_date: string | null;
  achieved_date: string | null;
  current_ieq_score: number | null;
  target_ieq_score: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  project?: { id: string; name: string };
  credits?: CertificationCredit[];
}

export interface CertificationCredit {
  id: string;
  certification_project_id: string;
  credit_id: string;
  credit_name: string;
  credit_category: string | null;
  max_points: number | null;
  target_points: number | null;
  achieved_points: number | null;
  status: 'not_pursuing' | 'pursuing' | 'documented' | 'achieved' | 'denied';
  compliance_percentage: number | null;
  compliance_data: Json | null;
  documentation_urls: string[] | null;
  notes: string | null;
  last_assessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificationReading {
  id: string;
  certification_project_id: string;
  credit_id: string;
  parameter: string;
  zone_id: string | null;
  zone_name: string | null;
  reading_value: number | null;
  threshold_value: number | null;
  unit: string | null;
  is_compliant: boolean | null;
  recorded_at: string;
}

export interface CertificationSummary {
  totalCredits: number;
  pursuingCredits: number;
  achievedCredits: number;
  totalPoints: number;
  achievedPoints: number;
  targetPoints: number;
  currentLevel: string;
  targetLevel: string;
  overallCompliance: number;
  ieqScore: number;
}

export function useCertificationProjects(projectId?: string) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: certificationProjects, isLoading } = useQuery({
    queryKey: ['certification-projects', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('certification_projects')
        .select(`
          *,
          project:project_id (id, name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get credits for each certification project
      const projectsWithCredits = await Promise.all(
        (data || []).map(async (project) => {
          const { data: credits } = await supabase
            .from('certification_credits')
            .select('*')
            .eq('certification_project_id', project.id);

          return {
            ...project,
            credits: credits || [],
          } as CertificationProject;
        })
      );

      return projectsWithCredits;
    },
    enabled: !!organization?.id,
  });

  const createCertificationProject = useMutation({
    mutationFn: async (project: Partial<CertificationProject>) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('certification_projects')
        .insert({
          organization_id: organization.id,
          certification_type: project.certification_type || 'leed_v4',
          project_id: project.project_id,
          target_level: project.target_level,
          status: project.status || 'registered',
          notes: project.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-create credits based on certification type
      const credits = getCreditsForCertificationType(project.certification_type as string, data.id);
      if (credits.length > 0) {
        const creditsToInsert = credits.map(c => ({
          certification_project_id: data.id,
          credit_id: c.credit_id || '',
          credit_name: c.credit_name || '',
          credit_category: c.credit_category,
          max_points: c.max_points,
          status: c.status || 'not_pursuing',
        }));
        await supabase.from('certification_credits').insert(creditsToInsert);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-projects'] });
      toast({ title: 'Certification project created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating project', description: error.message, variant: 'destructive' });
    },
  });

  const updateCertificationProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-projects'] });
      toast({ title: 'Project updated' });
    },
  });

  const deleteCertificationProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certification_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-projects'] });
      toast({ title: 'Project deleted' });
    },
  });

  return {
    certificationProjects,
    isLoading,
    createCertificationProject,
    updateCertificationProject,
    deleteCertificationProject,
  };
}

export function useCertificationCredits(certificationProjectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: credits, isLoading } = useQuery({
    queryKey: ['certification-credits', certificationProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_credits')
        .select('*')
        .eq('certification_project_id', certificationProjectId)
        .order('credit_id', { ascending: true });

      if (error) throw error;
      return data as CertificationCredit[];
    },
    enabled: !!certificationProjectId,
  });

  const updateCredit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationCredit> & { id: string }) => {
      const { data, error } = await supabase
        .from('certification_credits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-credits', certificationProjectId] });
    },
  });

  return {
    credits,
    isLoading,
    updateCredit,
  };
}

export function useCertificationReadings(certificationProjectId: string, creditId?: string) {
  const queryClient = useQueryClient();

  const { data: readings, isLoading } = useQuery({
    queryKey: ['certification-readings', certificationProjectId, creditId],
    queryFn: async () => {
      let query = supabase
        .from('certification_readings_log')
        .select('*')
        .eq('certification_project_id', certificationProjectId)
        .order('recorded_at', { ascending: false })
        .limit(500);

      if (creditId) {
        query = query.eq('credit_id', creditId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CertificationReading[];
    },
    enabled: !!certificationProjectId,
  });

  const addReading = useMutation({
    mutationFn: async (reading: Omit<CertificationReading, 'id' | 'recorded_at'>) => {
      const { data, error } = await supabase
        .from('certification_readings_log')
        .insert({
          ...reading,
          certification_project_id: certificationProjectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-readings', certificationProjectId] });
    },
  });

  return {
    readings,
    isLoading,
    addReading,
  };
}

// Calculate summary for a certification project
export function useCertificationSummary(certificationProject?: CertificationProject) {
  const credits = certificationProject?.credits || [];
  const certificationType = certificationProject?.certification_type;

  const totalCredits = credits.length;
  const pursuingCredits = credits.filter(c => c.status !== 'not_pursuing').length;
  const achievedCredits = credits.filter(c => c.status === 'achieved').length;
  
  const totalPoints = credits.reduce((sum, c) => sum + (c.max_points || 0), 0);
  const achievedPoints = credits.reduce((sum, c) => sum + (c.achieved_points || 0), 0);
  const targetPoints = credits.reduce((sum, c) => sum + (c.target_points || 0), 0);

  const overallCompliance = credits.length > 0
    ? Math.round(credits.reduce((sum, c) => sum + (c.compliance_percentage || 0), 0) / credits.length)
    : 0;

  let currentLevel = 'Not Certified';
  if (certificationType?.startsWith('leed')) {
    currentLevel = getLEEDLevel(achievedPoints);
  } else if (certificationType === 'well_v2') {
    currentLevel = getWELLLevel(achievedPoints);
  } else if (certificationType === 'mostadam') {
    currentLevel = getMostadamLevel(achievedPoints);
  }

  const summary: CertificationSummary = {
    totalCredits,
    pursuingCredits,
    achievedCredits,
    totalPoints,
    achievedPoints,
    targetPoints,
    currentLevel,
    targetLevel: certificationProject?.target_level || 'Not Set',
    overallCompliance,
    ieqScore: certificationProject?.current_ieq_score || 0,
  };

  return summary;
}

// Auto-generate credits for a certification type
function getCreditsForCertificationType(certificationType: string, projectId: string): Partial<CertificationCredit>[] {
  const credits: Partial<CertificationCredit>[] = [];

  if (certificationType?.startsWith('leed')) {
    for (const credit of LEED_IEQ_CREDITS) {
      credits.push({
        certification_project_id: projectId,
        credit_id: credit.id,
        credit_name: credit.name,
        credit_category: credit.category,
        max_points: credit.maxPoints,
        status: 'not_pursuing',
      });
    }
  } else if (certificationType === 'well_v2') {
    for (const feature of [...WELL_AIR_FEATURES, ...WELL_THERMAL_FEATURES]) {
      credits.push({
        certification_project_id: projectId,
        credit_id: feature.id,
        credit_name: feature.name,
        credit_category: feature.concept,
        max_points: feature.maxPoints,
        status: feature.type === 'precondition' ? 'pursuing' : 'not_pursuing',
      });
    }
  } else if (certificationType === 'mostadam') {
    for (const credit of MOSTADAM_IEQ_CREDITS) {
      credits.push({
        certification_project_id: projectId,
        credit_id: credit.id,
        credit_name: credit.name,
        credit_category: credit.category,
        max_points: credit.maxPoints,
        status: credit.maxPoints === 0 ? 'pursuing' : 'not_pursuing', // Auto-pursue mandatory
      });
    }
  }

  return credits;
}

// Hook to calculate compliance from IAQ sensor readings
export function useIAQComplianceCalculation(
  certificationProjectId: string,
  creditId: string,
  sensorReadings: { value: number; timestamp: Date }[]
) {
  // Find the credit requirements
  const allCredits = [...LEED_IEQ_CREDITS];
  const credit = allCredits.find(c => c.id === creditId);
  
  if (!credit) {
    return { compliant: false, percentage: 0, details: [] };
  }

  const details = credit.requirements.map(req => {
    if (req.threshold === undefined) {
      return { param: req.param, compliant: true, percentage: 100 };
    }

    const relevantReadings = sensorReadings; // In real app, filter by param type
    const result = calculateCompliancePercentage(relevantReadings, req.threshold, true, 95);

    return {
      param: req.param,
      ...result,
    };
  });

  const overallCompliant = details.every(d => d.compliant);
  const overallPercentage = details.length > 0
    ? Math.round(details.reduce((sum, d) => sum + d.percentage, 0) / details.length)
    : 0;

  return {
    compliant: overallCompliant,
    percentage: overallPercentage,
    details,
  };
}
