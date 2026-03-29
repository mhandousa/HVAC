import { useMemo } from 'react';
import {
  calculateAirProperties,
  celsiusToFahrenheit,
  AirProperties,
} from '@/lib/psychrometric-utils';
import { getCityWeatherProfile, ClimateZone } from '@/lib/saudi-weather-bins';

export type ERVType = 'plate_sensible' | 'plate_enthalpy' | 'enthalpy_wheel' | 'heat_pipe' | 'run_around';

export interface ERVTypeConfig {
  id: ERVType;
  name: string;
  nameAr: string;
  sensibleEfficiency: { min: number; max: number; typical: number };
  latentEfficiency: { min: number; max: number; typical: number };
  pressureDrop: { min: number; max: number }; // in. W.G.
  hasLatentRecovery: boolean;
  description: string;
}

export const ERV_TYPES: ERVTypeConfig[] = [
  {
    id: 'plate_sensible',
    name: 'Plate Heat Exchanger (Sensible)',
    nameAr: 'مبادل حراري صفائحي (محسوس)',
    sensibleEfficiency: { min: 55, max: 70, typical: 65 },
    latentEfficiency: { min: 0, max: 0, typical: 0 },
    pressureDrop: { min: 0.3, max: 0.8 },
    hasLatentRecovery: false,
    description: 'Cross-flow plate exchanger, sensible heat only',
  },
  {
    id: 'plate_enthalpy',
    name: 'Plate Heat Exchanger (Enthalpy)',
    nameAr: 'مبادل حراري صفائحي (إنثالبي)',
    sensibleEfficiency: { min: 65, max: 80, typical: 72 },
    latentEfficiency: { min: 50, max: 70, typical: 60 },
    pressureDrop: { min: 0.4, max: 1.0 },
    hasLatentRecovery: true,
    description: 'Membrane plate exchanger with moisture transfer',
  },
  {
    id: 'enthalpy_wheel',
    name: 'Enthalpy Wheel (Rotary)',
    nameAr: 'عجلة إنثالبي دوارة',
    sensibleEfficiency: { min: 70, max: 85, typical: 78 },
    latentEfficiency: { min: 60, max: 75, typical: 68 },
    pressureDrop: { min: 0.5, max: 1.2 },
    hasLatentRecovery: true,
    description: 'Rotary heat exchanger with desiccant coating',
  },
  {
    id: 'heat_pipe',
    name: 'Heat Pipe',
    nameAr: 'أنبوب حراري',
    sensibleEfficiency: { min: 50, max: 65, typical: 58 },
    latentEfficiency: { min: 0, max: 0, typical: 0 },
    pressureDrop: { min: 0.2, max: 0.5 },
    hasLatentRecovery: false,
    description: 'Passive heat transfer, low maintenance',
  },
  {
    id: 'run_around',
    name: 'Run-Around Coil',
    nameAr: 'ملف دائري',
    sensibleEfficiency: { min: 45, max: 60, typical: 52 },
    latentEfficiency: { min: 0, max: 0, typical: 0 },
    pressureDrop: { min: 0.3, max: 0.6 },
    hasLatentRecovery: false,
    description: 'Separate airstreams, glycol loop',
  },
];

export interface ERVInput {
  outdoorAirCfm: number;
  outdoorConditions: {
    dryBulbF: number;
    rhPercent: number;
  };
  indoorConditions: {
    dryBulbF: number;
    rhPercent: number;
  };
  ervType: ERVType;
  sensibleEfficiency: number; // 0-100%
  latentEfficiency: number;   // 0-100%
  altitudeFt: number;
  // Economics
  operatingHoursPerYear: number;
  electricityRateSAR: number;
  coolingCOP: number;
  heatingCOP: number;
}

export interface ERVResult {
  // Air states
  outdoorAir: AirProperties;
  supplyAir: AirProperties;
  returnAir: AirProperties;
  exhaustAir: AirProperties;
  
  // Heat recovery (BTU/h)
  sensibleRecovery: number;
  latentRecovery: number;
  totalRecovery: number;
  
  // Ventilation loads
  ventilationLoadWithoutERV: {
    sensible: number;
    latent: number;
    total: number;
  };
  ventilationLoadWithERV: {
    sensible: number;
    latent: number;
    total: number;
  };
  
  // Load reduction
  loadReduction: {
    sensible: number;
    latent: number;
    total: number;
    percentSensible: number;
    percentLatent: number;
    percentTotal: number;
  };
  
  // Annual savings
  annualEnergySavings: {
    coolingKWh: number;
    heatingKWh: number;
    totalKWh: number;
  };
  annualCostSavings: number;
  
  // Sizing
  recommendedAirflow: number;
  faceVelocity: number;
  estimatedPressureDrop: number;
  
  // Mode
  mode: 'cooling' | 'heating';
  isRecoveryBeneficial: boolean;
}

// Annual Simulation Types
export interface AnnualSimulationInput {
  cityId: string;
  outdoorAirCfm: number;
  ervType: ERVType;
  sensibleEfficiency: number;
  latentEfficiency: number;
  indoorDesignTempF: number;
  indoorDesignRH: number;
  electricityRateSAR: number;
  coolingCOP: number;
  heatingCOP: number;
  ervPurchaseCostSAR: number;
  installationCostSAR: number;
  maintenanceCostPerYear: number;
  discountRate: number; // percentage
}

export interface MonthlyBreakdown {
  month: string;
  coolingRecoveryKWh: number;
  heatingRecoveryKWh: number;
  totalSavingsKWh: number;
  costSavingsSAR: number;
  avgOutdoorTempC: number;
  operatingHours: number;
}

export interface AnnualSimulationResult {
  monthlyBreakdown: MonthlyBreakdown[];
  annualSummary: {
    totalCoolingRecoveryKWh: number;
    totalHeatingRecoveryKWh: number;
    totalEnergySavingsKWh: number;
    totalCostSavingsSAR: number;
    peakLoadReductionTons: number;
    carbonReductionKg: number;
  };
  economics: {
    totalInvestmentSAR: number;
    simplePaybackYears: number;
    npv10Year: number;
    irr: number;
    roiPercent: number;
  };
  sensitivityAnalysis: {
    paybackAt75Efficiency: number;
    paybackAt85Efficiency: number;
    paybackIfRatesIncrease20: number;
  };
}

// Month names for display
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Monthly hour distribution (approximate hours per month)
const MONTHLY_HOURS = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744];

export function useERVSizing() {
  const calculateERV = useMemo(() => {
    return (input: ERVInput): ERVResult => {
      const {
        outdoorAirCfm,
        outdoorConditions,
        indoorConditions,
        sensibleEfficiency,
        latentEfficiency,
        altitudeFt,
        operatingHoursPerYear,
        electricityRateSAR,
        coolingCOP,
        heatingCOP,
      } = input;
      
      // Calculate air properties
      const outdoorAir = calculateAirProperties(
        outdoorConditions.dryBulbF,
        outdoorConditions.rhPercent,
        altitudeFt
      );
      
      const returnAir = calculateAirProperties(
        indoorConditions.dryBulbF,
        indoorConditions.rhPercent,
        altitudeFt
      );
      
      // Determine mode
      const mode: 'cooling' | 'heating' = outdoorAir.dryBulb > returnAir.dryBulb ? 'cooling' : 'heating';
      
      // Temperature and humidity differences
      const deltaT = Math.abs(outdoorAir.dryBulb - returnAir.dryBulb);
      const deltaW = Math.abs(outdoorAir.humidityRatio - returnAir.humidityRatio);
      const deltaH = Math.abs(outdoorAir.enthalpy - returnAir.enthalpy);
      
      // Sensible heat recovery: Qs = ηs × 1.08 × CFM × ΔT
      const sensibleRecovery = (sensibleEfficiency / 100) * 1.08 * outdoorAirCfm * deltaT;
      
      // Latent heat recovery: Ql = ηl × 4840 × CFM × Δω
      const latentRecovery = (latentEfficiency / 100) * 4840 * outdoorAirCfm * deltaW;
      
      // Total recovery
      const totalRecovery = sensibleRecovery + latentRecovery;
      
      // Calculate supply air conditions after ERV
      let supplyDryBulb: number;
      let supplyHumidityRatio: number;
      
      if (mode === 'cooling') {
        // In cooling, outdoor is hotter - ERV pre-cools supply air
        supplyDryBulb = outdoorAir.dryBulb - (sensibleEfficiency / 100) * (outdoorAir.dryBulb - returnAir.dryBulb);
        supplyHumidityRatio = outdoorAir.humidityRatio - (latentEfficiency / 100) * (outdoorAir.humidityRatio - returnAir.humidityRatio);
      } else {
        // In heating, outdoor is colder - ERV pre-heats supply air
        supplyDryBulb = outdoorAir.dryBulb + (sensibleEfficiency / 100) * (returnAir.dryBulb - outdoorAir.dryBulb);
        supplyHumidityRatio = outdoorAir.humidityRatio + (latentEfficiency / 100) * (returnAir.humidityRatio - outdoorAir.humidityRatio);
      }
      
      // Calculate supply air RH from humidity ratio (approximate)
      const supplyRH = Math.min(100, Math.max(5, 
        (supplyHumidityRatio / outdoorAir.humidityRatio) * outdoorAir.rh * 
        (outdoorAir.dryBulb / supplyDryBulb)
      ));
      
      const supplyAir = calculateAirProperties(supplyDryBulb, supplyRH, altitudeFt);
      
      // Calculate exhaust air conditions
      let exhaustDryBulb: number;
      let exhaustRH: number;
      
      if (mode === 'cooling') {
        exhaustDryBulb = returnAir.dryBulb + (sensibleEfficiency / 100) * (outdoorAir.dryBulb - returnAir.dryBulb);
      } else {
        exhaustDryBulb = returnAir.dryBulb - (sensibleEfficiency / 100) * (returnAir.dryBulb - outdoorAir.dryBulb);
      }
      exhaustRH = Math.min(95, Math.max(10, returnAir.rh));
      
      const exhaustAir = calculateAirProperties(exhaustDryBulb, exhaustRH, altitudeFt);
      
      // Ventilation loads without ERV
      const sensibleLoadWithout = 1.08 * outdoorAirCfm * deltaT;
      const latentLoadWithout = 4840 * outdoorAirCfm * deltaW;
      const totalLoadWithout = sensibleLoadWithout + latentLoadWithout;
      
      // Ventilation loads with ERV
      const sensibleLoadWith = sensibleLoadWithout - sensibleRecovery;
      const latentLoadWith = latentLoadWithout - latentRecovery;
      const totalLoadWith = sensibleLoadWith + latentLoadWith;
      
      // Load reduction percentages
      const percentSensible = sensibleLoadWithout > 0 ? (sensibleRecovery / sensibleLoadWithout) * 100 : 0;
      const percentLatent = latentLoadWithout > 0 ? (latentRecovery / latentLoadWithout) * 100 : 0;
      const percentTotal = totalLoadWithout > 0 ? (totalRecovery / totalLoadWithout) * 100 : 0;
      
      // Annual energy savings
      // BTU/h to kWh: BTU/h × hours / 3412 BTU/kWh
      const coolingKWh = mode === 'cooling' 
        ? (totalRecovery * operatingHoursPerYear) / (3412 * coolingCOP)
        : 0;
      const heatingKWh = mode === 'heating'
        ? (totalRecovery * operatingHoursPerYear) / (3412 * heatingCOP)
        : 0;
      const totalKWh = coolingKWh + heatingKWh;
      
      // Annual cost savings
      const annualCostSavings = totalKWh * electricityRateSAR;
      
      // Sizing recommendations
      // Standard face velocity: 400-600 FPM
      const faceVelocity = 500; // FPM
      const recommendedAirflow = Math.ceil(outdoorAirCfm / 100) * 100; // Round up to nearest 100
      
      // Estimated pressure drop based on ERV type
      const ervTypeConfig = ERV_TYPES.find(t => t.id === input.ervType);
      const estimatedPressureDrop = ervTypeConfig 
        ? (ervTypeConfig.pressureDrop.min + ervTypeConfig.pressureDrop.max) / 2
        : 0.6;
      
      // Is recovery beneficial?
      const isRecoveryBeneficial = deltaT > 10 || deltaH > 5;
      
      return {
        outdoorAir,
        supplyAir,
        returnAir,
        exhaustAir,
        sensibleRecovery,
        latentRecovery,
        totalRecovery,
        ventilationLoadWithoutERV: {
          sensible: sensibleLoadWithout,
          latent: latentLoadWithout,
          total: totalLoadWithout,
        },
        ventilationLoadWithERV: {
          sensible: Math.max(0, sensibleLoadWith),
          latent: Math.max(0, latentLoadWith),
          total: Math.max(0, totalLoadWith),
        },
        loadReduction: {
          sensible: sensibleRecovery,
          latent: latentRecovery,
          total: totalRecovery,
          percentSensible,
          percentLatent,
          percentTotal,
        },
        annualEnergySavings: {
          coolingKWh,
          heatingKWh,
          totalKWh,
        },
        annualCostSavings,
        recommendedAirflow,
        faceVelocity,
        estimatedPressureDrop,
        mode,
        isRecoveryBeneficial,
      };
    };
  }, []);
  
  const calculateAnnualSimulation = useMemo(() => {
    return (input: AnnualSimulationInput): AnnualSimulationResult => {
      const {
        cityId,
        outdoorAirCfm,
        sensibleEfficiency,
        latentEfficiency,
        indoorDesignTempF,
        indoorDesignRH,
        electricityRateSAR,
        coolingCOP,
        heatingCOP,
        ervPurchaseCostSAR,
        installationCostSAR,
        maintenanceCostPerYear,
        discountRate,
      } = input;
      
      const cityProfile = getCityWeatherProfile(cityId);
      const indoorTempF = indoorDesignTempF;
      
      // Calculate monthly breakdown using bin data
      const monthlyBreakdown: MonthlyBreakdown[] = [];
      let totalCoolingKWh = 0;
      let totalHeatingKWh = 0;
      
      // Use monthly data from city profile
      const monthlyData = cityProfile?.monthlyData || [];
      let peakRecoveryBTUh = 0;
      
      // Process each month using monthly weather profiles
      monthlyData.forEach((monthData, index) => {
        const outdoorTempF = celsiusToFahrenheit(monthData.avgTempC);
        const outdoorRH = monthData.avgRH;
        
        // Calculate delta T
        const deltaT = Math.abs(outdoorTempF - indoorTempF);
        
        // Approximate humidity ratio difference (simplified)
        const outdoorW = 0.0001 * outdoorRH * Math.exp(0.06 * monthData.avgTempC);
        const indoorW = 0.0001 * indoorDesignRH * Math.exp(0.06 * ((indoorTempF - 32) * 5/9));
        const deltaW = Math.abs(outdoorW - indoorW);
        
        // Sensible recovery: Qs = ηs × 1.08 × CFM × ΔT
        const sensibleRecoveryBTUh = (sensibleEfficiency / 100) * 1.08 * outdoorAirCfm * deltaT;
        
        // Latent recovery: Ql = ηl × 4840 × CFM × Δω
        const latentRecoveryBTUh = (latentEfficiency / 100) * 4840 * outdoorAirCfm * deltaW;
        
        const totalRecoveryBTUh = sensibleRecoveryBTUh + latentRecoveryBTUh;
        peakRecoveryBTUh = Math.max(peakRecoveryBTUh, totalRecoveryBTUh);
        
        // Determine cooling vs heating hours for this month
        const coolingHours = monthData.coolingHours;
        const heatingHours = monthData.heatingHours;
        
        // Energy savings (BTU to kWh: BTU / 3412)
        const coolingKWh = (totalRecoveryBTUh * coolingHours) / (3412 * coolingCOP);
        const heatingKWh = (totalRecoveryBTUh * heatingHours) / (3412 * heatingCOP);
        
        totalCoolingKWh += coolingKWh;
        totalHeatingKWh += heatingKWh;
        
        const totalKWh = coolingKWh + heatingKWh;
        const costSavings = totalKWh * electricityRateSAR;
        
        monthlyBreakdown.push({
          month: MONTHS[index],
          coolingRecoveryKWh: Math.round(coolingKWh),
          heatingRecoveryKWh: Math.round(heatingKWh),
          totalSavingsKWh: Math.round(totalKWh),
          costSavingsSAR: Math.round(costSavings),
          avgOutdoorTempC: monthData.avgTempC,
          operatingHours: coolingHours + heatingHours,
        });
      });
      
      // If no city profile, generate default data
      if (!cityProfile) {
        MONTHS.forEach((month, index) => {
          monthlyBreakdown.push({
            month,
            coolingRecoveryKWh: 800 + Math.random() * 400,
            heatingRecoveryKWh: index < 2 || index > 10 ? 100 + Math.random() * 100 : 0,
            totalSavingsKWh: 850,
            costSavingsSAR: 150,
            avgOutdoorTempC: 30 + Math.sin((index / 12) * Math.PI * 2) * 15,
            operatingHours: MONTHLY_HOURS[index] * 0.5,
          });
        });
        totalCoolingKWh = 9600;
        totalHeatingKWh = 400;
      }
      
      // Annual summary
      const totalEnergySavingsKWh = totalCoolingKWh + totalHeatingKWh;
      const totalCostSavingsSAR = totalEnergySavingsKWh * electricityRateSAR;
      const peakLoadReductionTons = peakRecoveryBTUh / 12000;
      const carbonReductionKg = totalEnergySavingsKWh * 0.527; // Saudi grid factor
      
      // Economics calculations
      const totalInvestmentSAR = ervPurchaseCostSAR + installationCostSAR;
      const netAnnualSavings = totalCostSavingsSAR - maintenanceCostPerYear;
      const simplePaybackYears = totalInvestmentSAR / netAnnualSavings;
      
      // NPV calculation (10 year)
      const rate = discountRate / 100;
      let npv = -totalInvestmentSAR;
      for (let year = 1; year <= 10; year++) {
        npv += netAnnualSavings / Math.pow(1 + rate, year);
      }
      
      // IRR calculation (Newton-Raphson approximation)
      let irr = 0.1; // Start with 10%
      for (let i = 0; i < 20; i++) {
        let npvAtRate = -totalInvestmentSAR;
        let derivativeNPV = 0;
        for (let year = 1; year <= 10; year++) {
          npvAtRate += netAnnualSavings / Math.pow(1 + irr, year);
          derivativeNPV -= year * netAnnualSavings / Math.pow(1 + irr, year + 1);
        }
        if (Math.abs(derivativeNPV) > 0.001) {
          irr = irr - npvAtRate / derivativeNPV;
        }
      }
      
      // ROI
      const roiPercent = ((netAnnualSavings * 10 - totalInvestmentSAR) / totalInvestmentSAR) * 100;
      
      // Sensitivity analysis
      const calculatePayback = (efficiency: number, rateMultiplier: number) => {
        const adjustedSavings = totalCostSavingsSAR * (efficiency / sensibleEfficiency) * rateMultiplier;
        return totalInvestmentSAR / (adjustedSavings - maintenanceCostPerYear);
      };
      
      return {
        monthlyBreakdown,
        annualSummary: {
          totalCoolingRecoveryKWh: Math.round(totalCoolingKWh),
          totalHeatingRecoveryKWh: Math.round(totalHeatingKWh),
          totalEnergySavingsKWh: Math.round(totalEnergySavingsKWh),
          totalCostSavingsSAR: Math.round(totalCostSavingsSAR),
          peakLoadReductionTons: Math.round(peakLoadReductionTons * 10) / 10,
          carbonReductionKg: Math.round(carbonReductionKg),
        },
        economics: {
          totalInvestmentSAR,
          simplePaybackYears: Math.round(simplePaybackYears * 10) / 10,
          npv10Year: Math.round(npv),
          irr: Math.round(irr * 1000) / 10,
          roiPercent: Math.round(roiPercent),
        },
        sensitivityAnalysis: {
          paybackAt75Efficiency: Math.round(calculatePayback(75, 1) * 10) / 10,
          paybackAt85Efficiency: Math.round(calculatePayback(85, 1) * 10) / 10,
          paybackIfRatesIncrease20: Math.round(calculatePayback(sensibleEfficiency, 1.2) * 10) / 10,
        },
      };
    };
  }, []);
  
  return { calculateERV, calculateAnnualSimulation, ERV_TYPES };
}
