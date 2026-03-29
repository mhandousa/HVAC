// Acoustic Treatment ROI Calculations
// Based on research from acoustics studies on productivity impact

export type SpaceType = 
  | 'open-office'
  | 'private-office'
  | 'conference-room'
  | 'classroom'
  | 'healthcare'
  | 'hospitality'
  | 'retail'
  | 'residential';

export interface ProductivityData {
  baseProductivityLoss: number;      // % productivity loss at NC-55+
  improvementPerNC: number;          // % improvement per NC point reduced
  avgCostPerOccupant: number;        // SAR/year average salary
  meetingEfficiencyFactor: number;   // How much meetings are affected
}

// Research-based productivity impact by space type
export const PRODUCTIVITY_IMPACT: Record<SpaceType, ProductivityData> = {
  'open-office': {
    baseProductivityLoss: 0.15,        // 15% productivity loss in noisy open offices
    improvementPerNC: 0.012,           // 1.2% improvement per NC point
    avgCostPerOccupant: 180000,        // SAR/year average
    meetingEfficiencyFactor: 1.2,
  },
  'private-office': {
    baseProductivityLoss: 0.08,
    improvementPerNC: 0.008,
    avgCostPerOccupant: 240000,
    meetingEfficiencyFactor: 1.0,
  },
  'conference-room': {
    baseProductivityLoss: 0.20,        // High impact on meeting effectiveness
    improvementPerNC: 0.018,           // 1.8% per NC point (more sensitive)
    avgCostPerOccupant: 200000,
    meetingEfficiencyFactor: 1.5,      // Meetings heavily affected
  },
  'classroom': {
    baseProductivityLoss: 0.18,
    improvementPerNC: 0.016,
    avgCostPerOccupant: 150000,
    meetingEfficiencyFactor: 1.4,
  },
  'healthcare': {
    baseProductivityLoss: 0.12,
    improvementPerNC: 0.015,
    avgCostPerOccupant: 200000,
    meetingEfficiencyFactor: 1.1,
  },
  'hospitality': {
    baseProductivityLoss: 0.10,
    improvementPerNC: 0.010,
    avgCostPerOccupant: 120000,
    meetingEfficiencyFactor: 0.8,
  },
  'retail': {
    baseProductivityLoss: 0.05,
    improvementPerNC: 0.005,
    avgCostPerOccupant: 100000,
    meetingEfficiencyFactor: 0.5,
  },
  'residential': {
    baseProductivityLoss: 0.03,
    improvementPerNC: 0.004,
    avgCostPerOccupant: 0,             // Not applicable
    meetingEfficiencyFactor: 0,
  },
};

// Tenant satisfaction correlation with NC levels
export const TENANT_SATISFACTION_MODEL = {
  ncThresholds: {
    excellent: 25,
    good: 35,
    acceptable: 45,
    poor: 55,
  },
  retentionRates: {
    excellent: 0.98,   // 98% retention
    good: 0.92,
    acceptable: 0.85,
    poor: 0.70,
  },
  rentPremiums: {
    excellent: 0.12,   // 12% rent premium
    good: 0.05,
    acceptable: 0,
    poor: -0.08,       // 8% discount
  },
  satisfactionScores: {
    excellent: 95,
    good: 78,
    acceptable: 60,
    poor: 35,
  },
};

export interface ROIInputs {
  zoneId?: string;
  zoneName?: string;
  currentNC: number;
  targetNC: number;
  spaceType: SpaceType;
  areaM2: number;
  occupants: number;
  avgAnnualSalary: number;          // SAR
  rentPerM2PerYear?: number;        // SAR
  treatmentCostSAR: number;
  discountRate: number;             // e.g., 0.08 for 8%
  analysisYears: number;
}

export interface ROIResults {
  // Productivity
  currentProductivityLoss: number;     // percentage
  postTreatmentProductivityLoss: number;
  annualProductivityGainSAR: number;
  productivityImprovementPercent: number;
  
  // Tenant Value
  currentSatisfactionScore: number;
  postSatisfactionScore: number;
  annualTenantValueSAR: number;
  rentPremiumPotentialSAR: number;
  reducedTurnoverSavingsSAR: number;
  
  // Energy (reduced need for masking systems)
  annualEnergySavingsSAR: number;
  
  // Summary
  totalAnnualBenefitSAR: number;
  simplePaybackMonths: number;
  npv: number;
  irr: number;
  benefitCostRatio: number;
  
  // Timeline
  yearlyBenefits: { year: number; cumulative: number; netValue: number }[];
  
  // Breakdown percentages
  productivityShare: number;
  tenantValueShare: number;
  energyShare: number;
}

function getSatisfactionLevel(nc: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  const thresholds = TENANT_SATISFACTION_MODEL.ncThresholds;
  if (nc <= thresholds.excellent) return 'excellent';
  if (nc <= thresholds.good) return 'good';
  if (nc <= thresholds.acceptable) return 'acceptable';
  return 'poor';
}

/**
 * Calculate productivity gain from NC improvement
 */
export function calculateProductivityGains(
  currentNC: number,
  targetNC: number,
  spaceType: SpaceType,
  occupants: number,
  avgAnnualSalary: number
): {
  currentLoss: number;
  postLoss: number;
  annualGainSAR: number;
  improvementPercent: number;
} {
  const data = PRODUCTIVITY_IMPACT[spaceType] || PRODUCTIVITY_IMPACT['open-office'];
  const ncReduction = Math.max(0, currentNC - targetNC);
  
  // Calculate productivity loss at current NC
  // Assume baseline at NC-30, with increasing loss above that
  const currentExcess = Math.max(0, currentNC - 30);
  const targetExcess = Math.max(0, targetNC - 30);
  
  const currentLoss = Math.min(data.baseProductivityLoss, currentExcess * data.improvementPerNC);
  const postLoss = Math.min(data.baseProductivityLoss, targetExcess * data.improvementPerNC);
  const improvementPercent = (currentLoss - postLoss) * 100;
  
  // Calculate annual monetary gain
  const totalSalaryPool = occupants * avgAnnualSalary;
  const annualGainSAR = totalSalaryPool * (currentLoss - postLoss) * data.meetingEfficiencyFactor;
  
  return {
    currentLoss: currentLoss * 100,    // as percentage
    postLoss: postLoss * 100,
    annualGainSAR: Math.round(annualGainSAR),
    improvementPercent,
  };
}

/**
 * Calculate tenant retention and rent value from NC improvement
 */
export function calculateTenantValue(
  currentNC: number,
  targetNC: number,
  areaM2: number,
  rentPerM2PerYear?: number
): {
  currentScore: number;
  postScore: number;
  annualValueSAR: number;
  rentPremiumSAR: number;
  turnoverSavingsSAR: number;
} {
  const currentLevel = getSatisfactionLevel(currentNC);
  const targetLevel = getSatisfactionLevel(targetNC);
  
  const currentScore = TENANT_SATISFACTION_MODEL.satisfactionScores[currentLevel];
  const postScore = TENANT_SATISFACTION_MODEL.satisfactionScores[targetLevel];
  
  const baseRent = rentPerM2PerYear || 1500; // Default SAR/m2/year
  const annualRent = areaM2 * baseRent;
  
  // Rent premium potential
  const currentPremium = TENANT_SATISFACTION_MODEL.rentPremiums[currentLevel];
  const targetPremium = TENANT_SATISFACTION_MODEL.rentPremiums[targetLevel];
  const rentPremiumSAR = Math.round(annualRent * (targetPremium - currentPremium));
  
  // Reduced turnover savings (vacancy cost is typically 3-6 months rent)
  const currentRetention = TENANT_SATISFACTION_MODEL.retentionRates[currentLevel];
  const targetRetention = TENANT_SATISFACTION_MODEL.retentionRates[targetLevel];
  const vacancyCost = annualRent * 0.25; // 3 months
  const turnoverSavingsSAR = Math.round(vacancyCost * (targetRetention - currentRetention));
  
  return {
    currentScore,
    postScore,
    annualValueSAR: rentPremiumSAR + turnoverSavingsSAR,
    rentPremiumSAR,
    turnoverSavingsSAR,
  };
}

/**
 * Estimate energy savings from not needing sound masking
 */
export function calculateEnergySavings(
  currentNC: number,
  targetNC: number,
  areaM2: number
): number {
  // Sound masking costs approximately 50-80 SAR/m2/year to operate
  const maskingCostPerM2 = 65;
  
  // If we're achieving NC-35 or better, sound masking may not be needed
  const currentNeedsMasking = currentNC > 40;
  const targetNeedsMasking = targetNC > 40;
  
  if (currentNeedsMasking && !targetNeedsMasking) {
    return Math.round(areaM2 * maskingCostPerM2);
  }
  
  return 0;
}

/**
 * Calculate NPV of benefits stream
 */
export function calculateNPV(
  treatmentCost: number,
  annualBenefit: number,
  discountRate: number,
  years: number
): number {
  let npv = -treatmentCost;
  
  for (let year = 1; year <= years; year++) {
    npv += annualBenefit / Math.pow(1 + discountRate, year);
  }
  
  return Math.round(npv);
}

/**
 * Calculate IRR using Newton-Raphson method
 */
export function calculateIRR(
  treatmentCost: number,
  annualBenefit: number,
  years: number
): number {
  // Use Newton-Raphson iteration
  let rate = 0.1; // Start with 10%
  
  for (let i = 0; i < 100; i++) {
    let npv = -treatmentCost;
    let derivative = 0;
    
    for (let year = 1; year <= years; year++) {
      npv += annualBenefit / Math.pow(1 + rate, year);
      derivative -= year * annualBenefit / Math.pow(1 + rate, year + 1);
    }
    
    if (Math.abs(npv) < 1) break;
    if (Math.abs(derivative) < 0.001) break;
    
    rate = rate - npv / derivative;
    
    // Bound the rate
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return Math.round(rate * 10000) / 100; // Return as percentage
}

/**
 * Generate complete ROI analysis
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  // Productivity gains
  const productivity = calculateProductivityGains(
    inputs.currentNC,
    inputs.targetNC,
    inputs.spaceType,
    inputs.occupants,
    inputs.avgAnnualSalary
  );
  
  // Tenant value
  const tenantValue = calculateTenantValue(
    inputs.currentNC,
    inputs.targetNC,
    inputs.areaM2,
    inputs.rentPerM2PerYear
  );
  
  // Energy savings
  const energySavings = calculateEnergySavings(
    inputs.currentNC,
    inputs.targetNC,
    inputs.areaM2
  );
  
  // Total annual benefit
  const totalAnnualBenefit = productivity.annualGainSAR + tenantValue.annualValueSAR + energySavings;
  
  // Financial metrics
  const simplePaybackMonths = totalAnnualBenefit > 0 
    ? Math.round((inputs.treatmentCostSAR / totalAnnualBenefit) * 12 * 10) / 10 
    : Infinity;
  
  const npv = calculateNPV(
    inputs.treatmentCostSAR,
    totalAnnualBenefit,
    inputs.discountRate,
    inputs.analysisYears
  );
  
  const irr = calculateIRR(
    inputs.treatmentCostSAR,
    totalAnnualBenefit,
    inputs.analysisYears
  );
  
  const benefitCostRatio = totalAnnualBenefit * inputs.analysisYears / inputs.treatmentCostSAR;
  
  // Generate yearly timeline
  const yearlyBenefits: { year: number; cumulative: number; netValue: number }[] = [];
  let cumulative = 0;
  
  for (let year = 0; year <= inputs.analysisYears; year++) {
    if (year === 0) {
      yearlyBenefits.push({
        year,
        cumulative: 0,
        netValue: -inputs.treatmentCostSAR,
      });
    } else {
      cumulative += totalAnnualBenefit;
      yearlyBenefits.push({
        year,
        cumulative,
        netValue: cumulative - inputs.treatmentCostSAR,
      });
    }
  }
  
  // Calculate shares
  const total = productivity.annualGainSAR + tenantValue.annualValueSAR + energySavings;
  
  return {
    currentProductivityLoss: productivity.currentLoss,
    postTreatmentProductivityLoss: productivity.postLoss,
    annualProductivityGainSAR: productivity.annualGainSAR,
    productivityImprovementPercent: productivity.improvementPercent,
    
    currentSatisfactionScore: tenantValue.currentScore,
    postSatisfactionScore: tenantValue.postScore,
    annualTenantValueSAR: tenantValue.annualValueSAR,
    rentPremiumPotentialSAR: tenantValue.rentPremiumSAR,
    reducedTurnoverSavingsSAR: tenantValue.turnoverSavingsSAR,
    
    annualEnergySavingsSAR: energySavings,
    
    totalAnnualBenefitSAR: totalAnnualBenefit,
    simplePaybackMonths,
    npv,
    irr,
    benefitCostRatio: Math.round(benefitCostRatio * 10) / 10,
    
    yearlyBenefits,
    
    productivityShare: total > 0 ? Math.round((productivity.annualGainSAR / total) * 100) : 0,
    tenantValueShare: total > 0 ? Math.round((tenantValue.annualValueSAR / total) * 100) : 0,
    energyShare: total > 0 ? Math.round((energySavings / total) * 100) : 0,
  };
}

/**
 * Map zone type to ROI space type
 */
export function mapZoneTypeToSpaceType(zoneType: string | null | undefined): SpaceType {
  if (!zoneType) return 'open-office';
  
  const type = zoneType.toLowerCase();
  
  if (type.includes('conference') || type.includes('meeting')) return 'conference-room';
  if (type.includes('private') || type.includes('executive')) return 'private-office';
  if (type.includes('open') || type.includes('office')) return 'open-office';
  if (type.includes('classroom') || type.includes('lecture')) return 'classroom';
  if (type.includes('hospital') || type.includes('clinic') || type.includes('medical')) return 'healthcare';
  if (type.includes('hotel') || type.includes('lobby') || type.includes('restaurant')) return 'hospitality';
  if (type.includes('retail') || type.includes('shop') || type.includes('store')) return 'retail';
  if (type.includes('residential') || type.includes('apartment') || type.includes('bedroom')) return 'residential';
  
  return 'open-office';
}

/**
 * Format currency for display
 */
export function formatSAR(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `SAR ${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `SAR ${(value / 1000).toFixed(1)}K`;
  }
  return `SAR ${value.toLocaleString()}`;
}
