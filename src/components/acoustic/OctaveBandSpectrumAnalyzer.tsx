import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  OctaveBandSource, 
  analyzeSpectrum, 
  SOURCE_TYPE_COLORS,
} from '@/lib/octave-band-analysis';
import { NC_REFERENCE_CURVES, OctaveBandData } from '@/lib/nc-reference-curves';

interface OctaveBandSpectrumAnalyzerProps {
  sources: OctaveBandSource[];
  targetNC: number;
  zoneName?: string;
  height?: number;
  showSourceBreakdown?: boolean;
  onExport?: () => void;
}

const FREQUENCY_LABELS = ['63 Hz', '125 Hz', '250 Hz', '500 Hz', '1 kHz', '2 kHz', '4 kHz', '8 kHz'];
const FREQ_KEYS: (keyof OctaveBandData)[] = ['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'];

export const OctaveBandSpectrumAnalyzer: React.FC<OctaveBandSpectrumAnalyzerProps> = ({
  sources,
  targetNC,
  zoneName = 'Zone',
  height = 400,
  showSourceBreakdown = true,
  onExport,
}) => {
  const [stackedView, setStackedView] = useState(true);

  const analysis = useMemo(() => analyzeSpectrum(sources, targetNC), [sources, targetNC]);

  const chartData = useMemo(() => {
    return FREQUENCY_LABELS.map((label, index) => {
      const freqKey = FREQ_KEYS[index];
      const dataPoint: Record<string, number | string> = {
        frequency: label,
        combined: analysis.combined[freqKey] || 0,
        ncCurve: NC_REFERENCE_CURVES[targetNC]?.[freqKey] || 0,
      };

      sources.forEach(source => {
        dataPoint[source.name] = source.levels[freqKey] || 0;
      });

      [25, 35, 45].forEach(nc => {
        if (nc !== targetNC && NC_REFERENCE_CURVES[nc]) {
          dataPoint[`NC-${nc}`] = NC_REFERENCE_CURVES[nc][freqKey] || 0;
        }
      });

      return dataPoint;
    });
  }, [sources, analysis, targetNC]);

  const sourceColors = useMemo(() => {
    const colors: Record<string, string> = {};
    sources.forEach(source => {
      colors[source.name] = SOURCE_TYPE_COLORS[source.type] || 'hsl(var(--muted))';
    });
    return colors;
  }, [sources]);

  const getStatusColor = () => {
    if (analysis.isCompliant) return 'text-green-600 dark:text-green-400';
    if (analysis.complianceMargin >= -3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getStatusIcon = () => {
    if (analysis.isCompliant) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <AlertTriangle className="h-5 w-5 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-medium">Octave Band Spectrum Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">{zoneName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="stacked-view" checked={stackedView} onCheckedChange={setStackedView} />
            <Label htmlFor="stacked-view" className="text-sm">Stacked</Label>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                {analysis.isCompliant ? 'Meets Target' : 'Exceeds Target'}
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated NC-{analysis.calculatedNC} vs Target NC-{targetNC}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{analysis.calculatedNC}</p>
            <p className="text-xs text-muted-foreground">NC Rating</p>
          </div>
        </div>

        {analysis.exceedingBands.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-destructive mb-2">Exceedance at frequencies:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.exceedingBands.map(band => (
                <Badge key={band.band} variant="destructive">
                  {band.band}: +{band.excess.toFixed(1)} dB
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="frequency" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 80]} tick={{ fontSize: 12 }} label={{ value: 'Sound Level (dB)', angle: -90, position: 'insideLeft' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            <Legend />

            {showSourceBreakdown && sources.map((source, index) => (
              <Bar
                key={source.name}
                dataKey={source.name}
                stackId={stackedView ? 'sources' : undefined}
                fill={sourceColors[source.name]}
                radius={index === sources.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}

            {!showSourceBreakdown && <Bar dataKey="combined" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />}

            <Line type="monotone" dataKey="ncCurve" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={false} name={`NC-${targetNC} (Target)`} />
          </ComposedChart>
        </ResponsiveContainer>

        {showSourceBreakdown && sources.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Noise Source Contributions:</p>
            <div className="flex flex-wrap gap-4">
              {sources.map(source => (
                <div key={source.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sourceColors[source.name] }} />
                  <span className="text-sm">{source.name}</span>
                  <span className="text-xs text-muted-foreground">({source.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OctaveBandSpectrumAnalyzer;
