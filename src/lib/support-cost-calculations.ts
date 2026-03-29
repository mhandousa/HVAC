/**
 * Support Cost Calculations
 * Calculates material and labor costs for support BOQ items
 */

import { SupportBOQItem } from '@/types/boq';
import { 
  SUPPORT_COSTS, 
  LABOR_RATES, 
  getSupportCostItem, 
  getSizeMultiplier,
  SupportUnitCost 
} from './support-cost-database';

export interface SupportCostItem {
  supportType: string;
  description: string;
  size: string;
  quantity: number;
  unitOfMeasure: string;
  unitMaterialCost: number;
  unitLaborCost: number;
  extendedMaterialCost: number;
  extendedLaborCost: number;
  totalCost: number;
  costBasis: string;
}

export interface SupportCostSummary {
  items: SupportCostItem[];
  subtotalMaterial: number;
  subtotalLabor: number;
  subtotal: number;
  contingencyPercent: number;
  contingencyAmount: number;
  grandTotal: number;
  currency: 'SAR' | 'USD';
  laborRate: number;
  totalLaborHours: number;
}

export interface CostCalculationOptions {
  currency?: 'SAR' | 'USD';
  contingencyPercent?: number;
  laborRateMultiplier?: number;
  laborRateType?: 'standard' | 'premium' | 'helper';
  includeAccessories?: boolean;
  accessoryFactor?: number; // Multiplier for accessories (nuts, washers, etc.)
}

/**
 * Calculate costs for a list of support items
 */
export function calculateSupportCosts(
  supports: SupportBOQItem[],
  options?: CostCalculationOptions
): SupportCostSummary {
  const currency = options?.currency || 'SAR';
  const contingencyPercent = options?.contingencyPercent ?? 10;
  const laborRateType = options?.laborRateType || 'standard';
  const laborRateMultiplier = options?.laborRateMultiplier ?? 1.0;
  const includeAccessories = options?.includeAccessories ?? true;
  const accessoryFactor = options?.accessoryFactor ?? 0.15; // 15% of material for misc accessories
  
  const laborRates = LABOR_RATES[laborRateType];
  const laborRate = currency === 'SAR' 
    ? laborRates.SAR_per_hour * laborRateMultiplier
    : laborRates.USD_per_hour * laborRateMultiplier;
  
  const costItems: SupportCostItem[] = [];
  let totalMaterial = 0;
  let totalLabor = 0;
  let totalLaborHours = 0;
  
  for (const support of supports) {
    const costData = getSupportCostItem(support.supportType);
    
    if (!costData) {
      // Use default pricing if not found
      const defaultCost = getDefaultCost(support, currency);
      costItems.push(defaultCost);
      totalMaterial += defaultCost.extendedMaterialCost;
      totalLabor += defaultCost.extendedLaborCost;
      totalLaborHours += defaultCost.quantity * 0.5; // Default 0.5 hours
      continue;
    }
    
    const sizeMultiplier = getSizeMultiplier(costData, support.size);
    const baseMaterialCost = currency === 'SAR' ? costData.baseCostSAR : costData.baseCostUSD;
    const unitMaterialCost = baseMaterialCost * sizeMultiplier;
    const unitLaborCost = costData.laborHours * laborRate;
    
    const quantity = support.estimatedQuantity;
    const extendedMaterialCost = unitMaterialCost * quantity;
    const extendedLaborCost = unitLaborCost * quantity;
    
    costItems.push({
      supportType: support.supportType,
      description: costData.description,
      size: support.size,
      quantity,
      unitOfMeasure: costData.unitOfMeasure,
      unitMaterialCost: Math.round(unitMaterialCost * 100) / 100,
      unitLaborCost: Math.round(unitLaborCost * 100) / 100,
      extendedMaterialCost: Math.round(extendedMaterialCost * 100) / 100,
      extendedLaborCost: Math.round(extendedLaborCost * 100) / 100,
      totalCost: Math.round((extendedMaterialCost + extendedLaborCost) * 100) / 100,
      costBasis: `${costData.id} @ ${currency} ${baseMaterialCost.toFixed(2)} base`,
    });
    
    totalMaterial += extendedMaterialCost;
    totalLabor += extendedLaborCost;
    totalLaborHours += costData.laborHours * quantity;
  }
  
  // Add accessories if enabled
  if (includeAccessories && totalMaterial > 0) {
    const accessoryCost = totalMaterial * accessoryFactor;
    const accessoryLaborHours = totalLaborHours * 0.1; // 10% additional labor for accessories
    const accessoryLabor = accessoryLaborHours * laborRate;
    
    costItems.push({
      supportType: 'accessories',
      description: 'Misc. Accessories (nuts, washers, hardware)',
      size: 'Assorted',
      quantity: 1,
      unitOfMeasure: 'lot',
      unitMaterialCost: Math.round(accessoryCost * 100) / 100,
      unitLaborCost: Math.round(accessoryLabor * 100) / 100,
      extendedMaterialCost: Math.round(accessoryCost * 100) / 100,
      extendedLaborCost: Math.round(accessoryLabor * 100) / 100,
      totalCost: Math.round((accessoryCost + accessoryLabor) * 100) / 100,
      costBasis: `${(accessoryFactor * 100).toFixed(0)}% of material`,
    });
    
    totalMaterial += accessoryCost;
    totalLabor += accessoryLabor;
    totalLaborHours += accessoryLaborHours;
  }
  
  const subtotal = totalMaterial + totalLabor;
  const contingencyAmount = subtotal * (contingencyPercent / 100);
  const grandTotal = subtotal + contingencyAmount;
  
  return {
    items: costItems,
    subtotalMaterial: Math.round(totalMaterial * 100) / 100,
    subtotalLabor: Math.round(totalLabor * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    contingencyPercent,
    contingencyAmount: Math.round(contingencyAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    currency,
    laborRate: Math.round(laborRate * 100) / 100,
    totalLaborHours: Math.round(totalLaborHours * 10) / 10,
  };
}

/**
 * Get default cost for unknown support types
 */
function getDefaultCost(support: SupportBOQItem, currency: 'SAR' | 'USD'): SupportCostItem {
  const baseCost = currency === 'SAR' ? 50 : 13.50;
  const laborHours = 0.5;
  const laborRate = currency === 'SAR' ? LABOR_RATES.standard.SAR_per_hour : LABOR_RATES.standard.USD_per_hour;
  const laborCost = laborHours * laborRate;
  
  return {
    supportType: support.supportType,
    description: support.description,
    size: support.size,
    quantity: support.estimatedQuantity,
    unitOfMeasure: 'each',
    unitMaterialCost: baseCost,
    unitLaborCost: laborCost,
    extendedMaterialCost: baseCost * support.estimatedQuantity,
    extendedLaborCost: laborCost * support.estimatedQuantity,
    totalCost: (baseCost + laborCost) * support.estimatedQuantity,
    costBasis: 'Default estimate',
  };
}

/**
 * Calculate threaded rod requirements
 */
export interface ThreadedRodRequirement {
  rodDiameter: string;
  totalLengthFt: number;
  cutPieces: number;
  avgDropLengthFt: number;
  materialCost: number;
  laborCost: number;
}

export function calculateThreadedRodCost(
  hangerCount: number,
  avgDropLengthFt: number,
  rodDiameter: string,
  currency: 'SAR' | 'USD'
): ThreadedRodRequirement {
  const rodCost = SUPPORT_COSTS.threaded_rod;
  const sizeMultiplier = getSizeMultiplier(rodCost, rodDiameter);
  const baseCost = currency === 'SAR' ? rodCost.baseCostSAR : rodCost.baseCostUSD;
  const unitCost = baseCost * sizeMultiplier;
  
  // Each hanger needs 2 rods (or 1 for clevis)
  const totalLength = hangerCount * avgDropLengthFt * 1.5; // 1.5x for wastage and adjustments
  const laborRate = currency === 'SAR' ? LABOR_RATES.standard.SAR_per_hour : LABOR_RATES.standard.USD_per_hour;
  
  return {
    rodDiameter,
    totalLengthFt: Math.ceil(totalLength),
    cutPieces: hangerCount * 2,
    avgDropLengthFt,
    materialCost: Math.round(totalLength * unitCost * 100) / 100,
    laborCost: Math.round(hangerCount * rodCost.laborHours * laborRate * 100) / 100,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: 'SAR' | 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get cost summary statistics
 */
export interface CostStatistics {
  avgCostPerSupport: number;
  materialPercent: number;
  laborPercent: number;
  mostExpensiveItem: string;
  leastExpensiveItem: string;
}

export function getCostStatistics(summary: SupportCostSummary): CostStatistics {
  const totalQuantity = summary.items.reduce((sum, item) => sum + item.quantity, 0);
  const avgCostPerSupport = totalQuantity > 0 ? summary.subtotal / totalQuantity : 0;
  
  const materialPercent = summary.subtotal > 0 
    ? (summary.subtotalMaterial / summary.subtotal) * 100 
    : 0;
  const laborPercent = summary.subtotal > 0 
    ? (summary.subtotalLabor / summary.subtotal) * 100 
    : 0;
  
  const sortedByTotal = [...summary.items].sort((a, b) => b.totalCost - a.totalCost);
  const mostExpensiveItem = sortedByTotal[0]?.description || 'N/A';
  const leastExpensiveItem = sortedByTotal[sortedByTotal.length - 1]?.description || 'N/A';
  
  return {
    avgCostPerSupport: Math.round(avgCostPerSupport * 100) / 100,
    materialPercent: Math.round(materialPercent * 10) / 10,
    laborPercent: Math.round(laborPercent * 10) / 10,
    mostExpensiveItem,
    leastExpensiveItem,
  };
}
