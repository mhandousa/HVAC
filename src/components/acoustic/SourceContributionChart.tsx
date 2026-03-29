import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SourceContribution {
  source: string;
  percentage: number;
  color: string;
  type?: string;
}

interface SourceContributionChartProps {
  contributions: SourceContribution[];
  title?: string;
  onSourceClick?: (source: string) => void;
  height?: number;
}

export const SourceContributionChart: React.FC<SourceContributionChartProps> = ({
  contributions,
  title = 'Noise Source Contributions',
  onSourceClick,
  height = 300,
}) => {
  const dominantSource = contributions.reduce((max, curr) => 
    curr.percentage > max.percentage ? curr : max, 
    contributions[0]
  );

  const chartData = contributions.map(c => ({
    name: c.source,
    value: c.percentage,
    color: c.color,
    type: c.type,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Contribution: <span className="font-medium text-foreground">{data.value.toFixed(1)}%</span>
          </p>
          {data.type && (
            <p className="text-xs text-muted-foreground mt-1">
              Type: {data.type}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {dominantSource && (
            <Badge variant="outline" className="font-normal">
              Dominant: {dominantSource.source}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              onClick={(data) => onSourceClick?.(data.name)}
              style={{ cursor: onSourceClick ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Source List */}
        <div className="mt-4 space-y-2">
          {contributions
            .sort((a, b) => b.percentage - a.percentage)
            .map((contribution, index) => (
              <div 
                key={contribution.source}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  onSourceClick ? 'hover:bg-muted/50 cursor-pointer' : ''
                }`}
                onClick={() => onSourceClick?.(contribution.source)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: contribution.color }}
                  />
                  <span className="text-sm font-medium">{contribution.source}</span>
                  {contribution.type && (
                    <span className="text-xs text-muted-foreground">
                      ({contribution.type})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${contribution.percentage}%`,
                        backgroundColor: contribution.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {contribution.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SourceContributionChart;
