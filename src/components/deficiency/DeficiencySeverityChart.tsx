import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DeficiencyStats } from '@/hooks/useDeficiencyDashboard';

interface DeficiencySeverityChartProps {
  stats: DeficiencyStats;
}

const COLORS = {
  critical: 'hsl(var(--destructive))',
  major: 'hsl(var(--warning))',
  minor: 'hsl(var(--primary))',
};

export function DeficiencySeverityChart({ stats }: DeficiencySeverityChartProps) {
  const data = [
    { name: 'Critical', value: stats.critical, color: COLORS.critical },
    { name: 'Major', value: stats.major, color: COLORS.major },
    { name: 'Minor', value: stats.minor, color: COLORS.minor },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Severity Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No deficiencies to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Severity Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
