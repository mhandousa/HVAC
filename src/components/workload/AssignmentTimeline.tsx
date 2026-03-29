import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnrichedAssignment } from '@/hooks/useTechnicianWorkload';
import { format, parseISO, addDays, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssignmentTimelineProps {
  assignments: EnrichedAssignment[];
}

export function AssignmentTimeline({ assignments }: AssignmentTimelineProps) {
  const today = startOfDay(new Date());
  
  // Get assignments with due dates in the next 7 days
  const upcomingAssignments = assignments
    .filter(a => a.dueDate && a.status !== 'resolved')
    .map(a => ({
      ...a,
      dueDateParsed: parseISO(a.dueDate!),
    }))
    .filter(a => {
      const daysDiff = Math.ceil((a.dueDateParsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= -3 && daysDiff <= 7; // Show past 3 days and next 7 days
    })
    .sort((a, b) => a.dueDateParsed.getTime() - b.dueDateParsed.getTime());

  // Group by date
  const dateGroups = new Map<string, typeof upcomingAssignments>();
  for (let i = -3; i <= 7; i++) {
    const date = addDays(today, i);
    const key = format(date, 'yyyy-MM-dd');
    dateGroups.set(key, []);
  }

  upcomingAssignments.forEach(a => {
    const key = format(a.dueDateParsed, 'yyyy-MM-dd');
    if (dateGroups.has(key)) {
      dateGroups.get(key)!.push(a);
    }
  });

  const days = Array.from(dateGroups.entries()).map(([dateStr, items]) => {
    const date = parseISO(dateStr);
    const isToday = isSameDay(date, today);
    const isPast = date < today;

    return {
      date,
      dateStr,
      label: isToday ? 'Today' : format(date, 'EEE d'),
      count: items.length,
      items,
      isToday,
      isPast,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Assignment Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {days.map((day) => (
            <div
              key={day.dateStr}
              className={cn(
                "flex flex-col items-center min-w-[60px] p-2 rounded-lg transition-colors",
                day.isToday && "bg-primary/10 ring-2 ring-primary",
                day.isPast && !day.isToday && "opacity-50"
              )}
            >
              <span className={cn(
                "text-xs font-medium",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.label}
              </span>
              {day.count > 0 ? (
                <Badge 
                  variant={day.isPast ? "destructive" : "default"}
                  className="mt-1"
                >
                  {day.count}
                </Badge>
              ) : (
                <div className="w-5 h-5 mt-1 rounded-full border-2 border-dashed border-muted" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span>Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
