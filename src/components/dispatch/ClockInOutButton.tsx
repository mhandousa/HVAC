import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useClockIn, useClockOut, useTechnicianSchedules } from '@/hooks/useTechnicianSchedules';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClockInOutButtonProps {
  technicianId: string;
  className?: string;
}

export default function ClockInOutButton({ technicianId, className }: ClockInOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: schedules = [] } = useTechnicianSchedules(today);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const todaySchedule = schedules.find(
    s => s.technician_id === technicianId && s.schedule_date === today
  );

  const isClockedIn = todaySchedule?.clock_in_time && !todaySchedule?.clock_out_time;
  const isClockedOut = todaySchedule?.clock_out_time;

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      // Try to get GPS location
      let lat: number | undefined;
      let lng: number | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          // Location not available, continue without it
        }
      }

      await clockIn.mutateAsync({
        technicianId,
        scheduleDate: today,
        lat,
        lng,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todaySchedule) return;
    setIsLoading(true);
    try {
      await clockOut.mutateAsync({ scheduleId: todaySchedule.id });
    } finally {
      setIsLoading(false);
    }
  };

  if (isClockedOut) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Clock className="w-3 h-3" />
        <span>
          {format(new Date(todaySchedule!.clock_in_time!), 'HH:mm')} - {format(new Date(todaySchedule!.clock_out_time!), 'HH:mm')}
        </span>
      </div>
    );
  }

  if (isClockedIn) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>In since {format(new Date(todaySchedule!.clock_in_time!), 'HH:mm')}</span>
          {todaySchedule?.clock_in_location_lat && (
            <MapPin className="w-3 h-3" />
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClockOut}
          disabled={isLoading}
          className="h-6 px-2 text-xs"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3 mr-1" />}
          Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="default"
      onClick={handleClockIn}
      disabled={isLoading}
      className={cn("h-7 text-xs", className)}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1" />
      ) : (
        <LogIn className="w-3 h-3 mr-1" />
      )}
      Clock In
    </Button>
  );
}
