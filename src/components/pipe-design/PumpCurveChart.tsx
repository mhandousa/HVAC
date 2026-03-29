import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PumpCurve,
  PumpCurvePoint,
  SystemCurvePoint,
  OperatingPoint,
  calculateSystemCurve,
  findOperatingPoint,
} from '@/hooks/usePumpCurves';

interface PumpCurveChartProps {
  pumpCurve: PumpCurve;
  systemFlow?: number;
  systemHead?: number;
  staticHead?: number;
  showEfficiency?: boolean;
  showPower?: boolean;
  className?: string;
}

export function PumpCurveChart({
  pumpCurve,
  systemFlow,
  systemHead,
  staticHead = 0,
  showEfficiency = true,
  showPower = false,
  className,
}: PumpCurveChartProps) {
  const { curveData, systemCurve, operatingPoint } = useMemo(() => {
    const curveData = pumpCurve.curve_data.map((point) => ({
      flow: point.flow,
      pumpHead: point.head,
      efficiency: point.efficiency,
      power: point.power,
    }));

    let systemCurve: SystemCurvePoint[] = [];
    let operatingPoint: OperatingPoint | null = null;

    if (systemFlow && systemHead) {
      systemCurve = calculateSystemCurve(staticHead, systemFlow, systemHead, 20);
      operatingPoint = findOperatingPoint(pumpCurve.curve_data, systemCurve);

      // Merge system curve into chart data
      const mergedData = [...curveData];
      systemCurve.forEach((sysPoint) => {
        const existing = mergedData.find((d) => Math.abs(d.flow - sysPoint.flow) < 1);
        if (existing) {
          (existing as any).systemHead = sysPoint.head;
        } else {
          mergedData.push({
            flow: sysPoint.flow,
            pumpHead: interpolateHead(pumpCurve.curve_data, sysPoint.flow),
            efficiency: 0,
            power: 0,
            systemHead: sysPoint.head,
          } as any);
        }
      });

      mergedData.sort((a, b) => a.flow - b.flow);
      return { curveData: mergedData, systemCurve, operatingPoint };
    }

    return { curveData, systemCurve: [], operatingPoint: null };
  }, [pumpCurve, systemFlow, systemHead, staticHead]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            {pumpCurve.manufacturer} {pumpCurve.model}
          </CardTitle>
          {pumpCurve.motor_hp && (
            <Badge variant="secondary" className="text-xs">
              {pumpCurve.motor_hp} HP
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {pumpCurve.pump_type} • {pumpCurve.rpm} RPM
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="flow"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(v) => `${v}`}
                label={{ value: 'Flow (GPM)', position: 'bottom', offset: -5 }}
                className="text-xs"
              />
              <YAxis
                yAxisId="head"
                domain={[0, 'dataMax']}
                tickFormatter={(v) => `${v}`}
                label={{ value: 'Head (ft)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              {showEfficiency && (
                <YAxis
                  yAxisId="efficiency"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs"
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-medium">Flow: {data.flow?.toFixed(1)} GPM</p>
                      {data.pumpHead && <p>Pump Head: {data.pumpHead?.toFixed(1)} ft</p>}
                      {data.systemHead && <p>System Head: {data.systemHead?.toFixed(1)} ft</p>}
                      {data.efficiency > 0 && <p>Efficiency: {data.efficiency?.toFixed(1)}%</p>}
                      {data.power > 0 && <p>Power: {data.power?.toFixed(2)} kW</p>}
                    </div>
                  );
                }}
              />
              <Legend />

              {/* Pump H-Q Curve */}
              <Line
                yAxisId="head"
                type="monotone"
                dataKey="pumpHead"
                name="Pump Curve"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />

              {/* System Curve */}
              {systemFlow && (
                <Line
                  yAxisId="head"
                  type="monotone"
                  dataKey="systemHead"
                  name="System Curve"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {/* Efficiency Curve */}
              {showEfficiency && (
                <Area
                  yAxisId="efficiency"
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency"
                  stroke="hsl(142 76% 36%)"
                  fill="hsl(142 76% 36% / 0.1)"
                  strokeWidth={1}
                />
              )}

              {/* Operating Point */}
              {operatingPoint && (
                <ReferenceDot
                  yAxisId="head"
                  x={operatingPoint.flow}
                  y={operatingPoint.head}
                  r={8}
                  fill={operatingPoint.isValid ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))'}
                  stroke="white"
                  strokeWidth={2}
                />
              )}

              {/* Design Point Reference Lines */}
              {systemFlow && (
                <ReferenceLine
                  yAxisId="head"
                  x={systemFlow}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: 'Design', position: 'top' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Operating Point Summary */}
        {operatingPoint && (
          <div className="mt-4 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                {operatingPoint.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Operating Point
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  operatingPoint.isValid ? 'text-emerald-600' : 'text-amber-600'
                )}
              >
                {operatingPoint.efficiency.toFixed(1)}% Efficiency
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Flow</span>
                <p className="font-medium">{operatingPoint.flow.toFixed(1)} GPM</p>
              </div>
              <div>
                <span className="text-muted-foreground">Head</span>
                <p className="font-medium">{operatingPoint.head.toFixed(1)} ft</p>
              </div>
              <div>
                <span className="text-muted-foreground">Power</span>
                <p className="font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {operatingPoint.power.toFixed(2)} kW
                </p>
              </div>
            </div>
            {operatingPoint.message && (
              <p className="text-xs text-muted-foreground mt-2">{operatingPoint.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to interpolate pump head at a given flow
function interpolateHead(curve: PumpCurvePoint[], flow: number): number {
  if (curve.length === 0) return 0;
  if (flow <= curve[0].flow) return curve[0].head;
  if (flow >= curve[curve.length - 1].flow) return curve[curve.length - 1].head;

  for (let i = 0; i < curve.length - 1; i++) {
    if (curve[i].flow <= flow && curve[i + 1].flow >= flow) {
      const ratio = (flow - curve[i].flow) / (curve[i + 1].flow - curve[i].flow);
      return curve[i].head + ratio * (curve[i + 1].head - curve[i].head);
    }
  }

  return 0;
}
