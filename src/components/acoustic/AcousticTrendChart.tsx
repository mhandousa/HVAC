import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { useAggregatedAcousticReadings, useDemoAcousticReadings, type TimeRange } from '@/hooks/useAcousticReadings';
import { cn } from '@/lib/utils';

interface AcousticTrendChartProps {
  deviceId?: string;
  zoneId?: string;
  zoneName?: string;
  timeRange: TimeRange;
  targetNC?: number;
  showToleranceBand?: boolean;
  tolerance?: number;
  height?: number;
  compact?: boolean;
  showStats?: boolean;
}

export function AcousticTrendChart({
  deviceId,
  zoneName,
  timeRange,
  targetNC = 35,
  showToleranceBand = true,
  tolerance = 3,
  height = 250,
  compact = false,
  showStats = true,
}: AcousticTrendChartProps) {
  const { data: realData, stats, isLoading } = useAggregatedAcousticReadings(deviceId, timeRange, targetNC);
  const demoData = useDemoAcousticReadings(timeRange, targetNC);
  
  // Use real data if available, otherwise demo
  const chartData = realData.length > 0 ? realData : demoData;
  const isDemo = realData.length === 0;
  
  // Calculate demo stats if using demo data
  const displayStats = useMemo(() => {
    if (!isDemo) return stats;
    
    const values = demoData.map(d => d.value);
    return {
      min: Math.round(Math.min(...values) * 10) / 10,
      max: Math.round(Math.max(...values) * 10) / 10,
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      current: values[values.length - 1] || 0,
      exceedancePercent: Math.round((values.filter(v => v > targetNC).length / values.length) * 100),
    };
  }, [isDemo, demoData, stats, targetNC]);
  
  // Determine trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-5);
    const first = recent[0]?.value || 0;
    const last = recent[recent.length - 1]?.value || 0;
    const diff = last - first;
    if (diff > 2) return 'increasing';
    if (diff < -2) return 'decreasing';
    return 'stable';
  }, [chartData]);
  
  const TrendIcon = trend === 'increasing' ? TrendingUp : trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = trend === 'increasing' ? 'text-destructive' : trend === 'decreasing' ? 'text-success' : 'text-muted-foreground';
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    const value = data?.value || 0;
    const exceeds = value > targetNC;
    
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 space-y-1">
          <p className={cn('text-lg font-bold', exceeds ? 'text-destructive' : 'text-foreground')}>
            NC {value.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">
            Target: NC {targetNC} {exceeds ? '⚠️ Exceeded' : '✓'}
          </p>
          {data?.min !== undefined && (
            <p className="text-xs text-muted-foreground">
              Range: {data.min.toFixed(1)} - {data.max.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{zoneName || 'NC Level'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-bold',
              displayStats.current > targetNC ? 'text-destructive' : 'text-success'
            )}>
              NC {displayStats.current}
            </span>
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
          </div>
        </div>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[20, 60]} 
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              
              {showToleranceBand && (
                <ReferenceArea 
                  y1={targetNC - tolerance} 
                  y2={targetNC + tolerance} 
                  fill="hsl(var(--success))" 
                  fillOpacity={0.1}
                />
              )}
              
              <ReferenceLine 
                y={targetNC} 
                stroke="hsl(var(--success))" 
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="h-4 w-4" />
              {zoneName || 'NC Level Trends'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isDemo ? 'Demo data - configure NC meters to see real data' : 'Live acoustic monitoring'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={displayStats.current > targetNC ? 'destructive' : 'default'}
              className="gap-1"
            >
              NC {displayStats.current}
              <TrendIcon className={cn('h-3 w-3', trendColor)} />
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[20, 60]} 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                label={{ value: 'NC Level', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              
              {/* Tolerance band */}
              {showToleranceBand && (
                <ReferenceArea 
                  y1={targetNC - tolerance} 
                  y2={targetNC + tolerance} 
                  fill="hsl(var(--success))" 
                  fillOpacity={0.1}
                  label={{ value: `±${tolerance} dB`, fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
              )}
              
              {/* Target line */}
              <ReferenceLine 
                y={targetNC} 
                stroke="hsl(var(--success))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: `Target NC-${targetNC}`, fontSize: 10, fill: 'hsl(var(--success))' }}
              />
              
              {/* Min-max range area */}
              <Area
                type="monotone"
                dataKey="max"
                stackId="range"
                fill="hsl(var(--primary) / 0.1)"
                stroke="none"
              />
              
              {/* NC readings line */}
              <Line 
                type="monotone" 
                dataKey="value" 
                name="NC Level"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats summary */}
        {showStats && (
          <div className="mt-4 grid grid-cols-4 gap-4 rounded-lg border p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className={cn(
                'text-lg font-bold',
                displayStats.current > targetNC ? 'text-destructive' : 'text-foreground'
              )}>
                NC {displayStats.current}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-lg font-bold">NC {displayStats.avg}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Range</p>
              <p className="text-lg font-bold">{displayStats.min} - {displayStats.max}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Exceedance</p>
              <p className={cn(
                'text-lg font-bold',
                displayStats.exceedancePercent > 10 ? 'text-destructive' : 'text-success'
              )}>
                {displayStats.exceedancePercent}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
