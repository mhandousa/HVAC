import { useMemo } from 'react';
import { DuctSystem, DuctSegment } from './useDuctSystems';
import { PipeSystem, PipeSegment } from './usePipeSystems';
import { 
  INSULATION_MATERIALS, 
  SAUDI_CLIMATE_DATA,
  SERVICE_TYPES,
  pipeOD,
  calculateMinInsulationThickness,
  roundToStandardThickness,
  calculateDewPoint,
} from '@/lib/thermal-calculations';

// Sheet metal gauge weights (lb/ft²)
const GAUGE_WEIGHTS: Record<number, number> = {
  16: 2.656,
  18: 2.156,
  20: 1.656,
  22: 1.406,
  24: 1.156,
  26: 0.906,
  28: 0.781,
};

// Pipe weight per foot by nominal size (Schedule 40 steel)
const PIPE_WEIGHTS_LB_PER_FT: Record<number, number> = {
  0.5: 0.85,
  0.75: 1.13,
  1: 1.68,
  1.25: 2.27,
  1.5: 2.72,
  2: 3.65,
  2.5: 5.79,
  3: 7.58,
  4: 10.79,
  5: 14.62,
  6: 18.97,
  8: 28.55,
  10: 40.48,
  12: 49.56,
};

export interface DuctMaterialItem {
  segmentId: string;
  segmentName: string;
  shape: 'round' | 'rectangular';
  dimensions: string;
  lengthFt: number;
  surfaceAreaSqFt: number;
  weightLbs: number;
  gauge: number;
  material: string;
}

export interface PipeMaterialItem {
  segmentId: string;
  segmentName: string;
  nominalSize: string;
  lengthFt: number;
  material: string;
  schedule: string;
  weightLbsPerFt: number;
  totalWeightLbs: number;
}

export interface FittingItem {
  fittingType: string;
  fittingCode: string;
  size: string;
  quantity: number;
  unitWeight?: number;
}

export interface InsulationItem {
  application: 'duct' | 'pipe';
  segmentId: string;
  segmentName: string;
  insulationType: string;
  thicknessMm: number;
  surfaceAreaSqM: number;
  linearM?: number;
  costPerM2: number;
}

export interface DiffuserGrilleItem {
  type: string;
  model: string;
  neckSize: string;
  cfm: number;
  quantity: number;
}

export interface MaterialTakeoffSummary {
  totalDuctAreaSqFt: number;
  totalDuctWeightLbs: number;
  totalDuctLengthFt: number;
  totalPipeLengthFt: number;
  totalPipeWeightLbs: number;
  totalInsulationAreaSqM: number;
  totalInsulationCostSAR: number;
  totalDiffusers: number;
  totalDuctFittings: number;
  totalPipeFittings: number;
}

export interface MaterialTakeoff {
  projectName?: string;
  ductSystemName?: string;
  pipeSystemName?: string;
  generatedDate: string;
  ductMaterials: DuctMaterialItem[];
  pipeMaterials: PipeMaterialItem[];
  ductFittings: FittingItem[];
  pipeFittings: FittingItem[];
  insulation: InsulationItem[];
  diffusersGrilles: DiffuserGrilleItem[];
  summary: MaterialTakeoffSummary;
}

export interface InsulationSettings {
  includeInsulation: boolean;
  serviceTypeId: string;
  climateId: string;
  insulationMaterialId: string;
}

// Calculate duct surface area in sq ft
function calculateDuctSurfaceArea(segment: DuctSegment): number {
  const lengthFt = segment.length_ft || 0;
  
  if (segment.duct_shape === 'round' && segment.diameter_in) {
    // Circumference × length
    return (Math.PI * segment.diameter_in * lengthFt) / 144;
  } else if (segment.width_in && segment.height_in) {
    // Perimeter × length
    const perimeter = 2 * (segment.width_in + segment.height_in);
    return (perimeter * lengthFt) / 144;
  }
  
  return 0;
}

// Calculate sheet metal weight
function calculateDuctWeight(surfaceAreaSqFt: number, gauge: number): number {
  const weightPerSqFt = GAUGE_WEIGHTS[gauge] || GAUGE_WEIGHTS[24];
  return surfaceAreaSqFt * weightPerSqFt;
}

// Get gauge from duct size (SMACNA standards)
function getGaugeFromSegment(segment: DuctSegment): number {
  // Default based on duct size (SMACNA)
  const maxDim = Math.max(segment.width_in || 0, segment.height_in || 0, segment.diameter_in || 0);
  if (maxDim > 30) return 20;
  if (maxDim > 18) return 22;
  if (maxDim > 12) return 24;
  return 26;
}

// Format duct dimensions
function formatDuctDimensions(segment: DuctSegment): string {
  if (segment.duct_shape === 'round' && segment.diameter_in) {
    return `Ø${segment.diameter_in}"`;
  }
  if (segment.width_in && segment.height_in) {
    return `${segment.width_in}"×${segment.height_in}"`;
  }
  return 'N/A';
}

// Calculate pipe weight
function calculatePipeWeight(sizeInches: number, lengthFt: number): { perFt: number; total: number } {
  const perFt = PIPE_WEIGHTS_LB_PER_FT[sizeInches] || sizeInches * 2; // Estimate for unlisted sizes
  return { perFt, total: perFt * lengthFt };
}

// Aggregate fittings by type and size
function aggregateFittings(segments: DuctSegment[]): FittingItem[] {
  const fittingsMap = new Map<string, FittingItem>();
  
  segments.forEach(segment => {
    // Create estimated fittings based on segment properties
    if (segment.fittings_equivalent_length_ft && segment.fittings_equivalent_length_ft > 0) {
      // Estimate fittings based on equivalent length
      const size = formatDuctDimensions(segment);
      const estimatedElbows = Math.ceil(segment.fittings_equivalent_length_ft / 15); // ~15 ft equiv per elbow
      
      if (estimatedElbows > 0) {
        const key = `90_elbow_${size}`;
        const existing = fittingsMap.get(key);
        if (existing) {
          existing.quantity += estimatedElbows;
        } else {
          fittingsMap.set(key, {
            fittingType: '90° Elbow',
            fittingCode: 'CR3-1',
            size,
            quantity: estimatedElbows,
          });
        }
      }
    }
  });
  
  return Array.from(fittingsMap.values());
}

// Aggregate pipe fittings
function aggregatePipeFittings(segments: PipeSegment[]): FittingItem[] {
  const fittingsMap = new Map<string, FittingItem>();
  
  segments.forEach(segment => {
    // Estimate based on segment properties
    const sizeStr = segment.nominal_size_in ? `${segment.nominal_size_in}"` : 'N/A';
    
    // Estimate fittings from equivalent length
    if (segment.fittings_equivalent_length_ft && segment.fittings_equivalent_length_ft > 0) {
      const estimatedElbows = Math.ceil(segment.fittings_equivalent_length_ft / 10);
      
      if (estimatedElbows > 0) {
        const key = `90_elbow_${sizeStr}`;
        const existing = fittingsMap.get(key);
        if (existing) {
          existing.quantity += estimatedElbows;
        } else {
          fittingsMap.set(key, {
            fittingType: '90° Elbow',
            fittingCode: 'EL-90',
            size: sizeStr,
            quantity: estimatedElbows,
          });
        }
      }
    }
  });
  
  return Array.from(fittingsMap.values());
}

// Calculate insulation for duct segments
function calculateDuctInsulation(
  segments: DuctSegment[],
  settings: InsulationSettings
): InsulationItem[] {
  if (!settings.includeInsulation) return [];
  
  const material = INSULATION_MATERIALS.find(m => m.id === settings.insulationMaterialId);
  const climate = SAUDI_CLIMATE_DATA.find(c => c.id === settings.climateId);
  const service = SERVICE_TYPES.find(s => s.id === settings.serviceTypeId);
  
  if (!material || !climate) return [];
  
  return segments.map(segment => {
    const surfaceAreaSqFt = calculateDuctSurfaceArea(segment);
    const surfaceAreaSqM = surfaceAreaSqFt * 0.0929; // Convert to m²
    
    // For ducts, typically use 25mm for cold services
    const thicknessMm = service?.category === 'cold' ? 25 : 19;
    
    return {
      application: 'duct' as const,
      segmentId: segment.id,
      segmentName: segment.segment_name,
      insulationType: material.name,
      thicknessMm,
      surfaceAreaSqM,
      costPerM2: material.costPerM2,
    };
  });
}

// Calculate insulation for pipe segments
function calculatePipeInsulation(
  segments: PipeSegment[],
  settings: InsulationSettings
): InsulationItem[] {
  if (!settings.includeInsulation) return [];
  
  const material = INSULATION_MATERIALS.find(m => m.id === settings.insulationMaterialId);
  const climate = SAUDI_CLIMATE_DATA.find(c => c.id === settings.climateId);
  const service = SERVICE_TYPES.find(s => s.id === settings.serviceTypeId);
  
  if (!material || !climate || !service) return [];
  
  const dewPoint = calculateDewPoint(climate.summerDB, climate.summerRH);
  
  return segments.map(segment => {
    const lengthFt = segment.length_ft || 0;
    const lengthM = lengthFt * 0.3048;
    const nominalSizeIn = segment.nominal_size_in || 2;
    const pipeODmm = pipeOD(nominalSizeIn);
    
    // Calculate minimum thickness for condensation prevention
    const minThickness = calculateMinInsulationThickness({
      fluidTempC: service.typicalTemp,
      ambientTempC: climate.summerDB,
      dewPointC: dewPoint,
      pipeODmm,
      kValueInsulation: material.kValue,
    });
    
    const thicknessMm = roundToStandardThickness(minThickness);
    
    // Calculate outer surface area: π × (OD + 2×thickness) × length
    const outerDiameterM = (pipeODmm + 2 * thicknessMm) / 1000;
    const surfaceAreaSqM = Math.PI * outerDiameterM * lengthM;
    
    return {
      application: 'pipe' as const,
      segmentId: segment.id,
      segmentName: segment.segment_name,
      insulationType: material.name,
      thicknessMm,
      surfaceAreaSqM,
      linearM: lengthM,
      costPerM2: material.costPerM2,
    };
  });
}

export function generateMaterialTakeoff(
  ductSystem: DuctSystem | null,
  ductSegments: DuctSegment[],
  pipeSystem: PipeSystem | null,
  pipeSegments: PipeSegment[],
  diffusersGrilles: any[],
  insulationSettings: InsulationSettings
): MaterialTakeoff {
  // Process duct materials
  const ductMaterials: DuctMaterialItem[] = ductSegments.map(segment => {
    const surfaceAreaSqFt = calculateDuctSurfaceArea(segment);
    const gauge = getGaugeFromSegment(segment);
    const weightLbs = calculateDuctWeight(surfaceAreaSqFt, gauge);
    
    return {
      segmentId: segment.id,
      segmentName: segment.segment_name,
      shape: segment.duct_shape === 'round' ? 'round' : 'rectangular',
      dimensions: formatDuctDimensions(segment),
      lengthFt: segment.length_ft || 0,
      surfaceAreaSqFt,
      weightLbs,
      gauge,
      material: ductSystem?.duct_material || 'Galvanized Steel',
    };
  });
  
  // Process pipe materials
  const pipeMaterials: PipeMaterialItem[] = pipeSegments.map(segment => {
    const sizeInches = segment.nominal_size_in || 2;
    const lengthFt = segment.length_ft || 0;
    const { perFt, total } = calculatePipeWeight(sizeInches, lengthFt);
    
    return {
      segmentId: segment.id,
      segmentName: segment.segment_name,
      nominalSize: `${sizeInches}"`,
      lengthFt,
      material: segment.material_type || pipeSystem?.pipe_material || 'Carbon Steel',
      schedule: segment.schedule_class || 'Sch 40',
      weightLbsPerFt: perFt,
      totalWeightLbs: total,
    };
  });
  
  // Aggregate fittings
  const ductFittings = aggregateFittings(ductSegments);
  const pipeFittings = aggregatePipeFittings(pipeSegments);
  
  // Calculate insulation
  const ductInsulation = calculateDuctInsulation(ductSegments, insulationSettings);
  const pipeInsulation = calculatePipeInsulation(pipeSegments, insulationSettings);
  const insulation = [...ductInsulation, ...pipeInsulation];
  
  // Process diffusers/grilles
  const diffuserItems: DiffuserGrilleItem[] = diffusersGrilles.map(d => ({
    type: d.terminal_type || 'Supply Diffuser',
    model: d.model || 'Standard',
    neckSize: d.neck_size || 'N/A',
    cfm: d.airflow_cfm || 0,
    quantity: d.quantity || 1,
  }));
  
  // Calculate summary
  const summary: MaterialTakeoffSummary = {
    totalDuctAreaSqFt: ductMaterials.reduce((sum, d) => sum + d.surfaceAreaSqFt, 0),
    totalDuctWeightLbs: ductMaterials.reduce((sum, d) => sum + d.weightLbs, 0),
    totalDuctLengthFt: ductMaterials.reduce((sum, d) => sum + d.lengthFt, 0),
    totalPipeLengthFt: pipeMaterials.reduce((sum, p) => sum + p.lengthFt, 0),
    totalPipeWeightLbs: pipeMaterials.reduce((sum, p) => sum + p.totalWeightLbs, 0),
    totalInsulationAreaSqM: insulation.reduce((sum, i) => sum + i.surfaceAreaSqM, 0),
    totalInsulationCostSAR: insulation.reduce((sum, i) => sum + i.surfaceAreaSqM * i.costPerM2, 0),
    totalDiffusers: diffuserItems.reduce((sum, d) => sum + d.quantity, 0),
    totalDuctFittings: ductFittings.reduce((sum, f) => sum + f.quantity, 0),
    totalPipeFittings: pipeFittings.reduce((sum, f) => sum + f.quantity, 0),
  };
  
  return {
    projectName: ductSystem?.project_id || pipeSystem?.project_id || undefined,
    ductSystemName: ductSystem?.system_name,
    pipeSystemName: pipeSystem?.system_name,
    generatedDate: new Date().toISOString(),
    ductMaterials,
    pipeMaterials,
    ductFittings,
    pipeFittings,
    insulation,
    diffusersGrilles: diffuserItems,
    summary,
  };
}

export function useMaterialTakeoff(
  ductSystem: DuctSystem | null,
  ductSegments: DuctSegment[],
  pipeSystem: PipeSystem | null,
  pipeSegments: PipeSegment[],
  diffusersGrilles: any[],
  insulationSettings: InsulationSettings
) {
  const takeoff = useMemo(() => {
    return generateMaterialTakeoff(
      ductSystem,
      ductSegments,
      pipeSystem,
      pipeSegments,
      diffusersGrilles,
      insulationSettings
    );
  }, [ductSystem, ductSegments, pipeSystem, pipeSegments, diffusersGrilles, insulationSettings]);
  
  return takeoff;
}
