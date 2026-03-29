import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useZoneContext } from '@/hooks/useZoneContext';
import {
  generateSmartDefaults, 
  type SmartDefaultsContext, 
  type SmartDefault,
  type BuildingType,
  type ClimateZone,
} from '@/lib/smart-defaults';

// Re-export types for external use
export type { SmartDefault, BuildingType, ClimateZone };

interface UseSmartDefaultsOptions {
  buildingType?: BuildingType;
  climateZone?: ClimateZone;
  zoneArea_sqft?: number;
  spaceType?: string;
}

export function useSmartDefaults(options: UseSmartDefaultsOptions = {}) {
  const { projectId } = useZoneContext();
  const { data: projects } = useProjects();
  const project = projects?.find(p => p.id === projectId);

  // Build context from project data and options
  const context = useMemo<SmartDefaultsContext>(() => {
    // Try to infer building type from project data
    let buildingType = options.buildingType;
    if (!buildingType && project?.name) {
      // Simple heuristic based on project name
      const name = project.name.toLowerCase();
      if (name.includes('office')) buildingType = 'office';
      else if (name.includes('hospital') || name.includes('medical')) buildingType = 'hospital';
      else if (name.includes('school') || name.includes('university')) buildingType = 'school';
      else if (name.includes('hotel')) buildingType = 'hotel';
      else if (name.includes('retail') || name.includes('mall')) buildingType = 'retail';
      else if (name.includes('warehouse')) buildingType = 'warehouse';
      else if (name.includes('restaurant')) buildingType = 'restaurant';
      else if (name.includes('lab')) buildingType = 'laboratory';
      else if (name.includes('data')) buildingType = 'datacenter';
    }

    // Try to infer climate zone from project location (use name as fallback)
    let climateZone = options.climateZone;
    if (!climateZone && project?.name) {
      // Saudi Arabia climate zone mapping based on project name hints
      const name = project.name.toLowerCase();
      if (name.includes('riyadh') || name.includes('qassim')) climateZone = '0B';
      else if (name.includes('jeddah') || name.includes('mecca') || name.includes('makkah')) climateZone = '0A';
      else if (name.includes('dammam') || name.includes('dhahran') || name.includes('khobar')) climateZone = '1A';
      else if (name.includes('tabuk') || name.includes('hail')) climateZone = '3B';
      else if (name.includes('abha') || name.includes('taif')) climateZone = '3A';
      // Default to hot-humid for Saudi if no specific match
      else climateZone = '1A';
    }

    return {
      buildingType,
      climateZone,
      zoneArea_sqft: options.zoneArea_sqft,
      spaceType: options.spaceType,
    };
  }, [project, options]);

  // Generate defaults
  const defaults = useMemo(() => {
    return generateSmartDefaults(context);
  }, [context]);

  // Get sources for attribution
  const sources = useMemo(() => {
    const uniqueSources = new Set(defaults.map(d => d.source));
    return Array.from(uniqueSources);
  }, [defaults]);

  // Helper to get specific default
  const getDefault = (key: string): SmartDefault | undefined => {
    return defaults.find(d => d.key === key);
  };

  // Helper to get defaults by category
  const getByCategory = (category: SmartDefault['category']): SmartDefault[] => {
    return defaults.filter(d => d.category === category);
  };

  // Create a values object for easy application
  const values = useMemo(() => {
    const result: Record<string, number | string> = {};
    defaults.forEach(d => {
      result[d.key] = d.value;
    });
    return result;
  }, [defaults]);

  // Summary text for UI
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (context.buildingType) {
      parts.push(context.buildingType.charAt(0).toUpperCase() + context.buildingType.slice(1));
    }
    if (context.climateZone) {
      parts.push(`Climate Zone ${context.climateZone}`);
    }
    return parts.length > 0 
      ? `Smart defaults based on ${parts.join(' in ')}` 
      : 'Configure project settings for smart defaults';
  }, [context]);

  return {
    defaults,
    sources,
    values,
    summary,
    getDefault,
    getByCategory,
    context,
    hasContext: !!(context.buildingType || context.climateZone),
    isLoading: false,
  };
}
