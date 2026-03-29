import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CheckCircle2, AlertCircle, XCircle, Clock, Minus } from 'lucide-react';
import { FloorRemediationDashboard } from '@/hooks/useFloorRemediationDashboard';

interface RemediationProgressChartProps {
  data: FloorRemediationDashboard['zoneComparisonData'];
  onZoneClick?: (zoneId: string) => void;
}

const statusColors = {
  'verified-success': 'hsl(var(--chart-2))', // green
  'verified-partial': 'hsl(var(--chart-4))', // amber
  'verified-failed': 'hsl(var(--destructive))',
  'pending-verification': 'hsl(var(--chart-1))', // blue
  'no-remediation': 'hsl(var(--muted-foreground))',
};

const statusIcons = {
  'verified-success': CheckCircle2,
  'verified-partial': AlertCircle,
  'verified-failed': XCircle,
  'pending-verification': Clock,
  'no-remediation': Minus,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FloorRemediationDashboard['zoneComparisonData'][0];
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const StatusIcon = statusIcons[data.status];

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold mb-2">{data.zoneName}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Before:</span>
          <span className="font-medium">NC-{data.beforeNC}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">After:</span>
          <span className="font-medium">
            {data.afterNC !== null ? `NC-${data.afterNC}` : '—'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium">NC-{data.targetNC}</span>
        </div>
        {data.improvement > 0 && (
          <div className="flex justify-between gap-4 text-green-600">
            <span>Improvement:</span>
            <span className="font-medium">-{data.improvement} dB</span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t flex items-center gap-2">
        <StatusIcon className="h-4 w-4" style={{ color: statusColors[data.status] }} />
        <span className="capitalize text-xs">
          {data.status.replace(/-/g, ' ')}
        </span>
      </div>
    </div>
  );
}

export function RemediationProgressChart({
  data,
  onZoneClick,
}: RemediationProgressChartProps) {
  // Sort by improvement (most improved first)
  const sortedData = [...data].sort((a, b) => b.improvement - a.improvement);

  // Transform for horizontal bar chart
  const chartData = sortedData.map((zone) => ({
    ...zone,
    shortName: zone.zoneName.length > 15 
      ? zone.zoneName.substring(0, 15) + '...' 
      : zone.zoneName,
    beforeValue: zone.beforeNC,
    afterValue: zone.afterNC ?? zone.beforeNC,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 'dataMax + 10']}
            tickFormatter={(v) => `NC-${v}`}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Before NC (light) */}
          <Bar
            dataKey="beforeValue"
            fill="hsl(var(--muted))"
            radius={[0, 4, 4, 0]}
            barSize={16}
            name="Before"
          />

          {/* After NC (colored by status) */}
          <Bar
            dataKey="afterValue"
            radius={[0, 4, 4, 0]}
            barSize={16}
            name="After"
            onClick={(data) => onZoneClick?.(data.zoneId)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={statusColors[entry.status]}
              />
            ))}
          </Bar>

          {/* Reference line for average target */}
          {chartData.length > 0 && (
            <ReferenceLine
              x={Math.round(chartData.reduce((sum, z) => sum + z.targetNC, 0) / chartData.length)}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              label={{ value: 'Avg Target', position: 'top', fontSize: 10 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Before</span>
        </div>
        {Object.entries(statusColors).map(([status, color]) => {
          const Icon = statusIcons[status as keyof typeof statusIcons];
          return (
            <div key={status} className="flex items-center gap-1">
              <Icon className="h-3 w-3" style={{ color }} />
              <span className="capitalize">{status.replace(/-/g, ' ')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
