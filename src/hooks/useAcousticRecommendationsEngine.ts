import { useMemo } from 'react';
import { ZoneAcousticData } from './useZoneAcousticAnalysis';
import { 
  generateAcousticRecommendations, 
  AcousticRecommendation,
  calculateFloorRemediationSummary 
} from '@/lib/acoustic-remediation';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ROILevel = 'high' | 'medium' | 'low';

export interface ProjectAcousticRecommendation {
  id: string;
  zoneId: string;
  zoneName: string;
  floorId: string;
  floorName?: string;
  buildingId?: string;
  buildingName?: string;
  spaceType: string;
  priority: PriorityLevel;
  ncDelta: number;
  targetNC: number;
  estimatedNC: number | null;
  recommendations: AcousticRecommendation[];
  primaryAction: {
    type: 'silencer' | 'duct-mod' | 'equipment-change';
    title: string;
    expectedAttenuation: number;
    costEstimate: '$' | '$$' | '$$$';
    pressureDrop: number;
  } | null;
  estimatedROI: ROILevel;
}

export interface RecommendationsEngineSummary {
  totalZonesExceeding: number;
  totalZonesMarginal: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalSilencersNeeded: number;
  totalDuctModsNeeded: number;
  totalEquipmentChanges: number;
  estimatedTotalCost: '$' | '$$' | '$$$' | '$$$$';
  estimatedTotalPressureDrop: number;
}

/**
 * Calculate priority level based on NC delta
 * Critical: >10 dB over target
 * High: 6-10 dB over target
 * Medium: 3-5 dB over target
 * Low: 1-2 dB over target
 */
export function calculatePriorityLevel(ncDelta: number): PriorityLevel {
  if (ncDelta > 10) return 'critical';
  if (ncDelta >= 6) return 'high';
  if (ncDelta >= 3) return 'medium';
  return 'low';
}

/**
 * Estimate ROI based on space type sensitivity and treatment cost
 * High: Sensitive spaces (conference, executive) with moderate cost solutions
 * Medium: Standard spaces with any solution
 * Low: Less sensitive spaces or expensive solutions
 */
export function estimateROI(
  spaceType: string,
  recommendation: AcousticRecommendation | null,
  ncDelta: number
): ROILevel {
  if (!recommendation) return 'low';
  
  const sensitiveSpaces = ['conference', 'executive', 'auditorium', 'theater', 'library', 'hospital', 'patient'];
  const normalizedType = spaceType.toLowerCase();
  const isSensitive = sensitiveSpaces.some(s => normalizedType.includes(s));
  
  const costValue = recommendation.costEstimate === '$' ? 1 : recommendation.costEstimate === '$$' ? 2 : 3;
  const attenuationEfficiency = recommendation.expectedAttenuation / ncDelta;
  
  // High ROI: sensitive space + cost-effective solution + good attenuation
  if (isSensitive && costValue <= 2 && attenuationEfficiency >= 0.8) return 'high';
  
  // Medium ROI: decent attenuation or sensitive space
  if (attenuationEfficiency >= 0.7 || isSensitive) return 'medium';
  
  return 'low';
}

/**
 * Generate prioritized recommendations for all zones in a project
 */
export function generateProjectRecommendations(
  zones: ZoneAcousticData[]
): ProjectAcousticRecommendation[] {
  const results: ProjectAcousticRecommendation[] = [];
  
  zones.forEach(zone => {
    // Skip zones that don't need treatment
    if (zone.status === 'acceptable' || zone.status === 'no-data' || zone.ncDelta <= 0) {
      return;
    }
    
    const recommendations = generateAcousticRecommendations(zone);
    const primaryRec = recommendations[0] || null;
    
    const priority = calculatePriorityLevel(zone.ncDelta);
    const roi = estimateROI(zone.spaceType, primaryRec, zone.ncDelta);
    
    results.push({
      id: `rec-${zone.zoneId}`,
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      floorId: zone.floorId,
      spaceType: zone.spaceType,
      priority,
      ncDelta: zone.ncDelta,
      targetNC: zone.targetNC,
      estimatedNC: zone.estimatedNC,
      recommendations,
      primaryAction: primaryRec ? {
        type: primaryRec.type,
        title: primaryRec.title,
        expectedAttenuation: primaryRec.expectedAttenuation,
        costEstimate: primaryRec.costEstimate,
        pressureDrop: primaryRec.additionalPressureDrop,
      } : null,
      estimatedROI: roi,
    });
  });
  
  // Sort by priority (critical first), then by NC delta
  return results.sort((a, b) => {
    const priorityOrder: Record<PriorityLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.ncDelta - a.ncDelta;
  });
}

/**
 * Calculate summary statistics for recommendations
 */
export function calculateRecommendationsSummary(
  recommendations: ProjectAcousticRecommendation[],
  zones: ZoneAcousticData[]
): RecommendationsEngineSummary {
  const floorSummary = calculateFloorRemediationSummary(zones);
  
  const priorityCounts = recommendations.reduce(
    (acc, rec) => {
      acc[rec.priority]++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
  
  const typeCounts = recommendations.reduce(
    (acc, rec) => {
      if (rec.primaryAction) {
        if (rec.primaryAction.type === 'silencer') acc.silencers++;
        else if (rec.primaryAction.type === 'duct-mod') acc.ductMods++;
        else acc.equipment++;
      }
      return acc;
    },
    { silencers: 0, ductMods: 0, equipment: 0 }
  );
  
  return {
    totalZonesExceeding: zones.filter(z => z.status === 'exceeds').length,
    totalZonesMarginal: zones.filter(z => z.status === 'marginal').length,
    criticalCount: priorityCounts.critical,
    highCount: priorityCounts.high,
    mediumCount: priorityCounts.medium,
    lowCount: priorityCounts.low,
    totalSilencersNeeded: typeCounts.silencers,
    totalDuctModsNeeded: typeCounts.ductMods,
    totalEquipmentChanges: typeCounts.equipment,
    estimatedTotalCost: floorSummary.estimatedTotalCost,
    estimatedTotalPressureDrop: floorSummary.totalPressureImpact,
  };
}

/**
 * Group recommendations by building for comparison
 */
export function groupRecommendationsByBuilding(
  recommendations: ProjectAcousticRecommendation[]
): Record<string, ProjectAcousticRecommendation[]> {
  return recommendations.reduce((acc, rec) => {
    const buildingId = rec.buildingId || 'unknown';
    if (!acc[buildingId]) {
      acc[buildingId] = [];
    }
    acc[buildingId].push(rec);
    return acc;
  }, {} as Record<string, ProjectAcousticRecommendation[]>);
}

/**
 * Hook that provides the full acoustic recommendations engine
 */
export function useAcousticRecommendationsEngine(zones: ZoneAcousticData[]) {
  const recommendations = useMemo(() => {
    return generateProjectRecommendations(zones);
  }, [zones]);
  
  const summary = useMemo(() => {
    return calculateRecommendationsSummary(recommendations, zones);
  }, [recommendations, zones]);
  
  const byPriority = useMemo(() => ({
    critical: recommendations.filter(r => r.priority === 'critical'),
    high: recommendations.filter(r => r.priority === 'high'),
    medium: recommendations.filter(r => r.priority === 'medium'),
    low: recommendations.filter(r => r.priority === 'low'),
  }), [recommendations]);
  
  return {
    recommendations,
    summary,
    byPriority,
  };
}
