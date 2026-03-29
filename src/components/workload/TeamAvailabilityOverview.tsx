import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTechnicianAvailability, AvailabilityType } from '@/hooks/useTechnicianAvailability';
import { startOfWeek, endOfWeek, addDays, format, addMonths } from 'date-fns';
import { AlertTriangle, Palmtree, GraduationCap, Thermometer, Phone, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const availabilityIcons: Record<AvailabilityType, React.ReactNode> = {
  working: null,
  vacation: <Palmtree className="w-3 h-3" />,
  sick_leave: <Thermometer className="w-3 h-3" />,
  training: <GraduationCap className="w-3 h-3" />,
  on_call: <Phone className="w-3 h-3" />,
};

const availabilityLabels: Record<AvailabilityType, string> = {
  working: 'Working',
  vacation: 'Vacation',
  sick_leave: 'Sick Leave',
  training: 'Training',
  on_call: 'On Call',
};

export function TeamAvailabilityOverview() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const monthEnd = addMonths(today, 1);

  const { technicianAvailability, getTeamAvailabilitySummary, getUpcomingTimeOff, isLoading } = 
    useTechnicianAvailability(weekStart, monthEnd);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) { // Sun-Thu (Saudi work week)
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const weekSummaries = useMemo(() => {
    return weekDays.map(day => getTeamAvailabilitySummary(day));
  }, [weekDays, getTeamAvailabilitySummary]);

  const upcomingTimeOff = useMemo(() => getUpcomingTimeOff(14), [getUpcomingTimeOff]);

  const lowCoverageDays = weekSummaries.filter(s => {
    const coverageRate = s.totalCount > 0 ? s.availableCount / s.totalCount : 1;
    return coverageRate < 0.5;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Team Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTechnicians = technicianAvailability.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Team Availability This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Days */}
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const summary = weekSummaries[i];
            const coverageRate = totalTechnicians > 0 
              ? summary.availableCount / totalTechnicians 
              : 1;
            
            return (
              <div key={i} className="text-center space-y-1">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className="flex justify-center gap-0.5">
                  {Array.from({ length: Math.min(4, totalTechnicians) }).map((_, j) => (
                    <div
                      key={j}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        j < summary.availableCount
                          ? 'bg-green-500'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <div className="text-xs font-medium">
                  {summary.availableCount}/{totalTechnicians}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming Time-Off */}
        {upcomingTimeOff.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Upcoming Time-Off:</div>
            <div className="space-y-1.5">
              {upcomingTimeOff.slice(0, 3).map((timeOff) => (
                <div key={timeOff.id} className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">
                    {availabilityIcons[timeOff.type]}
                  </div>
                  <span className="font-medium truncate flex-1">{timeOff.technicianName}:</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {format(new Date(timeOff.startDate), 'MMM d')}
                    {timeOff.startDate !== timeOff.endDate && (
                      <>-{format(new Date(timeOff.endDate), 'MMM d')}</>
                    )}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {availabilityLabels[timeOff.type]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Coverage Warning */}
        {lowCoverageDays.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="text-xs text-warning">
              Low coverage on {lowCoverageDays.map(d => format(new Date(d.date), 'EEEE')).join(', ')}
            </span>
          </div>
        )}

        {totalTechnicians === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No technicians found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
