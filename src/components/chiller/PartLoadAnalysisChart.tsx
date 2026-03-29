import { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PartLoadCurve, ChillerType } from '@/lib/chiller-selection-calculations';
import { ASHRAE_90_1_MINIMUMS } from '@/lib/chiller-selection-calculations';

interface PartLoadAnalysisChartProps {
  partLoad: PartLoadCurve;
  chillerType: ChillerType;
  capacityTons: number;
  manufacturerName?: string;
  modelNumber?: string;
  alternatePartLoads?: { name: string; partLoad: PartLoadCurve }[];
}

export function PartLoadAnalysisChart({
  partLoad,
  chillerType,
  capacityTons,
  manufacturerName,
  modelNumber,
  alternatePartLoads = [],
}: PartLoadAnalysisChartProps) {
  const baseline = ASHRAE_90_1_MINIMUMS[chillerType];
  
  // Calculate baseline kW/ton at each point (from EER)
  // EER = 12 / kW/ton, so kW/ton = 12 / EER
  const baselineKwPerTon = 12 / baseline.eer;
  
  const chartData = useMemo(() => {
    const points = [
      { load: 25, loadLabel: '25%' },
      { load: 50, loadLabel: '50%' },
      { load: 75, loadLabel: '75%' },
      { load: 100, loadLabel: '100%' },
    ];
    
    return points.map(p => {
      const key = `pct${p.load}` as keyof PartLoadCurve;
      const result: Record<string, number | string> = {
        load: p.load,
        loadLabel: p.loadLabel,
        selected: partLoad[key],
        selectedKw: Math.round(capacityTons * (p.load / 100) * partLoad[key]),
        baseline: baselineKwPerTon,
      };
      
      alternatePartLoads.forEach((alt, idx) => {
        result[`alternate${idx}`] = alt.partLoad[key];
      });
      
      return result;
    });
  }, [partLoad, capacityTons, baselineKwPerTon, alternatePartLoads]);

  const iplvImprovement = useMemo(() => {
    // Calculate IPLV from part load curve
    const eerAt100 = 12 / partLoad.pct100;
    const eerAt75 = 12 / partLoad.pct75;
    const eerAt50 = 12 / partLoad.pct50;
    const eerAt25 = 12 / partLoad.pct25;
    const iplv = 1 / (0.01 / eerAt100 + 0.42 / eerAt75 + 0.45 / eerAt50 + 0.12 / eerAt25);
    return ((iplv / baseline.iplv - 1) * 100).toFixed(1);
  }, [partLoad, baseline.iplv]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Part Load Performance</CardTitle>
            <CardDescription>
              {manufacturerName && modelNumber 
                ? `${manufacturerName} ${modelNumber}` 
                : 'kW/ton at various load points'}
            </CardDescription>
          </div>
          <Badge 
            variant={Number(iplvImprovement) >= 0 ? 'default' : 'destructive'}
            className="ml-2"
          >
            {Number(iplvImprovement) >= 0 ? '+' : ''}{iplvImprovement}% vs ASHRAE 90.1
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="loadLabel" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'kW/ton', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
                domain={['auto', 'auto']}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    selected: 'Selected Chiller',
                    baseline: 'ASHRAE 90.1 Baseline',
                  };
                  alternatePartLoads.forEach((alt, idx) => {
                    labels[`alternate${idx}`] = alt.name;
                  });
                  return [`${value.toFixed(3)} kW/ton`, labels[name] || name];
                }}
              />
              <Legend />
              
              {/* ASHRAE 90.1 Baseline */}
              <ReferenceLine 
                y={baselineKwPerTon} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'ASHRAE Min', 
                  position: 'right',
                  fill: 'hsl(var(--destructive))',
                  fontSize: 10,
                }}
              />
              
              {/* Selected chiller line */}
              <Line
                type="monotone"
                dataKey="selected"
                name="Selected Chiller"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              
              {/* Alternate chillers */}
              {alternatePartLoads.map((alt, idx) => (
                <Line
                  key={alt.name}
                  type="monotone"
                  dataKey={`alternate${idx}`}
                  name={alt.name}
                  stroke={`hsl(${200 + idx * 40}, 70%, 50%)`}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Load point summary */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
          {chartData.map((point) => (
            <div key={point.load} className="rounded-md bg-muted/50 p-2">
              <div className="font-medium text-muted-foreground">{point.loadLabel} Load</div>
              <div className="text-lg font-bold">
                {(point.selected as number).toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">
                {point.selectedKw} kW
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
