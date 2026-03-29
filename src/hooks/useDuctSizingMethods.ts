import { useMemo, useCallback } from 'react';
import {
  sizeDuctEqualFriction,
  sizeDuctVelocity,
  sizeDuctStaticRegain,
  roundToStandardSize,
  equivalentRectangular,
  calculateSegmentPressureLoss,
  cfmToM3s,
  getRecommendedVelocity,
  calculateVelocity,
  roundDuctArea,
  DUCT_MATERIALS,
} from '@/lib/duct-calculations';

export type SizingMethod = 'equal_friction' | 'velocity' | 'static_regain';

export interface DuctSegmentInput {
  id: string;
  segmentName: string;
  airflowCfm: number;
  lengthFt: number;
  fittingCoefficients: number[];
  segmentType?: 'main' | 'branch' | 'terminal';
  parentSegmentId?: string;
}

export interface DuctSegmentResult extends DuctSegmentInput {
  diameterMm: number;
  diameterIn: number;
  widthMm?: number;
  heightMm?: number;
  widthIn?: number;
  heightIn?: number;
  velocityMs: number;
  velocityFpm: number;
  frictionLossPa: number;
  dynamicLossPa: number;
  totalPressureLossPa: number;
  totalPressureLossInWg: number;
}

export interface SizingMethodConfig {
  method: SizingMethod;
  targetFrictionPaPerM?: number; // For equal friction
  targetFrictionInWgPer100Ft?: number; // Alternative unit
  targetVelocityMs?: number; // For velocity method
  targetVelocityFpm?: number; // Alternative unit
  initialVelocityMs?: number; // For static regain
  finalVelocityMs?: number; // For velocity reduction method
  maxVelocityMs?: number; // Maximum velocity limit
  regainFactor?: number; // For static regain (default 0.75)
  ductShape: 'round' | 'rectangular';
  aspectRatio?: number; // For rectangular ducts
  materialType?: string;
}

export function useDuctSizingMethods() {
  /**
   * Size a single duct segment based on selected method
   */
  const sizeSegment = useCallback((
    segment: DuctSegmentInput,
    config: SizingMethodConfig,
    previousResult?: DuctSegmentResult
  ): DuctSegmentResult => {
    const airflowM3s = cfmToM3s(segment.airflowCfm);
    const lengthM = segment.lengthFt * 0.3048;
    const material = DUCT_MATERIALS[config.materialType || 'galvanized_steel'];
    
    let diameterMm: number;
    let velocityMs: number;

    switch (config.method) {
      case 'equal_friction': {
        // Convert friction rate if provided in imperial
        const frictionPaPerM = config.targetFrictionPaPerM || 
          (config.targetFrictionInWgPer100Ft ? config.targetFrictionInWgPer100Ft * 8.176 : 1.0);
        
        diameterMm = sizeDuctEqualFriction(airflowM3s, frictionPaPerM, material.roughness_mm);
        diameterMm = roundToStandardSize(diameterMm);
        velocityMs = calculateVelocity(airflowM3s, roundDuctArea(diameterMm));
        break;
      }

      case 'velocity': {
        // Convert velocity if provided in FPM
        const targetVelocity = config.targetVelocityMs || 
          (config.targetVelocityFpm ? config.targetVelocityFpm * 0.00508 : 6);
        
        // Adjust velocity based on segment type
        const velocityReduction = {
          main: 1.0,
          branch: 0.75,
          terminal: 0.5,
        };
        const adjustedVelocity = targetVelocity * (velocityReduction[segment.segmentType || 'branch'] || 1);
        
        diameterMm = sizeDuctVelocity(airflowM3s, adjustedVelocity);
        diameterMm = roundToStandardSize(diameterMm);
        velocityMs = calculateVelocity(airflowM3s, roundDuctArea(diameterMm));
        break;
      }

      case 'static_regain': {
        const initialVelocity = config.initialVelocityMs || 10;
        const regainFactor = config.regainFactor || 0.75;
        
        if (previousResult && segment.parentSegmentId) {
          // Use parent segment velocity for regain calculation
          const result = sizeDuctStaticRegain(
            airflowM3s,
            previousResult.velocityMs,
            lengthM,
            previousResult.diameterMm,
            regainFactor
          );
          diameterMm = roundToStandardSize(result.diameter);
          velocityMs = result.velocity;
        } else {
          // First segment - use initial velocity
          diameterMm = sizeDuctVelocity(airflowM3s, initialVelocity);
          diameterMm = roundToStandardSize(diameterMm);
          velocityMs = calculateVelocity(airflowM3s, roundDuctArea(diameterMm));
        }
        break;
      }

      default:
        diameterMm = 200;
        velocityMs = 5;
    }

    // Calculate pressure losses
    const pressureLoss = calculateSegmentPressureLoss(
      airflowM3s,
      lengthM,
      diameterMm,
      segment.fittingCoefficients,
      material.roughness_mm
    );

    // Calculate rectangular equivalent if needed
    let widthMm: number | undefined;
    let heightMm: number | undefined;
    
    if (config.ductShape === 'rectangular') {
      const rect = equivalentRectangular(diameterMm, config.aspectRatio || 2);
      widthMm = rect.width;
      heightMm = rect.height;
    }

    return {
      ...segment,
      diameterMm,
      diameterIn: Math.round(diameterMm / 25.4 * 10) / 10,
      widthMm,
      heightMm,
      widthIn: widthMm ? Math.round(widthMm / 25.4 * 10) / 10 : undefined,
      heightIn: heightMm ? Math.round(heightMm / 25.4 * 10) / 10 : undefined,
      velocityMs: Math.round(velocityMs * 100) / 100,
      velocityFpm: Math.round(velocityMs / 0.00508),
      frictionLossPa: Math.round(pressureLoss.frictionLoss * 100) / 100,
      dynamicLossPa: Math.round(pressureLoss.dynamicLoss * 100) / 100,
      totalPressureLossPa: Math.round(pressureLoss.totalLoss * 100) / 100,
      totalPressureLossInWg: Math.round(pressureLoss.totalLoss / 249.089 * 1000) / 1000,
    };
  }, []);

  /**
   * Size all segments in a system
   */
  const sizeSystem = useCallback((
    segments: DuctSegmentInput[],
    config: SizingMethodConfig
  ): DuctSegmentResult[] => {
    const results: DuctSegmentResult[] = [];
    const resultMap = new Map<string, DuctSegmentResult>();

    // Sort segments to process parents before children
    const sortedSegments = [...segments].sort((a, b) => {
      if (!a.parentSegmentId && b.parentSegmentId) return -1;
      if (a.parentSegmentId && !b.parentSegmentId) return 1;
      return 0;
    });

    for (const segment of sortedSegments) {
      const parentResult = segment.parentSegmentId 
        ? resultMap.get(segment.parentSegmentId) 
        : undefined;
      
      const result = sizeSegment(segment, config, parentResult);
      results.push(result);
      resultMap.set(segment.id, result);
    }

    return results;
  }, [sizeSegment]);

  /**
   * Get sizing method description
   */
  const getMethodDescription = useCallback((method: SizingMethod): string => {
    const descriptions: Record<SizingMethod, string> = {
      equal_friction: 'Maintains constant friction rate throughout the system. Simple and widely used for most HVAC applications.',
      velocity: 'Uses stepped velocity reduction from main to branch to terminal. Good for noise-sensitive applications.',
      static_regain: 'Reduces velocity at each branch to regain static pressure. Most energy efficient for large systems.',
    };
    return descriptions[method];
  }, []);

  /**
   * Get recommended settings for a method
   */
  const getRecommendedSettings = useCallback((
    method: SizingMethod,
    application: string = 'branch_supply'
  ): Partial<SizingMethodConfig> => {
    const velocity = getRecommendedVelocity(application);

    switch (method) {
      case 'equal_friction':
        return {
          targetFrictionPaPerM: 1.0,
          targetFrictionInWgPer100Ft: 0.08,
        };
      case 'velocity':
        return {
          targetVelocityMs: velocity.typical,
          targetVelocityFpm: Math.round(velocity.typical / 0.00508),
        };
      case 'static_regain':
        return {
          initialVelocityMs: velocity.max,
          regainFactor: 0.75,
        };
      default:
        return {};
    }
  }, []);

  return {
    sizeSegment,
    sizeSystem,
    getMethodDescription,
    getRecommendedSettings,
  };
}
