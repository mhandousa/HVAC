import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthTrendChartProps {
  projectId: string;
  days?: number;
  height?: number;
  className?: string;
}

interface SnapshotData {
  snapshot_date: string;
  overall_completeness_percent: number;
}

export function HealthTrendChart({
  projectId,
  days = 30,
  height = 120,
  className,
}: HealthTrendChartProps) {
  const startDate = useMemo(() => subDays(new Date(), days), [days]);
  
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['health-trend', projectId, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_completeness_snapshots')
        .select('snapshot_date, overall_completeness_percent')
        .eq('project_id', projectId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });
      
      if (error) throw error;
      return data as SnapshotData[];
    },
    enabled: !!projectId,
  });
  
  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    
    return snapshots.map((s) => ({
      date: format(new Date(s.snapshot_date), 'MMM d'),
      score: Math.round(s.overall_completeness_percent),
    }));
  }, [snapshots]);
  
  const trend = useMemo(() => {
    if (!chartData || chartData.length < 2) return { direction: 'stable' as const, value: 0 };
    
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    const diff = last - first;
    
    if (diff > 5) return { direction: 'up' as const, value: diff };
    if (diff < -5) return { direction: 'down' as const, value: Math.abs(diff) };
    return { direction: 'stable' as const, value: Math.abs(diff) };
  }, [chartData]);
  
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-green-500' : trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground';
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Health Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No historical data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {days}-Day Health Trend
          </CardTitle>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {trend.direction === 'stable' ? 'Stable' : `${trend.value}%`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}%`, 'Health Score']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#healthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
