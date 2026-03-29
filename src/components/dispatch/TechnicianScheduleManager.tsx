import { useState } from 'react';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useTechnicianSchedules, useCreateTechnicianSchedule, useUpdateTechnicianSchedule } from '@/hooks/useTechnicianSchedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, Save } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

export function TechnicianScheduleManager() {
  const { data: technicians = [] } = useTechnicians();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const { data: schedules = [] } = useTechnicianSchedules();
  const createSchedule = useCreateTechnicianSchedule();
  const updateSchedule = useUpdateTechnicianSchedule();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getScheduleForDay = (technicianId: string, date: Date) => {
    return schedules.find(
      s => s.technician_id === technicianId && isSameDay(new Date(s.schedule_date), date)
    );
  };

  const handleToggleAvailability = (technicianId: string, date: Date, currentSchedule?: any) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (currentSchedule) {
      updateSchedule.mutate({
        id: currentSchedule.id,
        is_available: !currentSchedule.is_available,
      });
    } else {
      createSchedule.mutate({
        technician_id: technicianId,
        schedule_date: dateStr,
        start_time: '08:00',
        end_time: '17:00',
        is_available: true,
        availability_type: 'working',
      });
    }
  };

  const handleUpdateSchedule = (scheduleId: string, updates: any) => {
    updateSchedule.mutate({ id: scheduleId, ...updates });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Technician Schedules
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 min-w-[200px]">Technician</th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="text-center p-2 min-w-[120px]">
                    <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className={isSameDay(day, new Date()) ? 'font-bold text-primary' : ''}>
                      {format(day, 'MMM d')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id} className="border-b">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {tech.full_name?.split(' ').map(n => n[0]).join('') || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{tech.full_name}</div>
                        <div className="text-xs text-muted-foreground">{tech.email}</div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const schedule = getScheduleForDay(tech.id, day);
                    const isAvailable = schedule?.is_available ?? true;
                    const isPast = day < new Date() && !isSameDay(day, new Date());
                    
                    return (
                      <td key={day.toISOString()} className="p-2">
                        <div className={`p-2 rounded-lg border ${
                          isPast ? 'bg-muted/30 opacity-50' :
                          isAvailable ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Switch
                              checked={isAvailable}
                              onCheckedChange={() => handleToggleAvailability(tech.id, day, schedule)}
                              disabled={isPast}
                            />
                          </div>
                          {schedule && isAvailable && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                <Input
                                  type="time"
                                  value={schedule.start_time}
                                  onChange={(e) => handleUpdateSchedule(schedule.id, { start_time: e.target.value })}
                                  className="h-6 text-xs p-1"
                                  disabled={isPast}
                                />
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                <Input
                                  type="time"
                                  value={schedule.end_time}
                                  onChange={(e) => handleUpdateSchedule(schedule.id, { end_time: e.target.value })}
                                  className="h-6 text-xs p-1"
                                  disabled={isPast}
                                />
                              </div>
                              {schedule.clock_in_time && (
                                <Badge variant="outline" className="text-xs w-full justify-center">
                                  In: {format(new Date(schedule.clock_in_time), 'h:mm a')}
                                </Badge>
                              )}
                            </div>
                          )}
                          {schedule && !isAvailable && (
                            <Select
                              value={schedule.availability_type || 'vacation'}
                              onValueChange={(value) => handleUpdateSchedule(schedule.id, { availability_type: value })}
                              disabled={isPast}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vacation">Vacation</SelectItem>
                                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                <SelectItem value="training">Training</SelectItem>
                                <SelectItem value="on_call">On Call</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
