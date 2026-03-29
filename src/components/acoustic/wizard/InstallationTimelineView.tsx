import React, { useMemo, useState } from 'react';
import { TreatmentPackage } from '@/lib/treatment-package-optimizer';
import { 
  generateInstallationSchedule, 
  InstallationSchedule,
  ScheduleOptions 
} from '@/lib/treatment-installation-scheduler';
import { exportScheduleToPDF } from '@/lib/treatment-schedule-pdf-export';
import { exportScheduleToExcel } from '@/lib/treatment-schedule-excel-export';
import { TimelinePhaseSection } from './TimelinePhaseSection';
import { TimelineLegend } from './TimelineLegend';
import { ContractorManagementDialog } from './ContractorManagementDialog';
import { ContractorAssignmentTracker } from './ContractorAssignmentTracker';
import { useContractorManagement } from '@/hooks/useContractorManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  CalendarDays,
  Clock, 
  Users, 
  Flag, 
  CheckCircle2,
  Settings2,
  Diamond,
  FileDown,
  FileSpreadsheet,
  HardHat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InstallationTimelineViewProps {
  selectedPackage: TreatmentPackage;
  projectName?: string;
  onScheduleGenerated?: (schedule: InstallationSchedule) => void;
}

const DAY_WIDTH = 48; // pixels per day

export function InstallationTimelineView({ 
  selectedPackage,
  projectName = 'Acoustic Treatment Project',
  onScheduleGenerated 
}: InstallationTimelineViewProps) {
  const [options, setOptions] = useState<ScheduleOptions>({
    hoursPerDay: 8,
    crewSize: 2,
    phaseBy: 'priority',
  });

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [showContractorDialog, setShowContractorDialog] = useState(false);

  const {
    contractors,
    addContractor,
    updateContractor,
    deleteContractor,
    assignContractorToPhase,
    updateAssignmentStatus,
    unassignContractorFromPhase,
    getPhaseContractor,
    getPhaseAssignment,
  } = useContractorManagement();

  const schedule = useMemo(() => {
    const result = generateInstallationSchedule(selectedPackage, options);
    onScheduleGenerated?.(result);
    // Expand all phases by default
    setExpandedPhases(new Set(result.phases.map(p => p.id)));
    return result;
  }, [selectedPackage, options, onScheduleGenerated]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    schedule.phases.forEach(phase => {
      phase.zones.forEach(zone => {
        zone.treatments.forEach(t => categories.add(t.category));
      });
    });
    return Array.from(categories);
  }, [schedule]);

  // Generate day markers
  const dayMarkers = Array.from({ length: schedule.totalDays }, (_, i) => i + 1);

  const handleExportPDF = async () => {
    try {
      await exportScheduleToPDF(schedule, {
        projectName,
        startDate,
        includeDetails: true,
        includeCosts: true,
      });
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      exportScheduleToExcel(schedule, {
        projectName,
        startDate,
        includeCalendarDates: !!startDate,
      });
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="space-y-4">
      {/* Schedule Options */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Schedule Options
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowContractorDialog(true)}>
                <HardHat className="h-4 w-4 mr-1" />
                Contractors
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hours/Day</Label>
              <Select 
                value={String(options.hoursPerDay)} 
                onValueChange={(v) => setOptions(prev => ({ ...prev, hoursPerDay: parseInt(v) }))}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="10">10 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Crew Size</Label>
              <Select 
                value={String(options.crewSize)} 
                onValueChange={(v) => setOptions(prev => ({ ...prev, crewSize: parseInt(v) }))}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2">2 people</SelectItem>
                  <SelectItem value="3">3 people</SelectItem>
                  <SelectItem value="4">4 people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phase By</Label>
              <Select 
                value={options.phaseBy} 
                onValueChange={(v) => setOptions(prev => ({ ...prev, phaseBy: v as any }))}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-36 justify-start">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schedule.totalDays}</p>
                <p className="text-xs text-muted-foreground">Working Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(schedule.totalHours)}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Flag className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schedule.totalPhases}</p>
                <p className="text-xs text-muted-foreground">Phases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schedule.totalZones}</p>
                <p className="text-xs text-muted-foreground">Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contractor Assignment Tracker */}
      <ContractorAssignmentTracker
        phases={schedule.phases}
        contractors={contractors}
        getPhaseContractor={getPhaseContractor}
        getPhaseAssignment={getPhaseAssignment}
        onAssign={assignContractorToPhase}
        onManageContractors={() => setShowContractorDialog(true)}
      />

      {/* Legend */}
      <TimelineLegend visibleCategories={allCategories} />

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Installation Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max p-4">
              {/* Day headers */}
              <div className="flex items-center mb-4 sticky top-0 bg-background z-10">
                <div className="w-48 flex-shrink-0 pr-3">
                  <span className="text-sm font-medium text-muted-foreground">Zone</span>
                </div>
                <div className="flex-1 flex">
                  {dayMarkers.map(day => (
                    <div 
                      key={day} 
                      className="flex-shrink-0 text-center border-l border-border/30 first:border-l-0"
                      style={{ width: `${DAY_WIDTH}px` }}
                    >
                      <span className="text-xs text-muted-foreground">Day {day}</span>
                    </div>
                  ))}
                </div>
                <div className="w-20 flex-shrink-0 text-right">
                  <span className="text-sm font-medium text-muted-foreground">Duration</span>
                </div>
              </div>

              {/* Grid lines */}
              <div className="relative">
                {/* Vertical grid lines */}
                <div className="absolute inset-0 flex pointer-events-none" style={{ marginLeft: '12rem' }}>
                  {dayMarkers.map(day => (
                    <div 
                      key={day} 
                      className="flex-shrink-0 border-l border-border/20"
                      style={{ width: `${DAY_WIDTH}px` }}
                    />
                  ))}
                </div>

                {/* Phases */}
                <div className="relative space-y-3">
                  {schedule.phases.map(phase => (
                    <TimelinePhaseSection
                      key={phase.id}
                      phase={phase}
                      totalDays={schedule.totalDays}
                      dayWidth={DAY_WIDTH}
                      isExpanded={expandedPhases.has(phase.id)}
                      onToggle={() => togglePhase(phase.id)}
                      contractor={getPhaseContractor(phase.id)}
                      assignment={getPhaseAssignment(phase.id)}
                      contractors={contractors}
                      onAssign={assignContractorToPhase}
                      onUpdateStatus={updateAssignmentStatus}
                      onUnassign={unassignContractorFromPhase}
                    />
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Diamond className="h-4 w-4 text-primary" />
                  Milestones
                </h4>
                <div className="flex flex-wrap gap-3">
                  {schedule.milestones.map((milestone, index) => (
                    <Badge 
                      key={index} 
                      variant={milestone.type === 'project-complete' ? 'default' : 'secondary'}
                      className="flex items-center gap-1.5"
                    >
                      {milestone.type === 'project-complete' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Flag className="h-3 w-3" />
                      )}
                      Day {milestone.day}: {milestone.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Contractor Management Dialog */}
      <ContractorManagementDialog
        open={showContractorDialog}
        onOpenChange={setShowContractorDialog}
        contractors={contractors}
        onAddContractor={addContractor}
        onUpdateContractor={updateContractor}
        onDeleteContractor={deleteContractor}
      />
    </div>
  );
}
