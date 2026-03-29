import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useERVPressureHistory, calculatePressureTrend } from '@/hooks/useERVPredictiveMaintenance';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface PressureTrendChartProps {
  equipmentId: string;
  equipmentName?: string;
  days?: number;
}

const WARNING_THRESHOLD = 200;
const CRITICAL_THRESHOLD = 250;

export function PressureTrendChart({ 
  equipmentId, 
  equipmentName,
  days = 30 
}: PressureTrendChartProps) {
  const { t } = useTranslation();
  const { data: pressureData, isLoading } = useERVPressureHistory(equipmentId, days);

  const chartData = useMemo(() => {
    if (!pressureData) return [];
    
    return pressureData.map(reading => ({
      date: format(reading.timestamp, 'MMM d'),
      datetime: reading.timestamp.toISOString(),
      pressure: reading.value,
    }));
  }, [pressureData]);

  const trendAnalysis = useMemo(() => {
    if (!pressureData || pressureData.length < 3) return null;
    return calculatePressureTrend(pressureData);
  }, [pressureData]);

  const currentPressure = chartData.length > 0 ? chartData[chartData.length - 1].pressure : 0;
  const pressureStatus = currentPressure >= CRITICAL_THRESHOLD 
    ? 'critical' 
    : currentPressure >= WARNING_THRESHOLD 
      ? 'warning' 
      : 'normal';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Filter Pressure Trend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Filter Pressure Trend')}
            {equipmentName && <span className="text-muted-foreground font-normal">- {equipmentName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            {t('No pressure data available for this equipment')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('Filter Pressure Trend')}
            {equipmentName && <span className="text-muted-foreground font-normal">- {equipmentName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                pressureStatus === 'critical' 
                  ? 'destructive' 
                  : pressureStatus === 'warning' 
                    ? 'default' 
                    : 'secondary'
              }
              className={pressureStatus === 'warning' ? 'bg-amber-500' : ''}
            >
              {pressureStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {pressureStatus === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {pressureStatus === 'normal' && <CheckCircle className="h-3 w-3 mr-1" />}
              {currentPressure.toFixed(0)} Pa
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, Math.max(CRITICAL_THRESHOLD + 50, ...chartData.map(d => d.pressure))]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ 
                  value: 'Pa', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number) => [`${value.toFixed(1)} Pa`, 'Pressure Drop']}
              />
              <ReferenceLine 
                y={WARNING_THRESHOLD} 
                stroke="hsl(45 93% 47%)" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Warning', 
                  position: 'right',
                  fill: 'hsl(45 93% 47%)',
                  fontSize: 10
                }}
              />
              <ReferenceLine 
                y={CRITICAL_THRESHOLD} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Critical', 
                  position: 'right',
                  fill: 'hsl(var(--destructive))',
                  fontSize: 10
                }}
              />
              <Area
                type="monotone"
                dataKey="pressure"
                fill="url(#pressureGradient)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {trendAnalysis && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">{t('Trend Slope')}</div>
                <div className={`font-semibold ${trendAnalysis.slope > 0.5 ? 'text-amber-500' : ''}`}>
                  {trendAnalysis.slope > 0 ? '+' : ''}{trendAnalysis.slope.toFixed(2)} Pa/day
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">{t('Confidence')}</div>
                <div className="font-semibold">
                  R² = {(trendAnalysis.rSquared * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">{t('Est. Days to Critical')}</div>
                <div className={`font-semibold ${
                  trendAnalysis.predictedDaysToThreshold && trendAnalysis.predictedDaysToThreshold < 14 
                    ? 'text-amber-500' 
                    : ''
                }`}>
                  {trendAnalysis.predictedDaysToThreshold 
                    ? `${trendAnalysis.predictedDaysToThreshold} days`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
