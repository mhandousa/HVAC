import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTechnicianAvailability, AvailabilityType, TechnicianAvailability } from '@/hooks/useTechnicianAvailability';
import { AvailabilityEditorDialog } from './AvailabilityEditorDialog';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Palmtree, 
  Thermometer, 
  GraduationCap, 
  Phone,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const availabilityConfig: Record<AvailabilityType, { icon: React.ReactNode; bgColor: string; label: string }> = {
  working: { icon: null, bgColor: 'bg-green-100', label: 'Working' },
  vacation: { icon: <Palmtree className="w-3 h-3" />, bgColor: 'bg-blue-100', label: 'Vacation' },
  sick_leave: { icon: <Thermometer className="w-3 h-3" />, bgColor: 'bg-orange-100', label: 'Sick Leave' },
  training: { icon: <GraduationCap className="w-3 h-3" />, bgColor: 'bg-purple-100', label: 'Training' },
  on_call: { icon: <Phone className="w-3 h-3" />, bgColor: 'bg-yellow-100', label: 'On Call' },
};

export function TechnicianAvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [editingTechnician, setEditingTechnician] = useState<TechnicianAvailability | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { technicianAvailability, isLoading } = useTechnicianAvailability(calendarStart, calendarEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const filteredTechnicians = useMemo(() => {
    if (selectedTechnician === 'all') return technicianAvailability;
    return technicianAvailability.filter(t => t.id === selectedTechnician);
  }, [technicianAvailability, selectedTechnician]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDayClick = (date: Date, technician: TechnicianAvailability) => {
    setEditingDate(date);
    setEditingTechnician(technician);
    setEditDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Availability Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicianAvailability.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[160px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Loading calendar...
            </div>
          ) : (
            <>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);
                  const dayOfWeek = getDay(day);
                  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Saudi weekend

                  return (
                    <div
                      key={dayStr}
                      className={cn(
                        'min-h-[100px] border rounded-md p-1',
                        !isCurrentMonth && 'bg-muted/50 opacity-50',
                        isTodayDate && 'ring-2 ring-primary',
                        isWeekend && isCurrentMonth && 'bg-muted/30'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-muted-foreground',
                        isTodayDate && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </div>

                      <div className="space-y-0.5 overflow-hidden">
                        {filteredTechnicians.slice(0, 4).map(tech => {
                          const schedule = tech.dailySchedule.find(s => s.date === dayStr);
                          if (!schedule) return null;

                          const config = availabilityConfig[schedule.availabilityType];
                          const isAvailable = schedule.isAvailable;

                          return (
                            <button
                              key={tech.id}
                              onClick={() => handleDayClick(day, tech)}
                              className={cn(
                                'w-full flex items-center gap-1 px-1 py-0.5 rounded text-xs transition-colors hover:ring-1 hover:ring-primary/50',
                                isAvailable ? 'bg-green-50' : config.bgColor
                              )}
                            >
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={tech.avatarUrl || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(tech.name)}
                                </AvatarFallback>
                              </Avatar>
                              {!isAvailable && config.icon}
                              <span className="truncate">{tech.name.split(' ')[0]}</span>
                            </button>
                          );
                        })}
                        {filteredTechnicians.length > 4 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{filteredTechnicians.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded bg-green-100" />
                  <span>Working</span>
                </div>
                {Object.entries(availabilityConfig)
                  .filter(([key]) => key !== 'working')
                  .map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                      <div className={cn('w-3 h-3 rounded flex items-center justify-center', config.bgColor)}>
                        {config.icon}
                      </div>
                      <span>{config.label}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      {editingTechnician && editingDate && (
        <AvailabilityEditorDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          technicianId={editingTechnician.id}
          technicianName={editingTechnician.name}
          date={editingDate}
          existingSchedule={editingTechnician.dailySchedule.find(
            s => s.date === format(editingDate, 'yyyy-MM-dd')
          )}
        />
      )}
    </>
  );
}
