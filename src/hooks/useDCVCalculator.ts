import { useMemo } from 'react';
import { ASHRAE_62_1_SPACE_TYPES } from '@/lib/ashrae-62-1-data';

export interface DCVZoneConfig {
  zoneId: string;
  zoneName: string;
  designOccupancy: number;
  floorArea: number; // ft²
  spaceTypeId: string;
  co2SensorDeviceId?: string;
  occupancySensorDeviceId?: string;
  
  // DCV parameters
  outdoorCO2: number; // ppm (typically 400)
  targetCO2: number;  // ppm (typically 1000)
  maxCO2: number;     // ppm (typically 1200)
  minVentilationFraction: number; // 0.3-0.5 typical
}

export type CO2Status = 'low' | 'normal' | 'elevated' | 'high';
export type VentilationMode = 'minimum' | 'proportional' | 'maximum';

export interface DCVZoneResult {
  zoneId: string;
  zoneName: string;
  
  // Sensor readings
  currentCO2?: number;
  currentOccupancy?: number;
  
  // Estimated from CO2
  estimatedOccupancy: number;
  
  // Ventilation rates
  designVoz: number;      // CFM at design occupancy
  areaMinimumOA: number;  // Ra × Az (always required)
  peopleOA: number;       // Rp × Pz (variable)
  currentVoz: number;     // Current required OA
  
  // ASHRAE rates
  Rp: number; // CFM/person
  Ra: number; // CFM/ft²
  
  // Status
  ventilationMode: VentilationMode;
  co2Status: CO2Status;
  damperPosition: number; // 0-100%
  
  // Savings
  currentSavingsCfm: number;
  currentSavingsPercent: number;
}

export interface DCVSystemResult {
  zones: DCVZoneResult[];
  totalDesignOA: number;
  totalCurrentOA: number;
  totalAreaOA: number;
  totalPeopleOA: number;
  totalSavingsCfm: number;
  totalSavingsPercent: number;
  averageCO2: number;
  worstZone?: DCVZoneResult;
  lastUpdated: Date;
  sensorHealthy: boolean;
}

// CO2 generation rate per person (CFM CO2)
const CO2_GENERATION_RATE = 0.0084; // CFM CO2/person at sedentary activity

/**
 * Estimate occupancy from CO2 levels using mass balance
 * N = V × (Cs - Co) / (K × 10^6)
 */
function estimateOccupancyFromCO2(
  spaceCO2: number,
  outdoorCO2: number,
  ventilationCfm: number
): number {
  if (spaceCO2 <= outdoorCO2) return 0;
  const deltaCO2 = (spaceCO2 - outdoorCO2) / 1000000; // Convert ppm to fraction
  const occupancy = (ventilationCfm * deltaCO2) / CO2_GENERATION_RATE;
  return Math.max(0, Math.round(occupancy));
}

/**
 * Calculate CO2 status based on levels
 */
function getCO2Status(co2: number, outdoorCO2: number, targetCO2: number, maxCO2: number): CO2Status {
  if (co2 <= outdoorCO2 + 150) return 'low';
  if (co2 <= targetCO2) return 'normal';
  if (co2 <= maxCO2) return 'elevated';
  return 'high';
}

/**
 * Calculate ventilation mode
 */
function getVentilationMode(
  co2: number, 
  outdoorCO2: number, 
  targetCO2: number
): VentilationMode {
  if (co2 <= outdoorCO2 + 100) return 'minimum';
  if (co2 >= targetCO2) return 'maximum';
  return 'proportional';
}

export function useDCVCalculator() {
  const calculateDCVZone = useMemo(() => {
    return (
      config: DCVZoneConfig,
      currentCO2?: number,
      currentOccupancy?: number
    ): DCVZoneResult => {
      // Get ASHRAE rates for space type
      const spaceType = ASHRAE_62_1_SPACE_TYPES.find(s => s.id === config.spaceTypeId);
    const Rp = spaceType?.Rp || 5;
    const Ra = spaceType?.Ra || 0.06;
      
      // Area-based minimum (always required)
      const areaMinimumOA = Ra * config.floorArea;
      
      // Design people-based OA
      const designPeopleOA = Rp * config.designOccupancy;
      
      // Design Voz (100% occupancy)
      const designVoz = areaMinimumOA + designPeopleOA;
      
      // Current CO2 reading
      const effectiveCO2 = currentCO2 ?? config.targetCO2;
      
      // Estimate occupancy from CO2 if no occupancy sensor
      let estimatedOccupancy: number;
      if (currentOccupancy !== undefined) {
        estimatedOccupancy = currentOccupancy;
      } else if (currentCO2 !== undefined) {
        estimatedOccupancy = estimateOccupancyFromCO2(
          currentCO2,
          config.outdoorCO2,
          designVoz
        );
      } else {
        estimatedOccupancy = config.designOccupancy;
      }
      
      // Clamp to design occupancy
      estimatedOccupancy = Math.min(estimatedOccupancy, config.designOccupancy);
      
      // Calculate current ventilation requirement based on CO2
      const ventilationMode = getVentilationMode(effectiveCO2, config.outdoorCO2, config.targetCO2);
      
      let currentVoz: number;
      let peopleOA: number;
      
      switch (ventilationMode) {
        case 'minimum':
          // Only area-based + minimum fraction of people OA
          peopleOA = designPeopleOA * config.minVentilationFraction;
          currentVoz = areaMinimumOA + peopleOA;
          break;
          
        case 'proportional':
          // Proportional control between minimum and design
          const co2Ratio = (effectiveCO2 - config.outdoorCO2) / (config.targetCO2 - config.outdoorCO2);
          const clampedRatio = Math.min(1, Math.max(config.minVentilationFraction, co2Ratio));
          peopleOA = designPeopleOA * clampedRatio;
          currentVoz = areaMinimumOA + peopleOA;
          break;
          
        case 'maximum':
        default:
          // Full design ventilation
          peopleOA = designPeopleOA;
          currentVoz = designVoz;
          break;
      }
      
      // Ensure minimum ventilation
      const absoluteMinimum = areaMinimumOA + (designPeopleOA * config.minVentilationFraction);
      currentVoz = Math.max(currentVoz, absoluteMinimum);
      
      // Calculate damper position (0-100%)
      const damperPosition = Math.round((currentVoz / designVoz) * 100);
      
      // CO2 status
      const co2Status = getCO2Status(effectiveCO2, config.outdoorCO2, config.targetCO2, config.maxCO2);
      
      // Savings
      const currentSavingsCfm = Math.max(0, designVoz - currentVoz);
      const currentSavingsPercent = designVoz > 0 ? (currentSavingsCfm / designVoz) * 100 : 0;
      
      return {
        zoneId: config.zoneId,
        zoneName: config.zoneName,
        currentCO2,
        currentOccupancy,
        estimatedOccupancy,
        designVoz,
        areaMinimumOA,
        peopleOA,
        currentVoz,
        Rp,
        Ra,
        ventilationMode,
        co2Status,
        damperPosition,
        currentSavingsCfm,
        currentSavingsPercent,
      };
    };
  }, []);
  
  const calculateDCVSystem = useMemo(() => {
    return (
      zones: DCVZoneResult[],
      sensorHealthy: boolean = true
    ): DCVSystemResult => {
      const totalDesignOA = zones.reduce((sum, z) => sum + z.designVoz, 0);
      const totalCurrentOA = zones.reduce((sum, z) => sum + z.currentVoz, 0);
      const totalAreaOA = zones.reduce((sum, z) => sum + z.areaMinimumOA, 0);
      const totalPeopleOA = zones.reduce((sum, z) => sum + z.peopleOA, 0);
      
      const totalSavingsCfm = totalDesignOA - totalCurrentOA;
      const totalSavingsPercent = totalDesignOA > 0 ? (totalSavingsCfm / totalDesignOA) * 100 : 0;
      
      // Average CO2 (only zones with readings)
      const zonesWithCO2 = zones.filter(z => z.currentCO2 !== undefined);
      const averageCO2 = zonesWithCO2.length > 0
        ? zonesWithCO2.reduce((sum, z) => sum + (z.currentCO2 || 0), 0) / zonesWithCO2.length
        : 0;
      
      // Worst zone (highest CO2)
      const worstZone = zones.reduce<DCVZoneResult | undefined>((worst, z) => {
        if (!z.currentCO2) return worst;
        if (!worst || (z.currentCO2 > (worst.currentCO2 || 0))) return z;
        return worst;
      }, undefined);
      
      return {
        zones,
        totalDesignOA,
        totalCurrentOA,
        totalAreaOA,
        totalPeopleOA,
        totalSavingsCfm,
        totalSavingsPercent,
        averageCO2,
        worstZone,
        lastUpdated: new Date(),
        sensorHealthy,
      };
    };
  }, []);
  
  return {
    calculateDCVZone,
    calculateDCVSystem,
    estimateOccupancyFromCO2,
    getCO2Status,
  };
}

// Default DCV configuration values
export const DEFAULT_DCV_CONFIG = {
  outdoorCO2: 400,
  targetCO2: 1000,
  maxCO2: 1200,
  minVentilationFraction: 0.3,
};

// CO2 thresholds for display
export const CO2_THRESHOLDS = {
  excellent: 600,
  good: 800,
  acceptable: 1000,
  poor: 1200,
  unhealthy: 1500,
};
