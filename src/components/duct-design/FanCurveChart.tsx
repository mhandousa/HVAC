import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FanCurve, FanCurvePoint, calculateSystemCurve, findOperatingPoint } from '@/hooks/useFanCurves';

interface FanCurveChartProps {
  fanCurve: FanCurve;
  systemCfm: number;
  systemStaticPressure: number;
  staticPressure?: number;
}

export function FanCurveChart({
  fanCurve,
  systemCfm,
  systemStaticPressure,
  staticPressure = 0,
}: FanCurveChartProps) {
  // Calculate system curve
  const systemCurve = useMemo(
    () => calculateSystemCurve(systemCfm, systemStaticPressure, staticPressure),
    [systemCfm, systemStaticPressure, staticPressure]
  );

  // Find operating point
  const operatingPoint = useMemo(
    () => findOperatingPoint(fanCurve.curve_data, systemCurve),
    [fanCurve.curve_data, systemCurve]
  );

  // Combine data for chart
  const chartData = useMemo(() => {
    const data: Array<{
      cfm: number;
      fanPressure?: number;
      systemPressure?: number;
      fanEfficiency?: number;
      fanBHP?: number;
    }> = [];

    // Add fan curve points
    fanCurve.curve_data.forEach((point) => {
      data.push({
        cfm: point.cfm,
        fanPressure: point.staticPressure,
        fanEfficiency: point.efficiency,
        fanBHP: point.bhp,
      });
    });

    // Add system curve points
    systemCurve.forEach((point) => {
      const existing = data.find((d) => Math.abs(d.cfm - point.cfm) < 50);
      if (existing) {
        existing.systemPressure = point.staticPressure;
      } else {
        data.push({
          cfm: point.cfm,
          systemPressure: point.staticPressure,
        });
      }
    });

    // Sort by CFM
    return data.sort((a, b) => a.cfm - b.cfm);
  }, [fanCurve.curve_data, systemCurve]);

  // Find max values for axis scaling
  const maxCfm = Math.max(...chartData.map((d) => d.cfm), systemCfm * 1.2);
  const maxPressure = Math.max(
    ...chartData.map((d) => d.fanPressure || d.systemPressure || 0),
    systemStaticPressure * 1.2
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">
            {fanCurve.manufacturer} {fanCurve.model}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fanCurve.fan_type} • {fanCurve.rpm} RPM • {fanCurve.motor_hp} HP
          </p>
        </div>
        {operatingPoint.isValid && (
          <Badge variant="secondary" className="text-emerald-600">
            {operatingPoint.efficiency.toFixed(0)}% Efficiency
          </Badge>
        )}
      </div>

      {/* Pressure vs CFM Chart */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Pressure vs Airflow</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="cfm"
                  type="number"
                  domain={[0, maxCfm]}
                  tickFormatter={(v) => `${v}`}
                  label={{ value: 'CFM', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="pressure"
                  domain={[0, maxPressure]}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{ value: 'in. w.g.', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}`,
                    name === 'fanPressure' ? 'Fan Curve' : 'System Curve',
                  ]}
                  labelFormatter={(label) => `${label} CFM`}
                />
                <Legend />
                
                {/* Fan curve */}
                <Line
                  yAxisId="pressure"
                  type="monotone"
                  dataKey="fanPressure"
                  name="Fan Curve"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  connectNulls
                />
                
                {/* System curve */}
                <Line
                  yAxisId="pressure"
                  type="monotone"
                  dataKey="systemPressure"
                  name="System Curve"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                
                {/* Operating point */}
                {operatingPoint.cfm > 0 && (
                  <ReferenceDot
                    yAxisId="pressure"
                    x={operatingPoint.cfm}
                    y={operatingPoint.staticPressure}
                    r={8}
                    fill={operatingPoint.isValid ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Chart */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Efficiency & Power</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="cfm"
                  type="number"
                  domain={[0, maxCfm]}
                  tickFormatter={(v) => `${v}`}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="efficiency"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="bhp"
                  orientation="right"
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${v}`}
                  className="text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                
                {/* Efficiency area */}
                <Area
                  yAxisId="efficiency"
                  type="monotone"
                  dataKey="fanEfficiency"
                  name="Efficiency (%)"
                  fill="hsl(var(--primary) / 0.2)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  connectNulls
                />
                
                {/* BHP line */}
                <Line
                  yAxisId="bhp"
                  type="monotone"
                  dataKey="fanBHP"
                  name="BHP"
                  stroke="hsl(var(--secondary-foreground))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                
                {/* Operating point */}
                {operatingPoint.cfm > 0 && (
                  <ReferenceDot
                    yAxisId="efficiency"
                    x={operatingPoint.cfm}
                    y={operatingPoint.efficiency}
                    r={6}
                    fill={operatingPoint.isValid ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Operating Point Summary */}
      {operatingPoint.cfm > 0 && (
        <Card className={operatingPoint.isValid ? 'border-emerald-200' : 'border-amber-200'}>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Operating CFM</p>
                <p className="text-lg font-bold">{operatingPoint.cfm.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Static Pressure</p>
                <p className="text-lg font-bold">{operatingPoint.staticPressure.toFixed(2)} in.</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BHP</p>
                <p className="text-lg font-bold">{operatingPoint.bhp.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <p className="text-lg font-bold">{operatingPoint.efficiency.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
