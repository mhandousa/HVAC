import React from 'react';
import { ScheduledZone, formatDuration } from '@/lib/treatment-installation-scheduler';
import { getCategoryColor, getCategoryBorderColor } from './TimelineLegend';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatCurrencySAR } from '@/lib/acoustic-cost-calculations';

interface TimelineZoneBarProps {
  zone: ScheduledZone;
  totalDays: number;
  dayWidth: number;
  showDetails?: boolean;
}

export function TimelineZoneBar({ zone, totalDays, dayWidth, showDetails = true }: TimelineZoneBarProps) {
  const barLeft = (zone.startDay - 1) * dayWidth;
  const barWidth = Math.max((zone.endDay - zone.startDay + 1) * dayWidth - 4, dayWidth * 0.5);

  // Calculate treatment segment widths
  const totalHours = zone.estimatedHours;
  
  return (
    <div className="relative h-10 flex items-center group">
      {/* Zone label */}
      <div className="w-48 flex-shrink-0 pr-3 truncate">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">{zone.zoneName}</span>
                <span className="text-xs text-muted-foreground truncate">{zone.spaceType}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{zone.zoneName}</p>
                <p className="text-xs text-muted-foreground">{zone.spaceType}</p>
                <p className="text-xs">Priority: {zone.priority}</p>
                <p className="text-xs">Duration: {formatDuration(zone.estimatedHours)}</p>
                <p className="text-xs">Cost: {formatCurrencySAR(zone.totalCost)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Timeline bar area */}
      <div className="flex-1 relative h-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-1 h-6 rounded-md overflow-hidden flex border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  left: `${barLeft}px`,
                  width: `${barWidth}px`,
                }}
              >
                {/* Treatment segments */}
                {zone.treatments.map((treatment, index) => {
                  const segmentWidth = (treatment.estimatedHours / totalHours) * 100;
                  return (
                    <div
                      key={treatment.treatmentId}
                      className={`h-full ${getCategoryColor(treatment.category)} ${index > 0 ? 'border-l border-white/20' : ''}`}
                      style={{ width: `${segmentWidth}%` }}
                    />
                  );
                })}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{zone.zoneName}</span>
                  <Badge variant="outline" className="text-xs">
                    Day {zone.startDay}-{zone.endDay}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {zone.treatments.map(treatment => (
                    <div key={treatment.treatmentId} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-sm ${getCategoryColor(treatment.category)}`} />
                      <span className="flex-1">{treatment.name}</span>
                      <span className="text-muted-foreground">
                        ×{treatment.quantity} ({formatDuration(treatment.estimatedHours)})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 border-t border-border/50 flex justify-between text-xs">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatDuration(zone.estimatedHours)}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Day range label */}
      {showDetails && (
        <div className="w-20 flex-shrink-0 text-right">
          <span className="text-xs text-muted-foreground">
            Day {zone.startDay}{zone.startDay !== zone.endDay ? `-${zone.endDay}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
