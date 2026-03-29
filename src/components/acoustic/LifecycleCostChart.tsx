import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LifecycleCostResult, formatCurrencySAR } from '@/lib/acoustic-lifecycle-costs';

interface LifecycleCostChartProps {
  results: LifecycleCostResult[];
  showNPV?: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export function LifecycleCostChart({ results, showNPV = false }: LifecycleCostChartProps) {
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    
    const maxYears = Math.max(...results.map(r => r.analysisYears));
    const data: Record<string, number | string>[] = [];
    
    // Add year 0 with initial costs
    const year0: Record<string, number | string> = { year: 0 };
    results.forEach(result => {
      year0[result.treatmentId] = result.totalInitialCost;
      year0[`${result.treatmentId}_npv`] = result.totalInitialCost;
    });
    data.push(year0);
    
    // Add subsequent years
    for (let year = 1; year <= maxYears; year++) {
      const yearData: Record<string, number | string> = { year };
      results.forEach(result => {
        const breakdown = result.yearlyBreakdown.find(b => b.year === year);
        if (breakdown) {
          yearData[result.treatmentId] = breakdown.cumulative;
          yearData[`${result.treatmentId}_npv`] = breakdown.cumulativeNPV;
        }
      });
      data.push(yearData);
    }
    
    return data;
  }, [results]);

  // Collect all replacement years for reference lines
  const replacementEvents = useMemo(() => {
    const events: { year: number; treatmentId: string; treatmentName: string }[] = [];
    results.forEach(result => {
      result.replacementYears.forEach(year => {
        events.push({ year, treatmentId: result.treatmentId, treatmentName: result.treatmentName });
      });
    });
    return events;
  }, [results]);

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          Add treatments to compare lifecycle costs
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cumulative Cost Over Time</CardTitle>
        <CardDescription>
          {showNPV ? 'Net Present Value (discounted)' : 'Nominal costs'} including maintenance, inspections, and replacements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              label={{ value: 'SAR', angle: -90, position: 'insideLeft' }}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const treatmentName = results.find(r => 
                  r.treatmentId === name || r.treatmentId === name.replace('_npv', '')
                )?.treatmentName || name;
                return [formatCurrencySAR(value), treatmentName];
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
                const result = results.find(r => r.treatmentId === value || r.treatmentId === value.replace('_npv', ''));
                return result?.treatmentName || value;
              }}
            />
            
            {/* Replacement event markers */}
            {replacementEvents.map((event, idx) => (
              <ReferenceLine
                key={`${event.treatmentId}-${event.year}-${idx}`}
                x={event.year}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            ))}
            
            {results.map((result, index) => (
              <Area
                key={result.treatmentId}
                type="monotone"
                dataKey={showNPV ? `${result.treatmentId}_npv` : result.treatmentId}
                name={result.treatmentId}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        
        {replacementEvents.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Replacements:</span>
            {replacementEvents.map((event, idx) => (
              <span key={idx} className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                {event.treatmentName} @ Year {event.year}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
