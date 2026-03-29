import { useMemo, useState, useCallback } from 'react';
import { 
  ASHRAE_62_1_SPACE_TYPES, 
  getSpaceTypeById, 
  getZoneEffectiveness,
  SpaceVentilationRate 
} from '@/lib/ashrae-62-1-data';

// Types
export interface ZoneVentilationInput {
  id: string;
  name: string;
  spaceTypeId: string;
  floorArea: number; // ft²
  occupancy: number;
  useDefaultOccupancy: boolean;
  supplyLocation: 'ceiling' | 'floor';
  returnLocation: 'ceiling' | 'floor';
  operatingMode: 'heating' | 'cooling';
}

export interface ZoneVentilationResult {
  zoneId: string;
  zoneName: string;
  spaceType: SpaceVentilationRate;
  floorArea: number;
  occupancy: number;
  defaultOccupancy: number;
  Rp: number;
  Ra: number;
  peopleOutdoorAir: number; // Rp × Pz (CFM)
  areaOutdoorAir: number; // Ra × Az (CFM)
  Vbz: number; // Breathing zone OA (CFM)
  Ez: number; // Zone effectiveness
  Voz: number; // Zone outdoor airflow (CFM)
  cfmPerPerson: number;
  cfmPerSqft: number;
  supplyConfig: string;
  operatingMode: string;
}

export interface SystemVentilationResult {
  zones: ZoneVentilationResult[];
  totalFloorArea: number;
  totalOccupancy: number;
  totalVbz: number;
  totalVoz: number;
  uncorrectedVou: number;
  diversityFactor: number;
  systemEfficiency: number;
  systemOutdoorAir: number; // Vot (CFM)
  systemOutdoorAirPercent: number;
  outdoorAirMassFlow: number; // lb/hr at standard conditions
}

// Calculate zone ventilation per ASHRAE 62.1
export function calculateZoneVentilation(input: ZoneVentilationInput): ZoneVentilationResult | null {
  const spaceType = getSpaceTypeById(input.spaceTypeId);
  if (!spaceType) return null;

  const { Rp, Ra, occupancyDensity } = spaceType;
  
  // Calculate default occupancy from density
  const defaultOccupancy = Math.round((input.floorArea / 1000) * occupancyDensity);
  const occupancy = input.useDefaultOccupancy ? defaultOccupancy : input.occupancy;
  
  // ASHRAE 62.1 Equation 6.2.2.1: Vbz = Rp × Pz + Ra × Az
  const peopleOutdoorAir = Rp * occupancy;
  const areaOutdoorAir = Ra * input.floorArea;
  const Vbz = peopleOutdoorAir + areaOutdoorAir;
  
  // Get zone effectiveness from Table 6.2.2.2
  const Ez = getZoneEffectiveness(input.supplyLocation, input.returnLocation, input.operatingMode);
  
  // Zone outdoor airflow: Voz = Vbz / Ez
  const Voz = Vbz / Ez;
  
  // Calculate effective rates
  const cfmPerPerson = occupancy > 0 ? Voz / occupancy : 0;
  const cfmPerSqft = input.floorArea > 0 ? Voz / input.floorArea : 0;
  
  const supplyConfig = `${input.supplyLocation}/${input.returnLocation}`;

  return {
    zoneId: input.id,
    zoneName: input.name,
    spaceType,
    floorArea: input.floorArea,
    occupancy,
    defaultOccupancy,
    Rp,
    Ra,
    peopleOutdoorAir,
    areaOutdoorAir,
    Vbz,
    Ez,
    Voz,
    cfmPerPerson,
    cfmPerSqft,
    supplyConfig,
    operatingMode: input.operatingMode,
  };
}

// Calculate system-level ventilation for multiple zones
export function calculateSystemVentilation(
  zones: ZoneVentilationResult[],
  diversityFactor: number = 0.85,
  supplyAirCfm?: number
): SystemVentilationResult {
  if (zones.length === 0) {
    return {
      zones: [],
      totalFloorArea: 0,
      totalOccupancy: 0,
      totalVbz: 0,
      totalVoz: 0,
      uncorrectedVou: 0,
      diversityFactor,
      systemEfficiency: 1.0,
      systemOutdoorAir: 0,
      systemOutdoorAirPercent: 0,
      outdoorAirMassFlow: 0,
    };
  }

  const totalFloorArea = zones.reduce((sum, z) => sum + z.floorArea, 0);
  const totalOccupancy = zones.reduce((sum, z) => sum + z.occupancy, 0);
  const totalVbz = zones.reduce((sum, z) => sum + z.Vbz, 0);
  const totalVoz = zones.reduce((sum, z) => sum + z.Voz, 0);
  
  // Apply diversity factor
  const uncorrectedVou = totalVoz * diversityFactor;
  
  // Calculate system ventilation efficiency (simplified - single zone or average)
  // For multi-zone VAV systems, this would use more complex calculations per Section 6.2.5
  let systemEfficiency = 1.0;
  
  if (zones.length > 1) {
    // Simplified estimation for multi-zone
    // Ev typically ranges from 0.65 to 1.0
    const avgEz = zones.reduce((sum, z) => sum + z.Ez, 0) / zones.length;
    // Estimate based on zone diversity
    systemEfficiency = Math.min(1.0, Math.max(0.65, avgEz * 0.9));
  }
  
  // System outdoor air: Vot = Vou / Ev
  const systemOutdoorAir = uncorrectedVou / systemEfficiency;
  
  // Calculate percentage if supply air is provided
  const systemOutdoorAirPercent = supplyAirCfm ? (systemOutdoorAir / supplyAirCfm) * 100 : 0;
  
  // Mass flow at standard conditions (0.075 lb/ft³ × 60 min/hr)
  const outdoorAirMassFlow = systemOutdoorAir * 0.075 * 60;

  return {
    zones,
    totalFloorArea,
    totalOccupancy,
    totalVbz,
    totalVoz,
    uncorrectedVou,
    diversityFactor,
    systemEfficiency,
    systemOutdoorAir,
    systemOutdoorAirPercent,
    outdoorAirMassFlow,
  };
}

// Calculate ventilation load contribution (BTU/h)
export function calculateVentilationLoad(
  cfm: number,
  outdoorTempF: number,
  indoorTempF: number,
  outdoorHumidityRatio?: number, // lb water/lb air
  indoorHumidityRatio?: number
): { sensible: number; latent: number; total: number } {
  // Sensible heat: Q = 1.08 × CFM × ΔT
  const sensible = 1.08 * cfm * Math.abs(outdoorTempF - indoorTempF);
  
  // Latent heat (if humidity data provided): Q = 4840 × CFM × Δω
  let latent = 0;
  if (outdoorHumidityRatio !== undefined && indoorHumidityRatio !== undefined) {
    latent = 4840 * cfm * Math.abs(outdoorHumidityRatio - indoorHumidityRatio);
  }
  
  return {
    sensible,
    latent,
    total: sensible + latent,
  };
}

// Hook for managing ventilation calculations
export function useVentilationCalculator() {
  const [zones, setZones] = useState<ZoneVentilationInput[]>([]);
  const [diversityFactor, setDiversityFactor] = useState(0.85);
  const [supplyAirCfm, setSupplyAirCfm] = useState<number | undefined>();

  // Create a new empty zone
  const createEmptyZone = useCallback((): ZoneVentilationInput => ({
    id: crypto.randomUUID(),
    name: `Zone ${zones.length + 1}`,
    spaceTypeId: 'office_space',
    floorArea: 1000,
    occupancy: 5,
    useDefaultOccupancy: true,
    supplyLocation: 'ceiling',
    returnLocation: 'ceiling',
    operatingMode: 'cooling',
  }), [zones.length]);

  // Add a zone
  const addZone = useCallback((zone?: Partial<ZoneVentilationInput>) => {
    const newZone = { ...createEmptyZone(), ...zone };
    setZones(prev => [...prev, newZone]);
    return newZone.id;
  }, [createEmptyZone]);

  // Update a zone
  const updateZone = useCallback((id: string, updates: Partial<ZoneVentilationInput>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  }, []);

  // Remove a zone
  const removeZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  }, []);

  // Clear all zones
  const clearZones = useCallback(() => {
    setZones([]);
  }, []);

  // Calculate results for all zones
  const zoneResults = useMemo(() => {
    return zones
      .map(calculateZoneVentilation)
      .filter((r): r is ZoneVentilationResult => r !== null);
  }, [zones]);

  // Calculate system-level results
  const systemResult = useMemo(() => {
    return calculateSystemVentilation(zoneResults, diversityFactor, supplyAirCfm);
  }, [zoneResults, diversityFactor, supplyAirCfm]);

  // Get all available space types
  const spaceTypes = useMemo(() => ASHRAE_62_1_SPACE_TYPES, []);

  return {
    zones,
    setZones,
    addZone,
    updateZone,
    removeZone,
    clearZones,
    createEmptyZone,
    diversityFactor,
    setDiversityFactor,
    supplyAirCfm,
    setSupplyAirCfm,
    zoneResults,
    systemResult,
    spaceTypes,
    calculateZoneVentilation,
    calculateSystemVentilation,
    calculateVentilationLoad,
  };
}
