import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { ERVPerformanceReading } from '@/hooks/useERVMaintenance';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';

interface ERVPerformanceChartProps {
  readings: ERVPerformanceReading[];
}

export function ERVPerformanceChart({ readings }: ERVPerformanceChartProps) {
  if (readings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={BarChart3}
            title="No Performance Data"
            description="Log maintenance with efficiency measurements to see performance trends over time."
          />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (reverse to show oldest to newest)
  const chartData = [...readings]
    .reverse()
    .slice(-30) // Last 30 readings
    .map((reading) => ({
      date: format(new Date(reading.reading_at), 'MMM d'),
      fullDate: format(new Date(reading.reading_at), 'MMM d, yyyy HH:mm'),
      sensibleEfficiency: reading.sensible_efficiency,
      latentEfficiency: reading.latent_efficiency,
      totalEfficiency: reading.total_efficiency,
      filterPressure: reading.filter_pressure_drop_pa,
      supplyAirflow: reading.supply_airflow_cfm,
    }));

  // Calculate baseline (design efficiency, typically 70-80%)
  const baselineEfficiency = 75;
  const warningThreshold = 65;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'Efficiency (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                />
                <Legend />
                <ReferenceLine 
                  y={baselineEfficiency} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
                  label={{ value: 'Design', fill: 'hsl(var(--primary))', fontSize: 10 }}
                />
                <ReferenceLine 
                  y={warningThreshold} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Warning', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="sensibleEfficiency"
                  name="Sensible"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="latentEfficiency"
                  name="Latent"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalEfficiency"
                  name="Total"
                  stroke="hsl(262 83% 58%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(262 83% 58%)', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {chartData.some(d => d.filterPressure) && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Pressure Drop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Pressure (Pa)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine 
                    y={250} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3"
                    label={{ value: 'Replace Filter', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="filterPressure"
                    name="Filter ΔP"
                    stroke="hsl(24 95% 53%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(24 95% 53%)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              High filter pressure drop indicates a dirty filter that needs replacement. 
              Typical replacement threshold is 250 Pa or 2x clean filter pressure drop.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
