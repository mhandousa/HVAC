import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ManufacturerSilencer, OctaveBandData } from '@/lib/manufacturer-silencer-catalog';

interface TreatmentOctaveBandChartProps {
  treatments: {
    name: string;
    insertionLoss: OctaveBandData;
    color: string;
  }[];
  requiredAttenuation?: number;
  height?: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(262 83% 58%)',
];

export function TreatmentOctaveBandChart({
  treatments,
  requiredAttenuation,
  height = 250,
}: TreatmentOctaveBandChartProps) {
  const frequencies = ['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'] as const;
  
  const data = frequencies.map(freq => {
    const dataPoint: { frequency: string; [key: string]: number | string } = { frequency: freq };
    treatments.forEach(t => {
      dataPoint[t.name] = t.insertionLoss[freq];
    });
    return dataPoint;
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="frequency" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ 
              value: 'dB', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value} dB`, name]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          
          {requiredAttenuation && (
            <ReferenceLine 
              y={requiredAttenuation} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5"
              label={{ 
                value: `Required: ${requiredAttenuation} dB`, 
                position: 'right',
                fill: 'hsl(var(--destructive))',
                fontSize: 11,
              }}
            />
          )}
          
          {treatments.map((t, index) => (
            <Bar
              key={t.name}
              dataKey={t.name}
              fill={t.color || CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Convert silencer data to chart format
 */
export function silencersToChartData(
  silencers: ManufacturerSilencer[],
  colors?: string[]
): { name: string; insertionLoss: OctaveBandData; color: string }[] {
  return silencers.slice(0, 4).map((s, i) => ({
    name: s.model,
    insertionLoss: s.insertionLoss.octaveBands,
    color: colors?.[i] || CHART_COLORS[i % CHART_COLORS.length],
  }));
}
