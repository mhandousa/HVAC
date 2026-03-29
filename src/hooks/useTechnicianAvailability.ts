import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useTechnicians } from './useTechnicians';
import { useDeficiencyAssignments } from './useDeficiencyAssignments';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isWithinInterval, addDays } from 'date-fns';

export type AvailabilityType = 'working' | 'vacation' | 'sick_leave' | 'training' | 'on_call';
export type CapacityStatus = 'available' | 'moderate' | 'full' | 'overloaded';

export interface DailyScheduleEntry {
  date: string;
  isAvailable: boolean;
  availabilityType: AvailabilityType;
  startTime: string | null;
  endTime: string | null;
  workingHours: number;
  notes: string | null;
  scheduleId: string | null;
}

export interface TechnicianAvailability {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  
  // Weekly summary
  weeklyWorkingHours: number;
  weeklyScheduledHours: number;
  weeklyTimeOffDays: number;
  
  // Capacity
  currentAssignments: number;
  avgResolutionDays: number;
  recommendedMaxAssignments: number;
  availableCapacity: number;
  capacityStatus: CapacityStatus;
  utilizationRate: number;
  
  // Daily schedule for the period
  dailySchedule: DailyScheduleEntry[];
  
  // Today's status
  todayAvailabilityType: AvailabilityType | null;
  isAvailableToday: boolean;
}

export interface TeamAvailabilitySummary {
  date: string;
  availableCount: number;
  totalCount: number;
  techniciansOff: { id: string; name: string; type: AvailabilityType }[];
}

export interface UpcomingTimeOff {
  id: string;
  technicianId: string;
  technicianName: string;
  startDate: string;
  endDate: string;
  type: AvailabilityType;
  notes: string | null;
}

const STANDARD_HOURS_PER_WEEK = 40;
const HOURS_PER_ASSIGNMENT = 4;

function calculateWorkingHours(startTime: string | null, endTime: string | null): number {
  if (!startTime || !endTime) return 8; // Default 8 hours
  
  const start = parseInt(startTime.split(':')[0], 10);
  const end = parseInt(endTime.split(':')[0], 10);
  return Math.max(0, end - start);
}

function getCapacityStatus(utilizationRate: number): CapacityStatus {
  if (utilizationRate < 0.5) return 'available';
  if (utilizationRate < 0.8) return 'moderate';
  if (utilizationRate <= 1) return 'full';
  return 'overloaded';
}

export function useTechnicianAvailability(startDate: Date, endDate: Date) {
  const { data: organization } = useOrganization();
  const { data: technicians } = useTechnicians();
  const { assignments } = useDeficiencyAssignments();

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['technician-schedules-range', organization?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('technician_schedules')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const technicianAvailability = useMemo(() => {
    if (!technicians) return [];

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

    return technicians.map((tech): TechnicianAvailability => {
      const techSchedules = schedules?.filter(s => s.technician_id === tech.id) || [];
      const techAssignments = assignments?.filter(a => 
        a.assignedTo === tech.id && 
        (a.status === 'assigned' || a.status === 'in_progress')
      ) || [];

      // Build daily schedule
      const dailySchedule: DailyScheduleEntry[] = datesInRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const schedule = techSchedules.find(s => s.schedule_date === dateStr);

        if (schedule) {
          return {
            date: dateStr,
            isAvailable: schedule.is_available,
            availabilityType: (schedule.availability_type as AvailabilityType) || 'working',
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            workingHours: schedule.is_available 
              ? calculateWorkingHours(schedule.start_time, schedule.end_time)
              : 0,
            notes: schedule.notes,
            scheduleId: schedule.id,
          };
        }

        // Default to working if no schedule (weekdays)
        const dayOfWeek = date.getDay();
        const isWeekday = dayOfWeek !== 5 && dayOfWeek !== 6; // Friday and Saturday are weekend in Saudi Arabia

        return {
          date: dateStr,
          isAvailable: isWeekday,
          availabilityType: 'working' as AvailabilityType,
          startTime: isWeekday ? '08:00' : null,
          endTime: isWeekday ? '17:00' : null,
          workingHours: isWeekday ? 8 : 0,
          notes: null,
          scheduleId: null,
        };
      });

      // Calculate weekly metrics
      const weeklySchedules = dailySchedule.filter(s => {
        const scheduleDate = parseISO(s.date);
        return isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd });
      });

      const weeklyScheduledHours = weeklySchedules
        .filter(s => s.isAvailable)
        .reduce((sum, s) => sum + s.workingHours, 0);

      const weeklyTimeOffDays = weeklySchedules
        .filter(s => !s.isAvailable && s.availabilityType !== 'working')
        .length;

      // Calculate capacity
      const currentAssignments = techAssignments.length;
      const recommendedMax = Math.max(1, Math.floor(weeklyScheduledHours / HOURS_PER_ASSIGNMENT));
      const utilizationRate = recommendedMax > 0 ? currentAssignments / recommendedMax : 0;
      const availableCapacity = Math.max(0, recommendedMax - currentAssignments);
      const capacityStatus = getCapacityStatus(utilizationRate);

      // Today's status
      const todaySchedule = dailySchedule.find(s => s.date === today);
      const todayAvailabilityType = todaySchedule?.availabilityType || null;
      const isAvailableToday = todaySchedule?.isAvailable ?? true;

      return {
        id: tech.id,
        name: tech.full_name || tech.email || 'Unknown',
        email: tech.email || '',
        avatarUrl: tech.avatar_url,
        weeklyWorkingHours: STANDARD_HOURS_PER_WEEK,
        weeklyScheduledHours,
        weeklyTimeOffDays,
        currentAssignments,
        avgResolutionDays: 3, // Would be calculated from historical data
        recommendedMaxAssignments: recommendedMax,
        availableCapacity,
        capacityStatus,
        utilizationRate,
        dailySchedule,
        todayAvailabilityType,
        isAvailableToday,
      };
    });
  }, [technicians, schedules, assignments, startDate, endDate]);

  const getTeamAvailabilitySummary = (date: Date): TeamAvailabilitySummary => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const techsOff: TeamAvailabilitySummary['techniciansOff'] = [];
    let availableCount = 0;

    technicianAvailability.forEach(tech => {
      const daySchedule = tech.dailySchedule.find(s => s.date === dateStr);
      if (daySchedule?.isAvailable) {
        availableCount++;
      } else if (daySchedule && !daySchedule.isAvailable) {
        techsOff.push({
          id: tech.id,
          name: tech.name,
          type: daySchedule.availabilityType,
        });
      }
    });

    return {
      date: dateStr,
      availableCount,
      totalCount: technicianAvailability.length,
      techniciansOff: techsOff,
    };
  };

  const getUpcomingTimeOff = (days: number = 14): UpcomingTimeOff[] => {
    const today = new Date();
    const futureDate = addDays(today, days);
    const upcomingTimeOff: UpcomingTimeOff[] = [];

    technicianAvailability.forEach(tech => {
      const timeOffPeriods = tech.dailySchedule
        .filter(s => !s.isAvailable && s.availabilityType !== 'working')
        .filter(s => {
          const scheduleDate = parseISO(s.date);
          return isWithinInterval(scheduleDate, { start: today, end: futureDate });
        });

      // Group consecutive days
      let currentStart: string | null = null;
      let currentType: AvailabilityType | null = null;
      let currentNotes: string | null = null;

      timeOffPeriods.forEach((period, index) => {
        if (!currentStart) {
          currentStart = period.date;
          currentType = period.availabilityType;
          currentNotes = period.notes;
        }

        const nextPeriod = timeOffPeriods[index + 1];
        const currentDate = parseISO(period.date);
        const isLastOrDiscontinuous = !nextPeriod || 
          parseISO(nextPeriod.date).getTime() !== addDays(currentDate, 1).getTime() ||
          nextPeriod.availabilityType !== currentType;

        if (isLastOrDiscontinuous && currentStart && currentType) {
          upcomingTimeOff.push({
            id: `${tech.id}-${currentStart}`,
            technicianId: tech.id,
            technicianName: tech.name,
            startDate: currentStart,
            endDate: period.date,
            type: currentType,
            notes: currentNotes,
          });
          currentStart = null;
          currentType = null;
          currentNotes = null;
        }
      });
    });

    return upcomingTimeOff.sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  const checkAvailabilityConflict = (technicianId: string, date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tech = technicianAvailability.find(t => t.id === technicianId);
    if (!tech) return false;

    const daySchedule = tech.dailySchedule.find(s => s.date === dateStr);
    return daySchedule ? !daySchedule.isAvailable : false;
  };

  return {
    technicianAvailability,
    isLoading: schedulesLoading,
    getTeamAvailabilitySummary,
    getUpcomingTimeOff,
    checkAvailabilityConflict,
  };
}
