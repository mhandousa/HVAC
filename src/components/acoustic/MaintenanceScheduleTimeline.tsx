import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Wrench, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LifecycleCostResult, formatCurrencySAR } from '@/lib/acoustic-lifecycle-costs';

interface MaintenanceScheduleTimelineProps {
  results: LifecycleCostResult[];
  maxYearsToShow?: number;
}

const COLORS = [
  'bg-chart-1',
  'bg-chart-2', 
  'bg-chart-3',
  'bg-chart-4',
];

const BORDER_COLORS = [
  'border-chart-1',
  'border-chart-2',
  'border-chart-3',
  'border-chart-4',
];

interface TimelineEvent {
  year: number;
  treatmentId: string;
  treatmentName: string;
  eventType: 'routine' | 'inspection' | 'replacement';
  cost: number;
  colorIndex: number;
}

export function MaintenanceScheduleTimeline({ 
  results, 
  maxYearsToShow = 30 
}: MaintenanceScheduleTimelineProps) {
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    
    results.forEach((result, colorIndex) => {
      result.yearlyBreakdown.forEach(breakdown => {
        if (breakdown.year > maxYearsToShow) return;
        if (breakdown.eventType === 'none') return;
        
        events.push({
          year: breakdown.year,
          treatmentId: result.treatmentId,
          treatmentName: result.treatmentName,
          eventType: breakdown.eventType,
          cost: breakdown.maintenance + breakdown.inspection + breakdown.replacement,
          colorIndex,
        });
      });
    });
    
    return events.sort((a, b) => a.year - b.year);
  }, [results, maxYearsToShow]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    timelineEvents.forEach(event => {
      if (!grouped[event.year]) grouped[event.year] = [];
      grouped[event.year].push(event);
    });
    return grouped;
  }, [timelineEvents]);

  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => a - b);

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
          Add treatments to view maintenance schedule
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'routine': return <Wrench className="h-3 w-3" />;
      case 'inspection': return <Search className="h-3 w-3" />;
      case 'replacement': return <RefreshCw className="h-3 w-3" />;
    }
  };

  const getEventLabel = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'routine': return 'Maintenance';
      case 'inspection': return 'Inspection';
      case 'replacement': return 'Replacement';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Maintenance Schedule</CardTitle>
        <CardDescription>
          Planned maintenance activities, inspections, and replacements over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            <span>Routine Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span>Inspection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-destructive" />
            <span>Replacement</span>
          </div>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-4">
            {years.map(year => (
              <div 
                key={year}
                className="flex-shrink-0 w-24 border rounded-lg p-2 bg-muted/30"
              >
                <div className="text-center font-semibold text-sm mb-2 text-foreground">
                  Year {year}
                </div>
                <div className="space-y-1.5">
                  {eventsByYear[year].map((event, idx) => (
                    <div 
                      key={`${event.treatmentId}-${idx}`}
                      className={cn(
                        'rounded px-1.5 py-1 text-xs border-l-2',
                        event.eventType === 'replacement' 
                          ? 'bg-destructive/10 border-destructive' 
                          : 'bg-background',
                        BORDER_COLORS[event.colorIndex % BORDER_COLORS.length]
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {getEventIcon(event.eventType)}
                        <span className="font-medium truncate text-foreground">
                          {event.treatmentName.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {getEventLabel(event.eventType)}
                      </div>
                      <div className="text-[10px] font-medium text-foreground">
                        {formatCurrencySAR(event.cost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {results.map((result, index) => {
            const routineCount = result.yearlyBreakdown.filter(b => b.eventType === 'routine').length;
            const inspectionCount = result.yearlyBreakdown.filter(b => b.eventType === 'inspection').length;
            const replacementCount = result.replacementYears.length;
            
            return (
              <div 
                key={result.treatmentId}
                className={cn(
                  'p-3 rounded-lg border-l-4 bg-muted/30',
                  BORDER_COLORS[index % BORDER_COLORS.length]
                )}
              >
                <div className="font-medium text-sm truncate mb-2">{result.treatmentName}</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <Badge variant="secondary" className="h-5 text-xs">{routineCount}×</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Inspections:</span>
                    <Badge variant="secondary" className="h-5 text-xs">{inspectionCount}×</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Replacements:</span>
                    <Badge 
                      variant={replacementCount > 0 ? "destructive" : "secondary"} 
                      className="h-5 text-xs"
                    >
                      {replacementCount}×
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
