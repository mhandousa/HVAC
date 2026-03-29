import { useMemo } from 'react';
import { useEquipmentCatalog } from './useEquipmentCatalog';
import { ERVType, ERV_TYPES } from './useERVSizing';
import { ClimateZone } from '@/lib/saudi-weather-bins';

export interface ERVMatchCriteria {
  airflowCfm: number;
  sensibleEfficiencyMin: number;
  latentEfficiencyMin?: number;
  ervType: ERVType;
  climateZone: ClimateZone;
  maxPressureDrop?: number;    // in. W.G.
  budgetSAR?: number;
}

export interface ERVEquipmentMatch {
  id: string;
  manufacturer: string;
  modelNumber: string;
  airflowCfm: number;
  sensibleEfficiency: number;
  latentEfficiency: number;
  pressureDrop: number;
  priceSAR: number;
  matchScore: number;          // 0-100
  airflowMatch: 'exact' | 'oversized' | 'undersized';
  efficiencyMatch: 'meets' | 'exceeds' | 'below';
  estimatedAnnualSavings: number;
  paybackYears: number;
  recommendation: 'best_value' | 'best_performance' | 'budget' | 'premium' | 'standard';
  sasoApproved: boolean;
  specs: {
    powerKw: number;
    weightKg: number;
    dimensions: string;
  };
}

// Sample ERV equipment data (would come from equipment_catalog table)
const ERV_CATALOG_DATA = [
  // Carrier
  { id: 'carrier-erv-500', manufacturer: 'Carrier', model: 'ERV-500', cfm: 500, sensible: 75, latent: 65, pressureDrop: 0.6, price: 18000, power: 0.6, weight: 45, saso: true },
  { id: 'carrier-erv-1000', manufacturer: 'Carrier', model: 'ERV-1000', cfm: 1000, sensible: 78, latent: 68, pressureDrop: 0.7, price: 28000, power: 1.0, weight: 72, saso: true },
  { id: 'carrier-erv-1500', manufacturer: 'Carrier', model: 'ERV-1500', cfm: 1500, sensible: 78, latent: 68, pressureDrop: 0.8, price: 38000, power: 1.5, weight: 98, saso: true },
  { id: 'carrier-erv-2000', manufacturer: 'Carrier', model: 'ERV-2000', cfm: 2000, sensible: 76, latent: 66, pressureDrop: 0.9, price: 48000, power: 2.0, weight: 125, saso: true },
  
  // Daikin
  { id: 'daikin-vam-500', manufacturer: 'Daikin', model: 'VAM-500HM', cfm: 500, sensible: 80, latent: 70, pressureDrop: 0.5, price: 22000, power: 0.5, weight: 42, saso: true },
  { id: 'daikin-vam-1000', manufacturer: 'Daikin', model: 'VAM-1000HM', cfm: 1000, sensible: 82, latent: 72, pressureDrop: 0.6, price: 35000, power: 0.9, weight: 68, saso: true },
  { id: 'daikin-vam-1500', manufacturer: 'Daikin', model: 'VAM-1500HM', cfm: 1500, sensible: 82, latent: 72, pressureDrop: 0.7, price: 52000, power: 1.4, weight: 95, saso: true },
  { id: 'daikin-vam-2000', manufacturer: 'Daikin', model: 'VAM-2000HM', cfm: 2000, sensible: 80, latent: 70, pressureDrop: 0.8, price: 68000, power: 1.8, weight: 120, saso: true },
  
  // Mitsubishi
  { id: 'mits-lghr-500', manufacturer: 'Mitsubishi', model: 'LGH-50RVX', cfm: 500, sensible: 77, latent: 67, pressureDrop: 0.55, price: 20000, power: 0.55, weight: 40, saso: true },
  { id: 'mits-lghr-1000', manufacturer: 'Mitsubishi', model: 'LGH-100RVX', cfm: 1000, sensible: 79, latent: 69, pressureDrop: 0.6, price: 32000, power: 0.95, weight: 65, saso: true },
  { id: 'mits-lghr-1500', manufacturer: 'Mitsubishi', model: 'LGH-150RVX', cfm: 1500, sensible: 79, latent: 69, pressureDrop: 0.65, price: 45000, power: 1.3, weight: 88, saso: true },
  { id: 'mits-lghr-2000', manufacturer: 'Mitsubishi', model: 'LGH-200RVX', cfm: 2000, sensible: 78, latent: 68, pressureDrop: 0.7, price: 58000, power: 1.7, weight: 115, saso: true },
  
  // LG
  { id: 'lg-erv-500', manufacturer: 'LG', model: 'LZ-H050GBA2', cfm: 500, sensible: 74, latent: 64, pressureDrop: 0.5, price: 16000, power: 0.5, weight: 38, saso: true },
  { id: 'lg-erv-1000', manufacturer: 'LG', model: 'LZ-H100GBA2', cfm: 1000, sensible: 76, latent: 66, pressureDrop: 0.55, price: 25000, power: 0.85, weight: 60, saso: true },
  { id: 'lg-erv-1500', manufacturer: 'LG', model: 'LZ-H150GBA2', cfm: 1500, sensible: 76, latent: 66, pressureDrop: 0.6, price: 35000, power: 1.2, weight: 82, saso: true },
  { id: 'lg-erv-2000', manufacturer: 'LG', model: 'LZ-H200GBA2', cfm: 2000, sensible: 75, latent: 65, pressureDrop: 0.65, price: 45000, power: 1.5, weight: 105, saso: true },
  
  // York (Sensible only - HRV)
  { id: 'york-hrv-500', manufacturer: 'York', model: 'HRV-500S', cfm: 500, sensible: 70, latent: 0, pressureDrop: 0.4, price: 12000, power: 0.4, weight: 35, saso: true },
  { id: 'york-hrv-1000', manufacturer: 'York', model: 'HRV-1000S', cfm: 1000, sensible: 72, latent: 0, pressureDrop: 0.45, price: 18000, power: 0.7, weight: 55, saso: true },
  { id: 'york-hrv-1500', manufacturer: 'York', model: 'HRV-1500S', cfm: 1500, sensible: 72, latent: 0, pressureDrop: 0.5, price: 25000, power: 1.0, weight: 75, saso: true },
  { id: 'york-hrv-2000', manufacturer: 'York', model: 'HRV-2000S', cfm: 2000, sensible: 70, latent: 0, pressureDrop: 0.55, price: 32000, power: 1.3, weight: 95, saso: true },
];

/**
 * Calculate estimated annual savings based on equipment specs and climate
 */
function calculateAnnualSavings(
  airflowCfm: number,
  sensibleEff: number,
  latentEff: number,
  climateZone: ClimateZone
): number {
  // Simplified calculation based on typical operating conditions
  const coolingHours = climateZone === 'hot_humid' ? 5000 : climateZone === 'hot_dry' ? 4500 : 2500;
  const avgDeltaT = climateZone === 'moderate' ? 8 : 20; // °F
  const avgDeltaW = climateZone === 'hot_humid' ? 0.008 : climateZone === 'hot_dry' ? 0.002 : 0.004; // lb/lb
  
  // Sensible recovery: BTU/h × hours / (3412 × COP)
  const sensibleRecovery = (sensibleEff / 100) * 1.08 * airflowCfm * avgDeltaT;
  const latentRecovery = (latentEff / 100) * 4840 * airflowCfm * avgDeltaW;
  
  const totalRecovery = sensibleRecovery + latentRecovery;
  const kwhSaved = (totalRecovery * coolingHours) / (3412 * 3.5); // COP = 3.5
  
  const electricityRate = 0.18; // SAR/kWh
  return Math.round(kwhSaved * electricityRate);
}

/**
 * Hook to match ERV sizing requirements with equipment catalog
 */
export function useERVEquipmentMatch(criteria?: ERVMatchCriteria) {
  const { data: catalogEquipment } = useEquipmentCatalog();
  
  const matches = useMemo((): ERVEquipmentMatch[] => {
    if (!criteria) return [];
    
    const {
      airflowCfm,
      sensibleEfficiencyMin,
      latentEfficiencyMin = 0,
      climateZone,
      maxPressureDrop = 1.0,
      budgetSAR,
    } = criteria;
    
    // Filter and score equipment
    const scored = ERV_CATALOG_DATA
      .filter(eq => {
        // Filter by airflow (allow 80-150% of required)
        if (eq.cfm < airflowCfm * 0.8 || eq.cfm > airflowCfm * 1.5) return false;
        
        // Filter by pressure drop
        if (eq.pressureDrop > maxPressureDrop) return false;
        
        // Filter by budget if specified
        if (budgetSAR && eq.price > budgetSAR * 1.2) return false;
        
        // For humid climates, require latent recovery
        if (climateZone === 'hot_humid' && eq.latent === 0) return false;
        
        return true;
      })
      .map(eq => {
        // Calculate match score (0-100)
        let score = 50; // Base score
        
        // Airflow match bonus
        const airflowRatio = eq.cfm / airflowCfm;
        if (airflowRatio >= 0.95 && airflowRatio <= 1.1) {
          score += 20; // Perfect match
        } else if (airflowRatio >= 0.9 && airflowRatio <= 1.2) {
          score += 10; // Good match
        }
        
        // Efficiency bonus
        if (eq.sensible >= sensibleEfficiencyMin + 5) score += 15;
        else if (eq.sensible >= sensibleEfficiencyMin) score += 10;
        
        if (latentEfficiencyMin > 0 && eq.latent >= latentEfficiencyMin + 5) score += 15;
        else if (latentEfficiencyMin > 0 && eq.latent >= latentEfficiencyMin) score += 10;
        
        // Lower pressure drop is better
        if (eq.pressureDrop <= 0.5) score += 5;
        
        // Premium brands bonus
        if (['Daikin', 'Mitsubishi'].includes(eq.manufacturer)) score += 5;
        
        // Determine airflow match type
        let airflowMatch: 'exact' | 'oversized' | 'undersized';
        if (airflowRatio >= 0.95 && airflowRatio <= 1.05) airflowMatch = 'exact';
        else if (airflowRatio > 1.05) airflowMatch = 'oversized';
        else airflowMatch = 'undersized';
        
        // Determine efficiency match
        let efficiencyMatch: 'meets' | 'exceeds' | 'below';
        if (eq.sensible >= sensibleEfficiencyMin + 5) efficiencyMatch = 'exceeds';
        else if (eq.sensible >= sensibleEfficiencyMin) efficiencyMatch = 'meets';
        else efficiencyMatch = 'below';
        
        // Calculate savings and payback
        const annualSavings = calculateAnnualSavings(eq.cfm, eq.sensible, eq.latent, climateZone);
        const installationCost = eq.price * 0.25; // 25% installation
        const totalInvestment = eq.price + installationCost;
        const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : 99;
        
        return {
          id: eq.id,
          manufacturer: eq.manufacturer,
          modelNumber: eq.model,
          airflowCfm: eq.cfm,
          sensibleEfficiency: eq.sensible,
          latentEfficiency: eq.latent,
          pressureDrop: eq.pressureDrop,
          priceSAR: eq.price,
          matchScore: Math.min(100, Math.round(score)),
          airflowMatch,
          efficiencyMatch,
          estimatedAnnualSavings: annualSavings,
          paybackYears: Math.round(paybackYears * 10) / 10,
          recommendation: 'standard' as const,
          sasoApproved: eq.saso,
          specs: {
            powerKw: eq.power,
            weightKg: eq.weight,
            dimensions: `${Math.round(eq.weight * 8)}×${Math.round(eq.weight * 5)}×${Math.round(eq.weight * 4)} mm`,
          },
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    
    // Assign recommendations
    if (scored.length > 0) {
      // Best value: good score with reasonable payback
      const bestValue = [...scored].sort((a, b) => a.paybackYears - b.paybackYears)[0];
      if (bestValue) (bestValue as { recommendation: string }).recommendation = 'best_value';
      
      // Best performance: highest efficiency
      const bestPerformance = [...scored].sort((a, b) => 
        (b.sensibleEfficiency + b.latentEfficiency) - (a.sensibleEfficiency + a.latentEfficiency)
      )[0];
      if (bestPerformance && bestPerformance.id !== bestValue?.id) {
        (bestPerformance as { recommendation: string }).recommendation = 'best_performance';
      }
      
      // Budget: lowest price
      const budget = [...scored].sort((a, b) => a.priceSAR - b.priceSAR)[0];
      if (budget && budget.id !== bestValue?.id && budget.id !== bestPerformance?.id) {
        (budget as { recommendation: string }).recommendation = 'budget';
      }
      
      // Premium: highest price with best efficiency
      const premium = [...scored].sort((a, b) => b.priceSAR - a.priceSAR)[0];
      if (premium && premium.id !== bestValue?.id && premium.id !== bestPerformance?.id && premium.id !== budget?.id) {
        (premium as { recommendation: string }).recommendation = 'premium';
      }
    }
    
    return scored;
  }, [criteria, catalogEquipment]);
  
  const bestValue = useMemo(() => 
    matches.find(m => m.recommendation === 'best_value') || null,
    [matches]
  );
  
  const bestPerformance = useMemo(() =>
    matches.find(m => m.recommendation === 'best_performance') || null,
    [matches]
  );
  
  return {
    matches,
    bestValue,
    bestPerformance,
    totalMatches: matches.length,
  };
}
