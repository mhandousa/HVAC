import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { TimelineAnalytics } from '@/hooks/useTimelineAnalytics';
import { formatDateShort, getHealthColor, getHealthBgColor } from '@/lib/timeline-utils';
import { cn } from '@/lib/utils';

interface TimelineSummaryCardProps {
  analytics: TimelineAnalytics;
  projectName?: string;
}

export function TimelineSummaryCard({ analytics, projectName }: TimelineSummaryCardProps) {
  const healthLabels = {
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    'delayed': 'Delayed',
  };
  
  const healthIcons = {
    'on-track': CheckCircle2,
    'at-risk': AlertCircle,
    'delayed': AlertCircle,
  };
  
  const HealthIcon = healthIcons[analytics.scheduleHealth];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {projectName ? `${projectName} Timeline` : 'Project Timeline'}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1',
              getHealthBgColor(analytics.scheduleHealth),
              getHealthColor(analytics.scheduleHealth)
            )}
          >
            <HealthIcon className="h-3 w-3" />
            {healthLabels[analytics.scheduleHealth]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Project Dates */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Start</span>
            </div>
            <p className="font-medium">
              {formatDateShort(analytics.projectStartDate)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Target End</span>
            </div>
            <p className="font-medium">
              {formatDateShort(analytics.projectEndDate)}
            </p>
          </div>
          
          {/* Duration */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Duration</span>
            </div>
            <p className="font-medium">
              {analytics.totalPlannedDays} days
            </p>
          </div>
          
          {/* Variance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {analytics.variance >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <span>Variance</span>
            </div>
            <p className={cn(
              'font-medium',
              analytics.variance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {analytics.variance >= 0 ? '+' : ''}{analytics.variance} stages
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{analytics.progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${analytics.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{analytics.completedStages} of {analytics.completedStages + analytics.inProgressStages + analytics.pendingStages} stages complete</span>
            {analytics.inProgressStages > 0 && (
              <span>{analytics.inProgressStages} in progress</span>
            )}
          </div>
        </div>
        
        {/* Projected Completion */}
        {analytics.estimatedCompletionDate && analytics.projectEndDate && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Projected Completion</span>
              <span className={cn(
                'font-medium',
                analytics.estimatedCompletionDate > analytics.projectEndDate 
                  ? 'text-red-600' 
                  : 'text-green-600'
              )}>
                {formatDateShort(analytics.estimatedCompletionDate)}
                {analytics.estimatedCompletionDate > analytics.projectEndDate && (
                  <span className="text-xs ml-1">
                    (+{Math.ceil((analytics.estimatedCompletionDate.getTime() - analytics.projectEndDate.getTime()) / (1000 * 60 * 60 * 24))} days)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
