import { useMemo } from 'react';
import { DeficiencyItem } from './useDeficiencyDashboard';
import { DeficiencySeverity } from '@/lib/deficiency-types';

export interface HeatMapCell {
  id: string;
  label: string;
  count: number;
  critical: number;
  major: number;
  minor: number;
  resolved: number;
  severityScore: number;
  trend: number;
  intensity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EquipmentHeatMapData {
  cells: HeatMapCell[];
  maxCount: number;
  maxSeverityScore: number;
}

export interface LocationHeatMapItem {
  id: string;
  name: string;
  totalCount: number;
  severityScore: number;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  children?: LocationHeatMapItem[];
}

export interface LocationHeatMapData {
  projects: LocationHeatMapItem[];
  maxCount: number;
}

// Equipment type extraction from equipment tag
const EQUIPMENT_TYPE_PATTERNS: { pattern: RegExp; type: string; label: string }[] = [
  { pattern: /^ERV/i, type: 'erv', label: 'ERV' },
  { pattern: /^AHU/i, type: 'ahu', label: 'AHU' },
  { pattern: /^FCU/i, type: 'fcu', label: 'FCU' },
  { pattern: /^VAV/i, type: 'vav', label: 'VAV' },
  { pattern: /^CHW|^CHILLER/i, type: 'chiller', label: 'Chiller' },
  { pattern: /^CT|^COOLING.*TOWER/i, type: 'cooling_tower', label: 'Cooling Tower' },
  { pattern: /^PUMP|^P-/i, type: 'pump', label: 'Pump' },
  { pattern: /^VRF|^VRV/i, type: 'vrf', label: 'VRF' },
  { pattern: /^BOILER|^B-/i, type: 'boiler', label: 'Boiler' },
  { pattern: /^FAN|^EF|^SF/i, type: 'fan', label: 'Fan' },
  { pattern: /^SPLIT|^DX/i, type: 'split', label: 'Split Unit' },
];

function getEquipmentType(tag: string): { type: string; label: string } {
  for (const { pattern, type, label } of EQUIPMENT_TYPE_PATTERNS) {
    if (pattern.test(tag)) {
      return { type, label };
    }
  }
  return { type: 'other', label: 'Other' };
}

function calculateSeverityScore(critical: number, major: number, minor: number): number {
  return critical * 3 + major * 2 + minor * 1;
}

function determineIntensity(count: number, maxCount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (maxCount === 0) return 'low';
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 'critical';
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.25) return 'medium';
  return 'low';
}

export function useDeficiencyHeatMap(deficiencies: DeficiencyItem[]) {
  // Aggregate by equipment type
  const equipmentHeatMap = useMemo<EquipmentHeatMapData>(() => {
    const typeMap = new Map<string, {
      label: string;
      count: number;
      critical: number;
      major: number;
      minor: number;
      resolved: number;
    }>();

    deficiencies.forEach((d) => {
      const { type, label } = getEquipmentType(d.equipmentTag);
      const existing = typeMap.get(type) || {
        label,
        count: 0,
        critical: 0,
        major: 0,
        minor: 0,
        resolved: 0,
      };

      existing.count++;
      if (d.severity === 'critical') existing.critical++;
      else if (d.severity === 'major') existing.major++;
      else existing.minor++;
      if (d.isResolved) existing.resolved++;

      typeMap.set(type, existing);
    });

    const maxCount = Math.max(...Array.from(typeMap.values()).map(v => v.count), 1);

    const cells: HeatMapCell[] = Array.from(typeMap.entries())
      .map(([id, data]) => {
        const severityScore = calculateSeverityScore(data.critical, data.major, data.minor);
        return {
          id,
          label: data.label,
          count: data.count,
          critical: data.critical,
          major: data.major,
          minor: data.minor,
          resolved: data.resolved,
          severityScore,
          trend: 0, // Would need historical data
          intensity: determineIntensity(data.count, maxCount),
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      cells,
      maxCount,
      maxSeverityScore: Math.max(...cells.map(c => c.severityScore), 0),
    };
  }, [deficiencies]);

  // Aggregate by location (project)
  const locationHeatMap = useMemo<LocationHeatMapData>(() => {
    const projectMap = new Map<string, {
      name: string;
      count: number;
      critical: number;
      major: number;
      minor: number;
    }>();

    deficiencies.forEach((d) => {
      const existing = projectMap.get(d.projectId) || {
        name: d.projectName,
        count: 0,
        critical: 0,
        major: 0,
        minor: 0,
      };

      existing.count++;
      if (d.severity === 'critical') existing.critical++;
      else if (d.severity === 'major') existing.major++;
      else existing.minor++;

      projectMap.set(d.projectId, existing);
    });

    const maxCount = Math.max(...Array.from(projectMap.values()).map(v => v.count), 1);

    const projects: LocationHeatMapItem[] = Array.from(projectMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        totalCount: data.count,
        severityScore: calculateSeverityScore(data.critical, data.major, data.minor),
        intensity: determineIntensity(data.count, maxCount),
      }))
      .sort((a, b) => b.totalCount - a.totalCount);

    return { projects, maxCount };
  }, [deficiencies]);

  return {
    equipmentHeatMap,
    locationHeatMap,
  };
}
