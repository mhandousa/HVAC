import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlobalPresenceUser } from '@/hooks/useGlobalPresence';
import { formatDistanceToNow } from 'date-fns';

interface ConflictInfo {
  toolType: string;
  entityId: string;
  users: GlobalPresenceUser[];
}

interface ConflictCenterProps {
  usersByTool: Map<string, GlobalPresenceUser[]>;
}

const TOOL_ROUTES: Record<string, string> = {
  load_calculation: '/design/load-calculation',
  equipment_selection: '/design/equipment-selection',
  ahu_configuration: '/design/ahu-configuration',
  ventilation_calculation: '/design/ventilation-calculator',
  coil_selection: '/design/coil-selection',
  filter_selection: '/design/filter-selection',
  vav_box_selection: '/design/vav-box-selection',
  fcu_selection: '/design/fcu-selection',
  chiller_selection: '/design/chiller-selection',
  boiler_selection: '/design/boiler-selection',
  cooling_tower_sizing: '/design/cooling-tower-sizing',
};

const TOOL_LABELS: Record<string, string> = {
  load_calculation: 'Load Calculation',
  equipment_selection: 'Equipment Selection',
  ahu_configuration: 'AHU Configuration',
  ventilation_calculation: 'Ventilation Calculator',
  coil_selection: 'Coil Selection',
  filter_selection: 'Filter Selection',
  vav_box_selection: 'VAV Box Selection',
  fcu_selection: 'FCU Selection',
  chiller_selection: 'Chiller Selection',
  boiler_selection: 'Boiler Selection',
  cooling_tower_sizing: 'Cooling Tower Sizing',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ConflictCenter({ usersByTool }: ConflictCenterProps) {
  const navigate = useNavigate();

  // Find potential conflicts: multiple users editing the same entity
  const conflicts: ConflictInfo[] = [];

  usersByTool.forEach((users, toolType) => {
    // Group users by entity
    const entityMap = new Map<string, GlobalPresenceUser[]>();
    users.forEach((user) => {
      if (!entityMap.has(user.currentEntityId)) {
        entityMap.set(user.currentEntityId, []);
      }
      entityMap.get(user.currentEntityId)!.push(user);
    });

    // Check for multiple editors on the same entity
    entityMap.forEach((entityUsers, entityId) => {
      const editors = entityUsers.filter((u) => u.isEditing);
      if (editors.length > 1) {
        conflicts.push({
          toolType,
          entityId,
          users: editors,
        });
      }
    });
  });

  if (conflicts.length === 0) {
    return null; // Don't render if no conflicts
  }

  const handleNavigate = (toolType: string, entityId: string) => {
    const route = TOOL_ROUTES[toolType];
    if (route) {
      navigate(`${route}?entityId=${entityId}`);
    }
  };

  return (
    <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          Active Conflicts
          <Badge variant="destructive" className="ml-auto">
            {conflicts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conflicts.map((conflict, index) => (
            <div
              key={`${conflict.toolType}-${conflict.entityId}-${index}`}
              className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background/80"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {TOOL_LABELS[conflict.toolType] || conflict.toolType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {conflict.users.length} users editing
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {conflict.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{user.fullName.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Started{' '}
                  {formatDistanceToNow(
                    new Date(
                      Math.min(...conflict.users.map((u) => new Date(u.joinedAt).getTime()))
                    ),
                    { addSuffix: true }
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(conflict.toolType, conflict.entityId)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
