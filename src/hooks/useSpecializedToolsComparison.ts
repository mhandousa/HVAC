import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

interface ToolDetail {
  id: string;
  name: string;
  created_at: string;
}

export interface ProjectSpecializedTools {
  projectId: string;
  projectName: string;
  projectStatus: string;
  projectLocation?: string;
  // Hot Water Plant
  hasHotWaterPlant: boolean;
  hotWaterPlantCount: number;
  hotWaterPlantDetails: ToolDetail[];
  // Smoke Control
  hasSmokeControl: boolean;
  smokeControlCount: number;
  smokeControlDetails: ToolDetail[];
  // Thermal Comfort
  hasThermalComfort: boolean;
  thermalComfortCount: number;
  thermalComfortDetails: ToolDetail[];
  // SBC Compliance
  hasSBCCompliance: boolean;
  sbcComplianceCount: number;
  sbcComplianceDetails: ToolDetail[];
  // Aggregate
  specializedToolsScore: number;
  completedToolsCount: number;
}

export interface SpecializedToolsComparisonSummary {
  totalProjects: number;
  projectsWithHotWaterPlant: number;
  projectsWithSmokeControl: number;
  projectsWithThermalComfort: number;
  projectsWithSBCCompliance: number;
  fullyCompleteProjects: number;
  averageScore: number;
}

export function useSpecializedToolsComparison(selectedProjectIds?: string[]) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['specialized-tools-comparison', organization?.id, selectedProjectIds],
    queryFn: async (): Promise<{
      projects: ProjectSpecializedTools[];
      summary: SpecializedToolsComparisonSummary;
    }> => {
      if (!organization?.id) {
        return { projects: [], summary: getEmptySummary() };
      }

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, location')
        .eq('organization_id', organization.id)
        .order('name');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) {
        return { projects: [], summary: getEmptySummary() };
      }

      // Filter by selected projects if provided
      const filteredProjects = selectedProjectIds?.length
        ? projects.filter(p => selectedProjectIds.includes(p.id))
        : projects;

      const projectIds = filteredProjects.map(p => p.id);

      // Fetch all specialized tools data in parallel
      // Note: Using correct column names from actual schema
      const [hotWaterPlants, smokeControlCalcs, thermalComfortAnalyses, sbcComplianceChecks] = await Promise.all([
        supabase
          .from('hot_water_plants')
          .select('id, plant_name, created_at, project_id')
          .in('project_id', projectIds),
        supabase
          .from('smoke_control_calculations')
          .select('id, calculation_name, created_at, project_id')
          .in('project_id', projectIds),
        supabase
          .from('thermal_comfort_analyses')
          .select('id, analysis_name, created_at, project_id')
          .in('project_id', projectIds),
        supabase
          .from('sbc_compliance_checks')
          .select('id, check_name, created_at, project_id')
          .in('project_id', projectIds),
      ]);

      // Build comparison data for each project
      const comparisonData: ProjectSpecializedTools[] = filteredProjects.map(project => {
        const hwPlants = (hotWaterPlants.data || []).filter(h => h.project_id === project.id);
        const smokeControls = (smokeControlCalcs.data || []).filter(s => s.project_id === project.id);
        const thermalComforts = (thermalComfortAnalyses.data || []).filter(t => t.project_id === project.id);
        const sbcChecks = (sbcComplianceChecks.data || []).filter(s => s.project_id === project.id);

        const hasHW = hwPlants.length > 0;
        const hasSmoke = smokeControls.length > 0;
        const hasThermal = thermalComforts.length > 0;
        const hasSBC = sbcChecks.length > 0;

        const completedCount = [hasHW, hasSmoke, hasThermal, hasSBC].filter(Boolean).length;
        const score = completedCount * 25;

        return {
          projectId: project.id,
          projectName: project.name,
          projectStatus: project.status || 'active',
          projectLocation: project.location || undefined,
          hasHotWaterPlant: hasHW,
          hotWaterPlantCount: hwPlants.length,
          hotWaterPlantDetails: hwPlants.map(h => ({
            id: h.id,
            name: h.plant_name,
            created_at: h.created_at || '',
          })),
          hasSmokeControl: hasSmoke,
          smokeControlCount: smokeControls.length,
          smokeControlDetails: smokeControls.map(s => ({
            id: s.id,
            name: s.calculation_name,
            created_at: s.created_at || '',
          })),
          hasThermalComfort: hasThermal,
          thermalComfortCount: thermalComforts.length,
          thermalComfortDetails: thermalComforts.map(t => ({
            id: t.id,
            name: t.analysis_name,
            created_at: t.created_at || '',
          })),
          hasSBCCompliance: hasSBC,
          sbcComplianceCount: sbcChecks.length,
          sbcComplianceDetails: sbcChecks.map(s => ({
            id: s.id,
            name: s.check_name,
            created_at: s.created_at || '',
          })),
          specializedToolsScore: score,
          completedToolsCount: completedCount,
        };
      });

      // Calculate summary
      const summary: SpecializedToolsComparisonSummary = {
        totalProjects: comparisonData.length,
        projectsWithHotWaterPlant: comparisonData.filter(p => p.hasHotWaterPlant).length,
        projectsWithSmokeControl: comparisonData.filter(p => p.hasSmokeControl).length,
        projectsWithThermalComfort: comparisonData.filter(p => p.hasThermalComfort).length,
        projectsWithSBCCompliance: comparisonData.filter(p => p.hasSBCCompliance).length,
        fullyCompleteProjects: comparisonData.filter(p => p.completedToolsCount === 4).length,
        averageScore: comparisonData.length > 0
          ? Math.round(comparisonData.reduce((sum, p) => sum + p.specializedToolsScore, 0) / comparisonData.length)
          : 0,
      };

      return { projects: comparisonData, summary };
    },
    enabled: !!organization?.id,
  });
}

function getEmptySummary(): SpecializedToolsComparisonSummary {
  return {
    totalProjects: 0,
    projectsWithHotWaterPlant: 0,
    projectsWithSmokeControl: 0,
    projectsWithThermalComfort: 0,
    projectsWithSBCCompliance: 0,
    fullyCompleteProjects: 0,
    averageScore: 0,
  };
}
