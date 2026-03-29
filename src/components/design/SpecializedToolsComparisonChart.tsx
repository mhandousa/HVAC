import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSpecializedTools } from '@/hooks/useSpecializedToolsComparison';
import { SPECIALIZED_TOOL_COLORS } from '@/lib/design-completeness-utils';

interface SpecializedToolsComparisonChartProps {
  projects: ProjectSpecializedTools[];
  isLoading?: boolean;
}

export function SpecializedToolsComparisonChart({ projects, isLoading }: SpecializedToolsComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Specialized Tools by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Specialized Tools by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No project data available for chart visualization.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for stacked bar chart
  const chartData = projects.map(project => ({
    name: project.projectName.length > 20 
      ? project.projectName.substring(0, 20) + '...' 
      : project.projectName,
    fullName: project.projectName,
    'Hot Water Plant': project.hasHotWaterPlant ? 25 : 0,
    'Smoke Control': project.hasSmokeControl ? 25 : 0,
    'Thermal Comfort': project.hasThermalComfort ? 25 : 0,
    'SBC Compliance': project.hasSBCCompliance ? 25 : 0,
    total: project.specializedToolsScore,
  }));

  // Sort by total score descending
  chartData.sort((a, b) => b.total - a.total);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{data.fullName}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: SPECIALIZED_TOOL_COLORS.hwPlant }}>Hot Water Plant</span>
            <span>{data['Hot Water Plant'] > 0 ? '✓' : '✗'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: SPECIALIZED_TOOL_COLORS.smokeControl }}>Smoke Control</span>
            <span>{data['Smoke Control'] > 0 ? '✓' : '✗'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: SPECIALIZED_TOOL_COLORS.thermalComfort }}>Thermal Comfort</span>
            <span>{data['Thermal Comfort'] > 0 ? '✓' : '✗'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: SPECIALIZED_TOOL_COLORS.sbcCompliance }}>SBC Compliance</span>
            <span>{data['SBC Compliance'] > 0 ? '✓' : '✗'}</span>
          </div>
          <div className="pt-2 border-t mt-2 font-medium">
            Total Score: {data.total}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Specialized Tools by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(400, projects.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Bar 
              dataKey="Hot Water Plant" 
              stackId="a" 
              fill={SPECIALIZED_TOOL_COLORS.hwPlant}
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Smoke Control" 
              stackId="a" 
              fill={SPECIALIZED_TOOL_COLORS.smokeControl}
            />
            <Bar 
              dataKey="Thermal Comfort" 
              stackId="a" 
              fill={SPECIALIZED_TOOL_COLORS.thermalComfort}
            />
            <Bar 
              dataKey="SBC Compliance" 
              stackId="a" 
              fill={SPECIALIZED_TOOL_COLORS.sbcCompliance}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Score distribution chart
export function SpecializedToolsScoreDistribution({ projects, isLoading }: SpecializedToolsComparisonChartProps) {
  if (isLoading || projects.length === 0) return null;

  // Group projects by score
  const scoreGroups = [
    { range: '0%', count: projects.filter(p => p.specializedToolsScore === 0).length, color: 'hsl(var(--destructive))' },
    { range: '25%', count: projects.filter(p => p.specializedToolsScore === 25).length, color: 'hsl(25, 95%, 63%)' },
    { range: '50%', count: projects.filter(p => p.specializedToolsScore === 50).length, color: 'hsl(45, 93%, 47%)' },
    { range: '75%', count: projects.filter(p => p.specializedToolsScore === 75).length, color: 'hsl(142, 76%, 50%)' },
    { range: '100%', count: projects.filter(p => p.specializedToolsScore === 100).length, color: 'hsl(142, 76%, 36%)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={scoreGroups} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              label={{ value: 'Projects', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} project${value !== 1 ? 's' : ''}`, 'Count']}
              labelFormatter={(label) => `Score: ${label}`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {scoreGroups.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
