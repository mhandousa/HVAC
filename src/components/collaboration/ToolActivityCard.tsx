import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlobalPresenceUser } from '@/hooks/useGlobalPresence';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Settings,
  Wind,
  Thermometer,
  Box,
  Droplets,
  Cpu,
  Activity,
  LucideIcon,
} from 'lucide-react';

interface ToolActivityCardProps {
  usersByTool: Map<string, GlobalPresenceUser[]>;
}

interface ToolCategoryInfo {
  name: string;
  icon: LucideIcon;
  tools: string[];
  route: string;
}

const TOOL_CATEGORIES: ToolCategoryInfo[] = [
  {
    name: 'Core Calculations',
    icon: Calculator,
    tools: ['load_calculation', 'ventilation_calculation', 'psychrometric'],
    route: '/design/load-calculation',
  },
  {
    name: 'Equipment Selection',
    icon: Settings,
    tools: ['equipment_selection', 'coil_selection', 'filter_selection', 'fan_selection', 'pump_selection'],
    route: '/design/equipment-selection',
  },
  {
    name: 'Air Distribution',
    icon: Wind,
    tools: ['ahu_configuration', 'duct_sizing', 'vav_box_selection', 'fcu_selection', 'diffuser_selection'],
    route: '/design/ahu-configuration',
  },
  {
    name: 'Water Distribution',
    icon: Droplets,
    tools: ['pipe_sizing', 'control_valve_sizing', 'expansion_tank_sizing'],
    route: '/design/pipe-sizing',
  },
  {
    name: 'Plant Design',
    icon: Thermometer,
    tools: ['chiller_selection', 'boiler_selection', 'cooling_tower_sizing', 'chw_plant', 'hw_plant'],
    route: '/design/chw-plant',
  },
  {
    name: 'VRF Systems',
    icon: Box,
    tools: ['vrf_designer'],
    route: '/design/vrf-designer',
  },
  {
    name: 'Energy Recovery',
    icon: Activity,
    tools: ['erv_sizing', 'economizer_sizing'],
    route: '/design/erv-sizing',
  },
  {
    name: 'Controls & Compliance',
    icon: Cpu,
    tools: ['sequence_of_operations', 'bas_points', 'ashrae_compliance', 'sbc_compliance'],
    route: '/design/sequence-of-operations',
  },
];

export function ToolActivityCard({ usersByTool }: ToolActivityCardProps) {
  const navigate = useNavigate();

  const getCategoryStats = (category: ToolCategoryInfo) => {
    let activeUsers = 0;
    let editingUsers = 0;
    let hasConflict = false;

    category.tools.forEach((tool) => {
      const users = usersByTool.get(tool) || [];
      activeUsers += users.length;
      editingUsers += users.filter((u) => u.isEditing).length;

      // Check for conflicts (multiple editors on same entity)
      const entityMap = new Map<string, number>();
      users.forEach((u) => {
        if (u.isEditing) {
          entityMap.set(u.currentEntityId, (entityMap.get(u.currentEntityId) || 0) + 1);
        }
      });
      entityMap.forEach((count) => {
        if (count > 1) hasConflict = true;
      });
    });

    return { activeUsers, editingUsers, hasConflict };
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TOOL_CATEGORIES.map((category) => {
        const stats = getCategoryStats(category);
        const Icon = category.icon;

        return (
          <Card
            key={category.name}
            className={`cursor-pointer transition-all hover:shadow-md ${
              stats.hasConflict
                ? 'border-orange-500/50 animate-pulse'
                : stats.activeUsers > 0
                ? 'border-primary/30'
                : ''
            }`}
            onClick={() => navigate(category.route)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {stats.activeUsers > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stats.activeUsers} active
                    </Badge>
                  )}
                  {stats.hasConflict && (
                    <Badge variant="destructive" className="text-xs">
                      Conflict
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-medium text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers === 0
                    ? 'No active users'
                    : `${stats.editingUsers} editing, ${stats.activeUsers - stats.editingUsers} viewing`}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
