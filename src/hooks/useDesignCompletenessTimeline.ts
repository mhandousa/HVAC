import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { format, subDays, eachDayOfInterval, parseISO, isBefore, startOfDay } from 'date-fns';
import { TimelineDataPoint, Milestone, MilestoneType, calculateZoneCompletenessFromPercents, calculateSpecializedToolsScore, calculateCombinedHealthScore } from '@/lib/design-completeness-utils';

interface TimelineEvent {
  id: string;
  zone_id: string;
  created_at: string;
}

interface SnapshotRecord {
  id: string;
  project_id: string;
  snapshot_date: string;
  total_zones: number;
  zones_with_load_calc: number;
  zones_with_equipment: number;
  zones_with_distribution: number;
  zones_with_ventilation: number | null;
  zones_with_erv: number | null;
  zones_with_acoustic: number | null;
  fully_complete_zones: number;
  overall_completeness_percent: number;
  load_calc_percent: number;
  equipment_percent: number;
  distribution_percent: number;
  ventilation_percent: number | null;
  erv_percent: number | null;
  acoustic_percent: number | null;
  zones_passing_nc: number | null;
  nc_compliance_percent: number | null;
  created_at: string;
  // Specialized tools (Phase 1: 6 tools)
  has_chw_plant: boolean | null;
  has_hw_plant: boolean | null;
  has_smoke_control: boolean | null;
  has_thermal_comfort: boolean | null;
  has_sbc_compliance: boolean | null;
  has_ashrae_90_1_compliance: boolean | null;
  // Phase 18: 5 new specialized tools
  has_economizer_selections: boolean | null;
  has_control_valve_selections: boolean | null;
  has_expansion_tank_selections: boolean | null;
  has_silencer_selections: boolean | null;
  has_vibration_isolation_selections: boolean | null;
  // 8 remaining specialized tools (previously stubbed)
  has_ahu_configurations: boolean | null;
  has_fan_selections: boolean | null;
  has_pump_selections: boolean | null;
  has_insulation_calculations: boolean | null;
  has_sequence_of_operations: boolean | null;
  has_coil_selections: boolean | null;
  has_filter_selections: boolean | null;
  has_cooling_tower_selections: boolean | null;
}

interface TimelineResult {
  timeline: TimelineDataPoint[];
  milestones: Milestone[];
  velocity: {
    zonesPerWeek: number;
    estimatedCompletionDate: string | null;
  };
  dataSource: 'snapshots' | 'derived';
  lastSnapshotDate: string | null;
}

export function useDesignCompletenessTimeline(
  projectId: string | null,
  dateRange: '7d' | '30d' | '90d' | 'all' = '30d'
) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['design-completeness-timeline', projectId, organization?.id, dateRange],
    queryFn: async (): Promise<TimelineResult | null> => {
      if (!projectId || !organization?.id) return null;

      // Calculate date range
      const today = startOfDay(new Date());
      let startDate: Date;
      
      if (dateRange === 'all') {
        // Start from 1 year ago for 'all' - will be adjusted based on data
        startDate = subDays(today, 365);
      } else {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        startDate = subDays(today, days);
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(today, 'yyyy-MM-dd');

      // Try to fetch from snapshots table first
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('design_completeness_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .gte('snapshot_date', startDateStr)
        .lte('snapshot_date', endDateStr)
        .order('snapshot_date', { ascending: true });

      // If we have snapshots, use them (more accurate)
      if (!snapshotsError && snapshots && snapshots.length > 0) {
        return transformSnapshotsToTimeline(snapshots as SnapshotRecord[], today);
      }

      // Fallback to event derivation for projects without snapshots
      return deriveTimelineFromEvents(projectId, dateRange, today);
    },
    enabled: !!projectId && !!organization?.id,
  });
}

// Transform snapshot records into timeline format
function transformSnapshotsToTimeline(
  snapshots: SnapshotRecord[],
  today: Date
): TimelineResult {
  const timeline: TimelineDataPoint[] = [];
  const milestones: Milestone[] = [];
  const seenMilestones = new Set<string>();

  for (const snapshot of snapshots) {
    const displayDate = format(parseISO(snapshot.snapshot_date), 'MMM d');
    
    // Detect milestones
    let milestone: Milestone | undefined;
    const totalZones = snapshot.total_zones;
    const zonesComplete = snapshot.fully_complete_zones;

    // Zone-based milestones
    if (zonesComplete >= 1 && !seenMilestones.has('first_complete')) {
      milestone = { type: 'first_complete', label: 'First zone complete', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('first_complete');
    } else if (totalZones > 0 && zonesComplete >= totalZones * 0.25 && !seenMilestones.has('quarter_complete')) {
      milestone = { type: 'quarter_complete', label: '25% complete', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('quarter_complete');
    } else if (totalZones > 0 && zonesComplete >= totalZones * 0.5 && !seenMilestones.has('half_complete')) {
      milestone = { type: 'half_complete', label: '50% complete', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('half_complete');
    } else if (totalZones > 0 && zonesComplete >= totalZones * 0.75 && !seenMilestones.has('three_quarter_complete')) {
      milestone = { type: 'three_quarter_complete', label: '75% complete', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('three_quarter_complete');
    } else if (totalZones > 0 && zonesComplete === totalZones && !seenMilestones.has('project_complete')) {
      milestone = { type: 'project_complete', label: 'Project complete', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('project_complete');
    } else if (snapshot.load_calc_percent === 100 && !seenMilestones.has('all_load_calc')) {
      milestone = { type: 'all_load_calc', label: 'All load calcs done', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_load_calc');
    } else if (snapshot.equipment_percent === 100 && !seenMilestones.has('all_equipment')) {
      milestone = { type: 'all_equipment', label: 'All equipment selected', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_equipment');
    } else if (snapshot.distribution_percent === 100 && !seenMilestones.has('all_distribution')) {
      milestone = { type: 'all_distribution', label: 'All distribution assigned', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_distribution');
    } else if (snapshot.ventilation_percent === 100 && !seenMilestones.has('all_ventilation')) {
      milestone = { type: 'all_ventilation', label: 'All ventilation calcs done', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_ventilation');
    } else if (snapshot.erv_percent === 100 && !seenMilestones.has('all_erv')) {
      milestone = { type: 'all_erv', label: 'All ERV sizing done', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_erv');
    } else if (snapshot.acoustic_percent === 100 && !seenMilestones.has('all_acoustic')) {
      milestone = { type: 'all_acoustic', label: 'All acoustic analysis done', date: snapshot.snapshot_date, category: 'zone' };
      milestones.push(milestone);
      seenMilestones.add('all_acoustic');
    }

    // Specialized tools milestones (can occur alongside zone milestones)
    if (snapshot.has_chw_plant && !seenMilestones.has('chw_plant_complete')) {
      const specializedMilestone: Milestone = { type: 'chw_plant_complete', label: 'CHW Plant added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('chw_plant_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_hw_plant && !seenMilestones.has('hw_plant_complete')) {
      const specializedMilestone: Milestone = { type: 'hw_plant_complete', label: 'HW Plant added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('hw_plant_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_smoke_control && !seenMilestones.has('smoke_control_complete')) {
      const specializedMilestone: Milestone = { type: 'smoke_control_complete', label: 'Smoke Control added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('smoke_control_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_thermal_comfort && !seenMilestones.has('thermal_comfort_complete')) {
      const specializedMilestone: Milestone = { type: 'thermal_comfort_complete', label: 'Thermal Comfort added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('thermal_comfort_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_sbc_compliance && !seenMilestones.has('sbc_compliance_complete')) {
      const specializedMilestone: Milestone = { type: 'sbc_compliance_complete', label: 'SBC Compliance added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('sbc_compliance_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_ashrae_90_1_compliance && !seenMilestones.has('ashrae_90_1_complete')) {
      const specializedMilestone: Milestone = { type: 'ashrae_90_1_complete', label: 'ASHRAE 90.1 added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('ashrae_90_1_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    
    // Phase 18: 5 new specialized tools milestones
    if (snapshot.has_economizer_selections && !seenMilestones.has('economizer_complete')) {
      const specializedMilestone: Milestone = { type: 'economizer_complete' as MilestoneType, label: 'Economizer Selection added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('economizer_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_control_valve_selections && !seenMilestones.has('control_valve_complete')) {
      const specializedMilestone: Milestone = { type: 'control_valve_complete' as MilestoneType, label: 'Control Valve Selection added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('control_valve_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_expansion_tank_selections && !seenMilestones.has('expansion_tank_complete')) {
      const specializedMilestone: Milestone = { type: 'expansion_tank_complete' as MilestoneType, label: 'Expansion Tank Selection added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('expansion_tank_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_silencer_selections && !seenMilestones.has('silencer_complete')) {
      const specializedMilestone: Milestone = { type: 'silencer_complete' as MilestoneType, label: 'Silencer Selection added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('silencer_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    if (snapshot.has_vibration_isolation_selections && !seenMilestones.has('vibration_isolation_complete')) {
      const specializedMilestone: Milestone = { type: 'vibration_isolation_complete' as MilestoneType, label: 'Vibration Isolation added', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('vibration_isolation_complete');
      if (!milestone) milestone = specializedMilestone;
    }
    
    // All specialized tools complete milestone (11 tools: original 6 + Phase 18 5)
    const allSpecialized = snapshot.has_chw_plant && snapshot.has_hw_plant && 
                           snapshot.has_smoke_control && snapshot.has_thermal_comfort && 
                           snapshot.has_sbc_compliance && snapshot.has_ashrae_90_1_compliance &&
                           snapshot.has_economizer_selections && snapshot.has_control_valve_selections &&
                           snapshot.has_expansion_tank_selections && snapshot.has_silencer_selections &&
                           snapshot.has_vibration_isolation_selections;
    if (allSpecialized && !seenMilestones.has('all_specialized_complete')) {
      const specializedMilestone: Milestone = { type: 'all_specialized_complete', label: 'All specialized tools complete', date: snapshot.snapshot_date, category: 'specialized' };
      milestones.push(specializedMilestone);
      seenMilestones.add('all_specialized_complete');
      if (!milestone) milestone = specializedMilestone;
    }

    // Calculate specialized tools score using centralized function (19 tools @ ~5.26% each)
    const specializedToolsScore = calculateSpecializedToolsScore({
      hasChilledWaterPlant: snapshot.has_chw_plant ?? false,
      hasHotWaterPlant: snapshot.has_hw_plant ?? false,
      hasSmokeControl: snapshot.has_smoke_control ?? false,
      hasThermalComfort: snapshot.has_thermal_comfort ?? false,
      hasSBCCompliance: snapshot.has_sbc_compliance ?? false,
      hasASHRAE90_1Compliance: snapshot.has_ashrae_90_1_compliance ?? false,
      // 8 remaining specialized tools (NOW tracked from snapshots)
      hasAHUConfiguration: snapshot.has_ahu_configurations ?? false,
      hasFanSelections: snapshot.has_fan_selections ?? false,
      hasPumpSelections: snapshot.has_pump_selections ?? false,
      hasInsulationCalculations: snapshot.has_insulation_calculations ?? false,
      hasSequenceOfOperations: snapshot.has_sequence_of_operations ?? false,
      hasCoilSelections: snapshot.has_coil_selections ?? false,
      hasFilterSelections: snapshot.has_filter_selections ?? false,
      hasCoolingTowerSelections: snapshot.has_cooling_tower_selections ?? false,
      // Phase 18: 5 new specialized tools (tracked from snapshots)
      hasEconomizerSelections: snapshot.has_economizer_selections ?? false,
      hasControlValveSelections: snapshot.has_control_valve_selections ?? false,
      hasExpansionTankSelections: snapshot.has_expansion_tank_selections ?? false,
      hasSilencerSelections: snapshot.has_silencer_selections ?? false,
      hasVibrationIsolationSelections: snapshot.has_vibration_isolation_selections ?? false,
    });

    // Calculate combined health score (75% zone completeness + 25% specialized tools)
    const combinedHealthScore = calculateCombinedHealthScore(
      snapshot.overall_completeness_percent,
      specializedToolsScore
    );

    timeline.push({
      date: snapshot.snapshot_date,
      displayDate,
      overallPercent: snapshot.overall_completeness_percent,
      loadCalcPercent: snapshot.load_calc_percent,
      equipmentPercent: snapshot.equipment_percent,
      distributionPercent: snapshot.distribution_percent,
      ventilationPercent: snapshot.ventilation_percent ?? 0,
      ervPercent: snapshot.erv_percent ?? 0,
      acousticPercent: snapshot.acoustic_percent ?? 0,
      ncCompliancePercent: snapshot.nc_compliance_percent ?? 0,
      zonesComplete: snapshot.fully_complete_zones,
      totalZones: snapshot.total_zones,
      zonesWithAcoustic: snapshot.zones_with_acoustic ?? 0,
      zonesPassingNC: snapshot.zones_passing_nc ?? 0,
      milestone,
      hasChwPlant: snapshot.has_chw_plant ?? false,
      hasHwPlant: snapshot.has_hw_plant ?? false,
      hasSmokeControl: snapshot.has_smoke_control ?? false,
      hasThermalComfort: snapshot.has_thermal_comfort ?? false,
      hasSbcCompliance: snapshot.has_sbc_compliance ?? false,
      hasAshrae90_1Compliance: snapshot.has_ashrae_90_1_compliance ?? false,
      // Phase 18: 5 new specialized tools
      hasEconomizerSelections: snapshot.has_economizer_selections ?? false,
      hasControlValveSelections: snapshot.has_control_valve_selections ?? false,
      hasExpansionTankSelections: snapshot.has_expansion_tank_selections ?? false,
      hasSilencerSelections: snapshot.has_silencer_selections ?? false,
      hasVibrationIsolationSelections: snapshot.has_vibration_isolation_selections ?? false,
      specializedToolsScore,
      combinedHealthScore,
    });
  }

  // Calculate velocity
  const velocity = calculateVelocity(timeline, today);
  const lastSnapshot = snapshots[snapshots.length - 1];

  return {
    timeline,
    milestones,
    velocity,
    dataSource: 'snapshots',
    lastSnapshotDate: lastSnapshot?.snapshot_date || null,
  };
}

// Derive timeline from event timestamps (fallback for projects without snapshots)
async function deriveTimelineFromEvents(
  projectId: string,
  dateRange: '7d' | '30d' | '90d' | 'all',
  today: Date
): Promise<TimelineResult> {
  // Fetch all zones for the project
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select(`
      id,
      floors!inner (
        buildings!inner (
          project_id
        )
      )
    `)
    .eq('floors.buildings.project_id', projectId);

  if (zonesError || !zones || zones.length === 0) {
    return {
      timeline: [],
      milestones: [],
      velocity: { zonesPerWeek: 0, estimatedCompletionDate: null },
      dataSource: 'derived',
      lastSnapshotDate: null,
    };
  }

  const zoneIds = zones.map(z => z.id);
  const totalZones = zoneIds.length;

  // Fetch all events with timestamps - now including ventilation and ERV
  const [loadCalcsResult, equipmentResult, ductResult, pipeResult, vrfResult, ventilationResult, ervResult] = await Promise.all([
    supabase
      .from('load_calculations')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('equipment_selections')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('duct_system_zones')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('pipe_system_zones')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('vrf_indoor_units')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('ventilation_zone_results')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('erv_sizing_calculations')
      .select('id, zone_id, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: true }),
  ]);

  const loadCalcs = (loadCalcsResult.data || []) as TimelineEvent[];
  const equipmentSelections = (equipmentResult.data || []) as TimelineEvent[];
  const ductZones = (ductResult.data || []) as TimelineEvent[];
  const pipeZones = (pipeResult.data || []) as TimelineEvent[];
  const vrfUnits = (vrfResult.data || []) as TimelineEvent[];
  const ventilationZones = (ventilationResult.data || []) as TimelineEvent[];
  const ervZones = (ervResult.data || []) as TimelineEvent[];

  // Combine all distribution system events
  const distributionEvents = [...ductZones, ...pipeZones, ...vrfUnits];

  // Get all unique dates
  const allEvents = [...loadCalcs, ...equipmentSelections, ...distributionEvents, ...ventilationZones, ...ervZones];
  
  if (allEvents.length === 0) {
    return {
      timeline: [],
      milestones: [],
      velocity: { zonesPerWeek: 0, estimatedCompletionDate: null },
      dataSource: 'derived',
      lastSnapshotDate: null,
    };
  }

  // Determine date range
  let startDate: Date;
  
  if (dateRange === 'all') {
    const firstEventDate = allEvents.reduce((earliest, event) => {
      const eventDate = parseISO(event.created_at);
      return isBefore(eventDate, earliest) ? eventDate : earliest;
    }, parseISO(allEvents[0].created_at));
    startDate = startOfDay(firstEventDate);
  } else {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    startDate = subDays(today, days);
  }

  // Generate all dates in range
  const dateInterval = eachDayOfInterval({ start: startDate, end: today });

  // Build timeline by aggregating cumulative counts per day
  const timeline: TimelineDataPoint[] = [];
  const milestones: Milestone[] = [];
  const seenMilestones = new Set<string>();

  dateInterval.forEach((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'MMM d');

    // Count unique zones with each type of completion as of this date
    const zonesWithLoadCalc = new Set(
      loadCalcs
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    ).size;

    const zonesWithEquipment = new Set(
      equipmentSelections
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    ).size;

    const zonesWithDistribution = new Set(
      distributionEvents
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    ).size;

    const zonesWithVentilation = new Set(
      ventilationZones
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    ).size;

    const zonesWithERV = new Set(
      ervZones
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    ).size;

    // Calculate percentages
    const loadCalcPercent = Math.round((zonesWithLoadCalc / totalZones) * 100);
    const equipmentPercent = Math.round((zonesWithEquipment / totalZones) * 100);
    const distributionPercent = Math.round((zonesWithDistribution / totalZones) * 100);
    const ventilationPercent = Math.round((zonesWithVentilation / totalZones) * 100);
    const ervPercent = Math.round((zonesWithERV / totalZones) * 100);
    
    // Overall uses centralized weighted average
    const overallPercent = calculateZoneCompletenessFromPercents(
      loadCalcPercent,
      equipmentPercent,
      distributionPercent,
      ventilationPercent,
      ervPercent
    );

    // Count fully complete zones
    const loadCalcZoneIds = new Set(
      loadCalcs
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    );
    const equipmentZoneIds = new Set(
      equipmentSelections
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    );
    const distributionZoneIds = new Set(
      distributionEvents
        .filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') <= dateStr)
        .map(e => e.zone_id)
    );

    const zonesComplete = zoneIds.filter(
      zid => loadCalcZoneIds.has(zid) && equipmentZoneIds.has(zid) && distributionZoneIds.has(zid)
    ).length;

    // Detect milestones
    let milestone: Milestone | undefined;

    if (zonesComplete >= 1 && !seenMilestones.has('first_complete')) {
      milestone = { type: 'first_complete', label: 'First zone complete', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('first_complete');
    } else if (zonesComplete >= totalZones * 0.25 && !seenMilestones.has('quarter_complete')) {
      milestone = { type: 'quarter_complete', label: '25% complete', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('quarter_complete');
    } else if (zonesComplete >= totalZones * 0.5 && !seenMilestones.has('half_complete')) {
      milestone = { type: 'half_complete', label: '50% complete', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('half_complete');
    } else if (zonesComplete >= totalZones * 0.75 && !seenMilestones.has('three_quarter_complete')) {
      milestone = { type: 'three_quarter_complete', label: '75% complete', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('three_quarter_complete');
    } else if (zonesComplete === totalZones && !seenMilestones.has('project_complete')) {
      milestone = { type: 'project_complete', label: 'Project complete', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('project_complete');
    } else if (zonesWithLoadCalc === totalZones && !seenMilestones.has('all_load_calc')) {
      milestone = { type: 'all_load_calc', label: 'All load calcs done', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('all_load_calc');
    } else if (zonesWithEquipment === totalZones && !seenMilestones.has('all_equipment')) {
      milestone = { type: 'all_equipment', label: 'All equipment selected', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('all_equipment');
    } else if (zonesWithDistribution === totalZones && !seenMilestones.has('all_distribution')) {
      milestone = { type: 'all_distribution', label: 'All distribution assigned', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('all_distribution');
    } else if (zonesWithVentilation === totalZones && !seenMilestones.has('all_ventilation')) {
      milestone = { type: 'all_ventilation', label: 'All ventilation calcs done', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('all_ventilation');
    } else if (zonesWithERV === totalZones && !seenMilestones.has('all_erv')) {
      milestone = { type: 'all_erv', label: 'All ERV sizing done', date: dateStr };
      milestones.push(milestone);
      seenMilestones.add('all_erv');
    }

    // Calculate combined health score (75% zone completeness + 25% specialized tools)
    // Note: Derived timeline doesn't have specialized tools data, so tools score is 0
    const combinedHealthScore = calculateCombinedHealthScore(overallPercent, 0);

    timeline.push({
      date: dateStr,
      displayDate,
      overallPercent,
      loadCalcPercent,
      equipmentPercent,
      distributionPercent,
      ventilationPercent,
      ervPercent,
      zonesComplete,
      totalZones,
      milestone,
      specializedToolsScore: 0,
      combinedHealthScore,
    });
  });

  const velocity = calculateVelocity(timeline, today);

  return {
    timeline,
    milestones,
    velocity,
    dataSource: 'derived',
    lastSnapshotDate: null,
  };
}

// Calculate velocity based on recent timeline data
function calculateVelocity(
  timeline: TimelineDataPoint[],
  today: Date
): { zonesPerWeek: number; estimatedCompletionDate: string | null } {
  const recentDays = timeline.slice(-7);
  let zonesPerWeek = 0;
  let estimatedCompletionDate: string | null = null;

  if (recentDays.length >= 2) {
    const startComplete = recentDays[0]?.zonesComplete || 0;
    const endComplete = recentDays[recentDays.length - 1]?.zonesComplete || 0;
    const totalZones = recentDays[recentDays.length - 1]?.totalZones || 0;
    const completedInPeriod = endComplete - startComplete;
    zonesPerWeek = Math.round(completedInPeriod * (7 / recentDays.length));

    if (zonesPerWeek > 0 && totalZones > 0) {
      const remaining = totalZones - endComplete;
      const weeksToComplete = remaining / zonesPerWeek;
      const daysToComplete = Math.ceil(weeksToComplete * 7);
      estimatedCompletionDate = format(
        subDays(today, -daysToComplete),
        'MMM d, yyyy'
      );
    }
  }

  return { zonesPerWeek, estimatedCompletionDate };
}
