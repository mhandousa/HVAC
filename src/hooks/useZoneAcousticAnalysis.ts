import { useMemo } from 'react';
import { useTerminalUnitSelections } from './useTerminalUnitSelections';
import { useZonesByFloorIds } from './useZones';
import { useFloors } from './useFloors';
import { SAUDI_NC_STANDARDS } from '@/lib/terminal-unit-calculations';

export interface ZoneAcousticData {
  zoneId: string;
  zoneName: string;
  floorId: string;
  spaceType: string;
  targetNC: number;
  estimatedNC: number | null;
  terminalUnits: {
    id: string;
    unitTag: string;
    unitType: string;
    noiseNC: number | null;
  }[];
  status: 'exceeds' | 'marginal' | 'acceptable' | 'no-data';
  ncDelta: number;
  recommendations: string[];
}

export interface FloorAcousticSummary {
  totalZones: number;
  zonesExceeding: number;
  zonesMarginal: number;
  zonesAcceptable: number;
  zonesNoData: number;
  worstNC: number;
  avgNC: number;
}

// Get target NC for a space type from Saudi standards
export function getTargetNCForSpaceType(zoneType: string | null | undefined): number {
  if (!zoneType) return 40; // Default to office
  
  const normalizedType = zoneType.toLowerCase().replace(/[_-]/g, ' ');
  
  // Map common zone types to NC standards
  const mapping: Record<string, number> = {
    'office': 40,
    'open office': 40,
    'private office': 35,
    'executive office': 30,
    'conference': 30,
    'conference room': 30,
    'meeting room': 35,
    'meeting': 35,
    'lobby': 45,
    'reception': 40,
    'corridor': 45,
    'hallway': 45,
    'server room': 55,
    'data center': 55,
    'kitchen': 50,
    'break room': 45,
    'restroom': 45,
    'bathroom': 45,
    'classroom': 35,
    'auditorium': 25,
    'theater': 25,
    'library': 35,
    'hospital room': 30,
    'patient room': 30,
    'operating room': 35,
    'laboratory': 45,
    'retail': 45,
    'store': 45,
    'warehouse': 55,
    'mechanical room': 60,
    'mechanical': 60,
    'storage': 50,
  };
  
  // Try exact match first
  if (mapping[normalizedType]) {
    return mapping[normalizedType];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(mapping)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value;
    }
  }
  
  // Check against SAUDI_NC_STANDARDS
  const standard = SAUDI_NC_STANDARDS.find(s => 
    s.spaceType.toLowerCase().includes(normalizedType) ||
    normalizedType.includes(s.spaceType.toLowerCase())
  );
  
  if (standard) {
    return standard.targetNC;
  }
  
  return 40; // Default to office
}

// Combine multiple NC levels using logarithmic addition
export function combineNCLevels(ncLevels: number[]): number {
  const validLevels = ncLevels.filter(nc => nc > 0 && !isNaN(nc));
  
  if (validLevels.length === 0) return 0;
  if (validLevels.length === 1) return validLevels[0];
  
  // NC ≈ dB - 7 (rough approximation), convert to dB, combine, convert back
  const dbLevels = validLevels.map(nc => nc + 7);
  const combinedDb = 10 * Math.log10(
    dbLevels.reduce((sum, db) => sum + Math.pow(10, db / 10), 0)
  );
  
  return Math.round(combinedDb - 7);
}

// Estimate NC for a terminal unit based on type and size
export function estimateTerminalUnitNC(
  unitType: string,
  maxCfm: number | null,
  supplyCfm: number | null
): number {
  if (!maxCfm) return 35; // Default estimate
  
  const cfm = supplyCfm || maxCfm * 0.7; // Assume 70% if not specified
  const loadRatio = cfm / maxCfm;
  
  // Base NC by unit type
  const baseNC: Record<string, number> = {
    'vav-cooling': 32,
    'vav-reheat': 34,
    'fcu-2pipe': 35,
    'fcu-4pipe': 36,
    'fcu-electric': 34,
  };
  
  const base = baseNC[unitType] || 35;
  
  // Adjust for load - higher load = higher noise
  const loadAdjustment = Math.round((loadRatio - 0.5) * 10);
  
  // Adjust for size - larger units tend to be quieter at same load ratio
  const sizeAdjustment = maxCfm > 800 ? -2 : maxCfm > 500 ? -1 : maxCfm < 300 ? 2 : 0;
  
  return Math.max(25, Math.min(55, base + loadAdjustment + sizeAdjustment));
}

// Generate recommendations based on acoustic analysis
function generateRecommendations(
  estimatedNC: number,
  targetNC: number,
  terminalUnits: { unitType: string; noiseNC: number | null }[]
): string[] {
  const recommendations: string[] = [];
  const delta = estimatedNC - targetNC;
  
  if (delta <= 0) {
    return ['Zone meets NC requirements'];
  }
  
  if (delta > 10) {
    recommendations.push('Consider relocating or replacing terminal units');
    recommendations.push('Add sound attenuators upstream of terminal units');
  } else if (delta > 5) {
    recommendations.push('Install lined ductwork near terminal units');
    recommendations.push('Consider NC-rated diffusers or grilles');
  } else {
    recommendations.push('Add acoustic lining to supply duct');
    recommendations.push('Verify damper positions are not causing excess noise');
  }
  
  // Unit-specific recommendations
  const vavUnits = terminalUnits.filter(u => u.unitType?.includes('vav'));
  const fcuUnits = terminalUnits.filter(u => u.unitType?.includes('fcu'));
  
  if (vavUnits.length > 0) {
    recommendations.push('Reduce VAV inlet velocity by upsizing inlet diameter');
  }
  
  if (fcuUnits.length > 0) {
    recommendations.push('Select low-noise FCU fan speed setting');
  }
  
  return recommendations.slice(0, 4); // Limit to 4 recommendations
}

export function useZoneAcousticAnalysis(projectId: string | undefined, floorId?: string) {
  // Get floors for the building that contains the selected floor
  const { data: floors = [] } = useFloors(undefined);
  
  // Determine which floor IDs to query zones for
  const floorIdsToQuery = useMemo(() => {
    if (floorId) return [floorId];
    return floors.map(f => f.id);
  }, [floorId, floors]);
  
  const { data: zones = [] } = useZonesByFloorIds(floorIdsToQuery);
  const { data: terminalUnits = [] } = useTerminalUnitSelections(projectId);
  
  const zoneAcousticData = useMemo<ZoneAcousticData[]>(() => {
    if (!zones.length) return [];
    
    // Filter zones by floor if specified
    const filteredZones = floorId 
      ? zones.filter(z => z.floor_id === floorId)
      : zones;
    
    return filteredZones.map(zone => {
      // Get terminal units for this zone
      const zoneUnits = terminalUnits.filter(tu => tu.zone_id === zone.id);
      
      // Get target NC for zone type
      const targetNC = getTargetNCForSpaceType(zone.zone_type);
      
      // Map terminal units with NC values
      const unitsWithNC = zoneUnits.map(tu => ({
        id: tu.id,
        unitTag: tu.unit_tag || 'Unknown',
        unitType: tu.unit_type,
        noiseNC: tu.noise_nc ?? estimateTerminalUnitNC(
          tu.unit_type,
          tu.max_cfm,
          tu.supply_cfm
        ),
      }));
      
      // Calculate combined NC
      const ncLevels = unitsWithNC
        .map(u => u.noiseNC)
        .filter((nc): nc is number => nc !== null && nc > 0);
      
      const estimatedNC = ncLevels.length > 0 ? combineNCLevels(ncLevels) : null;
      
      // Determine status
      let status: ZoneAcousticData['status'] = 'no-data';
      let ncDelta = 0;
      
      if (estimatedNC !== null) {
        ncDelta = estimatedNC - targetNC;
        
        if (ncDelta > 5) {
          status = 'exceeds';
        } else if (ncDelta > 0) {
          status = 'marginal';
        } else {
          status = 'acceptable';
        }
      }
      
      // Generate recommendations
      const recommendations = estimatedNC !== null
        ? generateRecommendations(estimatedNC, targetNC, unitsWithNC)
        : ['Add terminal units to analyze acoustic performance'];
      
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        floorId: zone.floor_id,
        spaceType: zone.zone_type || 'Office',
        targetNC,
        estimatedNC,
        terminalUnits: unitsWithNC,
        status,
        ncDelta,
        recommendations,
      };
    });
  }, [zones, terminalUnits, floorId]);
  
  const floorSummary = useMemo<FloorAcousticSummary>(() => {
    const zonesWithData = zoneAcousticData.filter(z => z.estimatedNC !== null);
    
    return {
      totalZones: zoneAcousticData.length,
      zonesExceeding: zoneAcousticData.filter(z => z.status === 'exceeds').length,
      zonesMarginal: zoneAcousticData.filter(z => z.status === 'marginal').length,
      zonesAcceptable: zoneAcousticData.filter(z => z.status === 'acceptable').length,
      zonesNoData: zoneAcousticData.filter(z => z.status === 'no-data').length,
      worstNC: zonesWithData.length > 0 
        ? Math.max(...zonesWithData.map(z => z.estimatedNC!))
        : 0,
      avgNC: zonesWithData.length > 0
        ? Math.round(zonesWithData.reduce((sum, z) => sum + z.estimatedNC!, 0) / zonesWithData.length)
        : 0,
    };
  }, [zoneAcousticData]);
  
  // Get zones that exceed NC standards, sorted by severity
  const exceedingZones = useMemo(() => {
    return zoneAcousticData
      .filter(z => z.status === 'exceeds' || z.status === 'marginal')
      .sort((a, b) => b.ncDelta - a.ncDelta);
  }, [zoneAcousticData]);
  
  return {
    zones: zoneAcousticData,
    floorSummary,
    exceedingZones,
  };
}
