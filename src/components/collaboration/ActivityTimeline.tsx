import { DesignActivity } from '@/hooks/useRecentDesignActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, GitBranch, CheckCircle, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityTimelineProps {
  activities: DesignActivity[];
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getActivityIcon(type: DesignActivity['type']) {
  switch (type) {
    case 'revision':
      return <History className="h-4 w-4 text-blue-500" />;
    case 'approval':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'alternative':
      return <GitBranch className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function getActivityBadgeVariant(type: DesignActivity['type']) {
  switch (type) {
    case 'revision':
      return 'secondary' as const;
    case 'approval':
      return 'default' as const;
    case 'alternative':
      return 'outline' as const;
    default:
      return 'secondary' as const;
  }
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  load_calculation: 'Load Calc',
  equipment_selection: 'Equipment',
  ahu_configuration: 'AHU Config',
  ventilation_calculation: 'Ventilation',
  coil_selection: 'Coil',
  filter_selection: 'Filter',
  vav_box_selection: 'VAV Box',
  fcu_selection: 'FCU',
  chiller_selection: 'Chiller',
  boiler_selection: 'Boiler',
  cooling_tower_sizing: 'Cooling Tower',
  duct_sizing: 'Duct',
  pipe_sizing: 'Pipe',
  erv_sizing: 'ERV',
};

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity to display. Activity will appear here when team members
            save designs, submit for approval, or create alternatives.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent Activity
          <Badge variant="secondary" className="ml-auto">
            {activities.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Timeline connector */}
                {index < activities.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-border -translate-x-1/2" />
                )}

                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.userName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{activity.userName}</span>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ENTITY_TYPE_LABELS[activity.entityType] || activity.entityType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {activity.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
