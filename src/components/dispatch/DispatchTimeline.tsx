import { useState, useMemo } from 'react';
import { WorkOrder } from '@/hooks/useWorkOrders';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useTechnicianSchedules } from '@/hooks/useTechnicianSchedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import ClockInOutButton from './ClockInOutButton';
import { PrayerTimeScheduler } from './PrayerTimeScheduler';

interface DispatchTimelineProps {
  workOrders: WorkOrder[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 6 PM

export default function DispatchTimeline({ workOrders }: DispatchTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: technicians = [] } = useTechnicians();
  const { data: schedules = [] } = useTechnicianSchedules(format(selectedDate, 'yyyy-MM-dd'));

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get work orders for the selected date
  const dayWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      if (!wo.due_date) return false;
      return wo.due_date === dateStr;
    });
  }, [workOrders, dateStr]);

  // Group work orders by technician
  const workOrdersByTech = useMemo(() => {
    const map = new Map<string, WorkOrder[]>();
    dayWorkOrders.forEach(wo => {
      if (wo.assigned_to) {
        const existing = map.get(wo.assigned_to) || [];
        existing.push(wo);
        map.set(wo.assigned_to, existing);
      }
    });
    return map;
  }, [dayWorkOrders]);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getScheduleForTech = (techId: string) => {
    return schedules.find(s => s.technician_id === techId);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      {/* Prayer Times Panel */}
      <div className="xl:col-span-1">
        <PrayerTimeScheduler showCitySelector={true} />
      </div>
      
      {/* Timeline Card */}
      <Card className="xl:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(d => addDays(d, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                className="min-w-[140px]"
              >
                {format(selectedDate, 'EEE, MMM d, yyyy')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(d => addDays(d, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[900px]">
            {/* Header with hours */}
            <div className="flex border-b">
              <div className="w-48 shrink-0 p-2 font-medium text-sm text-muted-foreground border-r">
                Technician
              </div>
              <div className="flex-1 flex">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="flex-1 p-2 text-center text-xs text-muted-foreground border-r last:border-r-0"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Technician rows */}
            {technicians.map(tech => {
              const techWorkOrders = workOrdersByTech.get(tech.id) || [];
              const schedule = getScheduleForTech(tech.id);
              const isClockedIn = schedule?.clock_in_time && !schedule?.clock_out_time;

              return (
                <div key={tech.id} className="flex border-b last:border-b-0 hover:bg-muted/30">
                  {/* Technician info */}
                  <div className="w-48 shrink-0 p-2 border-r">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tech.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(tech.full_name, tech.email)}
                          </AvatarFallback>
                        </Avatar>
                        {isClockedIn && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tech.full_name || tech.email}
                        </p>
                        <ClockInOutButton technicianId={tech.id} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Timeline slots */}
                  <div className="flex-1 flex relative min-h-[60px]">
                    {HOURS.map(hour => (
                      <div
                        key={hour}
                        className="flex-1 border-r last:border-r-0 border-dashed"
                      />
                    ))}

                    {/* Work order blocks */}
                    {techWorkOrders.map((wo, idx) => {
                      // Simple positioning: distribute evenly across morning hours
                      const startHour = 8 + idx * 2;
                      const duration = 2;
                      const left = ((startHour - 6) / 12) * 100;
                      const width = (duration / 12) * 100;

                      return (
                        <div
                          key={wo.id}
                          className={cn(
                            "absolute top-1 bottom-1 rounded-md px-2 py-1 text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
                            getPriorityColor(wo.priority)
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          title={wo.title}
                        >
                          <p className="font-medium truncate">{wo.title}</p>
                          <p className="opacity-80 truncate">{wo.status}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

              {technicians.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No technicians found
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
