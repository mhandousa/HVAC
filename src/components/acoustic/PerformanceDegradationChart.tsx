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
import { LifecycleCostResult } from '@/lib/acoustic-lifecycle-costs';

interface PerformanceDegradationChartProps {
  results: LifecycleCostResult[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export function PerformanceDegradationChart({ results }: PerformanceDegradationChartProps) {
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    
    const maxYears = Math.max(...results.map(r => r.analysisYears));
    const data: Record<string, number | string>[] = [];
    
    // Year 0 - all at 100%
    const year0: Record<string, number | string> = { year: 0 };
    results.forEach(result => {
      year0[result.treatmentId] = 100;
    });
    data.push(year0);
    
    // Subsequent years
    for (let year = 1; year <= maxYears; year++) {
      const yearData: Record<string, number | string> = { year };
      results.forEach(result => {
        const breakdown = result.yearlyBreakdown.find(b => b.year === year);
        if (breakdown) {
          yearData[result.treatmentId] = breakdown.performance;
        }
      });
      data.push(yearData);
    }
    
    return data;
  }, [results]);

  // Get the minimum acceptable performance threshold
  const minThresholds = useMemo(() => {
    return results.map(r => 100 - r.characteristics.maxDegradationPercent);
  }, [results]);

  const lowestThreshold = Math.min(...minThresholds);

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          Add treatments to view performance degradation
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Performance Degradation</CardTitle>
        <CardDescription>
          Acoustic effectiveness over time (resets after replacement)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              domain={[Math.max(0, lowestThreshold - 10), 100]}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Effectiveness', angle: -90, position: 'insideLeft' }}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const treatmentName = results.find(r => r.treatmentId === name)?.treatmentName || name;
                return [`${value.toFixed(1)}%`, treatmentName];
              }}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              formatter={(value) => {
                const result = results.find(r => r.treatmentId === value);
                return result?.treatmentName || value;
              }}
            />
            
            {/* Minimum acceptable performance line */}
            <ReferenceLine
              y={lowestThreshold}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              label={{ 
                value: 'Replacement Threshold', 
                position: 'right',
                fill: 'hsl(var(--destructive))',
                fontSize: 11,
              }}
            />
            
            {results.map((result, index) => (
              <Line
                key={result.treatmentId}
                type="monotone"
                dataKey={result.treatmentId}
                name={result.treatmentId}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {results.map((result, index) => (
            <div key={result.treatmentId} className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium truncate">{result.treatmentName}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-5">
                Avg: {result.avgPerformance.toFixed(1)}% | Final: {result.finalPerformance.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
