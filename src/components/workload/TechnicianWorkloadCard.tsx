import { useMemo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TechnicianMetrics } from '@/hooks/useTechnicianWorkload';
import { useTechnicianAvailability } from '@/hooks/useTechnicianAvailability';
import { useTechnicianSkills } from '@/hooks/useTechnicianSkills';
import { CapacityIndicator } from './CapacityIndicator';
import { TechnicianSkillsCard } from './TechnicianSkillsCard';
import { TechnicianSkillsEditor } from './TechnicianSkillsEditor';
import { TrendingUp, TrendingDown, Minus, Eye, UserPlus, Palmtree, Thermometer, GraduationCap, AlertTriangle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, addMonths } from 'date-fns';

interface TechnicianWorkloadCardProps {
  technician: TechnicianMetrics;
  onViewDetails: (technician: TechnicianMetrics) => void;
  onAssignNew?: (technician: TechnicianMetrics) => void;
}

export function TechnicianWorkloadCard({ technician, onViewDetails, onAssignNew }: TechnicianWorkloadCardProps) {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const monthEnd = useMemo(() => addMonths(new Date(), 1), []);
  
  const { technicianAvailability } = useTechnicianAvailability(weekStart, monthEnd);
  const { data: skills } = useTechnicianSkills(technician.id);
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);
  
  const techAvailability = useMemo(() => {
    return technicianAvailability.find(t => t.id === technician.id);
  }, [technicianAvailability, technician.id]);

  const topSkills = useMemo(() => {
    if (!skills) return [];
    return skills.slice(0, 3);
  }, [skills]);

  const initials = technician.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-destructive" />,
    stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  };

  const priorityColors = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  const hasActiveWork = technician.activeAssignments > 0 || technician.inProgressAssignments > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={technician.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{technician.name}</h3>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                {technician.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {trendIcon[technician.trend]}
              <Badge variant={hasActiveWork ? 'default' : 'secondary'}>
                {hasActiveWork ? 'Active' : 'Available'}
              </Badge>
            </div>
            {/* Availability Status */}
            {techAvailability && !techAvailability.isAvailableToday && techAvailability.todayAvailabilityType && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {techAvailability.todayAvailabilityType === 'vacation' && <Palmtree className="w-3 h-3" />}
                {techAvailability.todayAvailabilityType === 'sick_leave' && <Thermometer className="w-3 h-3" />}
                {techAvailability.todayAvailabilityType === 'training' && <GraduationCap className="w-3 h-3" />}
                Off Today
              </Badge>
            )}
            {techAvailability?.capacityStatus === 'overloaded' && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="w-3 h-3" />
                Overloaded
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{technician.activeAssignments + technician.inProgressAssignments}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold">{technician.inProgressAssignments}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className={cn("text-lg font-bold", technician.overdueAssignments > 0 && "text-destructive")}>
              {technician.overdueAssignments}
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{technician.resolvedAssignments}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Resolution Rate</span>
            <span className="font-medium">{technician.resolutionRate.toFixed(0)}%</span>
          </div>
          <Progress 
            value={technician.resolutionRate} 
            className="h-2"
          />
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Avg. Resolution:</span>
            <span className="ml-1 font-medium">{technician.avgResolutionDays.toFixed(1)} days</span>
          </div>
          <div>
            <span className="text-muted-foreground">On-Time:</span>
            <span className="ml-1 font-medium">{technician.onTimeCompletionRate.toFixed(0)}%</span>
          </div>
        </div>

        {/* Priority Breakdown */}
        {(technician.urgentCount > 0 || technician.highCount > 0 || technician.mediumCount > 0 || technician.lowCount > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {technician.urgentCount > 0 && (
              <Badge className={priorityColors.urgent}>Urgent: {technician.urgentCount}</Badge>
            )}
            {technician.highCount > 0 && (
              <Badge className={priorityColors.high}>High: {technician.highCount}</Badge>
            )}
            {technician.mediumCount > 0 && (
              <Badge className={priorityColors.medium}>Medium: {technician.mediumCount}</Badge>
            )}
            {technician.lowCount > 0 && (
              <Badge className={priorityColors.low}>Low: {technician.lowCount}</Badge>
            )}
          </div>
        )}

        {/* Capacity Indicator */}
        {techAvailability && (
          <CapacityIndicator
            weeklyScheduledHours={techAvailability.weeklyScheduledHours}
            weeklyWorkingHours={techAvailability.weeklyWorkingHours}
            currentAssignments={techAvailability.currentAssignments}
            recommendedMax={techAvailability.recommendedMaxAssignments}
            availableCapacity={techAvailability.availableCapacity}
            capacityStatus={techAvailability.capacityStatus}
            utilizationRate={techAvailability.utilizationRate}
            compact
          />
        )}

        {/* Skills Summary */}
        {topSkills.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="w-3 h-3" />
                Skills
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSkillsEditorOpen(true);
                }}
              >
                Edit
              </Button>
            </div>
            <TechnicianSkillsCard skills={topSkills} compact />
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={() => onViewDetails(technician)}
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
        {onAssignNew && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onAssignNew(technician)}
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>

      {/* Skills Editor Dialog */}
      <TechnicianSkillsEditor
        open={skillsEditorOpen}
        onOpenChange={setSkillsEditorOpen}
        technicianId={technician.id}
        technicianName={technician.name}
      />
    </Card>
  );
}
