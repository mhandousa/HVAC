// Shared utilities for design completeness components

// Weight constants for combined health score
export const HEALTH_SCORE_WEIGHTS = {
  zoneCompleteness: 0.75,
  specializedTools: 0.25,
} as const;

// ============== Zone Metric Weights (Canonical Source) ==============
// These weights are used across the application for consistent zone completeness calculations.
// If updating these values, also update the local copy in:
//   - supabase/functions/capture-design-snapshots/index.ts (edge function can't import this)
export const ZONE_METRIC_WEIGHTS = {
  loadCalc: 0.25,      // 25% - Load Calculation
  equipment: 0.20,     // 20% - Equipment Selection
  distribution: 0.20,  // 20% - Distribution System (Duct/Pipe/VRF)
  ventilation: 0.15,   // 15% - Ventilation (ASHRAE 62.1)
  erv: 0.10,           // 10% - ERV/HRV Sizing
  acoustic: 0.10,      // 10% - Acoustic Analysis (NC Compliance)
} as const;

/**
 * Flags indicating which zone metrics are complete
 */
export interface ZoneMetricFlags {
  hasLoadCalc: boolean;
  hasEquipment: boolean;
  hasDistribution: boolean;
  hasVentilation: boolean;
  hasERV: boolean;
  hasAcoustic: boolean;
}

/**
 * Calculate zone completeness score from boolean flags (0-100)
 * Use this when you have per-zone boolean completion flags
 */
export const calculateZoneCompletenessScore = (metrics: ZoneMetricFlags): number => {
  return Math.round(
    (metrics.hasLoadCalc ? ZONE_METRIC_WEIGHTS.loadCalc * 100 : 0) +
    (metrics.hasEquipment ? ZONE_METRIC_WEIGHTS.equipment * 100 : 0) +
    (metrics.hasDistribution ? ZONE_METRIC_WEIGHTS.distribution * 100 : 0) +
    (metrics.hasVentilation ? ZONE_METRIC_WEIGHTS.ventilation * 100 : 0) +
    (metrics.hasERV ? ZONE_METRIC_WEIGHTS.erv * 100 : 0) +
    (metrics.hasAcoustic ? ZONE_METRIC_WEIGHTS.acoustic * 100 : 0)
  );
};

/**
 * Calculate zone completeness from percentage values (0-100)
 * Use this when you have aggregate percentages for each metric
 */
export const calculateZoneCompletenessFromPercents = (
  loadCalcPercent: number,
  equipmentPercent: number,
  distributionPercent: number,
  ventilationPercent: number,
  ervPercent: number,
  acousticPercent: number = 0
): number => {
  return Math.round(
    (loadCalcPercent * ZONE_METRIC_WEIGHTS.loadCalc) +
    (equipmentPercent * ZONE_METRIC_WEIGHTS.equipment) +
    (distributionPercent * ZONE_METRIC_WEIGHTS.distribution) +
    (ventilationPercent * ZONE_METRIC_WEIGHTS.ventilation) +
    (ervPercent * ZONE_METRIC_WEIGHTS.erv) +
    (acousticPercent * ZONE_METRIC_WEIGHTS.acoustic)
  );
};

// Calculate combined health score from zone completeness and specialized tools score
export const calculateCombinedHealthScore = (
  zoneCompleteness: number,
  specializedToolsScore: number
): number => {
  return Math.round(
    (zoneCompleteness * HEALTH_SCORE_WEIGHTS.zoneCompleteness) +
    (specializedToolsScore * HEALTH_SCORE_WEIGHTS.specializedTools)
  );
};

export interface SeverityInfo {
  id: 'critical' | 'warning' | 'good' | 'complete';
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

/**
 * Get severity classification based on a score (0-100)
 * Thresholds: 0-32 = Critical, 33-65 = Warning, 66-99 = Good, 100 = Complete
 */
export const getSeverity = (score: number): SeverityInfo => {
  if (score >= 100) return {
    id: 'complete',
    label: 'COMPLETE',
    color: 'hsl(142, 71%, 35%)',
    bgColor: 'hsl(142, 71%, 35%)',
    textColor: 'white',
  };
  if (score >= 66) return {
    id: 'good',
    label: 'GOOD',
    color: 'hsl(142, 71%, 45%)',
    bgColor: 'hsl(142, 71%, 45%)',
    textColor: 'white',
  };
  if (score >= 33) return {
    id: 'warning',
    label: 'WARNING',
    color: 'hsl(45, 93%, 47%)',
    bgColor: 'hsl(45, 93%, 47%)',
    textColor: 'white',
  };
  return {
    id: 'critical',
    label: 'CRITICAL',
    color: 'hsl(0, 72%, 51%)',
    bgColor: 'hsl(0, 72%, 51%)',
    textColor: 'white',
  };
};

/**
 * Consistent metric colors used across all design completeness charts
 */
export const METRIC_COLORS = {
  loadCalc: 'hsl(217, 91%, 60%)',      // Blue
  equipment: 'hsl(142, 71%, 45%)',     // Green
  distribution: 'hsl(280, 87%, 65%)',  // Purple
  ventilation: 'hsl(190, 90%, 50%)',   // Cyan
  erv: 'hsl(330, 80%, 60%)',           // Pink
  acoustic: 'hsl(270, 75%, 55%)',      // Violet
  overall: 'hsl(220, 70%, 50%)',       // Dark Blue for overall/timeline
  specializedTools: 'hsl(35, 95%, 55%)', // Gold/Orange for specialized tools trend
  combinedHealth: 'hsl(160, 84%, 39%)', // Teal for unified health score
} as const;

// Threshold boundary values for health score severity zones
export const SEVERITY_THRESHOLDS = {
  critical: 33,
  warning: 66,
  complete: 100,
} as const;

// Background colors for chart severity zones (with transparency)
export const SEVERITY_ZONE_COLORS = {
  critical: 'rgba(239, 68, 68, 0.08)',
  warning: 'rgba(234, 179, 8, 0.08)',
  good: 'rgba(34, 197, 94, 0.06)',
} as const;

// Line colors for threshold boundaries
export const THRESHOLD_LINE_COLORS = {
  critical: 'hsl(0, 72%, 51%)',
  warning: 'hsl(45, 93%, 47%)',
  complete: 'hsl(142, 71%, 45%)',
} as const;

/**
 * Metric labels for consistent display
 */
export const METRIC_LABELS = {
  loadCalc: 'Load Calculation',
  equipment: 'Equipment Selection',
  distribution: 'Distribution System',
  ventilation: 'Ventilation (62.1)',
  erv: 'ERV/HRV Sizing',
  acoustic: 'Acoustic Analysis',
  overall: 'Overall Completion',
  specializedTools: 'Specialized Tools',
  combinedHealth: 'Design Health Score',
} as const;

/**
 * Status colors for progress indicators
 */
export const STATUS_COLORS = {
  complete: 'hsl(142, 71%, 45%)',  // Green
  partial: 'hsl(45, 93%, 47%)',    // Yellow/Warning
  none: 'hsl(0, 72%, 51%)',        // Red
} as const;

/**
 * Acoustic NC status colors for charts
 */
export const ACOUSTIC_STATUS_COLORS = {
  acceptable: 'hsl(142, 71%, 45%)',    // Green
  marginal: 'hsl(45, 93%, 47%)',       // Amber
  exceeds: 'hsl(0, 72%, 51%)',         // Red
  noData: 'hsl(220, 14%, 75%)',        // Gray
} as const;

/**
 * Get status color based on completion ratio
 */
export const getStatusColor = (completed: number, total: number): string => {
  if (completed === total && total > 0) return STATUS_COLORS.complete;
  if (completed > 0) return STATUS_COLORS.partial;
  return STATUS_COLORS.none;
};

// ============== Aggregation Interfaces ==============

export interface BuildingOverview {
  id: string;
  name: string;
  floorCount: number;
  zoneCount: number;
  completeZones: number;
  overallCompleteness: number;
  severity: SeverityInfo;
  zonesWithLoadCalc: number;
  zonesWithEquipment: number;
  zonesWithDistribution: number;
  zonesWithVentilation: number;
  zonesWithERV: number;
}

export interface FloorOverview {
  id: string;
  name: string;
  buildingId: string;
  zoneCount: number;
  completeZones: number;
  overallCompleteness: number;
  severity: SeverityInfo;
  zonesWithLoadCalc: number;
  zonesWithEquipment: number;
  zonesWithDistribution: number;
  zonesWithVentilation: number;
  zonesWithERV: number;
}

export interface ChartDataPoint {
  name: string;
  loadCalc: number;
  equipment: number;
  distribution: number;
  ventilation?: number;
  erv?: number;
  acoustic?: number;
  overall?: number;
}

// Specialized Tools Count - 19 project-level tools (Phase 18: added 5 new)
export const SPECIALIZED_TOOLS_COUNT = 19;
export const SPECIALIZED_TOOL_WEIGHT = 100 / SPECIALIZED_TOOLS_COUNT; // ~5.26% per tool

export interface SpecializedToolsFlags {
  hasChilledWaterPlant: boolean;
  hasHotWaterPlant: boolean;
  hasSmokeControl: boolean;
  hasThermalComfort: boolean;
  hasSBCCompliance: boolean;
  hasASHRAE90_1Compliance: boolean;
  hasAHUConfiguration: boolean;
  hasFanSelections: boolean;
  hasPumpSelections: boolean;
  hasInsulationCalculations: boolean;
  hasSequenceOfOperations: boolean;
  hasCoilSelections: boolean;
  hasFilterSelections: boolean;
  hasCoolingTowerSelections: boolean;
  // Phase 18: 5 new specialized tools
  hasEconomizerSelections: boolean;
  hasControlValveSelections: boolean;
  hasExpansionTankSelections: boolean;
  hasSilencerSelections: boolean;
  hasVibrationIsolationSelections: boolean;
}

/**
 * Calculate specialized tools score from boolean flags (0-100)
 * 19 tools @ ~5.26% each (SPECIALIZED_TOOLS_COUNT)
 */
export const calculateSpecializedToolsScore = (tools: SpecializedToolsFlags): number => {
  const weight = SPECIALIZED_TOOL_WEIGHT;
  let score = 0;
  
  if (tools.hasChilledWaterPlant) score += weight;
  if (tools.hasHotWaterPlant) score += weight;
  if (tools.hasSmokeControl) score += weight;
  if (tools.hasThermalComfort) score += weight;
  if (tools.hasSBCCompliance) score += weight;
  if (tools.hasASHRAE90_1Compliance) score += weight;
  if (tools.hasAHUConfiguration) score += weight;
  if (tools.hasFanSelections) score += weight;
  if (tools.hasPumpSelections) score += weight;
  if (tools.hasInsulationCalculations) score += weight;
  if (tools.hasSequenceOfOperations) score += weight;
  if (tools.hasCoilSelections) score += weight;
  if (tools.hasFilterSelections) score += weight;
  if (tools.hasCoolingTowerSelections) score += weight;
  // Phase 18: 5 new specialized tools
  if (tools.hasEconomizerSelections) score += weight;
  if (tools.hasControlValveSelections) score += weight;
  if (tools.hasExpansionTankSelections) score += weight;
  if (tools.hasSilencerSelections) score += weight;
  if (tools.hasVibrationIsolationSelections) score += weight;
  
  return Math.round(score);
};

/**
 * Specialized tools colors for timeline visualization (6 tools)
 */
export const SPECIALIZED_TOOL_COLORS = {
  chwPlant: 'hsl(200, 90%, 50%)',       // Ice Blue
  hwPlant: 'hsl(25, 95%, 53%)',         // Orange
  smokeControl: 'hsl(200, 85%, 50%)',   // Blue
  thermalComfort: 'hsl(0, 75%, 55%)',   // Red
  sbcCompliance: 'hsl(142, 76%, 40%)',  // Green
  ashrae90_1: 'hsl(280, 70%, 55%)',     // Purple
} as const;

export interface TimelineDataPoint {
  date: string;
  displayDate: string;
  overallPercent: number;
  loadCalcPercent: number;
  equipmentPercent: number;
  distributionPercent: number;
  ventilationPercent: number;
  ervPercent: number;
  acousticPercent?: number;
  ncCompliancePercent?: number;
  zonesComplete: number;
  totalZones: number;
  zonesWithAcoustic?: number;
  zonesPassingNC?: number;
  milestone?: Milestone;
  // Specialized tools status (original 6 tools)
  hasChwPlant?: boolean;
  hasHwPlant?: boolean;
  hasSmokeControl?: boolean;
  hasThermalComfort?: boolean;
  hasSbcCompliance?: boolean;
  hasAshrae90_1Compliance?: boolean;
  // Phase 18: 5 new specialized tools
  hasEconomizerSelections?: boolean;
  hasControlValveSelections?: boolean;
  hasExpansionTankSelections?: boolean;
  hasSilencerSelections?: boolean;
  hasVibrationIsolationSelections?: boolean;
  specializedToolsScore?: number;
  combinedHealthScore?: number; // Weighted blend: 75% zone + 25% tools
}

export type MilestoneType = 
  | 'first_complete' | 'quarter_complete' | 'half_complete' | 'three_quarter_complete' 
  | 'all_load_calc' | 'all_equipment' | 'all_distribution' | 'all_ventilation' | 'all_erv' | 'all_acoustic'
  | 'project_complete'
  // Specialized tools milestones (original 6 tools)
  | 'chw_plant_complete' | 'hw_plant_complete' | 'smoke_control_complete' | 'thermal_comfort_complete' 
  | 'sbc_compliance_complete' | 'ashrae_90_1_complete' | 'all_specialized_complete'
  // Phase 18: 5 new specialized tools milestones
  | 'economizer_complete' | 'control_valve_complete' | 'expansion_tank_complete' 
  | 'silencer_complete' | 'vibration_isolation_complete';

export interface Milestone {
  type: MilestoneType;
  label: string;
  date: string;
  category?: 'zone' | 'specialized';
}
