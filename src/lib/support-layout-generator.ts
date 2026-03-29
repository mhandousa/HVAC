/**
 * Support Layout Generator
 * Generates visual layout data for duct and pipe support diagrams
 */

import { SupportBOQItem } from '@/types/boq';
import { SMACNA_DUCT_HANGER_SPACING, SMACNA_RISER_SPACING } from './smacna-support-standards';
import { SMACNA_BRACE_SPACING } from './asce7-seismic-standards';

export interface LayoutSegment {
  id: string;
  name: string;
  lengthFt: number;
  shape: 'round' | 'rectangular';
  maxDimension: number; // inches
  application: 'duct' | 'pipe';
  isRiser: boolean;
  hangerPositions: number[]; // Distance from start (ft)
  hangerType: string;
  hangerSpacing: number;
  seismicPositions: number[]; // Seismic brace positions
  seismicType: string;
}

export interface SupportLayoutData {
  segments: LayoutSegment[];
  totalLength: number;
  totalHangers: number;
  totalSeismicBraces: number;
  bounds: { width: number; height: number };
  scale: number; // pixels per foot
}

export interface LayoutGeneratorOptions {
  includeSeismic: boolean;
  seismicBraceSpacing?: number;
  showDimensions: boolean;
  scale?: number; // pixels per foot, default 20
  maxWidth?: number; // max canvas width
}

/**
 * Generate support layout data from duct/pipe segments
 */
export function generateSupportLayout(
  segments: Array<{
    id: string;
    name: string;
    lengthFt: number;
    shape: 'round' | 'rectangular';
    diameterIn?: number;
    widthIn?: number;
    heightIn?: number;
    application: 'duct' | 'pipe';
    isRiser?: boolean;
  }>,
  options: LayoutGeneratorOptions = { includeSeismic: false, showDimensions: true }
): SupportLayoutData {
  const scale = options.scale || 20; // 20 pixels per foot default
  const maxWidth = options.maxWidth || 1200;
  
  const layoutSegments: LayoutSegment[] = [];
  let totalHangers = 0;
  let totalSeismicBraces = 0;
  let totalLength = 0;
  
  for (const seg of segments) {
    const maxDim = seg.shape === 'round' 
      ? (seg.diameterIn || 12)
      : Math.max(seg.widthIn || 12, seg.heightIn || 12);
    
    const isRiser = seg.isRiser || false;
    
    // Determine hanger spacing based on size and shape
    const hangerInfo = getHangerSpacing(seg.shape, maxDim, isRiser, seg.application);
    
    // Calculate hanger positions
    const hangerPositions = calculateHangerPositions(seg.lengthFt, hangerInfo.spacing);
    totalHangers += hangerPositions.length;
    
    // Calculate seismic brace positions if enabled
    let seismicPositions: number[] = [];
    let seismicType = '';
    
    if (options.includeSeismic && !isRiser) {
      const seismicSpacing = options.seismicBraceSpacing || SMACNA_BRACE_SPACING.transverse.maxSpacingFt;
      seismicPositions = calculateSeismicPositions(seg.lengthFt, seismicSpacing);
      seismicType = 'cable_brace';
      totalSeismicBraces += seismicPositions.length;
    }
    
    layoutSegments.push({
      id: seg.id,
      name: seg.name,
      lengthFt: seg.lengthFt,
      shape: seg.shape,
      maxDimension: maxDim,
      application: seg.application,
      isRiser,
      hangerPositions,
      hangerType: hangerInfo.type,
      hangerSpacing: hangerInfo.spacing,
      seismicPositions,
      seismicType,
    });
    
    totalLength += seg.lengthFt;
  }
  
  // Calculate bounds
  const maxSegmentLength = Math.max(...segments.map(s => s.lengthFt), 10);
  const effectiveScale = Math.min(scale, maxWidth / maxSegmentLength);
  
  const width = maxSegmentLength * effectiveScale + 100; // padding
  const height = layoutSegments.length * 100 + 150; // 100px per segment + legend
  
  return {
    segments: layoutSegments,
    totalLength,
    totalHangers,
    totalSeismicBraces,
    bounds: { width, height },
    scale: effectiveScale,
  };
}

/**
 * Get hanger spacing based on duct/pipe size
 */
function getHangerSpacing(
  shape: 'round' | 'rectangular',
  maxDimensionIn: number,
  isRiser: boolean,
  application: 'duct' | 'pipe'
): { spacing: number; type: string } {
  if (application === 'pipe') {
    // MSS SP-58 pipe support spacing
    const pipeSpacing = getPipeSpacing(maxDimensionIn);
    return { spacing: pipeSpacing, type: 'clevis' };
  }
  
  if (isRiser) {
    const riserConfig = shape === 'round'
      ? (maxDimensionIn <= 24 ? SMACNA_RISER_SPACING.round['up_to_24'] : SMACNA_RISER_SPACING.round['over_24'])
      : (maxDimensionIn <= 30 ? SMACNA_RISER_SPACING.rectangular['up_to_30'] : SMACNA_RISER_SPACING.rectangular['over_30']);
    
    return { 
      spacing: riserConfig.spacingFt, 
      type: 'clampType' in riserConfig ? riserConfig.clampType : riserConfig.bracketType 
    };
  }
  
  // Horizontal duct
  const ductConfig = shape === 'round'
    ? getDuctRoundConfig(maxDimensionIn)
    : getDuctRectConfig(maxDimensionIn);
  
  return { spacing: ductConfig.spacingFt, type: ductConfig.hangerType };
}

function getDuctRoundConfig(diameterIn: number) {
  if (diameterIn <= 12) return SMACNA_DUCT_HANGER_SPACING.round['up_to_12'];
  if (diameterIn <= 18) return SMACNA_DUCT_HANGER_SPACING.round['13_to_18'];
  if (diameterIn <= 24) return SMACNA_DUCT_HANGER_SPACING.round['19_to_24'];
  if (diameterIn <= 36) return SMACNA_DUCT_HANGER_SPACING.round['25_to_36'];
  return SMACNA_DUCT_HANGER_SPACING.round['over_36'];
}

function getDuctRectConfig(maxDimIn: number) {
  if (maxDimIn <= 12) return SMACNA_DUCT_HANGER_SPACING.rectangular['up_to_12'];
  if (maxDimIn <= 18) return SMACNA_DUCT_HANGER_SPACING.rectangular['13_to_18'];
  if (maxDimIn <= 30) return SMACNA_DUCT_HANGER_SPACING.rectangular['19_to_30'];
  if (maxDimIn <= 60) return SMACNA_DUCT_HANGER_SPACING.rectangular['31_to_60'];
  return SMACNA_DUCT_HANGER_SPACING.rectangular['over_60'];
}

function getPipeSpacing(nominalSizeIn: number): number {
  // MSS SP-58 spacing
  if (nominalSizeIn <= 1) return 7;
  if (nominalSizeIn <= 1.5) return 9;
  if (nominalSizeIn <= 2) return 10;
  if (nominalSizeIn <= 2.5) return 11;
  if (nominalSizeIn <= 3) return 12;
  if (nominalSizeIn <= 4) return 14;
  if (nominalSizeIn <= 6) return 17;
  if (nominalSizeIn <= 8) return 19;
  if (nominalSizeIn <= 10) return 22;
  return 23;
}

/**
 * Calculate hanger positions along a segment
 */
function calculateHangerPositions(lengthFt: number, spacingFt: number): number[] {
  if (lengthFt <= 0) return [];
  
  const positions: number[] = [];
  const firstPosition = Math.min(spacingFt / 2, 4); // First hanger within 4ft or half spacing
  
  positions.push(firstPosition);
  
  let currentPos = firstPosition + spacingFt;
  while (currentPos < lengthFt - 2) { // Leave at least 2ft from end
    positions.push(Math.round(currentPos * 10) / 10);
    currentPos += spacingFt;
  }
  
  // Add final hanger if needed
  if (lengthFt > firstPosition + 4 && (lengthFt - positions[positions.length - 1]) > 4) {
    positions.push(lengthFt - Math.min(spacingFt / 2, 4));
  }
  
  return positions;
}

/**
 * Calculate seismic brace positions
 */
function calculateSeismicPositions(lengthFt: number, maxSpacingFt: number): number[] {
  if (lengthFt <= 12) {
    // Short runs: one brace near center
    return [lengthFt / 2];
  }
  
  const positions: number[] = [];
  const firstPosition = Math.min(12, lengthFt / 4); // First brace within 12ft
  
  positions.push(firstPosition);
  
  let currentPos = firstPosition + maxSpacingFt;
  while (currentPos < lengthFt - 8) {
    positions.push(Math.round(currentPos * 10) / 10);
    currentPos += maxSpacingFt;
  }
  
  return positions;
}

/**
 * Generate SVG path data for a duct/pipe segment
 */
export interface SVGPathData {
  segmentPath: string;
  hangerPaths: string[];
  seismicPaths: string[];
  dimensionLines: string[];
  labels: Array<{ x: number; y: number; text: string }>;
}

export function generateSVGPaths(
  segment: LayoutSegment,
  yOffset: number,
  scale: number,
  options: { showDimensions: boolean; showSeismic: boolean }
): SVGPathData {
  const startX = 60;
  const segmentY = yOffset + 30;
  const endX = startX + segment.lengthFt * scale;
  const ductHeight = Math.min(segment.maxDimension / 2, 20); // Max 20px height
  
  // Main segment rectangle
  const segmentPath = `M ${startX} ${segmentY - ductHeight} 
    L ${endX} ${segmentY - ductHeight} 
    L ${endX} ${segmentY + ductHeight} 
    L ${startX} ${segmentY + ductHeight} Z`;
  
  // Hanger symbols (triangles pointing down)
  const hangerPaths = segment.hangerPositions.map(pos => {
    const x = startX + pos * scale;
    const topY = segmentY - ductHeight - 15;
    return `M ${x} ${topY} L ${x - 6} ${topY - 12} L ${x + 6} ${topY - 12} Z`;
  });
  
  // Seismic brace symbols (diamonds)
  const seismicPaths = options.showSeismic ? segment.seismicPositions.map(pos => {
    const x = startX + pos * scale;
    const y = segmentY + ductHeight + 20;
    return `M ${x} ${y - 8} L ${x + 6} ${y} L ${x} ${y + 8} L ${x - 6} ${y} Z`;
  }) : [];
  
  // Dimension lines
  const dimensionLines: string[] = [];
  const labels: Array<{ x: number; y: number; text: string }> = [];
  
  if (options.showDimensions && segment.hangerPositions.length > 1) {
    // Show spacing between first two hangers
    const x1 = startX + segment.hangerPositions[0] * scale;
    const x2 = startX + segment.hangerPositions[1] * scale;
    const dimY = segmentY - ductHeight - 35;
    
    dimensionLines.push(`M ${x1} ${dimY} L ${x2} ${dimY}`);
    dimensionLines.push(`M ${x1} ${dimY - 3} L ${x1} ${dimY + 3}`);
    dimensionLines.push(`M ${x2} ${dimY - 3} L ${x2} ${dimY + 3}`);
    
    labels.push({
      x: (x1 + x2) / 2,
      y: dimY - 5,
      text: `${segment.hangerSpacing}'`,
    });
  }
  
  // Segment label
  labels.push({
    x: startX - 5,
    y: segmentY + 5,
    text: segment.name,
  });
  
  // Length label
  labels.push({
    x: endX + 10,
    y: segmentY + 5,
    text: `${segment.lengthFt}'`,
  });
  
  return {
    segmentPath,
    hangerPaths,
    seismicPaths,
    dimensionLines,
    labels,
  };
}

/**
 * Get legend items for the diagram
 */
export interface LegendItem {
  type: 'hanger' | 'seismic' | 'riser';
  symbol: string;
  color: string;
  label: string;
}

export function getLayoutLegend(hasSeismic: boolean): LegendItem[] {
  const items: LegendItem[] = [
    { type: 'hanger', symbol: '▼', color: '#3b82f6', label: 'Trapeze/Clevis Hanger' },
  ];
  
  if (hasSeismic) {
    items.push({ type: 'seismic', symbol: '◆', color: '#f97316', label: 'Seismic Brace' });
  }
  
  items.push({ type: 'riser', symbol: '●', color: '#ef4444', label: 'Riser Clamp' });
  
  return items;
}
