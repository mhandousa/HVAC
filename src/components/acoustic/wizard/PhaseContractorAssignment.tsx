import React from 'react';
import { Contractor, PhaseContractorAssignment as Assignment, ASSIGNMENT_STATUS_CONFIG, AssignmentStatus } from '@/types/contractor';
import { InstallationPhase } from '@/lib/treatment-installation-scheduler';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  User,
  Phone,
  Mail,
  Play,
  CheckCircle2,
  UserPlus,
  X,
  Star,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PhaseContractorAssignmentProps {
  phase: InstallationPhase;
  assignment?: Assignment;
  contractor?: Contractor;
  contractors: Contractor[];
  onAssign: (phaseId: string, contractorId: string) => void;
  onUpdateStatus: (phaseId: string, status: AssignmentStatus) => void;
  onUnassign: (phaseId: string) => void;
}

export function PhaseContractorAssignmentPanel({
  phase,
  assignment,
  contractor,
  contractors,
  onAssign,
  onUpdateStatus,
  onUnassign,
}: PhaseContractorAssignmentProps) {
  if (!assignment || !contractor) {
    // Not assigned - show assignment selector
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No contractor assigned</span>
        <Select onValueChange={(contractorId) => onAssign(phase.id, contractorId)}>
          <SelectTrigger className="w-48 h-8 ml-auto">
            <SelectValue placeholder="Assign contractor..." />
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
      </div>
    );
  }

  const statusConfig = ASSIGNMENT_STATUS_CONFIG[assignment.status];
  const canStart = assignment.status === 'accepted';
  const canComplete = assignment.status === 'in_progress';
  const isCompleted = assignment.status === 'completed';

  return (
    <div className="p-3 rounded-lg bg-card border">
      {/* Contractor Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{contractor.name}</span>
              {contractor.isPreferred && (
                <Award className="h-3.5 w-3.5 text-chart-4" />
              )}
            </div>
            {contractor.companyName && (
              <p className="text-sm text-muted-foreground">{contractor.companyName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <X className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <p className="text-sm mb-3">Remove contractor from this phase?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Cancel</Button>
                <Button size="sm" variant="destructive" onClick={() => onUnassign(phase.id)}>
                  Remove
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex items-center gap-4 mt-3 text-sm">
        <button
          onClick={() => window.open(`tel:${contractor.phone}`)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          {contractor.phone}
        </button>
        <button
          onClick={() => window.open(`mailto:${contractor.email}`)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          {contractor.email}
        </button>
      </div>

      {/* Rating */}
      {contractor.rating && (
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < (contractor.rating ?? 0)
                    ? 'fill-chart-4 text-chart-4'
                    : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
      )}

      {/* Status Dates */}
      {assignment.assignedDate && (
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>Assigned: {format(new Date(assignment.assignedDate), 'MMM d, yyyy')}</p>
          {assignment.startedDate && (
            <p>Started: {format(new Date(assignment.startedDate), 'MMM d, yyyy')}</p>
          )}
          {assignment.completedDate && (
            <p>Completed: {format(new Date(assignment.completedDate), 'MMM d, yyyy')}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {assignment.status === 'assigned' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(phase.id, 'accepted')}
            >
              Mark Accepted
            </Button>
          )}
          {canStart && (
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(phase.id, 'in_progress')}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Start Work
            </Button>
          )}
          {canComplete && (
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(phase.id, 'completed')}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Mark Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
