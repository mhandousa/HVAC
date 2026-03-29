import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMultiZoneAcousticReadings, type ZoneConfig } from '@/hooks/useMultiZoneAcousticReadings';
import type { TimeRange } from '@/hooks/useAcousticReadings';
import { Loader2, Volume2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Distinct colors for up to 8 zones
const ZONE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(210, 70%, 50%)',
  'hsl(var(--warning))',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(160, 70%, 40%)',
  'hsl(30, 70%, 50%)',
];

interface MultiZoneAcousticChartProps {
  zones: ZoneConfig[];
  timeRange: TimeRange;
  height?: number;
  showTargetLine?: boolean;
  showLegend?: boolean;
  showSummaryTable?: boolean;
  title?: string;
  description?: string;
  onZoneClick?: (zoneId: string) => void;
}

export function MultiZoneAcousticChart({
  zones,
  timeRange,
  height = 300,
  showTargetLine = true,
  showLegend = true,
  showSummaryTable = true,
  title = 'Multi-Zone NC Comparison',
  description,
  onZoneClick,
}: MultiZoneAcousticChartProps) {
  const { data, summaryStats, isLoading, isDemo } = useMultiZoneAcousticReadings(zones, timeRange);

  // Calculate average target NC for reference line
  const avgTargetNC = useMemo(() => {
    if (zones.length === 0) return 35;
    return Math.round(zones.reduce((sum, z) => sum + z.targetNC, 0) / zones.length);
  }, [zones]);

  // Assign colors to zones
  const zonesWithColors = useMemo(() => {
    return zones.map((zone, idx) => ({
      ...zone,
      color: zone.color || ZONE_COLORS[idx % ZONE_COLORS.length],
    }));
  }, [zones]);

  if (zones.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Volume2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">Select zones to compare</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {isDemo && (
            <Badge variant="secondary" className="text-xs">Demo Data</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[20, 60]}
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                label={{ 
                  value: 'NC Level', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
                }}
              />
              
              {/* Target reference line */}
              {showTargetLine && (
                <ReferenceLine 
                  y={avgTargetNC} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{ 
                    value: `Target NC-${avgTargetNC}`, 
                    position: 'right',
                    style: { fontSize: 10, fill: 'hsl(var(--destructive))' }
                  }}
                />
              )}
              
              {/* Zone lines */}
              {zonesWithColors.map(zone => (
                <Line
                  key={zone.id}
                  type="monotone"
                  dataKey={zone.id}
                  name={zone.name}
                  stroke={zone.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const zone = zones.find(z => z.name === name);
                  const target = zone?.targetNC || avgTargetNC;
                  const delta = value - target;
                  return [
                    `NC-${value.toFixed(1)} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} vs target)`,
                    name,
                  ];
                }}
              />
              
              {showLegend && (
                <Legend 
                  onClick={(e) => {
                    const zone = zones.find(z => z.name === e.value);
                    if (zone && onZoneClick) onZoneClick(zone.id);
                  }}
                  wrapperStyle={{ cursor: onZoneClick ? 'pointer' : 'default' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        {showSummaryTable && summaryStats.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Zone</th>
                  <th className="text-center p-2 font-medium">Current</th>
                  <th className="text-center p-2 font-medium">Target</th>
                  <th className="text-center p-2 font-medium">Delta</th>
                  <th className="text-center p-2 font-medium">Trend</th>
                  <th className="text-center p-2 font-medium">Exceed %</th>
                </tr>
              </thead>
              <tbody>
                {summaryStats.map((stat, idx) => {
                  const zone = zonesWithColors.find(z => z.id === stat.zoneId);
                  const TrendIcon = stat.delta > 0 ? TrendingUp : stat.delta < 0 ? TrendingDown : Minus;
                  const trendColor = stat.delta > 0 ? 'text-destructive' : stat.delta < 0 ? 'text-green-600' : 'text-muted-foreground';
                  
                  return (
                    <tr 
                      key={stat.zoneId}
                      className={cn(
                        'border-t hover:bg-muted/30 transition-colors',
                        onZoneClick && 'cursor-pointer'
                      )}
                      onClick={() => onZoneClick?.(stat.zoneId)}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: zone?.color }}
                          />
                          <span className="font-medium truncate max-w-[120px]">{stat.zoneName}</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        {stat.current !== null ? `NC-${stat.current}` : '-'}
                      </td>
                      <td className="text-center p-2 text-muted-foreground">
                        NC-{stat.targetNC}
                      </td>
                      <td className={cn('text-center p-2 font-medium', trendColor)}>
                        {stat.delta > 0 ? '+' : ''}{stat.delta}
                      </td>
                      <td className="text-center p-2">
                        <TrendIcon className={cn('h-4 w-4 mx-auto', trendColor)} />
                      </td>
                      <td className="text-center p-2">
                        <Badge 
                          variant={stat.exceedancePercent > 20 ? 'destructive' : stat.exceedancePercent > 0 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {stat.exceedancePercent}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
