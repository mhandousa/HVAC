import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useState, useMemo } from 'react';
import { DEFICIENCY_CATEGORIES, getCategoryForTag } from '@/lib/deficiency-types';
import type { DeficiencySeverity } from '@/lib/deficiency-types';

export type { DeficiencySeverity };

export interface DeficiencyFilters {
  projectId?: string;
  severities: DeficiencySeverity[];
  categories: string[];
  status: 'all' | 'open' | 'resolved';
  dateRange: 'all' | '7days' | '30days' | '90days';
  equipmentType?: string;
}

export interface DeficiencyStats {
  total: number;
  critical: number;
  major: number;
  minor: number;
  resolved: number;
  resolutionRate: number;
  byCategory: { category: string; count: number; color: string }[];
  trends: {
    totalChange: number;
    criticalChange: number;
    majorChange: number;
    minorChange: number;
  };
}

export interface DeficiencyItem {
  id: string;
  photoUrl: string;
  testId: string;
  testName: string;
  checklistId: string;
  equipmentTag: string;
  projectId: string;
  projectName: string;
  deficiencyTags: string[];
  severity: DeficiencySeverity;
  description: string | null;
  isResolved: boolean;
  hasBeforeAfter: boolean;
  capturedAt: string;
  daysOpen: number;
  remediationNotes: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Installation Errors': 'hsl(var(--chart-1))',
  'Missing Components': 'hsl(var(--chart-2))',
  'Damage': 'hsl(var(--chart-3))',
  'Performance Issues': 'hsl(var(--chart-4))',
  'Documentation Issues': 'hsl(var(--chart-5))',
};

export function useDeficiencyDashboard() {
  const { data: organization } = useOrganization();
  const [filters, setFilters] = useState<DeficiencyFilters>({
    severities: [],
    categories: [],
    status: 'all',
    dateRange: '30days',
  });

  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: ['deficiency-dashboard', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Build date filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (filters.dateRange === '7days') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (filters.dateRange === '30days') {
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (filters.dateRange === '90days') {
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Fetch photo metadata with joins
      let query = supabase
        .from('commissioning_photo_metadata')
        .select(`
          *,
          test:test_id (
            id,
            test_name,
            checklist_id,
            checklist:checklist_id (
              id,
              equipment_tag,
              commissioning_project:commissioning_project_id (
                id,
                name,
                project_id,
                organization_id,
                project:project_id (
                  id,
                  name
                )
              )
            )
          )
        `)
        .not('deficiency_tags', 'is', null)
        .not('deficiency_tags', 'eq', '{}');

      if (dateFilter) {
        query = query.gte('captured_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by organization
      const orgFiltered = data?.filter((item: any) => 
        item.test?.checklist?.commissioning_project?.organization_id === organization.id
      ) || [];

      return orgFiltered;
    },
    enabled: !!organization?.id,
  });

  // Fetch projects for filter dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-filter', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Process data into DeficiencyItem[]
  const deficiencies = useMemo<DeficiencyItem[]>(() => {
    if (!rawData) return [];

    return rawData.map((item: any) => {
      const test = item.test;
      const checklist = test?.checklist;
      const commProject = checklist?.commissioning_project;
      const project = commProject?.project;

      const isResolved = !!(
        item.related_after_photo_url ||
        item.remediation_completed_at ||
        (item.remediation_notes && item.remediation_notes.toLowerCase().includes('resolved'))
      );

      const capturedAt = new Date(item.captured_at || item.created_at);
      const daysOpen = isResolved ? 0 : Math.floor((Date.now() - capturedAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        photoUrl: item.photo_url,
        testId: item.test_id,
        testName: test?.test_name || 'Unknown Test',
        checklistId: checklist?.id || '',
        equipmentTag: checklist?.equipment_tag || 'Unknown',
        projectId: project?.id || '',
        projectName: project?.name || commProject?.name || 'Unknown Project',
        deficiencyTags: item.deficiency_tags || [],
        severity: item.deficiency_severity || 'minor',
        description: item.description,
        isResolved,
        hasBeforeAfter: !!item.related_after_photo_url,
        capturedAt: item.captured_at || item.created_at,
        daysOpen,
        remediationNotes: item.remediation_notes,
      };
    });
  }, [rawData]);

  // Equipment type extraction helper
  const getEquipmentType = (tag: string): string => {
    const patterns: { pattern: RegExp; type: string }[] = [
      { pattern: /^ERV/i, type: 'erv' },
      { pattern: /^AHU/i, type: 'ahu' },
      { pattern: /^FCU/i, type: 'fcu' },
      { pattern: /^VAV/i, type: 'vav' },
      { pattern: /^CHW|^CHILLER/i, type: 'chiller' },
      { pattern: /^CT|^COOLING.*TOWER/i, type: 'cooling_tower' },
      { pattern: /^PUMP|^P-/i, type: 'pump' },
      { pattern: /^VRF|^VRV/i, type: 'vrf' },
      { pattern: /^BOILER|^B-/i, type: 'boiler' },
      { pattern: /^FAN|^EF|^SF/i, type: 'fan' },
      { pattern: /^SPLIT|^DX/i, type: 'split' },
    ];
    for (const { pattern, type } of patterns) {
      if (pattern.test(tag)) return type;
    }
    return 'other';
  };

  // Apply client-side filters
  const filteredDeficiencies = useMemo(() => {
    let result = [...deficiencies];

    if (filters.projectId) {
      result = result.filter(d => d.projectId === filters.projectId);
    }

    if (filters.severities.length > 0) {
      result = result.filter(d => filters.severities.includes(d.severity));
    }

    if (filters.categories.length > 0) {
      result = result.filter(d => 
        d.deficiencyTags.some(tag => {
          const category = getCategoryForTag(tag);
          return category && filters.categories.includes(category.label);
        })
      );
    }

    if (filters.status === 'open') {
      result = result.filter(d => !d.isResolved);
    } else if (filters.status === 'resolved') {
      result = result.filter(d => d.isResolved);
    }

    if (filters.equipmentType) {
      result = result.filter(d => getEquipmentType(d.equipmentTag) === filters.equipmentType);
    }

    return result;
  }, [deficiencies, filters]);

  // Calculate stats
  const stats = useMemo<DeficiencyStats>(() => {
    const all = filteredDeficiencies;
    const critical = all.filter(d => d.severity === 'critical').length;
    const major = all.filter(d => d.severity === 'major').length;
    const minor = all.filter(d => d.severity === 'minor').length;
    const resolved = all.filter(d => d.isResolved).length;

    // Calculate by category
    const categoryMap = new Map<string, number>();
    all.forEach(d => {
      d.deficiencyTags.forEach(tag => {
        const category = getCategoryForTag(tag);
        if (category) {
          categoryMap.set(category.label, (categoryMap.get(category.label) || 0) + 1);
        }
      });
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        color: CATEGORY_COLORS[category] || 'hsl(var(--muted))',
      }))
      .sort((a, b) => b.count - a.count);

    // Simplified trends (would need historical data for real trends)
    const trends = {
      totalChange: 0,
      criticalChange: 0,
      majorChange: 0,
      minorChange: 0,
    };

    return {
      total: all.length,
      critical,
      major,
      minor,
      resolved,
      resolutionRate: all.length > 0 ? Math.round((resolved / all.length) * 100) : 0,
      byCategory,
      trends,
    };
  }, [filteredDeficiencies]);

  return {
    deficiencies: filteredDeficiencies,
    stats,
    filters,
    setFilters,
    projects: projects || [],
    isLoading,
    refetch,
  };
}
