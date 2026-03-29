import { useState, useMemo } from 'react';
import { WorkOrder } from '@/hooks/useWorkOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, AlertCircle, Timer, CheckCircle2, Wrench, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface DispatchCalendarProps {
  workOrders: WorkOrder[];
}

const statusConfig = {
  open: { icon: AlertCircle, className: 'bg-info text-info-foreground' },
  in_progress: { icon: Timer, className: 'bg-warning text-warning-foreground' },
  completed: { icon: CheckCircle2, className: 'bg-success text-success-foreground' },
  cancelled: { icon: AlertCircle, className: 'bg-muted text-muted-foreground' },
};

const priorityColors = {
  low: 'border-l-muted-foreground',
  medium: 'border-l-info',
  high: 'border-l-warning',
  urgent: 'border-l-destructive',
};

export default function DispatchCalendar({ workOrders }: DispatchCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const workOrdersByDate = useMemo(() => {
    const map = new Map<string, WorkOrder[]>();
    workOrders.forEach((wo) => {
      if (wo.due_date) {
        const dateKey = wo.due_date.split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(wo);
      }
    });
    return map;
  }, [workOrders]);

  const selectedDateWorkOrders = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return workOrdersByDate.get(dateKey) || [];
  }, [selectedDate, workOrdersByDate]);

  const daysWithWorkOrders = useMemo(() => {
    return Array.from(workOrdersByDate.keys()).map(date => new Date(date));
  }, [workOrdersByDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border w-full"
            modifiers={{
              hasWorkOrders: daysWithWorkOrders,
            }}
            modifiersStyles={{
              hasWorkOrders: {
                fontWeight: 'bold',
              },
            }}
            components={{
              DayContent: ({ date }) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const dayWorkOrders = workOrdersByDate.get(dateKey) || [];
                const urgentCount = dayWorkOrders.filter(wo => wo.priority === 'urgent' || wo.priority === 'high').length;
                const totalCount = dayWorkOrders.length;
                
                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <span>{date.getDate()}</span>
                    {totalCount > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {urgentCount > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        )}
                        {totalCount - urgentCount > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Work Orders */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
          </h3>
          <ScrollArea className="h-[500px] pr-2">
            {selectedDateWorkOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No work orders scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateWorkOrders.map((wo) => {
                  const status = statusConfig[wo.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card 
                      key={wo.id} 
                      className={cn(
                        'border-l-4 hover:shadow-md transition-shadow',
                        priorityColors[wo.priority]
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm line-clamp-2">{wo.title}</h4>
                          <Badge 
                            variant="secondary"
                            className={cn('text-[10px] shrink-0', status.className)}
                          >
                            {wo.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {wo.equipment_tag && (
                            <div className="flex items-center gap-1 font-mono">
                              <Wrench className="w-3 h-3" />
                              {wo.equipment_tag}
                            </div>
                          )}
                          {wo.assigned_profile?.full_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {wo.assigned_profile.full_name}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
