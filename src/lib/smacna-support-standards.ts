// SMACNA and MSS SP-58 Support Standards
// Based on SMACNA HVAC Duct Construction Standards and MSS SP-58

/**
 * SMACNA HVAC Duct Construction Standards Table 4-1
 * Maximum Hanger Spacing for Horizontal Ducts
 */
export const SMACNA_DUCT_HANGER_SPACING = {
  round: {
    // Diameter range (inches) → max spacing (ft) and hanger type
    ranges: [
      { maxDia: 12, spacing: 10, hangerType: 'clevis' as const, description: 'Up to 12"' },
      { maxDia: 18, spacing: 10, hangerType: 'clevis' as const, description: '13" to 18"' },
      { maxDia: 24, spacing: 8, hangerType: 'clevis' as const, description: '19" to 24"' },
      { maxDia: 36, spacing: 8, hangerType: 'trapeze' as const, description: '25" to 36"' },
      { maxDia: Infinity, spacing: 6, hangerType: 'trapeze' as const, description: 'Over 36"' },
    ],
  },
  rectangular: {
    // Max dimension (inches) → max spacing (ft) and hanger type
    ranges: [
      { maxDim: 12, spacing: 10, hangerType: 'strap' as const, description: 'Up to 12"' },
      { maxDim: 18, spacing: 10, hangerType: 'strap' as const, description: '13" to 18"' },
      { maxDim: 30, spacing: 8, hangerType: 'trapeze' as const, description: '19" to 30"' },
      { maxDim: 60, spacing: 8, hangerType: 'trapeze' as const, description: '31" to 60"' },
      { maxDim: 96, spacing: 6, hangerType: 'trapeze' as const, description: '61" to 96"' },
      { maxDim: Infinity, spacing: 4, hangerType: 'trapeze' as const, description: 'Over 96"' },
    ],
  },
} as const;

/**
 * SMACNA Table 4-2: Hanger Rod Size by Load
 * Maximum safe working load for threaded rods (Grade 2)
 */
export const SMACNA_ROD_SIZING = [
  { diameter: '1/4"', maxLoadLbs: 100, maxDuctWidthIn: 12 },
  { diameter: '3/8"', maxLoadLbs: 250, maxDuctWidthIn: 24 },
  { diameter: '1/2"', maxLoadLbs: 500, maxDuctWidthIn: 48 },
  { diameter: '5/8"', maxLoadLbs: 850, maxDuctWidthIn: 72 },
  { diameter: '3/4"', maxLoadLbs: 1200, maxDuctWidthIn: 96 },
  { diameter: '7/8"', maxLoadLbs: 1800, maxDuctWidthIn: 120 },
  { diameter: '1"', maxLoadLbs: 2400, maxDuctWidthIn: 144 },
] as const;

/**
 * SMACNA Riser (Vertical) Support Spacing
 */
export const SMACNA_RISER_SPACING = {
  round: [
    { maxDia: 24, spacing: 12, clampType: 'riser_clamp' as const },
    { maxDia: 36, spacing: 10, clampType: 'riser_clamp' as const },
    { maxDia: Infinity, spacing: 8, clampType: 'riser_clamp' as const },
  ],
  rectangular: [
    { maxDim: 30, spacing: 12, bracketType: 'riser_clamp' as const },
    { maxDim: 60, spacing: 10, bracketType: 'riser_clamp' as const },
    { maxDim: Infinity, spacing: 8, bracketType: 'riser_clamp' as const },
  ],
} as const;

/**
 * Duct weight per square foot by gauge (lbs/sqft)
 * Based on galvanized steel
 */
export const GAUGE_WEIGHTS_LB_PER_SQFT: Record<number, number> = {
  14: 3.281,
  16: 2.656,
  18: 2.156,
  20: 1.656,
  22: 1.406,
  24: 1.156,
  26: 0.906,
  28: 0.781,
};

/**
 * Insulation weight factors (multiplier on bare duct weight)
 */
export const INSULATION_WEIGHT_FACTORS = {
  none: 1.0,
  internal_liner_1in: 1.15,
  internal_liner_2in: 1.25,
  external_wrap_1in: 1.20,
  external_wrap_2in: 1.35,
  external_board_1in: 1.40,
  external_board_2in: 1.60,
} as const;

/**
 * Pressure class adjustments for spacing
 * Higher pressure = closer spacing for stability
 */
export const PRESSURE_CLASS_SPACING_FACTORS: Record<string, number> = {
  '0.5_in_wg': 1.0,    // 125 Pa
  '1_in_wg': 1.0,      // 250 Pa
  '2_in_wg': 1.0,      // 500 Pa
  '3_in_wg': 0.85,     // 750 Pa - reduce spacing by 15%
  '4_in_wg': 0.80,     // 1000 Pa - reduce spacing by 20%
  '6_in_wg': 0.75,     // 1500 Pa - reduce spacing by 25%
  '10_in_wg': 0.65,    // 2500 Pa - reduce spacing by 35%
};

/**
 * MSS SP-58 Table 3: Support Spacing for Steel Pipe (Water Service)
 * NPS size → max spacing (ft)
 */
export const MSS_SP58_PIPE_SPACING = [
  { nps: 0.5, spacing: 7, rodDiameter: '3/8"' },
  { nps: 0.75, spacing: 7, rodDiameter: '3/8"' },
  { nps: 1, spacing: 7, rodDiameter: '3/8"' },
  { nps: 1.25, spacing: 7, rodDiameter: '3/8"' },
  { nps: 1.5, spacing: 9, rodDiameter: '3/8"' },
  { nps: 2, spacing: 10, rodDiameter: '3/8"' },
  { nps: 2.5, spacing: 11, rodDiameter: '1/2"' },
  { nps: 3, spacing: 12, rodDiameter: '1/2"' },
  { nps: 4, spacing: 14, rodDiameter: '1/2"' },
  { nps: 5, spacing: 16, rodDiameter: '5/8"' },
  { nps: 6, spacing: 17, rodDiameter: '5/8"' },
  { nps: 8, spacing: 19, rodDiameter: '3/4"' },
  { nps: 10, spacing: 22, rodDiameter: '7/8"' },
  { nps: 12, spacing: 23, rodDiameter: '7/8"' },
  { nps: 14, spacing: 25, rodDiameter: '1"' },
  { nps: 16, spacing: 27, rodDiameter: '1"' },
  { nps: 18, spacing: 28, rodDiameter: '1-1/8"' },
  { nps: 20, spacing: 30, rodDiameter: '1-1/4"' },
  { nps: 24, spacing: 32, rodDiameter: '1-1/4"' },
] as const;

/**
 * MSS SP-58 Vertical Pipe (Riser) Support Spacing
 */
export const MSS_SP58_RISER_SPACING = [
  { nps: 1, spacing: 12 },
  { nps: 2, spacing: 15 },
  { nps: 3, spacing: 15 },
  { nps: 4, spacing: 15 },
  { nps: 6, spacing: 20 },
  { nps: 8, spacing: 20 },
  { nps: 10, spacing: 25 },
  { nps: 12, spacing: 25 },
  { nps: 16, spacing: 30 },
  { nps: 20, spacing: 30 },
  { nps: 24, spacing: 35 },
] as const;

/**
 * Copper pipe support spacing (closer than steel)
 * Per ASME B31.9
 */
export const COPPER_PIPE_SPACING = [
  { nps: 0.5, spacing: 5, rodDiameter: '3/8"' },
  { nps: 0.75, spacing: 5, rodDiameter: '3/8"' },
  { nps: 1, spacing: 6, rodDiameter: '3/8"' },
  { nps: 1.25, spacing: 7, rodDiameter: '3/8"' },
  { nps: 1.5, spacing: 8, rodDiameter: '3/8"' },
  { nps: 2, spacing: 8, rodDiameter: '3/8"' },
  { nps: 2.5, spacing: 9, rodDiameter: '1/2"' },
  { nps: 3, spacing: 10, rodDiameter: '1/2"' },
  { nps: 4, spacing: 12, rodDiameter: '1/2"' },
] as const;

/**
 * Helper: Get duct hanger spacing based on shape and dimension
 */
export function getDuctHangerSpacing(
  shape: 'round' | 'rectangular',
  maxDimension: number,
  options?: { pressureClass?: string; hasInsulation?: boolean }
): { spacing: number; hangerType: 'clevis' | 'trapeze' | 'strap'; description: string } {
  let baseSpacing: number;
  let hangerType: 'clevis' | 'trapeze' | 'strap';
  let description: string;

  if (shape === 'round') {
    const range = SMACNA_DUCT_HANGER_SPACING.round.ranges.find(r => maxDimension <= r.maxDia);
    baseSpacing = range?.spacing || 6;
    hangerType = range?.hangerType || 'trapeze';
    description = range?.description || 'Large round';
  } else {
    const range = SMACNA_DUCT_HANGER_SPACING.rectangular.ranges.find(r => maxDimension <= r.maxDim);
    baseSpacing = range?.spacing || 4;
    hangerType = range?.hangerType || 'trapeze';
    description = range?.description || 'Large rectangular';
  }

  // Apply pressure class factor
  if (options?.pressureClass) {
    const factor = PRESSURE_CLASS_SPACING_FACTORS[options.pressureClass] || 1.0;
    baseSpacing = Math.floor(baseSpacing * factor);
  }

  // Reduce spacing by 10% for insulated ducts (added weight)
  if (options?.hasInsulation) {
    baseSpacing = Math.floor(baseSpacing * 0.9);
  }

  return { spacing: Math.max(baseSpacing, 3), hangerType, description };
}

/**
 * Helper: Get rod diameter based on load or duct width
 */
export function getRodDiameter(loadLbs?: number, ductWidthIn?: number): string {
  if (loadLbs) {
    const rod = SMACNA_ROD_SIZING.find(r => loadLbs <= r.maxLoadLbs);
    return rod?.diameter || '1"';
  }
  if (ductWidthIn) {
    const rod = SMACNA_ROD_SIZING.find(r => ductWidthIn <= r.maxDuctWidthIn);
    return rod?.diameter || '1"';
  }
  return '1/2"'; // Default
}

/**
 * Helper: Get pipe support spacing based on size and material
 */
export function getPipeSpacing(
  nps: number,
  material: string = 'steel',
  isRiser: boolean = false
): { spacing: number; rodDiameter: string } {
  if (isRiser) {
    const riser = MSS_SP58_RISER_SPACING.find(r => nps <= r.nps) || MSS_SP58_RISER_SPACING[MSS_SP58_RISER_SPACING.length - 1];
    const rodInfo = MSS_SP58_PIPE_SPACING.find(r => nps <= r.nps);
    return { spacing: riser.spacing, rodDiameter: rodInfo?.rodDiameter || '1/2"' };
  }

  if (material.toLowerCase().includes('copper')) {
    const copper = COPPER_PIPE_SPACING.find(r => nps <= r.nps) || COPPER_PIPE_SPACING[COPPER_PIPE_SPACING.length - 1];
    return { spacing: copper.spacing, rodDiameter: copper.rodDiameter };
  }

  const steel = MSS_SP58_PIPE_SPACING.find(r => nps <= r.nps) || MSS_SP58_PIPE_SPACING[MSS_SP58_PIPE_SPACING.length - 1];
  return { spacing: steel.spacing, rodDiameter: steel.rodDiameter };
}

/**
 * Helper: Calculate duct weight per linear foot
 */
export function calculateDuctWeightPerFoot(
  shape: 'round' | 'rectangular',
  dimensions: { diameterIn?: number; widthIn?: number; heightIn?: number },
  gauge: number,
  insulationFactor: keyof typeof INSULATION_WEIGHT_FACTORS = 'none'
): number {
  const gaugeWeight = GAUGE_WEIGHTS_LB_PER_SQFT[gauge] || GAUGE_WEIGHTS_LB_PER_SQFT[24];
  let perimeterFt: number;

  if (shape === 'round' && dimensions.diameterIn) {
    perimeterFt = (Math.PI * dimensions.diameterIn) / 12;
  } else if (dimensions.widthIn && dimensions.heightIn) {
    perimeterFt = (2 * (dimensions.widthIn + dimensions.heightIn)) / 12;
  } else {
    return 0;
  }

  const baseWeightPerFt = perimeterFt * gaugeWeight;
  const insFactor = INSULATION_WEIGHT_FACTORS[insulationFactor] || 1.0;
  
  return baseWeightPerFt * insFactor;
}

/**
 * Seismic bracing requirements (simplified)
 */
export const SEISMIC_BRACING = {
  zones: ['low', 'moderate', 'high', 'very_high'] as const,
  requirements: {
    low: { ductSizeThreshold: Infinity, intervalFt: 40 },
    moderate: { ductSizeThreshold: 48, intervalFt: 30 },
    high: { ductSizeThreshold: 24, intervalFt: 24 },
    very_high: { ductSizeThreshold: 18, intervalFt: 20 },
  },
} as const;

export type SeismicZone = (typeof SEISMIC_BRACING.zones)[number];

/**
 * Helper: Estimate seismic braces needed
 */
export function estimateSeismicBraces(
  lengthFt: number,
  maxDimension: number,
  zone: SeismicZone
): number {
  const req = SEISMIC_BRACING.requirements[zone];
  if (maxDimension < req.ductSizeThreshold) {
    return 0; // No bracing required for small ducts in this zone
  }
  return Math.ceil(lengthFt / req.intervalFt);
}
