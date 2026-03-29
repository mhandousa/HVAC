import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface ProjectAcousticIssue {
  projectId: string;
  projectName: string;
  zonesExceeding: number;
  zonesMarginal: number;
  worstNCDelta: number;
  worstZoneName: string;
}

export interface OrganizationAcousticSummary {
  totalZonesAnalyzed: number;
  zonesPassingNC: number;
  zonesExceeding: number;
  zonesMarginal: number;
  zonesNoData: number;
  compliancePercent: number;
  worstNCDelta: number;
  worstZoneName: string;
  worstProjectName: string;
  projectsWithIssues: ProjectAcousticIssue[];
  totalProjects: number;
  projectsWithAcoustic: number;
}

// NC delta thresholds for categorization
const NC_EXCEEDING_THRESHOLD = 5; // More than 5 NC above target = exceeding
const NC_MARGINAL_THRESHOLD = 0;  // 0-5 NC above target = marginal

export function useOrganizationAcousticSummary() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['organization-acoustic-summary', organization?.id],
    queryFn: async (): Promise<OrganizationAcousticSummary> => {
      if (!organization?.id) {
        return getEmptySummary();
      }

      // Fetch all acoustic calculations for the organization with zone and project info
      const { data: calculations, error } = await supabase
        .from('acoustic_calculations')
        .select(`
          id,
          zone_id,
          calculated_nc,
          target_nc,
          meets_target,
          project_id,
          projects!inner(id, name)
        `)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Error fetching acoustic calculations:', error);
        throw error;
      }

      if (!calculations || calculations.length === 0) {
        return getEmptySummary();
      }

      // Fetch zone names for calculations
      const zoneIds = [...new Set(calculations.map(c => c.zone_id).filter(Boolean))];
      const { data: zones } = await supabase
        .from('zones')
        .select('id, name')
        .in('id', zoneIds);

      const zoneMap = new Map((zones || []).map(z => [z.id, z.name]));

      // Group calculations by zone to get per-zone status
      const zoneStatusMap = new Map<string, {
        projectId: string;
        projectName: string;
        zoneName: string;
        worstNCDelta: number;
        meetsAllTargets: boolean;
      }>();

      for (const calc of calculations) {
        if (!calc.zone_id) continue;

        const project = calc.projects as any;
        const zoneName = zoneMap.get(calc.zone_id) || 'Unknown Zone';
        const ncDelta = (calc.calculated_nc ?? 0) - (calc.target_nc ?? 0);

        const existing = zoneStatusMap.get(calc.zone_id);
        if (!existing) {
          zoneStatusMap.set(calc.zone_id, {
            projectId: calc.project_id,
            projectName: project?.name || 'Unknown Project',
            zoneName,
            worstNCDelta: ncDelta,
            meetsAllTargets: calc.meets_target ?? true,
          });
        } else {
          // Update worst case
          if (ncDelta > existing.worstNCDelta) {
            existing.worstNCDelta = ncDelta;
          }
          if (!calc.meets_target) {
            existing.meetsAllTargets = false;
          }
        }
      }

      // Calculate summary metrics
      let zonesPassingNC = 0;
      let zonesExceeding = 0;
      let zonesMarginal = 0;
      let worstNCDelta = 0;
      let worstZoneName = '';
      let worstProjectName = '';

      const projectIssuesMap = new Map<string, ProjectAcousticIssue>();

      for (const [_zoneId, status] of zoneStatusMap) {
        if (status.worstNCDelta > worstNCDelta) {
          worstNCDelta = status.worstNCDelta;
          worstZoneName = status.zoneName;
          worstProjectName = status.projectName;
        }

        if (status.worstNCDelta > NC_EXCEEDING_THRESHOLD) {
          zonesExceeding++;
          
          // Track project issues
          const projectIssue = projectIssuesMap.get(status.projectId);
          if (!projectIssue) {
            projectIssuesMap.set(status.projectId, {
              projectId: status.projectId,
              projectName: status.projectName,
              zonesExceeding: 1,
              zonesMarginal: 0,
              worstNCDelta: status.worstNCDelta,
              worstZoneName: status.zoneName,
            });
          } else {
            projectIssue.zonesExceeding++;
            if (status.worstNCDelta > projectIssue.worstNCDelta) {
              projectIssue.worstNCDelta = status.worstNCDelta;
              projectIssue.worstZoneName = status.zoneName;
            }
          }
        } else if (status.worstNCDelta > NC_MARGINAL_THRESHOLD) {
          zonesMarginal++;
          
          const projectIssue = projectIssuesMap.get(status.projectId);
          if (projectIssue) {
            projectIssue.zonesMarginal++;
          } else {
            projectIssuesMap.set(status.projectId, {
              projectId: status.projectId,
              projectName: status.projectName,
              zonesExceeding: 0,
              zonesMarginal: 1,
              worstNCDelta: status.worstNCDelta,
              worstZoneName: status.zoneName,
            });
          }
        } else {
          zonesPassingNC++;
        }
      }

      const totalZonesAnalyzed = zoneStatusMap.size;
      const compliancePercent = totalZonesAnalyzed > 0
        ? Math.round((zonesPassingNC / totalZonesAnalyzed) * 100)
        : 0;

      // Get unique projects with acoustic data
      const projectsWithAcoustic = new Set(calculations.map(c => c.project_id)).size;

      // Count total projects
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Sort project issues by severity
      const projectsWithIssues = Array.from(projectIssuesMap.values())
        .filter(p => p.zonesExceeding > 0 || p.zonesMarginal > 0)
        .sort((a, b) => b.worstNCDelta - a.worstNCDelta);

      return {
        totalZonesAnalyzed,
        zonesPassingNC,
        zonesExceeding,
        zonesMarginal,
        zonesNoData: 0, // Would need zone count to calculate
        compliancePercent,
        worstNCDelta: Math.round(worstNCDelta * 10) / 10,
        worstZoneName,
        worstProjectName,
        projectsWithIssues,
        totalProjects: totalProjects || 0,
        projectsWithAcoustic,
      };
    },
    enabled: !!organization?.id,
  });
}

function getEmptySummary(): OrganizationAcousticSummary {
  return {
    totalZonesAnalyzed: 0,
    zonesPassingNC: 0,
    zonesExceeding: 0,
    zonesMarginal: 0,
    zonesNoData: 0,
    compliancePercent: 0,
    worstNCDelta: 0,
    worstZoneName: '',
    worstProjectName: '',
    projectsWithIssues: [],
    totalProjects: 0,
    projectsWithAcoustic: 0,
  };
}
