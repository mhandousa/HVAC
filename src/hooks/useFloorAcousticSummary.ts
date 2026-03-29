import { useMemo } from 'react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

export interface FloorAcousticData {
  floorId: string;
  floorName: string;
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

interface FloorInfo {
  id: string;
  name: string;
  buildingId?: string;
}

interface BuildingInfo {
  id: string;
  name: string;
}

/**
 * Aggregate zone acoustic data by floor
 */
export function aggregateFloorAcousticData(
  zones: ZoneAcousticData[],
  floors: FloorInfo[],
  buildings: BuildingInfo[]
): FloorAcousticData[] {
  // Create lookup maps
  const floorMap = new Map<string, FloorInfo>();
  floors.forEach(f => floorMap.set(f.id, f));

  const buildingMap = new Map<string, BuildingInfo>();
  buildings.forEach(b => buildingMap.set(b.id, b));

  // Initialize floor stats
  const floorStats = new Map<string, {
    floorId: string;
    floorName: string;
    buildingId: string;
    buildingName: string;
    acceptable: number;
    marginal: number;
    exceeds: number;
    noData: number;
    total: number;
    ncDeltas: number[];
    worstDelta: number;
    worstZoneName: string;
  }>();

  // Initialize all floors
  floors.forEach(floor => {
    if (floor.buildingId) {
      const building = buildingMap.get(floor.buildingId);
      floorStats.set(floor.id, {
        floorId: floor.id,
        floorName: floor.name,
        buildingId: floor.buildingId,
        buildingName: building?.name || 'Unknown Building',
        acceptable: 0,
        marginal: 0,
        exceeds: 0,
        noData: 0,
        total: 0,
        ncDeltas: [],
        worstDelta: 0,
        worstZoneName: '',
      });
    }
  });

  // Aggregate zone data
  zones.forEach(zone => {
    const stats = floorStats.get(zone.floorId);
    if (!stats) return;

    stats.total++;

    switch (zone.status) {
      case 'acceptable':
        stats.acceptable++;
        break;
      case 'marginal':
        stats.marginal++;
        break;
      case 'exceeds':
        stats.exceeds++;
        break;
      case 'no-data':
        stats.noData++;
        break;
    }

    if (zone.ncDelta > 0) {
      stats.ncDeltas.push(zone.ncDelta);
    }

    if (zone.ncDelta > stats.worstDelta) {
      stats.worstDelta = zone.ncDelta;
      stats.worstZoneName = zone.zoneName;
    }
  });

  // Calculate final metrics
  return Array.from(floorStats.values())
    .filter(f => f.total > 0)
    .map((floor): FloorAcousticData => {
      const analyzed = floor.total - floor.noData;
      const avgNCDelta = floor.ncDeltas.length > 0
        ? Math.round((floor.ncDeltas.reduce((a, b) => a + b, 0) / floor.ncDeltas.length) * 10) / 10
        : 0;

      return {
        floorId: floor.floorId,
        floorName: floor.floorName,
        buildingId: floor.buildingId,
        buildingName: floor.buildingName,
        totalZones: floor.total,
        zonesAnalyzed: analyzed,
        zonesExceeding: floor.exceeds,
        zonesMarginal: floor.marginal,
        zonesAcceptable: floor.acceptable,
        zonesNoData: floor.noData,
        avgNCDelta,
        worstNCDelta: floor.worstDelta,
        worstZoneName: floor.worstZoneName,
        compliancePercent: analyzed > 0 ? Math.round((floor.acceptable / analyzed) * 100) : 100,
      };
    })
    .sort((a, b) => a.compliancePercent - b.compliancePercent);
}

/**
 * Hook to get floor-level acoustic summary data
 */
export function useFloorAcousticSummary(
  zones: ZoneAcousticData[],
  floors: FloorInfo[],
  buildings: BuildingInfo[]
) {
  const floorData = useMemo(() => {
    return aggregateFloorAcousticData(zones, floors, buildings);
  }, [zones, floors, buildings]);

  // Group by building for easy lookup
  const byBuilding = useMemo(() => {
    const grouped: Record<string, FloorAcousticData[]> = {};
    floorData.forEach(floor => {
      if (!grouped[floor.buildingId]) {
        grouped[floor.buildingId] = [];
      }
      grouped[floor.buildingId].push(floor);
    });
    // Sort floors within each building by name
    Object.keys(grouped).forEach(buildingId => {
      grouped[buildingId].sort((a, b) => a.floorName.localeCompare(b.floorName));
    });
    return grouped;
  }, [floorData]);

  return { floorData, byBuilding };
}
