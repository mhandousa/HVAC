import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { VolumeX, Wrench, Settings, Layers, GitBranch } from 'lucide-react';
import { FloorRemediationDashboard } from '@/hooks/useFloorRemediationDashboard';
import { TreatmentApplied } from '@/hooks/useZoneRemediationHistory';

interface TreatmentBreakdownPieChartProps {
  data: FloorRemediationDashboard['treatmentBreakdown'];
  onTreatmentClick?: (type: TreatmentApplied['type']) => void;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const treatmentIcons: Record<TreatmentApplied['type'], React.ElementType> = {
  silencer: VolumeX,
  'duct-mod': Wrench,
  'equipment-change': Settings,
  'acoustic-lining': Layers,
  'flex-duct': GitBranch,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FloorRemediationDashboard['treatmentBreakdown'][0];
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const Icon = treatmentIcons[data.type];

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold mb-2">
        <Icon className="h-4 w-4" />
        {data.label}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Count:</span>
          <span className="font-medium">{data.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Cost:</span>
          <span className="font-medium">SAR {data.totalCost.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: FloorRemediationDashboard['treatmentBreakdown'][0];
  }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => {
        const Icon = treatmentIcons[entry.payload.type];
        return (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-1.5 text-xs"
          >
            <Icon className="h-3 w-3" style={{ color: entry.color }} />
            <span>{entry.payload.label}</span>
            <span className="text-muted-foreground">({entry.payload.count})</span>
          </div>
        );
      })}
    </div>
  );
}

export function TreatmentBreakdownPieChart({
  data,
  onTreatmentClick,
}: TreatmentBreakdownPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <VolumeX className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No treatments recorded</p>
      </div>
    );
  }

  const totalCost = data.reduce((sum, t) => sum + t.totalCost, 0);
  const totalCount = data.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="count"
            onClick={(data) => onTreatmentClick?.(data.type)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="text-xs text-muted-foreground">Total Treatments</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-2xl font-bold">
            SAR {(totalCost / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-muted-foreground">Total Cost</div>
        </div>
      </div>
    </div>
  );
}
