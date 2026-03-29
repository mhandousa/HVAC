import { useMemo, useCallback } from 'react';
import {
  sizeRefrigerantLine,
  checkOilReturn,
  calculateEquivalentLength,
  validateVRFSystem,
  REFRIGERANT_FITTINGS,
  ACR_COPPER_SIZES,
  getPipeSizeName,
  type RefrigerantType,
  type LineType,
  type RefrigerantSizingResult,
  type OilReturnResult,
  type ValidationMessage,
} from '@/lib/vrf-refrigerant-calculations';
import type { VRFSystem, VRFIndoorUnit, VRFBranchSelector } from './useVRFSystems';

export interface PipingSizingInput {
  capacityKw: number;
  lengthFt: number;
  equivalentLengthFt?: number;
  isRiser?: boolean;
  elevationChangeFt?: number;
}

export interface SystemSizingSummary {
  totalIndoorCapacity: number;
  outdoorCapacity: number;
  capacityRatio: number;
  totalPipingLength: number;
  maxElevation: number;
  indoorUnitCount: number;
  allUnitsOilReturnOk: boolean;
  validationMessages: ValidationMessage[];
}

export function useVRFPipingSizing(refrigerant: RefrigerantType = 'R410A') {
  
  const sizeLiquidLine = useCallback((input: PipingSizingInput): RefrigerantSizingResult => {
    return sizeRefrigerantLine({
      capacityKw: input.capacityKw,
      lengthFt: input.lengthFt,
      equivalentLengthFt: input.equivalentLengthFt || 0,
      lineType: 'liquid',
      refrigerant,
      isRiser: input.isRiser || false,
      elevationChangeFt: input.elevationChangeFt || 0,
    });
  }, [refrigerant]);
  
  const sizeSuctionLine = useCallback((input: PipingSizingInput): RefrigerantSizingResult => {
    return sizeRefrigerantLine({
      capacityKw: input.capacityKw,
      lengthFt: input.lengthFt,
      equivalentLengthFt: input.equivalentLengthFt || 0,
      lineType: 'suction',
      refrigerant,
      isRiser: input.isRiser || false,
      elevationChangeFt: input.elevationChangeFt || 0,
    });
  }, [refrigerant]);
  
  const sizeDischargeLine = useCallback((input: PipingSizingInput): RefrigerantSizingResult => {
    return sizeRefrigerantLine({
      capacityKw: input.capacityKw,
      lengthFt: input.lengthFt,
      equivalentLengthFt: input.equivalentLengthFt || 0,
      lineType: 'discharge',
      refrigerant,
      isRiser: input.isRiser || false,
      elevationChangeFt: input.elevationChangeFt || 0,
    });
  }, [refrigerant]);
  
  const verifyOilReturn = useCallback((velocity_fps: number, isRiser: boolean): OilReturnResult => {
    return checkOilReturn(velocity_fps, isRiser, refrigerant);
  }, [refrigerant]);
  
  const calculateFittingsEquivalentLength = useCallback((
    fittings: { type: string; quantity: number }[],
    pipeSize: number
  ): number => {
    return calculateEquivalentLength(
      fittings.map(f => ({ ...f, pipeSize }))
    );
  }, []);
  
  const sizeAllUnits = useCallback((
    units: VRFIndoorUnit[],
    branchSelectors: VRFBranchSelector[]
  ): Map<string, { liquid: RefrigerantSizingResult; suction: RefrigerantSizingResult }> => {
    const results = new Map();
    
    for (const unit of units) {
      const isRiser = Math.abs(unit.elevation_from_outdoor_ft) > 0;
      
      const liquidResult = sizeLiquidLine({
        capacityKw: unit.cooling_capacity_kw,
        lengthFt: unit.liquid_line_length_ft,
        equivalentLengthFt: unit.liquid_line_equiv_length_ft,
        isRiser,
        elevationChangeFt: unit.elevation_from_outdoor_ft,
      });
      
      const suctionResult = sizeSuctionLine({
        capacityKw: unit.cooling_capacity_kw,
        lengthFt: unit.suction_line_length_ft || unit.liquid_line_length_ft,
        equivalentLengthFt: unit.suction_line_equiv_length_ft,
        isRiser,
        elevationChangeFt: unit.elevation_from_outdoor_ft,
      });
      
      results.set(unit.id, { liquid: liquidResult, suction: suctionResult });
    }
    
    return results;
  }, [sizeLiquidLine, sizeSuctionLine]);
  
  const calculateSystemSummary = useCallback((
    system: VRFSystem | null,
    units: VRFIndoorUnit[]
  ): SystemSizingSummary => {
    const totalIndoorCapacity = units.reduce((sum, u) => sum + u.cooling_capacity_kw, 0);
    const outdoorCapacity = system?.outdoor_unit_capacity_kw || 0;
    const capacityRatio = outdoorCapacity > 0 ? totalIndoorCapacity / outdoorCapacity : 0;
    
    const totalPipingLength = units.reduce((sum, u) => sum + u.liquid_line_length_ft, 0);
    const maxElevation = Math.max(...units.map(u => Math.abs(u.elevation_from_outdoor_ft)), 0);
    
    const allUnitsOilReturnOk = units.every(u => u.oil_return_ok !== false);
    
    const validationMessages = validateVRFSystem({
      outdoorCapacity,
      totalIndoorCapacity,
      totalPipingLength,
      maxElevation,
      indoorUnitCount: units.length,
      firstBranchLength: units.length > 0 ? Math.min(...units.map(u => u.liquid_line_length_ft)) : 0,
    });
    
    return {
      totalIndoorCapacity,
      outdoorCapacity,
      capacityRatio,
      totalPipingLength,
      maxElevation,
      indoorUnitCount: units.length,
      allUnitsOilReturnOk,
      validationMessages,
    };
  }, []);
  
  return {
    sizeLiquidLine,
    sizeSuctionLine,
    sizeDischargeLine,
    verifyOilReturn,
    calculateFittingsEquivalentLength,
    sizeAllUnits,
    calculateSystemSummary,
    fittingsLibrary: REFRIGERANT_FITTINGS,
    pipeSizes: ACR_COPPER_SIZES,
    getPipeSizeName,
  };
}
