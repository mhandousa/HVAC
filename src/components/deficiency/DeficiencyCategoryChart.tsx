import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { DeficiencyStats } from '@/hooks/useDeficiencyDashboard';

interface DeficiencyCategoryChartProps {
  stats: DeficiencyStats;
}

export function DeficiencyCategoryChart({ stats }: DeficiencyCategoryChartProps) {
  const data = stats.byCategory.slice(0, 5);

  if (data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Deficiencies by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No deficiencies to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Deficiencies by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="category"
                width={120}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
