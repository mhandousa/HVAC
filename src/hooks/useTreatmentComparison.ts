import { useMemo } from 'react';
import { 
  MANUFACTURER_SILENCER_CATALOG, 
  ManufacturerSilencer,
  OctaveBandData 
} from '@/lib/manufacturer-silencer-catalog';

export interface TreatmentComparisonFilters {
  ductSizeIn: number;
  minAttenuation: number;
  maxPressureDropIn: number;
  maxCostSAR?: number;
  manufacturers?: string[];
  silencerType?: 'round' | 'rectangular' | 'all';
}

export type BadgeType = 'best-value' | 'best-performance' | 'lowest-pressure' | 'quietest';

export interface RankedSilencer {
  silencer: ManufacturerSilencer;
  estimatedCostSAR: number;
  efficiency: number;           // dB per 1000 SAR
  meetsRequirements: boolean;
  rank: number;
  badges: BadgeType[];
  score: number;
}

export interface ChartDataPoint {
  id: string;
  cost: number;
  attenuation: number;
  label: string;
  manufacturer: string;
  meetsRequirements: boolean;
}

const COST_MAPPING: Record<string, number> = {
  '$': 1200,
  '$$': 2000,
  '$$$': 3200,
  '$$$$': 4800,
};

/**
 * Estimate cost in SAR from silencer cost tier
 */
export function estimateSilencerCost(silencer: ManufacturerSilencer): number {
  const baseCost = COST_MAPPING[silencer.estimatedCost] || 2000;
  
  // Adjust for size
  const sizeMultiplier = silencer.type === 'round' 
    ? (silencer.dimensions.diameterIn || 12) / 12
    : ((silencer.dimensions.heightIn || 12) * (silencer.dimensions.widthIn || 12)) / 144;
  
  // Adjust for length
  const lengthMultiplier = (silencer.dimensions.lengthIn || 36) / 36;
  
  return Math.round(baseCost * Math.sqrt(sizeMultiplier) * lengthMultiplier);
}

/**
 * Check if silencer matches size requirements
 */
function matchesSize(silencer: ManufacturerSilencer, ductSizeIn: number): boolean {
  return ductSizeIn >= silencer.sizeRange.minIn && ductSizeIn <= silencer.sizeRange.maxIn;
}

/**
 * Hook for filtering, scoring, and ranking silencer treatments
 */
export function useTreatmentComparison(filters: TreatmentComparisonFilters): {
  silencers: RankedSilencer[];
  bestValue: RankedSilencer | null;
  bestPerformance: RankedSilencer | null;
  lowestPressure: RankedSilencer | null;
  quietest: RankedSilencer | null;
  chartData: ChartDataPoint[];
  totalMatching: number;
} {
  return useMemo(() => {
    // Filter silencers by size and type
    let filtered = MANUFACTURER_SILENCER_CATALOG.filter(s => {
      if (!matchesSize(s, filters.ductSizeIn)) return false;
      if (filters.silencerType && filters.silencerType !== 'all' && s.type !== filters.silencerType) return false;
      if (filters.manufacturers?.length && !filters.manufacturers.includes(s.manufacturer)) return false;
      return true;
    });
    
    // Calculate costs and rank
    const ranked: RankedSilencer[] = filtered.map(silencer => {
      const estimatedCostSAR = estimateSilencerCost(silencer);
      const meetsAttenuation = silencer.insertionLoss.overall >= filters.minAttenuation;
      const meetsPressure = silencer.pressureDropIn <= filters.maxPressureDropIn;
      const meetsCost = !filters.maxCostSAR || estimatedCostSAR <= filters.maxCostSAR;
      const meetsRequirements = meetsAttenuation && meetsPressure && meetsCost;
      
      // Efficiency: dB per 1000 SAR (higher is better)
      const efficiency = estimatedCostSAR > 0 
        ? (silencer.insertionLoss.overall / estimatedCostSAR) * 1000 
        : 0;
      
      // Score: weighted combination
      let score = 0;
      if (meetsRequirements) {
        score += 100;
        score += efficiency * 5;
        score -= silencer.pressureDropIn * 20;
        score -= silencer.selfNoiseNC * 0.5;
      } else {
        score -= 50;
        if (!meetsAttenuation) score -= (filters.minAttenuation - silencer.insertionLoss.overall) * 5;
        if (!meetsPressure) score -= (silencer.pressureDropIn - filters.maxPressureDropIn) * 50;
      }
      
      return {
        silencer,
        estimatedCostSAR,
        efficiency: Math.round(efficiency * 10) / 10,
        meetsRequirements,
        rank: 0,
        badges: [] as BadgeType[],
        score,
      };
    });
    
    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    ranked.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    // Find best in categories (among those meeting requirements)
    const meetingReqs = ranked.filter(r => r.meetsRequirements);
    
    let bestValue: RankedSilencer | null = null;
    let bestPerformance: RankedSilencer | null = null;
    let lowestPressure: RankedSilencer | null = null;
    let quietest: RankedSilencer | null = null;
    
    if (meetingReqs.length > 0) {
      // Best value: highest efficiency
      bestValue = meetingReqs.reduce((best, curr) => 
        curr.efficiency > best.efficiency ? curr : best
      );
      bestValue.badges.push('best-value');
      
      // Best performance: highest attenuation
      bestPerformance = meetingReqs.reduce((best, curr) => 
        curr.silencer.insertionLoss.overall > best.silencer.insertionLoss.overall ? curr : best
      );
      if (bestPerformance !== bestValue) {
        bestPerformance.badges.push('best-performance');
      }
      
      // Lowest pressure
      lowestPressure = meetingReqs.reduce((best, curr) => 
        curr.silencer.pressureDropIn < best.silencer.pressureDropIn ? curr : best
      );
      if (lowestPressure !== bestValue && lowestPressure !== bestPerformance) {
        lowestPressure.badges.push('lowest-pressure');
      }
      
      // Quietest
      quietest = meetingReqs.reduce((best, curr) => 
        curr.silencer.selfNoiseNC < best.silencer.selfNoiseNC ? curr : best
      );
      if (quietest !== bestValue && quietest !== bestPerformance && quietest !== lowestPressure) {
        quietest.badges.push('quietest');
      }
    }
    
    // Generate chart data
    const chartData: ChartDataPoint[] = ranked.map(r => ({
      id: r.silencer.id,
      cost: r.estimatedCostSAR,
      attenuation: r.silencer.insertionLoss.overall,
      label: r.silencer.model,
      manufacturer: r.silencer.manufacturer,
      meetsRequirements: r.meetsRequirements,
    }));
    
    return {
      silencers: ranked,
      bestValue,
      bestPerformance,
      lowestPressure,
      quietest,
      chartData,
      totalMatching: meetingReqs.length,
    };
  }, [filters]);
}

/**
 * Get octave band data for multiple silencers for comparison
 */
export function getOctaveBandComparisonData(silencers: ManufacturerSilencer[]): {
  frequency: string;
  [key: string]: number | string;
}[] {
  const frequencies = ['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'] as const;
  
  return frequencies.map(freq => {
    const dataPoint: { frequency: string; [key: string]: number | string } = { frequency: freq };
    silencers.forEach(s => {
      dataPoint[s.model] = s.insertionLoss.octaveBands[freq];
    });
    return dataPoint;
  });
}
