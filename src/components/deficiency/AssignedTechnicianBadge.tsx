import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeficiencyAssignment } from '@/hooks/useDeficiencyAssignments';
import { cn } from '@/lib/utils';
import { format, isPast, differenceInDays } from 'date-fns';
import { UserPlus, Clock, AlertCircle } from 'lucide-react';

interface AssignedTechnicianBadgeProps {
  assignment?: DeficiencyAssignment | null;
  onAssign: () => void;
  compact?: boolean;
}

export function AssignedTechnicianBadge({
  assignment,
  onAssign,
  compact = false,
}: AssignedTechnicianBadgeProps) {
  if (!assignment) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onAssign();
        }}
      >
        <UserPlus className="w-4 h-4" />
        {!compact && <span>Assign</span>}
      </Button>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = assignment.dueDate && isPast(new Date(assignment.dueDate));
  const daysUntilDue = assignment.dueDate
    ? differenceInDays(new Date(assignment.dueDate), new Date())
    : null;

  const getDueDateColor = () => {
    if (!daysUntilDue) return 'text-muted-foreground';
    if (isOverdue) return 'text-destructive';
    if (daysUntilDue <= 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getPriorityColor = () => {
    switch (assignment.priority) {
      case 'urgent':
        return 'ring-2 ring-destructive';
      case 'high':
        return 'ring-2 ring-warning';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
              }}
            >
              <Avatar className={cn('w-6 h-6', getPriorityColor())}>
                <AvatarImage src={assignment.assignee?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(assignment.assignee?.fullName || null)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{assignment.assignee?.fullName || 'Unknown'}</p>
              {assignment.dueDate && (
                <p className={cn('text-xs', getDueDateColor())}>
                  Due: {format(new Date(assignment.dueDate), 'MMM d')}
                  {isOverdue && ' (Overdue)'}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-auto p-2 justify-start"
      onClick={(e) => {
        e.stopPropagation();
        onAssign();
      }}
    >
      <div className="flex items-center gap-2">
        <Avatar className={cn('w-7 h-7', getPriorityColor())}>
          <AvatarImage src={assignment.assignee?.avatarUrl || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(assignment.assignee?.fullName || null)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {assignment.assignee?.fullName || 'Unknown'}
          </span>
          {assignment.dueDate && (
            <span className={cn('text-xs flex items-center gap-1', getDueDateColor())}>
              {isOverdue ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {format(new Date(assignment.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
}
