import { useCallback } from 'react';
import {
  PIPE_DATA,
  PipeMaterial,
  getFluidProperties,
  sizePipeByVelocity,
  sizePipeByFriction,
  calculateSegmentHydraulics,
  calculateVelocity,
  getPipeID,
} from '@/lib/pipe-calculations';

export type PipeSizingMethod = 'velocity' | 'friction_limit' | 'equal_friction';

export interface PipeSizingParams {
  method: PipeSizingMethod;
  targetVelocityFPS?: number;
  maxFrictionPer100ft?: number;
  fluidTempF?: number;
  glycolPercent?: number;
}

export interface SizedSegment {
  nominalSize: number;
  insideDiameter: number;
  velocity: number;
  frictionPer100ft: number;
  totalHeadLoss: number;
  reynoldsNumber: number;
}

export function usePipeSizingMethods() {
  const sizeSegment = useCallback((
    flowGPM: number,
    lengthFt: number,
    material: PipeMaterial,
    params: PipeSizingParams,
    fittingsKTotal: number = 0,
    elevationChangeFt: number = 0
  ): SizedSegment | null => {
    const fluidProps = getFluidProperties(
      params.fluidTempF ?? 45,
      params.glycolPercent ?? 0
    );

    let result;

    switch (params.method) {
      case 'velocity':
        result = sizePipeByVelocity(flowGPM, material, params.targetVelocityFPS ?? 6);
        break;
      case 'friction_limit':
      case 'equal_friction':
        result = sizePipeByFriction(flowGPM, material, fluidProps, params.maxFrictionPer100ft ?? 4);
        break;
      default:
        result = sizePipeByVelocity(flowGPM, material, 6);
    }

    if (!result) return null;

    const hydraulics = calculateSegmentHydraulics(
      flowGPM,
      lengthFt,
      result.diameterIn,
      material,
      fluidProps,
      fittingsKTotal,
      elevationChangeFt
    );

    return {
      nominalSize: result.nominalSize,
      insideDiameter: result.diameterIn,
      velocity: hydraulics.velocity,
      frictionPer100ft: hydraulics.frictionPer100ft,
      totalHeadLoss: hydraulics.totalHeadLossFt,
      reynoldsNumber: hydraulics.reynoldsNumber,
    };
  }, []);

  const recalculateSegment = useCallback((
    flowGPM: number,
    lengthFt: number,
    nominalSize: number,
    material: PipeMaterial,
    fluidTempF: number = 45,
    glycolPercent: number = 0,
    fittingsKTotal: number = 0,
    elevationChangeFt: number = 0
  ): SizedSegment | null => {
    const diameter = getPipeID(material, nominalSize);
    if (!diameter) return null;

    const fluidProps = getFluidProperties(fluidTempF, glycolPercent);
    const hydraulics = calculateSegmentHydraulics(
      flowGPM,
      lengthFt,
      diameter,
      material,
      fluidProps,
      fittingsKTotal,
      elevationChangeFt
    );

    return {
      nominalSize,
      insideDiameter: diameter,
      velocity: hydraulics.velocity,
      frictionPer100ft: hydraulics.frictionPer100ft,
      totalHeadLoss: hydraulics.totalHeadLossFt,
      reynoldsNumber: hydraulics.reynoldsNumber,
    };
  }, []);

  const getMethodDescription = useCallback((method: PipeSizingMethod): string => {
    switch (method) {
      case 'velocity':
        return 'Size pipes to maintain velocity below target (typically 4-8 fps). Good for noise control and erosion prevention.';
      case 'friction_limit':
        return 'Size pipes to limit friction loss per 100 ft (typically 2-4 ft/100ft). Balances pipe cost with pump energy.';
      case 'equal_friction':
        return 'Maintain constant friction rate throughout system. Simplifies balancing but may result in oversized pipes.';
      default:
        return '';
    }
  }, []);

  const getRecommendedSettings = useCallback((method: PipeSizingMethod): { targetVelocityFPS: number; maxFrictionPer100ft: number } => {
    switch (method) {
      case 'velocity':
        return { targetVelocityFPS: 6, maxFrictionPer100ft: 4 };
      case 'friction_limit':
        return { targetVelocityFPS: 8, maxFrictionPer100ft: 4 };
      case 'equal_friction':
        return { targetVelocityFPS: 8, maxFrictionPer100ft: 2.5 };
      default:
        return { targetVelocityFPS: 6, maxFrictionPer100ft: 4 };
    }
  }, []);

  const getAvailableMaterials = useCallback((): { value: PipeMaterial; label: string }[] => {
    return Object.entries(PIPE_DATA).map(([key, data]) => ({
      value: key as PipeMaterial,
      label: data.name,
    }));
  }, []);

  return {
    sizeSegment,
    recalculateSegment,
    getMethodDescription,
    getRecommendedSettings,
    getAvailableMaterials,
  };
}
