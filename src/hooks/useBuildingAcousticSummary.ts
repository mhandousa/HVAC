import { useMemo } from 'react';
import { ZoneAcousticData } from './useZoneAcousticAnalysis';

export interface BuildingAcousticData {
  buildingId: string;
  buildingName: string;
  totalZones: number;
  zonesAnalyzed: number;
  zonesExceeding: number;
  zonesMarginal: number;
  zonesAcceptable: number;
  zonesNoData: number;
  avgNCDelta: number;
  worstNCDelta: number;
  worstZoneName: string;
  compliancePercent: number;
}

/**
 * Aggregate acoustic data at the building level from zone acoustic data
 */
export function aggregateBuildingAcousticData(
  zones: ZoneAcousticData[],
  buildingMap: Map<string, { id: string; name: string; floorIds: string[] }>
): BuildingAcousticData[] {
  const buildingStats = new Map<string, BuildingAcousticData>();
  
  // Initialize buildings
  buildingMap.forEach((building, buildingId) => {
    buildingStats.set(buildingId, {
      buildingId,
      buildingName: building.name,
      totalZones: 0,
      zonesAnalyzed: 0,
      zonesExceeding: 0,
      zonesMarginal: 0,
      zonesAcceptable: 0,
      zonesNoData: 0,
      avgNCDelta: 0,
      worstNCDelta: -Infinity,
      worstZoneName: '',
      compliancePercent: 100,
    });
  });
  
  // Aggregate zone data by building
  zones.forEach(zone => {
    // Find building for this zone's floor
    let buildingId: string | null = null;
    buildingMap.forEach((building, id) => {
      if (building.floorIds.includes(zone.floorId)) {
        buildingId = id;
      }
    });
    
    if (!buildingId) return;
    
    const stats = buildingStats.get(buildingId);
    if (!stats) return;
    
    stats.totalZones++;
    
    switch (zone.status) {
      case 'exceeds':
        stats.zonesExceeding++;
        stats.zonesAnalyzed++;
        break;
      case 'marginal':
        stats.zonesMarginal++;
        stats.zonesAnalyzed++;
        break;
      case 'acceptable':
        stats.zonesAcceptable++;
        stats.zonesAnalyzed++;
        break;
      case 'no-data':
        stats.zonesNoData++;
        break;
    }
    
    if (zone.ncDelta > stats.worstNCDelta) {
      stats.worstNCDelta = zone.ncDelta;
      stats.worstZoneName = zone.zoneName;
    }
  });
  
  // Calculate averages and percentages
  buildingStats.forEach(stats => {
    if (stats.zonesAnalyzed > 0) {
      const zonesWithDelta = zones.filter(z => 
        z.status !== 'no-data' && 
        buildingMap.get(stats.buildingId)?.floorIds.includes(z.floorId)
      );
      
      if (zonesWithDelta.length > 0) {
        stats.avgNCDelta = Math.round(
          zonesWithDelta.reduce((sum, z) => sum + z.ncDelta, 0) / zonesWithDelta.length
        );
      }
      
      stats.compliancePercent = Math.round(
        (stats.zonesAcceptable / stats.zonesAnalyzed) * 100
      );
    }
    
    // Fix worstNCDelta if no zones exceeded
    if (stats.worstNCDelta === -Infinity) {
      stats.worstNCDelta = 0;
    }
  });
  
  // Sort by worst compliance (most problematic first)
  return Array.from(buildingStats.values())
    .filter(b => b.totalZones > 0)
    .sort((a, b) => a.compliancePercent - b.compliancePercent);
}

/**
 * Hook to calculate building-level acoustic summary
 */
export function useBuildingAcousticSummary(
  zones: ZoneAcousticData[],
  buildings: { id: string; name: string }[],
  floors: { id: string; buildingId?: string }[]
) {
  const buildingData = useMemo(() => {
    // Build floor -> building mapping
    const buildingMap = new Map<string, { id: string; name: string; floorIds: string[] }>();
    
    buildings.forEach(building => {
      const floorIds = floors
        .filter(f => f.buildingId === building.id)
        .map(f => f.id);
      
      buildingMap.set(building.id, {
        id: building.id,
        name: building.name,
        floorIds,
      });
    });
    
    return aggregateBuildingAcousticData(zones, buildingMap);
  }, [zones, buildings, floors]);
  
  const overallStats = useMemo(() => {
    const totalZones = buildingData.reduce((sum, b) => sum + b.totalZones, 0);
    const totalAnalyzed = buildingData.reduce((sum, b) => sum + b.zonesAnalyzed, 0);
    const totalAcceptable = buildingData.reduce((sum, b) => sum + b.zonesAcceptable, 0);
    
    return {
      totalBuildings: buildingData.length,
      totalZones,
      totalAnalyzed,
      overallCompliance: totalAnalyzed > 0 
        ? Math.round((totalAcceptable / totalAnalyzed) * 100) 
        : 100,
      buildingsWithIssues: buildingData.filter(b => b.zonesExceeding > 0 || b.zonesMarginal > 0).length,
    };
  }, [buildingData]);
  
  return {
    buildingData,
    overallStats,
  };
}
