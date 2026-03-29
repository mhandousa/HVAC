import { useMemo } from 'react';
import { LoadCalculationWithZone } from './useLoadCalculationsWithZones';

export interface TerminalUnitForValidation {
  id: string;
  unit_tag: string;
  zone_id: string | null;
  zone_name?: string;
  building_name?: string;
  floor_name?: string;
  supply_cfm: number | null;
  quantity: number;
  cooling_load_btuh: number | null;
  heating_load_btuh: number | null;
}

export interface CFMValidationResult {
  unitId: string;
  unitTag: string;
  zoneId: string | null;
  zoneName: string;
  buildingName: string;
  floorName: string;
  
  // Terminal Unit Values (total = per unit × quantity)
  terminalSupplyCfm: number;
  terminalCoolingBtuh: number;
  terminalHeatingBtuh: number;
  
  // Load Calc Requirements
  requiredCfm: number | null;
  requiredCoolingBtuh: number | null;
  requiredHeatingBtuh: number | null;
  
  // Variance
  cfmVariancePercent: number | null;
  cfmVarianceAbsolute: number | null;
  coolingVariancePercent: number | null;
  heatingVariancePercent: number | null;
  
  // Status
  status: 'pass' | 'warning' | 'error' | 'no_data';
  messages: string[];
}

export interface ValidationSummary {
  totalUnits: number;
  passCount: number;
  warningCount: number;
  errorCount: number;
  noDataCount: number;
  totalCfmVariance: number; // Total CFM difference across all zones
  totalRequiredCfm: number;
  totalSuppliedCfm: number;
}

export interface ValidationThresholds {
  passPercent: number;    // ≤ this = pass (default 5%)
  warningPercent: number; // ≤ this = warning, > this = error (default 15%)
}

const DEFAULT_THRESHOLDS: ValidationThresholds = {
  passPercent: 5,
  warningPercent: 15,
};

function calculateStatus(
  variancePercent: number | null,
  thresholds: ValidationThresholds
): 'pass' | 'warning' | 'error' {
  if (variancePercent === null) return 'pass';
  
  const absVariance = Math.abs(variancePercent);
  
  if (absVariance <= thresholds.passPercent) {
    return 'pass';
  } else if (absVariance <= thresholds.warningPercent) {
    return 'warning';
  } else {
    return 'error';
  }
}

function generateMessages(
  cfmVariancePercent: number | null,
  requiredCfm: number | null,
  terminalCfm: number,
  thresholds: ValidationThresholds
): string[] {
  const messages: string[] = [];
  
  if (requiredCfm === null) {
    messages.push('No load calculation found for this zone');
    return messages;
  }
  
  if (requiredCfm === 0) {
    messages.push('Zone load calculation has 0 CFM requirement');
    return messages;
  }
  
  if (cfmVariancePercent === null) {
    return messages;
  }
  
  const absVariance = Math.abs(cfmVariancePercent);
  const cfmDiff = terminalCfm - requiredCfm;
  
  if (absVariance <= thresholds.passPercent) {
    messages.push(`CFM within tolerance (${cfmVariancePercent > 0 ? '+' : ''}${cfmVariancePercent.toFixed(1)}%)`);
  } else if (absVariance <= thresholds.warningPercent) {
    if (cfmVariancePercent > 0) {
      messages.push(`CFM is ${cfmVariancePercent.toFixed(1)}% higher than required (+${cfmDiff.toFixed(0)} CFM)`);
    } else {
      messages.push(`CFM is ${absVariance.toFixed(1)}% lower than required (${cfmDiff.toFixed(0)} CFM)`);
    }
  } else {
    if (cfmVariancePercent > 0) {
      messages.push(`CFM significantly oversized (+${cfmVariancePercent.toFixed(1)}%, +${cfmDiff.toFixed(0)} CFM)`);
    } else {
      messages.push(`CFM significantly undersized (${cfmVariancePercent.toFixed(1)}%, ${cfmDiff.toFixed(0)} CFM)`);
    }
  }
  
  return messages;
}

export function validateTerminalUnits(
  terminalUnits: TerminalUnitForValidation[],
  loadCalcs: LoadCalculationWithZone[],
  thresholds: ValidationThresholds = DEFAULT_THRESHOLDS
): CFMValidationResult[] {
  // Create a map of zone_id to load calculation for quick lookup
  const loadCalcByZone = new Map<string, LoadCalculationWithZone>();
  loadCalcs.forEach(lc => {
    if (lc.zone_id) {
      loadCalcByZone.set(lc.zone_id, lc);
    }
  });
  
  return terminalUnits.map(unit => {
    const loadCalc = unit.zone_id ? loadCalcByZone.get(unit.zone_id) : null;
    
    // Calculate terminal unit totals (per unit × quantity)
    const terminalSupplyCfm = (unit.supply_cfm || 0) * unit.quantity;
    const terminalCoolingBtuh = (unit.cooling_load_btuh || 0) * unit.quantity;
    const terminalHeatingBtuh = (unit.heating_load_btuh || 0) * unit.quantity;
    
    // Get requirements from load calc
    const requiredCfm = loadCalc?.cfm_required ?? null;
    const requiredCoolingBtuh = loadCalc?.cooling_load_btuh ?? null;
    const requiredHeatingBtuh = loadCalc?.heating_load_btuh ?? null;
    
    // Calculate variances
    let cfmVariancePercent: number | null = null;
    let cfmVarianceAbsolute: number | null = null;
    let coolingVariancePercent: number | null = null;
    let heatingVariancePercent: number | null = null;
    
    if (requiredCfm !== null && requiredCfm > 0) {
      cfmVariancePercent = ((terminalSupplyCfm - requiredCfm) / requiredCfm) * 100;
      cfmVarianceAbsolute = terminalSupplyCfm - requiredCfm;
    }
    
    if (requiredCoolingBtuh !== null && requiredCoolingBtuh > 0) {
      coolingVariancePercent = ((terminalCoolingBtuh - requiredCoolingBtuh) / requiredCoolingBtuh) * 100;
    }
    
    if (requiredHeatingBtuh !== null && requiredHeatingBtuh > 0) {
      heatingVariancePercent = ((terminalHeatingBtuh - requiredHeatingBtuh) / requiredHeatingBtuh) * 100;
    }
    
    // Determine status
    let status: 'pass' | 'warning' | 'error' | 'no_data';
    
    if (!unit.zone_id || !loadCalc) {
      status = 'no_data';
    } else if (requiredCfm === null || requiredCfm === 0) {
      status = 'warning'; // Has zone but no CFM requirement
    } else {
      status = calculateStatus(cfmVariancePercent, thresholds);
    }
    
    // Generate messages
    const messages = generateMessages(cfmVariancePercent, requiredCfm, terminalSupplyCfm, thresholds);
    
    return {
      unitId: unit.id,
      unitTag: unit.unit_tag,
      zoneId: unit.zone_id,
      zoneName: unit.zone_name || loadCalc?.zone_name || 'Unknown Zone',
      buildingName: unit.building_name || loadCalc?.building_name || '',
      floorName: unit.floor_name || loadCalc?.floor_name || '',
      terminalSupplyCfm,
      terminalCoolingBtuh,
      terminalHeatingBtuh,
      requiredCfm,
      requiredCoolingBtuh,
      requiredHeatingBtuh,
      cfmVariancePercent,
      cfmVarianceAbsolute,
      coolingVariancePercent,
      heatingVariancePercent,
      status,
      messages,
    };
  });
}

export function calculateValidationSummary(
  validationResults: CFMValidationResult[]
): ValidationSummary {
  const summary: ValidationSummary = {
    totalUnits: validationResults.length,
    passCount: 0,
    warningCount: 0,
    errorCount: 0,
    noDataCount: 0,
    totalCfmVariance: 0,
    totalRequiredCfm: 0,
    totalSuppliedCfm: 0,
  };
  
  validationResults.forEach(result => {
    switch (result.status) {
      case 'pass':
        summary.passCount++;
        break;
      case 'warning':
        summary.warningCount++;
        break;
      case 'error':
        summary.errorCount++;
        break;
      case 'no_data':
        summary.noDataCount++;
        break;
    }
    
    summary.totalSuppliedCfm += result.terminalSupplyCfm;
    if (result.requiredCfm !== null) {
      summary.totalRequiredCfm += result.requiredCfm;
      summary.totalCfmVariance += result.cfmVarianceAbsolute || 0;
    }
  });
  
  return summary;
}

export function useTerminalUnitValidation(
  terminalUnits: TerminalUnitForValidation[],
  loadCalcs: LoadCalculationWithZone[],
  thresholds?: ValidationThresholds
) {
  const validationResults = useMemo(() => {
    if (!terminalUnits.length) return [];
    return validateTerminalUnits(terminalUnits, loadCalcs, thresholds);
  }, [terminalUnits, loadCalcs, thresholds]);
  
  const summary = useMemo(() => {
    return calculateValidationSummary(validationResults);
  }, [validationResults]);
  
  const validationByUnitId = useMemo(() => {
    const map = new Map<string, CFMValidationResult>();
    validationResults.forEach(result => {
      map.set(result.unitId, result);
    });
    return map;
  }, [validationResults]);
  
  return {
    validationResults,
    summary,
    validationByUnitId,
    hasIssues: summary.warningCount > 0 || summary.errorCount > 0,
    hasErrors: summary.errorCount > 0,
  };
}
