import React, { useState } from 'react';
import { InstallationPhase } from '@/lib/treatment-installation-scheduler';
import { Contractor, PhaseContractorAssignment, AssignmentStatus, ASSIGNMENT_STATUS_CONFIG } from '@/types/contractor';
import { TimelineZoneBar } from './TimelineZoneBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, MapPin, User, Award } from 'lucide-react';
import { formatCurrencySAR } from '@/lib/acoustic-cost-calculations';
import { cn } from '@/lib/utils';

interface TimelinePhaseSectionProps {
  phase: InstallationPhase;
  totalDays: number;
  dayWidth: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  contractor?: Contractor;
  assignment?: PhaseContractorAssignment;
  contractors?: Contractor[];
  onAssign?: (phaseId: string, contractorId: string) => void;
  onUpdateStatus?: (phaseId: string, status: AssignmentStatus) => void;
  onUnassign?: (phaseId: string) => void;
}

export function TimelinePhaseSection({ 
  phase, 
  totalDays, 
  dayWidth, 
  isExpanded = true,
  onToggle,
  contractor,
  assignment,
}: TimelinePhaseSectionProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const expanded = onToggle ? isExpanded : localExpanded;
  const handleToggle = onToggle || (() => setLocalExpanded(!localExpanded));

  const phaseBarLeft = (phase.startDay - 1) * dayWidth;
  const phaseBarWidth = phase.durationDays * dayWidth - 4;
  const statusConfig = assignment ? ASSIGNMENT_STATUS_CONFIG[assignment.status] : null;


  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
      {/* Phase Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 flex items-center gap-3 text-left">
          <span className="font-semibold">{phase.name}</span>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Day {phase.startDay}-{phase.endDay}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {phase.zones.length} zones
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {contractor && (
            <Badge variant="outline" className="text-xs gap-1">
              <User className="h-3 w-3" />
              {contractor.name}
              {contractor.isPreferred && <Award className="h-3 w-3 text-chart-4" />}
            </Badge>
          )}
          {statusConfig && (
            <Badge className={cn('text-xs', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          )}
          <span className="text-muted-foreground">{phase.durationDays} days</span>
          <span className="font-medium">{formatCurrencySAR(phase.totalCost)}</span>
        </div>
      </button>

      {/* Phase Description */}
      {expanded && phase.description && (
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/10 border-b border-border/30">
          {phase.description}
        </div>
      )}

      {/* Zone Bars */}
      {expanded && (
        <div className="p-4 space-y-1">
          {/* Phase overview bar */}
          <div className="relative h-6 mb-4">
            <div className="w-48 flex-shrink-0" />
            <div 
              className="absolute h-4 top-1 rounded bg-primary/10 border border-primary/30"
              style={{
                left: `calc(12rem + ${phaseBarLeft}px)`,
                width: `${phaseBarWidth}px`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-medium text-primary truncate px-2">
                  Phase {phase.phaseNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Zone bars */}
          {phase.zones.map(zone => (
            <TimelineZoneBar
              key={zone.zoneId}
              zone={zone}
              totalDays={totalDays}
              dayWidth={dayWidth}
            />
          ))}
        </div>
      )}

      {/* Collapsed summary */}
      {!expanded && (
        <div className="px-4 py-2 flex items-center gap-2">
          <div className="w-48 flex-shrink-0" />
          <div className="flex-1 relative h-4">
            <div 
              className="absolute h-full rounded bg-gradient-to-r from-primary/40 to-primary/20"
              style={{
                left: `${phaseBarLeft}px`,
                width: `${phaseBarWidth}px`,
              }}
            />
          </div>
          <div className="w-20 flex-shrink-0 text-right">
            <span className="text-xs text-muted-foreground">
              {phase.zones.length} zones
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
