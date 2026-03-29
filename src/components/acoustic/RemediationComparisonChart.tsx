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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import {
  OctaveBandData,
  OCTAVE_BAND_FREQUENCIES,
  interpolateNCCurve,
  calculateImprovement,
} from '@/lib/nc-reference-curves';

interface RemediationComparisonChartProps {
  before: OctaveBandData;
  after: OctaveBandData;
  targetNC: number;
  zoneName?: string;
  treatmentDescription?: string;
  height?: number;
}

export function RemediationComparisonChart({
  before,
  after,
  targetNC,
  zoneName,
  treatmentDescription,
  height = 350,
}: RemediationComparisonChartProps) {
  const targetCurve = interpolateNCCurve(targetNC);
  const improvement = calculateImprovement(before, after);

  // Generate chart data
  const chartData = OCTAVE_BAND_FREQUENCIES.map((freq) => ({
    frequency: freq,
    before: Math.round(before[freq] * 10) / 10,
    after: Math.round(after[freq] * 10) / 10,
    target: Math.round(targetCurve[freq] * 10) / 10,
    improvement: Math.round((before[freq] - after[freq]) * 10) / 10,
  }));

  const isSuccess = improvement.afterNC <= targetNC;
  const isImproved = improvement.afterNC < improvement.beforeNC;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const beforeVal = payload.find((p: any) => p.dataKey === 'before')?.value;
    const afterVal = payload.find((p: any) => p.dataKey === 'after')?.value;
    const targetVal = payload.find((p: any) => p.dataKey === 'target')?.value;
    const improvementVal = beforeVal && afterVal ? beforeVal - afterVal : 0;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Before:</span>
            <span className="font-medium text-destructive">{beforeVal} dB</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">After:</span>
            <span
              className={`font-medium ${
                afterVal <= targetVal ? 'text-green-600' : 'text-amber-500'
              }`}
            >
              {afterVal} dB
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium">{targetVal} dB</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t">
            <span className="text-muted-foreground">Improvement:</span>
            <span
              className={`font-bold ${
                improvementVal > 0 ? 'text-green-600' : 'text-destructive'
              }`}
            >
              {improvementVal > 0 ? '-' : '+'}
              {Math.abs(improvementVal).toFixed(1)} dB
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4" />
            {zoneName
              ? `Remediation Effectiveness - ${zoneName}`
              : 'Remediation Effectiveness'}
          </CardTitle>
          <Badge
            variant={isSuccess ? 'default' : isImproved ? 'secondary' : 'destructive'}
            className="flex items-center gap-1"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Target Achieved
              </>
            ) : isImproved ? (
              <>
                <ArrowDown className="h-3 w-3" />-{improvement.overallImprovement} dB
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                No Improvement
              </>
            )}
          </Badge>
        </div>
        {treatmentDescription && (
          <p className="text-sm text-muted-foreground mt-1">{treatmentDescription}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="text-xs text-muted-foreground">Before</div>
            <div className="text-xl font-bold text-destructive">
              NC-{improvement.beforeNC}
            </div>
          </div>
          <div
            className={`text-center p-3 rounded-lg ${
              isSuccess ? 'bg-green-500/10' : 'bg-amber-500/10'
            }`}
          >
            <div className="text-xs text-muted-foreground">After</div>
            <div
              className={`text-xl font-bold ${
                isSuccess ? 'text-green-600' : 'text-amber-500'
              }`}
            >
              NC-{improvement.afterNC}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-xs text-muted-foreground">Target</div>
            <div className="text-xl font-bold text-primary">NC-{targetNC}</div>
          </div>
          <div
            className={`text-center p-3 rounded-lg ${
              improvement.overallImprovement > 0 ? 'bg-green-500/10' : 'bg-muted/30'
            }`}
          >
            <div className="text-xs text-muted-foreground">Improvement</div>
            <div
              className={`text-xl font-bold ${
                improvement.overallImprovement > 0
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}
            >
              {improvement.overallImprovement > 0 ? '-' : ''}
              {improvement.overallImprovement} dB
            </div>
          </div>
        </div>

        {/* Chart */}
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
              <Legend />

              {/* Improvement shaded area between before and after */}
              <Area
                type="monotone"
                dataKey="before"
                fill="hsl(142 76% 36% / 0.15)"
                stroke="none"
              />

              {/* Target line */}
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name={`Target NC-${targetNC}`}
              />

              {/* Before measurement */}
              <Line
                type="monotone"
                dataKey="before"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: 'hsl(var(--destructive))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
                name="Before"
              />

              {/* After measurement */}
              <Line
                type="monotone"
                dataKey="after"
                stroke="hsl(142 76% 36%)"
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: 'hsl(142 76% 36%)',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
                name="After"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Frequency-by-frequency improvement */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Improvement by Frequency</div>
          <div className="flex gap-2 flex-wrap">
            {OCTAVE_BAND_FREQUENCIES.map((freq) => {
              const imp = improvement.frequencyImprovements[freq];
              const isPositive = imp > 0;

              return (
                <div
                  key={freq}
                  className={`px-2 py-1 rounded text-xs ${
                    isPositive
                      ? 'bg-green-500/10 text-green-600'
                      : imp < 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {freq}: {isPositive ? '-' : '+'}
                  {Math.abs(Math.round(imp))} dB
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
