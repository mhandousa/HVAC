import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ReassignmentSuggestion, useApplyReassignment } from '@/hooks/useWorkloadBalancing';
import { SkillMatchBadge } from './SkillMatchBadge';
import { ArrowRight, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReassignmentSuggestionCardProps {
  suggestion: ReassignmentSuggestion;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  onApplied: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground',
};

export function ReassignmentSuggestionCard({
  suggestion,
  selected,
  onSelectChange,
  onApplied,
}: ReassignmentSuggestionCardProps) {
  const applyReassignment = useApplyReassignment();
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await applyReassignment.mutateAsync(suggestion);
      toast.success('Assignment reassigned successfully');
      onApplied();
    } catch (error) {
      toast.error('Failed to reassign');
    } finally {
      setIsApplying(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn(
      "transition-all",
      selected && "ring-2 ring-primary"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelectChange}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">
                Assignment #{suggestion.assignmentId.slice(0, 8)}
              </span>
              <Badge className={priorityColors[suggestion.priority]}>
                {suggestion.priority}
              </Badge>
            </div>
            {suggestion.dueDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                Due: {format(parseISO(suggestion.dueDate), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>

        {/* Technician Transfer */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                {getInitials(suggestion.fromTechnicianName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{suggestion.fromTechnicianName}</p>
              <p className="text-xs text-muted-foreground">{suggestion.impact.fromUtilizationBefore}% utilized</p>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-green-500/10 text-green-600">
                {getInitials(suggestion.toTechnicianName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{suggestion.toTechnicianName}</p>
              <p className="text-xs text-muted-foreground">{suggestion.impact.toUtilizationBefore}% utilized</p>
            </div>
          </div>
        </div>

        {/* Skill Match Indicator */}
        {suggestion.skillMatch && (
          <div className="flex items-center gap-2 flex-wrap py-2 border-t border-b">
            <SkillMatchBadge score={suggestion.skillMatch.score} size="sm" />
            {suggestion.skillMatch.matchedSkills.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {suggestion.skillMatch.matchedSkills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    ✓ {skill}
                  </Badge>
                ))}
                {suggestion.skillMatch.matchedSkills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{suggestion.skillMatch.matchedSkills.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <p className="text-sm text-muted-foreground">
          {suggestion.reason}
        </p>

        {/* Impact Preview */}
        <div className="space-y-2 text-sm">
          <p className="font-medium text-muted-foreground">Impact Preview:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs truncate">{suggestion.fromTechnicianName}</p>
              <div className="flex items-center gap-2">
                <Progress 
                  value={suggestion.impact.fromUtilizationBefore} 
                  className="h-2 flex-1"
                />
                <span className="text-xs w-8">{suggestion.impact.fromUtilizationBefore}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={suggestion.impact.fromUtilizationAfter} 
                  className="h-2 flex-1 [&>div]:bg-green-500"
                />
                <span className="text-xs w-8 text-green-600">{suggestion.impact.fromUtilizationAfter}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs truncate">{suggestion.toTechnicianName}</p>
              <div className="flex items-center gap-2">
                <Progress 
                  value={suggestion.impact.toUtilizationBefore} 
                  className="h-2 flex-1"
                />
                <span className="text-xs w-8">{suggestion.impact.toUtilizationBefore}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={suggestion.impact.toUtilizationAfter} 
                  className="h-2 flex-1"
                />
                <span className="text-xs w-8">{suggestion.impact.toUtilizationAfter}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={isApplying}
            className="gap-1"
          >
            {isApplying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
