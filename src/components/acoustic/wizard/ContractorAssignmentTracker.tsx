import React from 'react';
import { InstallationPhase } from '@/lib/treatment-installation-scheduler';
import { Contractor, PhaseContractorAssignment, ASSIGNMENT_STATUS_CONFIG, AssignmentStatus } from '@/types/contractor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ContractorAssignmentTrackerProps {
  phases: InstallationPhase[];
  contractors: Contractor[];
  getPhaseContractor: (phaseId: string) => Contractor | undefined;
  getPhaseAssignment: (phaseId: string) => PhaseContractorAssignment | undefined;
  onAssign: (phaseId: string, contractorId: string) => void;
  onManageContractors: () => void;
}

export function ContractorAssignmentTracker({
  phases,
  contractors,
  getPhaseContractor,
  getPhaseAssignment,
  onAssign,
  onManageContractors,
}: ContractorAssignmentTrackerProps) {
  // Calculate statistics
  const stats = {
    total: phases.length,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
  };

  phases.forEach((phase) => {
    const assignment = getPhaseAssignment(phase.id);
    if (!assignment) {
      stats.pending++;
    } else if (assignment.status === 'completed') {
      stats.completed++;
    } else if (assignment.status === 'in_progress') {
      stats.inProgress++;
    } else {
      stats.assigned++;
    }
  });

  const completionPercent = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contractor Assignments
          </CardTitle>
          <Button size="sm" variant="outline" onClick={onManageContractors}>
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assignment Progress</span>
            <span className="font-medium">{completionPercent}% Complete</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              {stats.pending} Pending
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-chart-4" />
              {stats.assigned} Assigned
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-chart-1" />
              {stats.inProgress} In Progress
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-chart-2" />
              {stats.completed} Complete
            </span>
          </div>
        </div>

        {/* Phase List */}
        <div className="space-y-2">
          {phases.map((phase) => {
            const contractor = getPhaseContractor(phase.id);
            const assignment = getPhaseAssignment(phase.id);
            const statusConfig = assignment 
              ? ASSIGNMENT_STATUS_CONFIG[assignment.status]
              : null;

            return (
              <div
                key={phase.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{phase.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Day {phase.startDay}-{phase.endDay}
                    </Badge>
                  </div>
                  
                  {contractor ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {contractor.name}
                        {contractor.companyName && ` (${contractor.companyName})`}
                      </span>
                      {contractor.isPreferred && (
                        <Award className="h-3 w-3 text-chart-4" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="text-sm">Not assigned</span>
                    </div>
                  )}
                </div>

                {/* Status / Action */}
                {assignment ? (
                  <Badge className={cn('text-xs', statusConfig?.color)}>
                    {assignment.status === 'completed' && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {assignment.status === 'in_progress' && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {statusConfig?.label}
                  </Badge>
                ) : (
                  <Select onValueChange={(contractorId) => onAssign(phase.id, contractorId)}>
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.isPreferred && <Award className="h-3 w-3 text-chart-4" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
