import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { OctaveBandData, OCTAVE_BAND_FREQUENCIES } from '@/lib/nc-reference-curves';

interface FrequencyBandMatchChartProps {
  requiredAttenuation: OctaveBandData;
  silencerAttenuation: OctaveBandData;
  title?: string;
  height?: number;
}

export function FrequencyBandMatchChart({
  requiredAttenuation,
  silencerAttenuation,
  title = 'Frequency Band Attenuation Match',
  height = 250,
}: FrequencyBandMatchChartProps) {
  // Build chart data
  const chartData = OCTAVE_BAND_FREQUENCIES.map(freq => {
    const required = requiredAttenuation[freq] || 0;
    const provided = silencerAttenuation[freq] || 0;
    const deficit = Math.max(0, required - provided);
    const surplus = Math.max(0, provided - required);
    
    return {
      frequency: freq,
      required,
      provided,
      deficit,
      surplus,
      isMet: provided >= required,
    };
  });

  // Calculate overall match score
  const totalRequired = Object.values(requiredAttenuation).reduce((sum, v) => sum + (v || 0), 0);
  const totalProvided = Object.values(silencerAttenuation).reduce((sum, v) => sum + (v || 0), 0);
  const matchPercent = totalRequired > 0 ? Math.round((Math.min(totalProvided, totalRequired) / totalRequired) * 100) : 100;
  
  const deficientBands = chartData.filter(d => !d.isMet);
  const isFullyMet = deficientBands.length === 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Required:</span>
            <span className="font-medium">{data.required.toFixed(1)} dB</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Provided:</span>
            <span className="font-medium">{data.provided.toFixed(1)} dB</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t">
            <span className="text-muted-foreground">Status:</span>
            <span className={data.isMet ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
              {data.isMet ? `+${data.surplus.toFixed(1)} dB` : `-${data.deficit.toFixed(1)} dB`}
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
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>Required vs. provided attenuation per band</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isFullyMet ? (
              <Badge className="gap-1 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                All Bands Met
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {deficientBands.length} Band{deficientBands.length > 1 ? 's' : ''} Deficient
              </Badge>
            )}
            <Badge variant="outline">{matchPercent}% Match</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="frequency"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'dB',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 11 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Required attenuation bars */}
              <Bar
                dataKey="required"
                name="Required"
                fill="hsl(var(--muted-foreground) / 0.3)"
                radius={[4, 4, 0, 0]}
              />

              {/* Provided attenuation bars with conditional coloring */}
              <Bar
                dataKey="provided"
                name="Provided"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMet ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deficient bands summary */}
        {deficientBands.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <h4 className="text-sm font-medium flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Deficient Frequency Bands
            </h4>
            <div className="flex flex-wrap gap-2">
              {deficientBands.map(band => (
                <Badge
                  key={band.frequency}
                  variant="outline"
                  className="bg-destructive/5 border-destructive/30 text-destructive"
                >
                  {band.frequency}: -{band.deficit.toFixed(1)} dB
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-muted-foreground/30" />
            <span className="text-muted-foreground">Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
            <span className="text-muted-foreground">Meets Requirement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Below Requirement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
