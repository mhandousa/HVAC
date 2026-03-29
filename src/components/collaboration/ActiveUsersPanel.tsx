import { GlobalPresenceUser } from '@/hooks/useGlobalPresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Edit3, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ActiveUsersPanelProps {
  users: GlobalPresenceUser[];
  isConnected: boolean;
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
  duct_sizing: '/design/duct-sizing',
  pipe_sizing: '/design/pipe-sizing',
  erv_sizing: '/design/erv-sizing',
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
  duct_sizing: 'Duct Sizing',
  pipe_sizing: 'Pipe Sizing',
  erv_sizing: 'ERV Sizing',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ActiveUsersPanel({ users, isConnected }: ActiveUsersPanelProps) {
  const navigate = useNavigate();

  const handleUserClick = (user: GlobalPresenceUser) => {
    const route = TOOL_ROUTES[user.currentTool];
    if (route) {
      navigate(`${route}?entityId=${user.currentEntityId}`);
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Active Users
            {!isConnected && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Offline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No other team members are currently active in design tools.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Active Users
          <Badge variant="secondary" className="ml-auto">
            {users.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {users.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {user.isEditing && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-orange-500 rounded-full p-0.5">
                        <Edit3 className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {TOOL_LABELS[user.currentTool] || user.currentTool}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: false })}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="mt-1">
                    {user.isEditing ? 'Editing' : 'Viewing'}{' '}
                    {TOOL_LABELS[user.currentTool] || user.currentTool}
                  </p>
                  <p className="text-muted-foreground">Click to navigate</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
