// BOQ Calculation Utilities
// Accessories derivation and SMACNA/MSS SP-58 supports estimation logic

import { 
  AccessoryBOQItem, 
  SupportBOQItem, 
  TerminalUnitBOQItem, 
  AHUComponentBOQItem,
  SupportEstimationSettings,
} from '@/types/boq';
import { DuctSegment } from '@/hooks/useDuctSystems';
import { PipeSegment } from '@/hooks/usePipeSystems';
import {
  getDuctHangerSpacing,
  getRodDiameter,
  getPipeSpacing,
  calculateDuctWeightPerFoot,
  estimateSeismicBraces,
  SMACNA_RISER_SPACING,
  GAUGE_WEIGHTS_LB_PER_SQFT,
  SeismicZone,
} from './smacna-support-standards';

/**
 * Derive accessories from terminal unit selections
 */
export function deriveAccessoriesFromTerminalUnits(
  terminalUnits: TerminalUnitBOQItem[]
): AccessoryBOQItem[] {
  const accessories: AccessoryBOQItem[] = [];

  terminalUnits.forEach(unit => {
    // Damper
    if (unit.hasDamper) {
      accessories.push({
        category: 'damper',
        description: `Volume Damper - ${unit.unitType}`,
        size: unit.size,
        quantity: 1,
        sourceUnit: unit.unitTag,
        sourceType: 'terminal',
      });

      // Actuator for damper
      accessories.push({
        category: 'actuator',
        description: 'DDC Damper Actuator',
        size: '24V',
        quantity: 1,
        sourceUnit: unit.unitTag,
        sourceType: 'terminal',
      });
    }

    // Reheat coil
    if (unit.hasReheat && unit.reheatType) {
      accessories.push({
        category: 'coil',
        description: `Reheat Coil - ${unit.reheatType}`,
        size: unit.size,
        quantity: 1,
        sourceUnit: unit.unitTag,
        sourceType: 'terminal',
      });

      // Reheat control valve for hot water coils
      if (unit.reheatType.toLowerCase().includes('hot water')) {
        accessories.push({
          category: 'control',
          description: 'Modulating Control Valve - 2-way',
          size: '1/2" - 1"',
          quantity: 1,
          sourceUnit: unit.unitTag,
          sourceType: 'terminal',
        });
      }
    }

    // Flow measuring station
    if (unit.hasFlowStation) {
      accessories.push({
        category: 'sensor',
        description: 'Airflow Measuring Station',
        size: unit.size,
        quantity: 1,
        sourceUnit: unit.unitTag,
        sourceType: 'terminal',
      });
    }

    // Discharge air temperature sensor (common for VAV)
    if (unit.unitType === 'VAV' || unit.unitType === 'FPTU') {
      accessories.push({
        category: 'sensor',
        description: 'Discharge Air Temperature Sensor',
        size: 'Duct Mount',
        quantity: 1,
        sourceUnit: unit.unitTag,
        sourceType: 'terminal',
      });
    }
  });

  return accessories;
}

/**
 * Derive accessories from AHU configurations
 */
export function deriveAccessoriesFromAHUs(
  ahuComponents: AHUComponentBOQItem[]
): AccessoryBOQItem[] {
  const accessories: AccessoryBOQItem[] = [];

  ahuComponents.forEach(ahu => {
    // Outdoor air damper
    accessories.push({
      category: 'damper',
      description: 'Outdoor Air Damper - Low Leakage',
      size: `${Math.round(ahu.cfm / 500)} sqft`,
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    // Return air damper
    accessories.push({
      category: 'damper',
      description: 'Return Air Damper',
      size: `${Math.round(ahu.cfm / 500)} sqft`,
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    // OA Damper actuator
    accessories.push({
      category: 'actuator',
      description: 'OA Damper Actuator - Modulating',
      size: '24V',
      quantity: 2, // OA + RA
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    // Cooling coil control valve
    if (ahu.hasCoolingCoil && ahu.coolingTons) {
      const valveSize = ahu.coolingTons > 50 ? '4"' : ahu.coolingTons > 25 ? '3"' : '2"';
      accessories.push({
        category: 'control',
        description: 'CHW Control Valve - 2-way Modulating',
        size: valveSize,
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // Heating coil control valve
    if (ahu.hasHeatingCoil && ahu.heatingMBH) {
      const valveSize = ahu.heatingMBH > 500 ? '2"' : '1-1/2"';
      accessories.push({
        category: 'control',
        description: 'HW Control Valve - 2-way Modulating',
        size: valveSize,
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // Preheat coil control valve
    if (ahu.hasPreheatCoil) {
      accessories.push({
        category: 'control',
        description: 'Preheat Coil Control Valve',
        size: '1-1/2"',
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // VFD for supply fan
    if (ahu.supplyFanHP) {
      accessories.push({
        category: 'control',
        description: 'Variable Frequency Drive - Supply Fan',
        size: `${ahu.supplyFanHP} HP`,
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // VFD for return fan
    if (ahu.returnFanHP) {
      accessories.push({
        category: 'control',
        description: 'Variable Frequency Drive - Return Fan',
        size: `${ahu.returnFanHP} HP`,
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // Sensors
    accessories.push({
      category: 'sensor',
      description: 'Supply Air Temperature Sensor',
      size: 'Duct Mount',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    accessories.push({
      category: 'sensor',
      description: 'Mixed Air Temperature Sensor',
      size: 'Duct Mount',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    accessories.push({
      category: 'sensor',
      description: 'Return Air Temperature Sensor',
      size: 'Duct Mount',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    accessories.push({
      category: 'sensor',
      description: 'Duct Static Pressure Sensor',
      size: '0-5" WC',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    // Filter differential pressure switch
    if (ahu.filterType) {
      accessories.push({
        category: 'sensor',
        description: 'Filter Differential Pressure Switch',
        size: '0-2" WC',
        quantity: 1,
        sourceUnit: ahu.ahuTag,
        sourceType: 'ahu',
      });
    }

    // Smoke detector
    accessories.push({
      category: 'sensor',
      description: 'Duct Smoke Detector',
      size: 'Supply',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });

    accessories.push({
      category: 'sensor',
      description: 'Duct Smoke Detector',
      size: 'Return',
      quantity: 1,
      sourceUnit: ahu.ahuTag,
      sourceType: 'ahu',
    });
  });

  return accessories;
}

// Interface for internal tracking during calculation
interface DuctSupportAccumulator {
  supportType: 'trapeze' | 'clevis' | 'strap' | 'riser_clamp';
  sizeRange: string;
  quantity: number;
  rodDiameter: string;
  spacingFt: number;
  basis: string;
  isRiser: boolean;
}

/**
 * Enhanced duct support estimation based on SMACNA HVAC Duct Construction Standards
 */
export function estimateDuctSupports(
  ductSegments: DuctSegment[],
  settings?: Partial<SupportEstimationSettings>
): SupportBOQItem[] {
  const supports: SupportBOQItem[] = [];
  const accumulator: Map<string, DuctSupportAccumulator> = new Map();

  const defaultSettings: SupportEstimationSettings = {
    includeSeismicBracing: false,
    seismicZone: 'low',
    installationType: 'overhead',
    pressureClass: '2_in_wg',
    hasInsulation: false,
    ...settings,
  };

  let totalSeismicBraces = 0;
  let totalBeamClamps = 0;

  ductSegments.forEach(segment => {
    const lengthFt = segment.length_ft || 0;
    if (lengthFt === 0) return;

    const shape: 'round' | 'rectangular' = segment.duct_shape === 'round' ? 'round' : 'rectangular';
    const diameterIn = segment.diameter_in || 0;
    const widthIn = segment.width_in || 0;
    const heightIn = segment.height_in || 0;
    const maxDimension = Math.max(diameterIn, widthIn, heightIn);

    // Detect risers from segment name (common convention: "RISER", "VERTICAL", "UP", "DOWN")
    const segmentNameUpper = (segment.segment_name || '').toUpperCase();
    const isRiser = segmentNameUpper.includes('RISER') || 
                   segmentNameUpper.includes('VERTICAL') ||
                   segmentNameUpper.includes(' UP') ||
                   segmentNameUpper.includes(' DN') ||
                   segmentNameUpper.includes(' DOWN');

    // Get gauge and calculate weight
    const gauge = getGaugeFromDimension(maxDimension);
    const weightPerFt = calculateDuctWeightPerFoot(
      shape,
      { diameterIn, widthIn, heightIn },
      gauge,
      defaultSettings.hasInsulation ? 'external_wrap_1in' : 'none'
    );

    let hangerSpacing: number;
    let hangerType: 'clevis' | 'trapeze' | 'strap' | 'riser_clamp';
    let sizeDescription: string;
    let basis: string;

    if (isRiser) {
      // Use riser spacing tables
      if (shape === 'round') {
        const riser = SMACNA_RISER_SPACING.round.find(r => maxDimension <= r.maxDia) || 
                     SMACNA_RISER_SPACING.round[SMACNA_RISER_SPACING.round.length - 1];
        hangerSpacing = riser.spacing;
        hangerType = 'riser_clamp';
      } else {
        const riser = SMACNA_RISER_SPACING.rectangular.find(r => maxDimension <= r.maxDim) ||
                     SMACNA_RISER_SPACING.rectangular[SMACNA_RISER_SPACING.rectangular.length - 1];
        hangerSpacing = riser.spacing;
        hangerType = 'riser_clamp';
      }
      sizeDescription = getSizeRangeDescription(maxDimension);
      basis = `SMACNA Riser - ${hangerSpacing}ft max`;
    } else {
      // Use horizontal duct spacing
      const spacingInfo = getDuctHangerSpacing(shape, maxDimension, {
        pressureClass: defaultSettings.pressureClass,
        hasInsulation: defaultSettings.hasInsulation,
      });
      hangerSpacing = spacingInfo.spacing;
      hangerType = spacingInfo.hangerType;
      sizeDescription = spacingInfo.description;
      basis = `SMACNA Table 4-1 - ${hangerSpacing}ft spacing`;
    }

    // Calculate quantity: hangers at ends + every spacing interval
    const hangerCount = Math.ceil(lengthFt / hangerSpacing) + 1;

    // Calculate load per hanger for rod sizing
    const loadPerHanger = (weightPerFt * hangerSpacing) / 2; // Distributed load
    const rodDiameter = getRodDiameter(loadPerHanger, maxDimension);

    // Accumulate by type and size range
    const key = `${hangerType}_${sizeDescription}_${isRiser ? 'riser' : 'horiz'}`;
    const existing = accumulator.get(key);
    if (existing) {
      existing.quantity += hangerCount;
    } else {
      accumulator.set(key, {
        supportType: hangerType,
        sizeRange: sizeDescription,
        quantity: hangerCount,
        rodDiameter,
        spacingFt: hangerSpacing,
        basis,
        isRiser,
      });
    }

    // Beam clamps for overhead installation
    if (defaultSettings.installationType === 'overhead' && !isRiser) {
      totalBeamClamps += hangerCount;
    }

    // Seismic bracing
    if (defaultSettings.includeSeismicBracing && !isRiser) {
      const braces = estimateSeismicBraces(
        lengthFt,
        maxDimension,
        defaultSettings.seismicZone as SeismicZone
      );
      totalSeismicBraces += braces;
    }
  });

  // Convert accumulator to support items with 10% allowance
  accumulator.forEach((data) => {
    const adjustedQty = Math.ceil(data.quantity * 1.1);
    supports.push({
      supportType: data.supportType,
      description: getHangerDescription(data.supportType, data.isRiser),
      size: data.sizeRange,
      estimatedQuantity: adjustedQty,
      application: 'duct',
      basis: data.basis,
      rodDiameter: data.rodDiameter,
      spacingFt: data.spacingFt,
      isRiser: data.isRiser,
    });
  });

  // Add beam clamps
  if (totalBeamClamps > 0) {
    supports.push({
      supportType: 'beam_clamp',
      description: 'Beam Clamp - Universal',
      size: 'Various',
      estimatedQuantity: Math.ceil(totalBeamClamps * 1.1),
      application: 'duct',
      basis: 'One per hanger point (overhead)',
      rodDiameter: null,
      spacingFt: undefined,
      isRiser: false,
    });
  }

  // Add seismic braces
  if (totalSeismicBraces > 0) {
    supports.push({
      supportType: 'seismic_brace',
      description: `Seismic Brace - ${defaultSettings.seismicZone} zone`,
      size: 'Per calculation',
      estimatedQuantity: totalSeismicBraces,
      application: 'duct',
      basis: `Seismic zone: ${defaultSettings.seismicZone}`,
      rodDiameter: null,
      spacingFt: undefined,
      isRiser: false,
    });
  }

  return supports;
}

/**
 * Enhanced pipe support estimation based on MSS SP-58
 */
export function estimatePipeSupports(
  pipeSegments: PipeSegment[],
  settings?: Partial<SupportEstimationSettings>
): SupportBOQItem[] {
  const supports: SupportBOQItem[] = [];

  interface PipeSupportAccumulator {
    sizeRange: string;
    quantity: number;
    rodDiameter: string;
    spacingFt: number;
    isRiser: boolean;
  }

  const horizontalAccum: Map<string, PipeSupportAccumulator> = new Map();
  const riserAccum: Map<string, PipeSupportAccumulator> = new Map();

  let totalLengthFt = 0;
  let totalGuides = 0;
  let totalAnchors = 0;

  pipeSegments.forEach(segment => {
    const lengthFt = segment.length_ft || 0;
    if (lengthFt === 0) return;

    totalLengthFt += lengthFt;
    const nps = segment.nominal_size_in || 2;
    const material = segment.material_type || 'steel';

    // Detect risers from segment name
    const segmentNameUpper = (segment.segment_name || '').toUpperCase();
    const isRiser = segmentNameUpper.includes('RISER') || 
                   segmentNameUpper.includes('VERTICAL') ||
                   segmentNameUpper.includes(' UP') ||
                   segmentNameUpper.includes(' DN');

    const spacingInfo = getPipeSpacing(nps, material, isRiser);
    const hangerCount = Math.ceil(lengthFt / spacingInfo.spacing) + 1;

    const sizeRange = getPipeSizeRange(nps);
    const key = `${sizeRange}_${material.toLowerCase().includes('copper') ? 'copper' : 'steel'}`;

    const accum = isRiser ? riserAccum : horizontalAccum;
    const existing = accum.get(key);
    if (existing) {
      existing.quantity += hangerCount;
    } else {
      accum.set(key, {
        sizeRange,
        quantity: hangerCount,
        rodDiameter: spacingInfo.rodDiameter,
        spacingFt: spacingInfo.spacing,
        isRiser,
      });
    }
  });

  // Estimate guides and anchors
  totalGuides = Math.ceil(totalLengthFt / 100);
  totalAnchors = Math.ceil(totalLengthFt / 200);

  // Convert horizontal hangers
  horizontalAccum.forEach((data, key) => {
    const adjustedQty = Math.ceil(data.quantity * 1.1);
    supports.push({
      supportType: 'clevis',
      description: `Clevis Hanger - ${data.sizeRange}`,
      size: data.sizeRange,
      estimatedQuantity: adjustedQty,
      application: 'pipe',
      basis: `MSS SP-58 - ${data.spacingFt}ft spacing`,
      rodDiameter: data.rodDiameter,
      spacingFt: data.spacingFt,
      isRiser: false,
    });
  });

  // Convert riser supports
  riserAccum.forEach((data) => {
    const adjustedQty = Math.ceil(data.quantity * 1.1);
    supports.push({
      supportType: 'riser_clamp',
      description: `Riser Clamp - ${data.sizeRange}`,
      size: data.sizeRange,
      estimatedQuantity: adjustedQty,
      application: 'pipe',
      basis: `MSS SP-58 Riser - ${data.spacingFt}ft spacing`,
      rodDiameter: data.rodDiameter,
      spacingFt: data.spacingFt,
      isRiser: true,
    });
  });

  // Add guides
  if (totalGuides > 0) {
    supports.push({
      supportType: 'pipe_guide',
      description: 'Pipe Guide',
      size: 'Various',
      estimatedQuantity: totalGuides,
      application: 'pipe',
      basis: 'Est. 1 per 100ft at expansion loops',
      rodDiameter: null,
      spacingFt: 100,
      isRiser: false,
    });
  }

  // Add anchors
  if (totalAnchors > 0) {
    supports.push({
      supportType: 'anchor',
      description: 'Pipe Anchor',
      size: 'Various',
      estimatedQuantity: totalAnchors,
      application: 'pipe',
      basis: 'Est. 1 per 200ft at fixed points',
      rodDiameter: null,
      spacingFt: 200,
      isRiser: false,
    });
  }

  return supports;
}

// Helper functions

function getGaugeFromDimension(maxDim: number): number {
  if (maxDim > 84) return 16;
  if (maxDim > 60) return 18;
  if (maxDim > 30) return 20;
  if (maxDim > 18) return 22;
  if (maxDim > 12) return 24;
  return 26;
}

function getSizeRangeDescription(maxDim: number): string {
  if (maxDim <= 12) return 'Up to 12"';
  if (maxDim <= 18) return '13" - 18"';
  if (maxDim <= 30) return '19" - 30"';
  if (maxDim <= 48) return '31" - 48"';
  if (maxDim <= 60) return '49" - 60"';
  if (maxDim <= 84) return '61" - 84"';
  return 'Over 84"';
}

function getHangerDescription(type: string, isRiser: boolean): string {
  if (isRiser) {
    return 'Riser Clamp - Duct';
  }
  switch (type) {
    case 'trapeze': return 'Trapeze Hanger';
    case 'clevis': return 'Clevis Hanger';
    case 'strap': return 'Strap Hanger';
    default: return 'Support Hanger';
  }
}

function getPipeSizeRange(nps: number): string {
  if (nps <= 1) return '1/2" - 1"';
  if (nps <= 2) return '1-1/4" - 2"';
  if (nps <= 4) return '2-1/2" - 4"';
  if (nps <= 6) return '5" - 6"';
  if (nps <= 10) return '8" - 10"';
  return '12" and larger';
}

/**
 * Aggregate accessories by category
 */
export function aggregateAccessoriesByCategory(
  accessories: AccessoryBOQItem[]
): { category: string; count: number }[] {
  const categoryMap = new Map<string, number>();

  accessories.forEach(acc => {
    const current = categoryMap.get(acc.category) || 0;
    categoryMap.set(acc.category, current + acc.quantity);
  });

  return Array.from(categoryMap.entries()).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1) + 's',
    count,
  }));
}

/**
 * Aggregate fittings by type
 */
export function aggregateFittingsByType(
  ductFittings: { fittingType: string; quantity: number }[],
  pipeFittings: { fittingType: string; quantity: number }[]
): { type: string; count: number }[] {
  const typeMap = new Map<string, number>();

  [...ductFittings, ...pipeFittings].forEach(f => {
    const current = typeMap.get(f.fittingType) || 0;
    typeMap.set(f.fittingType, current + f.quantity);
  });

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
