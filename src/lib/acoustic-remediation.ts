// Acoustic remediation recommendation logic

import { 
  SilencerModel, 
  DuctModification, 
  SILENCER_CATALOG, 
  DUCT_MODIFICATIONS 
} from './acoustic-remediation-data';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

// Re-export types for external use
export type { SilencerModel, DuctModification };

export interface AcousticRecommendation {
  id: string;
  type: 'silencer' | 'duct-mod' | 'equipment-change';
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  expectedAttenuation: number;
  additionalPressureDrop: number;
  costEstimate: '$' | '$$' | '$$$';
  applicableUnits: string[];
  specificProduct?: SilencerModel;
  modificationType?: DuctModification;
}

export interface FloorRemediationSummary {
  zonesRequiringTreatment: number;
  totalSilencersNeeded: number;
  silencerBreakdown: { model: string; count: number }[];
  ductModifications: { name: string; count: number }[];
  totalPressureImpact: number;
  estimatedTotalCost: '$' | '$$' | '$$$' | '$$$$';
}

// Estimate duct size from terminal unit CFM
function estimateDuctSizeIn(maxCfm: number | null): number {
  if (!maxCfm) return 10; // Default 10"
  
  // Roughly: Area = CFM / velocity (assume 1200 FPM)
  // Diameter = 2 * sqrt(Area / π)
  const area = maxCfm / 1200;
  const diameter = 2 * Math.sqrt(area / Math.PI) * 12; // Convert to inches
  
  // Round to nearest standard size
  if (diameter <= 6) return 6;
  if (diameter <= 8) return 8;
  if (diameter <= 10) return 10;
  if (diameter <= 12) return 12;
  if (diameter <= 14) return 14;
  if (diameter <= 16) return 16;
  return 18;
}

// Select appropriate silencers for the attenuation needed
function selectSilencers(
  attenuationNeeded: number,
  ductSizeIn: number,
  maxPressureDrop?: number
): SilencerModel[] {
  return SILENCER_CATALOG
    .filter(s => ductSizeIn >= s.sizeRange.minIn && ductSizeIn <= s.sizeRange.maxIn)
    .filter(s => s.insertionLoss >= attenuationNeeded * 0.7) // At least 70% coverage
    .filter(s => !maxPressureDrop || s.pressureDropIn <= maxPressureDrop)
    .sort((a, b) => {
      // Prefer minimum length that meets attenuation, then by cost
      if (a.insertionLoss >= attenuationNeeded && b.insertionLoss >= attenuationNeeded) {
        if (a.lengthFt !== b.lengthFt) return a.lengthFt - b.lengthFt;
        return a.pressureDropIn - b.pressureDropIn;
      }
      return b.insertionLoss - a.insertionLoss;
    });
}

// Get applicable duct modifications for terminal unit types
function getApplicableDuctMods(
  unitTypes: string[],
  attenuationNeeded: number
): DuctModification[] {
  const hasVAV = unitTypes.some(t => t?.toLowerCase().includes('vav'));
  const hasFCU = unitTypes.some(t => t?.toLowerCase().includes('fcu'));
  
  return DUCT_MODIFICATIONS
    .filter(mod => {
      if (mod.applicability.includes('all')) return true;
      if (hasVAV && mod.applicability.includes('vav')) return true;
      if (hasFCU && mod.applicability.includes('fcu')) return true;
      return false;
    })
    .sort((a, b) => b.effectivenessPerDollar - a.effectivenessPerDollar);
}

// Generate recommendations for low attenuation needs (1-5 dB)
function getLowAttenuationRecommendations(
  zone: ZoneAcousticData,
  ductSize: number
): AcousticRecommendation[] {
  const recommendations: AcousticRecommendation[] = [];
  const unitTypes = zone.terminalUnits.map(u => u.unitType);
  const unitTags = zone.terminalUnits.map(u => u.unitTag);
  
  const applicableMods = getApplicableDuctMods(unitTypes, zone.ncDelta);
  
  // Priority 1: Best value duct modification
  if (applicableMods.length > 0) {
    const bestMod = applicableMods[0];
    recommendations.push({
      id: `${zone.zoneId}-${bestMod.id}`,
      type: 'duct-mod',
      priority: 1,
      title: bestMod.name,
      description: bestMod.description,
      expectedAttenuation: bestMod.attenuationDb,
      additionalPressureDrop: bestMod.pressureDropIn,
      costEstimate: bestMod.costEstimate,
      applicableUnits: unitTags,
      modificationType: bestMod,
    });
  }
  
  // Priority 2: NC-rated diffuser if applicable
  const ncDiffuser = DUCT_MODIFICATIONS.find(m => m.id === 'nc-rated-diffuser');
  if (ncDiffuser && unitTypes.some(t => t?.includes('vav'))) {
    recommendations.push({
      id: `${zone.zoneId}-nc-diffuser`,
      type: 'duct-mod',
      priority: 2,
      title: ncDiffuser.name,
      description: ncDiffuser.description,
      expectedAttenuation: ncDiffuser.attenuationDb,
      additionalPressureDrop: ncDiffuser.pressureDropIn,
      costEstimate: ncDiffuser.costEstimate,
      applicableUnits: unitTags.filter((_, i) => unitTypes[i]?.includes('vav')),
      modificationType: ncDiffuser,
    });
  }
  
  // Priority 3: Small silencer as backup
  const silencers = selectSilencers(zone.ncDelta, ductSize);
  if (silencers.length > 0) {
    const silencer = silencers[0];
    recommendations.push({
      id: `${zone.zoneId}-silencer-${silencer.id}`,
      type: 'silencer',
      priority: 3,
      title: `${silencer.model} Silencer`,
      description: `Install ${silencer.lengthFt}ft ${silencer.type} sound attenuator upstream of terminal units`,
      expectedAttenuation: silencer.insertionLoss,
      additionalPressureDrop: silencer.pressureDropIn,
      costEstimate: silencer.estimatedCost,
      applicableUnits: unitTags,
      specificProduct: silencer,
    });
  }
  
  return recommendations;
}

// Generate recommendations for medium attenuation needs (6-10 dB)
function getMediumAttenuationRecommendations(
  zone: ZoneAcousticData,
  ductSize: number
): AcousticRecommendation[] {
  const recommendations: AcousticRecommendation[] = [];
  const unitTypes = zone.terminalUnits.map(u => u.unitType);
  const unitTags = zone.terminalUnits.map(u => u.unitTag);
  
  // Priority 1: Silencer (primary solution)
  const silencers = selectSilencers(zone.ncDelta, ductSize);
  if (silencers.length > 0) {
    const silencer = silencers[0];
    recommendations.push({
      id: `${zone.zoneId}-silencer-${silencer.id}`,
      type: 'silencer',
      priority: 1,
      title: `${silencer.model} Silencer`,
      description: `Install ${silencer.lengthFt}ft ${silencer.type} sound attenuator upstream of terminal units. Insertion loss: ${silencer.insertionLoss} dB`,
      expectedAttenuation: silencer.insertionLoss,
      additionalPressureDrop: silencer.pressureDropIn,
      costEstimate: silencer.estimatedCost,
      applicableUnits: unitTags,
      specificProduct: silencer,
    });
  }
  
  // Priority 2: Duct lining combo
  const linedDuct = DUCT_MODIFICATIONS.find(m => m.id === 'lined-duct-2in');
  if (linedDuct) {
    recommendations.push({
      id: `${zone.zoneId}-lined-duct`,
      type: 'duct-mod',
      priority: 2,
      title: linedDuct.name,
      description: linedDuct.description,
      expectedAttenuation: linedDuct.attenuationDb,
      additionalPressureDrop: linedDuct.pressureDropIn,
      costEstimate: linedDuct.costEstimate,
      applicableUnits: unitTags,
      modificationType: linedDuct,
    });
  }
  
  // Priority 3: VAV upsizing or FCU speed reduction
  const hasVAV = unitTypes.some(t => t?.includes('vav'));
  const hasFCU = unitTypes.some(t => t?.includes('fcu'));
  
  if (hasVAV) {
    const vavUpsize = DUCT_MODIFICATIONS.find(m => m.id === 'vav-upsizing');
    if (vavUpsize) {
      recommendations.push({
        id: `${zone.zoneId}-vav-upsize`,
        type: 'equipment-change',
        priority: 3,
        title: vavUpsize.name,
        description: vavUpsize.description,
        expectedAttenuation: vavUpsize.attenuationDb,
        additionalPressureDrop: vavUpsize.pressureDropIn,
        costEstimate: vavUpsize.costEstimate,
        applicableUnits: unitTags.filter((_, i) => unitTypes[i]?.includes('vav')),
        modificationType: vavUpsize,
      });
    }
  } else if (hasFCU) {
    const fcuSpeed = DUCT_MODIFICATIONS.find(m => m.id === 'fcu-speed-reduction');
    if (fcuSpeed) {
      recommendations.push({
        id: `${zone.zoneId}-fcu-speed`,
        type: 'equipment-change',
        priority: 3,
        title: fcuSpeed.name,
        description: fcuSpeed.description,
        expectedAttenuation: fcuSpeed.attenuationDb,
        additionalPressureDrop: fcuSpeed.pressureDropIn,
        costEstimate: fcuSpeed.costEstimate,
        applicableUnits: unitTags.filter((_, i) => unitTypes[i]?.includes('fcu')),
        modificationType: fcuSpeed,
      });
    }
  }
  
  return recommendations;
}

// Generate recommendations for high attenuation needs (10+ dB)
function getHighAttenuationRecommendations(
  zone: ZoneAcousticData,
  ductSize: number
): AcousticRecommendation[] {
  const recommendations: AcousticRecommendation[] = [];
  const unitTypes = zone.terminalUnits.map(u => u.unitType);
  const unitTags = zone.terminalUnits.map(u => u.unitTag);
  
  // Priority 1: Large silencer (5ft)
  const silencers = selectSilencers(zone.ncDelta, ductSize);
  const largeSilencer = silencers.find(s => s.lengthFt === 5) || silencers[0];
  
  if (largeSilencer) {
    recommendations.push({
      id: `${zone.zoneId}-silencer-${largeSilencer.id}`,
      type: 'silencer',
      priority: 1,
      title: `${largeSilencer.model} Silencer (Recommended)`,
      description: `Install ${largeSilencer.lengthFt}ft ${largeSilencer.type} sound attenuator upstream of terminal units. High attenuation required.`,
      expectedAttenuation: largeSilencer.insertionLoss,
      additionalPressureDrop: largeSilencer.pressureDropIn,
      costEstimate: largeSilencer.estimatedCost,
      applicableUnits: unitTags,
      specificProduct: largeSilencer,
    });
  }
  
  // Priority 2: Combination treatment
  const linedDuct = DUCT_MODIFICATIONS.find(m => m.id === 'lined-duct-2in');
  const plenumBoot = DUCT_MODIFICATIONS.find(m => m.id === 'plenum-boot');
  
  if (linedDuct && plenumBoot) {
    recommendations.push({
      id: `${zone.zoneId}-combo-treatment`,
      type: 'duct-mod',
      priority: 2,
      title: 'Combination Treatment',
      description: `${linedDuct.name} + ${plenumBoot.name}: Combined effect of ${linedDuct.attenuationDb + plenumBoot.attenuationDb} dB attenuation`,
      expectedAttenuation: linedDuct.attenuationDb + plenumBoot.attenuationDb,
      additionalPressureDrop: linedDuct.pressureDropIn + plenumBoot.pressureDropIn,
      costEstimate: '$$',
      applicableUnits: unitTags,
    });
  }
  
  // Priority 3: Equipment relocation notice
  recommendations.push({
    id: `${zone.zoneId}-equipment-relocation`,
    type: 'equipment-change',
    priority: 3,
    title: 'Consider Equipment Relocation',
    description: `High NC delta (${zone.ncDelta} dB) may require relocating terminal units or considering architectural acoustic treatment (ceiling panels, wall absorption)`,
    expectedAttenuation: zone.ncDelta,
    additionalPressureDrop: 0,
    costEstimate: '$$$',
    applicableUnits: unitTags,
  });
  
  return recommendations;
}

// Main function to generate acoustic recommendations
export function generateAcousticRecommendations(
  zone: ZoneAcousticData
): AcousticRecommendation[] {
  if (zone.ncDelta <= 0 || zone.status === 'acceptable') {
    return []; // Zone already compliant
  }
  
  if (zone.terminalUnits.length === 0) {
    return []; // No terminal units to analyze
  }
  
  // Estimate duct size from largest terminal unit
  const maxCfm = Math.max(
    ...zone.terminalUnits.map(u => {
      // Parse CFM from unit data if available
      return 500; // Default estimate
    })
  );
  const ductSize = estimateDuctSizeIn(maxCfm);
  
  // Strategy varies by attenuation needed
  if (zone.ncDelta <= 5) {
    return getLowAttenuationRecommendations(zone, ductSize);
  } else if (zone.ncDelta <= 10) {
    return getMediumAttenuationRecommendations(zone, ductSize);
  } else {
    return getHighAttenuationRecommendations(zone, ductSize);
  }
}

// Calculate floor-level remediation summary
export function calculateFloorRemediationSummary(
  zones: ZoneAcousticData[]
): FloorRemediationSummary {
  const zonesNeedingTreatment = zones.filter(z => z.status === 'exceeds' || z.status === 'marginal');
  
  const silencerCounts: Record<string, number> = {};
  const modCounts: Record<string, number> = {};
  let totalPressureDrop = 0;
  let totalCostLevel = 0;
  
  zonesNeedingTreatment.forEach(zone => {
    const recommendations = generateAcousticRecommendations(zone);
    const primaryRec = recommendations[0];
    
    if (primaryRec) {
      totalPressureDrop += primaryRec.additionalPressureDrop;
      
      if (primaryRec.type === 'silencer' && primaryRec.specificProduct) {
        const model = primaryRec.specificProduct.model;
        silencerCounts[model] = (silencerCounts[model] || 0) + 1;
      } else if (primaryRec.modificationType) {
        const name = primaryRec.modificationType.name;
        modCounts[name] = (modCounts[name] || 0) + 1;
      }
      
      // Calculate cost level
      if (primaryRec.costEstimate === '$') totalCostLevel += 1;
      else if (primaryRec.costEstimate === '$$') totalCostLevel += 2;
      else if (primaryRec.costEstimate === '$$$') totalCostLevel += 3;
    }
  });
  
  // Determine overall cost
  let estimatedTotalCost: FloorRemediationSummary['estimatedTotalCost'] = '$';
  const avgCost = zonesNeedingTreatment.length > 0 
    ? totalCostLevel / zonesNeedingTreatment.length 
    : 0;
  
  if (avgCost > 2.5 || totalCostLevel > 15) estimatedTotalCost = '$$$$';
  else if (avgCost > 2 || totalCostLevel > 10) estimatedTotalCost = '$$$';
  else if (avgCost > 1.5 || totalCostLevel > 5) estimatedTotalCost = '$$';
  
  return {
    zonesRequiringTreatment: zonesNeedingTreatment.length,
    totalSilencersNeeded: Object.values(silencerCounts).reduce((a, b) => a + b, 0),
    silencerBreakdown: Object.entries(silencerCounts).map(([model, count]) => ({ model, count })),
    ductModifications: Object.entries(modCounts).map(([name, count]) => ({ name, count })),
    totalPressureImpact: Math.round(totalPressureDrop * 100) / 100,
    estimatedTotalCost,
  };
}
