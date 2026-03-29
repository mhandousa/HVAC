import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Volume2,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  OctaveBandData,
  generateChartData,
  getExceedingFrequencies,
  calculateNCFromOctaveBands,
} from '@/lib/nc-reference-curves';

interface OctaveBandChartProps {
  measured: OctaveBandData | null;
  targetNC: number;
  zoneName?: string;
  showComplianceZone?: boolean;
  showReferenceNCCurves?: boolean;
  referenceNCLevels?: number[];
  height?: number;
  onExport?: () => void;
}

export function OctaveBandChart({
  measured,
  targetNC,
  zoneName,
  showComplianceZone = true,
  showReferenceNCCurves = true,
  referenceNCLevels = [25, 35, 45],
  height = 350,
  onExport,
}: OctaveBandChartProps) {
  const [showReferences, setShowReferences] = useState(showReferenceNCCurves);
  const [showCompliance, setShowCompliance] = useState(showComplianceZone);

  const chartData = generateChartData(
    measured,
    targetNC,
    showReferences ? referenceNCLevels : []
  );

  const measuredNC = measured ? calculateNCFromOctaveBands(measured) : null;
  const exceedingFrequencies = measured
    ? getExceedingFrequencies(measured, targetNC)
    : [];
  const isCompliant = measuredNC !== null && measuredNC <= targetNC;

  // Reference curve colors (grays)
  const refColors: Record<number, string> = {
    25: 'hsl(var(--muted-foreground) / 0.3)',
    30: 'hsl(var(--muted-foreground) / 0.4)',
    35: 'hsl(var(--muted-foreground) / 0.5)',
    40: 'hsl(var(--muted-foreground) / 0.6)',
    45: 'hsl(var(--muted-foreground) / 0.7)',
    50: 'hsl(var(--muted-foreground) / 0.8)',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const measuredValue = payload.find((p: any) => p.dataKey === 'measured')?.value;
    const targetValue = payload.find((p: any) => p.dataKey === 'target')?.value;
    const delta = measuredValue && targetValue ? measuredValue - targetValue : null;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {measuredValue !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Measured:</span>
              <span className="font-medium">{measuredValue} dB</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Target (NC-{targetNC}):</span>
            <span className="font-medium">{targetValue} dB</span>
          </div>
          {delta !== null && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Delta:</span>
              <span
                className={`font-bold ${
                  delta > 3
                    ? 'text-destructive'
                    : delta > 0
                    ? 'text-amber-500'
                    : 'text-green-500'
                }`}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} dB
              </span>
            </div>
          )}
        </div>
        {showReferences && (
          <div className="mt-2 pt-2 border-t space-y-1">
            {referenceNCLevels.map((nc) => {
              const refValue = payload.find(
                (p: any) => p.dataKey === `NC-${nc}`
              )?.value;
              if (refValue === undefined) return null;
              return (
                <div
                  key={nc}
                  className="flex items-center justify-between gap-4 text-xs text-muted-foreground"
                >
                  <span>NC-{nc}:</span>
                  <span>{refValue} dB</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" />
            {zoneName ? `Octave Band Analysis - ${zoneName}` : 'Octave Band Analysis'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {measuredNC !== null && (
              <Badge
                variant={isCompliant ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {isCompliant ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                NC-{measuredNC}
              </Badge>
            )}
            {onExport && (
              <Button variant="ghost" size="icon" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <Switch
              id="show-refs"
              checked={showReferences}
              onCheckedChange={setShowReferences}
            />
            <Label htmlFor="show-refs" className="text-sm cursor-pointer">
              Reference Curves
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-compliance"
              checked={showCompliance}
              onCheckedChange={setShowCompliance}
            />
            <Label htmlFor="show-compliance" className="text-sm cursor-pointer">
              Compliance Zone
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="frequency"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                domain={[10, 80]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'dB',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Compliance Zone (shaded area below target) */}
              {showCompliance && (
                <Area
                  type="monotone"
                  dataKey="target"
                  fill="hsl(var(--primary) / 0.1)"
                  stroke="none"
                  fillOpacity={1}
                />
              )}

              {/* Reference NC Curves */}
              {showReferences &&
                referenceNCLevels.map((nc) => (
                  <Line
                    key={`nc-${nc}`}
                    type="monotone"
                    dataKey={`NC-${nc}`}
                    stroke={refColors[nc] || 'hsl(var(--muted-foreground) / 0.5)'}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    name={`NC-${nc}`}
                  />
                ))}

              {/* Target NC Curve */}
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name={`Target NC-${targetNC}`}
              />

              {/* Measured Values */}
              {measured && (
                <Line
                  type="monotone"
                  dataKey="measured"
                  stroke={isCompliant ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))'}
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: isCompliant
                      ? 'hsl(142 76% 36%)'
                      : 'hsl(var(--destructive))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 7 }}
                  name="Measured"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Exceeding Frequencies Summary */}
        {exceedingFrequencies.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <h4 className="text-sm font-medium flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Frequencies Exceeding Target
            </h4>
            <div className="flex flex-wrap gap-2">
              {exceedingFrequencies.map(({ frequency, delta }) => (
                <Badge
                  key={frequency}
                  variant="outline"
                  className="bg-destructive/5 border-destructive/30 text-destructive"
                >
                  {frequency}: +{delta} dB
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          {measured && (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-1 rounded"
                style={{
                  backgroundColor: isCompliant
                    ? 'hsl(142 76% 36%)'
                    : 'hsl(var(--destructive))',
                }}
              />
              <span>Measured</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-0.5 rounded"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                borderTop: '2px dashed hsl(var(--primary))',
              }}
            />
            <span>Target NC-{targetNC}</span>
          </div>
          {showReferences && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div
                className="w-4 h-0.5 rounded"
                style={{ borderTop: '2px dashed hsl(var(--muted-foreground) / 0.5)' }}
              />
              <span>Reference Curves</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
