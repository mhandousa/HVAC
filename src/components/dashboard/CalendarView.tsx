import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Wrench, Calendar, Shield, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { usePMSchedules } from "@/hooks/usePMSchedules";
import { useEquipment } from "@/hooks/useEquipment";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "work_order" | "pm_schedule" | "warranty";
  priority?: string;
  status?: string;
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { data: workOrders } = useWorkOrders();
  const { data: pmSchedules } = usePMSchedules();
  const { data: equipment } = useEquipment();

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Add work orders with due dates
    workOrders?.forEach(wo => {
      if (wo.due_date) {
        allEvents.push({
          id: wo.id,
          title: wo.title,
          date: new Date(wo.due_date),
          type: "work_order",
          priority: wo.priority,
          status: wo.status
        });
      }
    });

    // Add PM schedules with next due dates
    pmSchedules?.forEach(pm => {
      if (pm.next_due_at) {
        allEvents.push({
          id: pm.id,
          title: pm.name,
          date: new Date(pm.next_due_at),
          type: "pm_schedule",
          priority: pm.priority
        });
      }
    });

    // Add warranty expirations
    equipment?.forEach(eq => {
      if (eq.warranty_expiry) {
        allEvents.push({
          id: eq.id,
          title: `${eq.name} warranty expires`,
          date: new Date(eq.warranty_expiry),
          type: "warranty"
        });
      }
    });

    return allEvents;
  }, [workOrders, pmSchedules, equipment]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month to align with day of week
  const startDayOfWeek = monthStart.getDay();
  const paddedDays = Array(startDayOfWeek).fill(null).concat(daysInMonth);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const getEventColor = (type: CalendarEvent["type"], priority?: string) => {
    if (type === "warranty") return "bg-amber-500";
    if (type === "pm_schedule") return "bg-blue-500";
    if (priority === "high") return "bg-destructive";
    if (priority === "low") return "bg-muted-foreground";
    return "bg-primary";
  };

  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "work_order": return <Wrench className="h-3 w-3" />;
      case "pm_schedule": return <Calendar className="h-3 w-3" />;
      case "warranty": return <Shield className="h-3 w-3" />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {paddedDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="bg-background p-2 min-h-[80px]" />;
              }
              
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "bg-background p-2 min-h-[80px] cursor-pointer transition-colors hover:bg-muted/50",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground",
                    isSelected && "ring-2 ring-primary ring-inset",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded truncate text-white",
                          getEventColor(event.type, event.priority)
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">Click on a date to see events</p>
          ) : selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={cn(
                    "p-2 rounded-full text-white",
                    getEventColor(event.type, event.priority)
                  )}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {event.type === "work_order" ? "Work Order" : 
                         event.type === "pm_schedule" ? "PM Schedule" : "Warranty"}
                      </Badge>
                      {event.priority && (
                        <Badge 
                          variant={event.priority === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {event.priority}
                        </Badge>
                      )}
                      {event.status && (
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Work Orders</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>PM Schedules</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Warranty Expirations</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-destructive" />
                <span>High Priority</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
