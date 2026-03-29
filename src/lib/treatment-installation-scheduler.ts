import { TreatmentPackage, ZoneTreatmentPlan, RecommendedTreatment } from './treatment-package-optimizer';

export interface ScheduledTreatment {
  treatmentId: string;
  name: string;
  category: string;
  quantity: number;
  estimatedHours: number;
  startHour: number;
  endHour: number;
}

export interface ScheduledZone {
  zoneId: string;
  zoneName: string;
  floorId: string;
  spaceType: string;
  priority: number;
  treatments: ScheduledTreatment[];
  installationOrder: number;
  estimatedHours: number;
  startDay: number;
  endDay: number;
  totalCost: number;
}

export interface InstallationPhase {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  durationDays: number;
  zones: ScheduledZone[];
  totalCost: number;
  treatmentCategories: string[];
  priorityRange: { min: number; max: number };
}

export interface ScheduleMilestone {
  day: number;
  type: 'phase-complete' | 'floor-complete' | 'project-complete';
  label: string;
  phaseId?: string;
}

export interface InstallationSchedule {
  packageId: string;
  packageName: string;
  totalDays: number;
  totalHours: number;
  totalPhases: number;
  totalZones: number;
  phases: InstallationPhase[];
  criticalPath: string[];
  milestones: ScheduleMilestone[];
  totalCost: number;
}

export interface ScheduleOptions {
  workdaysPerWeek?: number;
  hoursPerDay?: number;
  crewSize?: number;
  phaseBy?: 'priority' | 'floor' | 'category';
  startDate?: Date;
}

const DEFAULT_OPTIONS: Required<ScheduleOptions> = {
  workdaysPerWeek: 5,
  hoursPerDay: 8,
  crewSize: 2,
  phaseBy: 'priority',
  startDate: new Date(),
};

// Treatment duration estimates (hours)
const TREATMENT_HOURS: Record<string, { base: number; perUnit: number }> = {
  silencer: { base: 2, perUnit: 1.5 },
  lining: { base: 1.5, perUnit: 0.5 },
  isolator: { base: 1, perUnit: 0.75 },
  panel: { base: 1, perUnit: 0.3 },
  boot: { base: 0.5, perUnit: 0.25 },
  wrap: { base: 1, perUnit: 0.4 },
};

// Treatment installation order (lower = installed first)
const TREATMENT_ORDER: Record<string, number> = {
  isolator: 1,    // Vibration isolators first
  silencer: 2,    // Then silencers
  boot: 3,        // Plenum boots
  lining: 4,      // Duct lining
  wrap: 5,        // Acoustic wrap
  panel: 6,       // Acoustic panels last
};

function getTreatmentCategory(treatmentName: string): string {
  const name = treatmentName.toLowerCase();
  if (name.includes('silencer') || name.includes('attenuator')) return 'silencer';
  if (name.includes('lining') || name.includes('liner')) return 'lining';
  if (name.includes('isolator') || name.includes('mount') || name.includes('spring')) return 'isolator';
  if (name.includes('panel') || name.includes('tile')) return 'panel';
  if (name.includes('boot') || name.includes('plenum')) return 'boot';
  if (name.includes('wrap') || name.includes('lagging')) return 'wrap';
  return 'other';
}

function estimateTreatmentHours(treatment: RecommendedTreatment): number {
  const category = getTreatmentCategory(treatment.name);
  const rates = TREATMENT_HOURS[category] || { base: 1.5, perUnit: 0.5 };
  return rates.base + (treatment.quantity * rates.perUnit);
}

function sortTreatmentsByInstallOrder(treatments: RecommendedTreatment[]): RecommendedTreatment[] {
  return [...treatments].sort((a, b) => {
    const orderA = TREATMENT_ORDER[getTreatmentCategory(a.name)] || 10;
    const orderB = TREATMENT_ORDER[getTreatmentCategory(b.name)] || 10;
    return orderA - orderB;
  });
}

function createScheduledZone(
  zone: ZoneTreatmentPlan,
  installationOrder: number,
  crewSize: number
): ScheduledZone {
  const sortedTreatments = sortTreatmentsByInstallOrder(zone.treatments);
  
  let currentHour = 0;
  const scheduledTreatments: ScheduledTreatment[] = sortedTreatments.map((treatment, index) => {
    const estimatedHours = estimateTreatmentHours(treatment) / crewSize;
    const scheduled: ScheduledTreatment = {
      treatmentId: treatment.treatmentId,
      name: treatment.name,
      category: getTreatmentCategory(treatment.name),
      quantity: treatment.quantity,
      estimatedHours,
      startHour: currentHour,
      endHour: currentHour + estimatedHours,
    };
    currentHour += estimatedHours;
    return scheduled;
  });

  const totalHours = scheduledTreatments.reduce((sum, t) => sum + t.estimatedHours, 0);

  return {
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    floorId: zone.floorId || 'unknown',
    spaceType: zone.spaceType,
    priority: zone.priority,
    treatments: scheduledTreatments,
    installationOrder,
    estimatedHours: totalHours,
    startDay: 0, // Will be calculated later
    endDay: 0,   // Will be calculated later
    totalCost: zone.totalCost,
  };
}

function groupZonesByPriority(zones: ScheduledZone[]): Map<string, ScheduledZone[]> {
  const groups = new Map<string, ScheduledZone[]>();
  
  zones.forEach(zone => {
    let groupKey: string;
    if (zone.priority >= 70) {
      groupKey = 'critical';
    } else if (zone.priority >= 40) {
      groupKey = 'high';
    } else {
      groupKey = 'medium';
    }
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(zone);
  });
  
  return groups;
}

function groupZonesByFloor(zones: ScheduledZone[]): Map<string, ScheduledZone[]> {
  const groups = new Map<string, ScheduledZone[]>();
  
  zones.forEach(zone => {
    const floorKey = zone.floorId || 'unknown';
    if (!groups.has(floorKey)) {
      groups.set(floorKey, []);
    }
    groups.get(floorKey)!.push(zone);
  });
  
  return groups;
}

function groupZonesByCategory(zones: ScheduledZone[]): Map<string, ScheduledZone[]> {
  // Group by primary treatment category
  const groups = new Map<string, ScheduledZone[]>();
  
  zones.forEach(zone => {
    const primaryCategory = zone.treatments[0]?.category || 'other';
    if (!groups.has(primaryCategory)) {
      groups.set(primaryCategory, []);
    }
    groups.get(primaryCategory)!.push(zone);
  });
  
  return groups;
}

function getPhaseName(groupKey: string, phaseBy: 'priority' | 'floor' | 'category'): { name: string; description: string } {
  if (phaseBy === 'priority') {
    switch (groupKey) {
      case 'critical':
        return { name: 'Critical Zones', description: 'High-priority sensitive spaces requiring immediate attention' };
      case 'high':
        return { name: 'High Priority', description: 'Important zones with significant NC exceedance' };
      case 'medium':
        return { name: 'Medium Priority', description: 'Zones with moderate acoustic improvement needs' };
      default:
        return { name: groupKey, description: '' };
    }
  } else if (phaseBy === 'floor') {
    return { name: `Floor ${groupKey}`, description: `All zones on floor ${groupKey}` };
  } else {
    const categoryNames: Record<string, string> = {
      silencer: 'Silencer Installations',
      lining: 'Duct Lining',
      isolator: 'Vibration Isolation',
      panel: 'Acoustic Panels',
      boot: 'Plenum Boots',
      wrap: 'Acoustic Wrap',
      other: 'Other Treatments',
    };
    return { 
      name: categoryNames[groupKey] || groupKey, 
      description: `Zones requiring ${categoryNames[groupKey]?.toLowerCase() || groupKey}` 
    };
  }
}

function getPhaseOrder(groupKey: string, phaseBy: 'priority' | 'floor' | 'category'): number {
  if (phaseBy === 'priority') {
    switch (groupKey) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      default: return 99;
    }
  } else if (phaseBy === 'category') {
    return TREATMENT_ORDER[groupKey] || 99;
  }
  return parseInt(groupKey) || 99;
}

export function generateInstallationSchedule(
  selectedPackage: TreatmentPackage,
  options?: ScheduleOptions
): InstallationSchedule {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { hoursPerDay, crewSize, phaseBy } = opts;

  // Create scheduled zones from the package
  const scheduledZones = selectedPackage.zones
    .map((zone, index) => createScheduledZone(zone, index + 1, crewSize))
    .sort((a, b) => b.priority - a.priority);

  // Group zones based on phasing strategy
  let groups: Map<string, ScheduledZone[]>;
  switch (phaseBy) {
    case 'floor':
      groups = groupZonesByFloor(scheduledZones);
      break;
    case 'category':
      groups = groupZonesByCategory(scheduledZones);
      break;
    case 'priority':
    default:
      groups = groupZonesByPriority(scheduledZones);
      break;
  }

  // Sort groups by phase order
  const sortedGroups = Array.from(groups.entries())
    .sort(([keyA], [keyB]) => getPhaseOrder(keyA, phaseBy) - getPhaseOrder(keyB, phaseBy));

  // Build phases with day calculations
  const phases: InstallationPhase[] = [];
  let currentDay = 1;
  let phaseNumber = 1;

  for (const [groupKey, zones] of sortedGroups) {
    if (zones.length === 0) continue;

    const { name, description } = getPhaseName(groupKey, phaseBy);
    const phaseStartDay = currentDay;
    
    // Sort zones within phase by priority
    const sortedZones = zones.sort((a, b) => b.priority - a.priority);
    
    // Calculate days for each zone
    let phaseHours = 0;
    sortedZones.forEach(zone => {
      const startHour = phaseHours;
      const endHour = startHour + zone.estimatedHours;
      
      zone.startDay = phaseStartDay + Math.floor(startHour / hoursPerDay);
      zone.endDay = phaseStartDay + Math.ceil(endHour / hoursPerDay) - 1;
      
      phaseHours = endHour;
    });

    const phaseDurationDays = Math.ceil(phaseHours / hoursPerDay);
    const phaseEndDay = phaseStartDay + phaseDurationDays - 1;

    const priorities = zones.map(z => z.priority);
    const categories = [...new Set(zones.flatMap(z => z.treatments.map(t => t.category)))];

    phases.push({
      id: `phase-${phaseNumber}`,
      phaseNumber,
      name: `Phase ${phaseNumber}: ${name}`,
      description,
      startDay: phaseStartDay,
      endDay: phaseEndDay,
      durationDays: phaseDurationDays,
      zones: sortedZones,
      totalCost: zones.reduce((sum, z) => sum + z.totalCost, 0),
      treatmentCategories: categories,
      priorityRange: { min: Math.min(...priorities), max: Math.max(...priorities) },
    });

    currentDay = phaseEndDay + 1;
    phaseNumber++;
  }

  // Generate milestones
  const milestones: ScheduleMilestone[] = phases.map(phase => ({
    day: phase.endDay,
    type: 'phase-complete' as const,
    label: `${phase.name} Complete`,
    phaseId: phase.id,
  }));

  // Add project complete milestone
  const totalDays = phases.length > 0 ? phases[phases.length - 1].endDay : 0;
  milestones.push({
    day: totalDays,
    type: 'project-complete',
    label: 'Project Complete - All Zones Treated',
  });

  // Build critical path (highest priority zones)
  const criticalPath = scheduledZones
    .filter(z => z.priority >= 60)
    .sort((a, b) => a.startDay - b.startDay)
    .map(z => z.zoneId);

  return {
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,
    totalDays,
    totalHours: scheduledZones.reduce((sum, z) => sum + z.estimatedHours, 0),
    totalPhases: phases.length,
    totalZones: scheduledZones.length,
    phases,
    criticalPath,
    milestones,
    totalCost: selectedPackage.totalCost,
  };
}

export function getCalendarDate(startDate: Date, dayOffset: number, workdaysPerWeek: number = 5): Date {
  if (workdaysPerWeek >= 7) {
    const result = new Date(startDate);
    result.setDate(result.getDate() + dayOffset - 1);
    return result;
  }

  let workdaysCounted = 0;
  const result = new Date(startDate);
  
  while (workdaysCounted < dayOffset) {
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workdaysCounted++;
    }
    if (workdaysCounted < dayOffset) {
      result.setDate(result.getDate() + 1);
    }
  }
  
  return result;
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}
