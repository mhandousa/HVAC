import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useTechnicianWorkload } from '@/hooks/useTechnicianWorkload';

interface WorkloadDistributionChartProps {
  onTechnicianClick?: (technicianName: string) => void;
}

export function WorkloadDistributionChart({ onTechnicianClick }: WorkloadDistributionChartProps) {
  const { getWorkloadDistribution } = useTechnicianWorkload();
  const data = getWorkloadDistribution();

  if (data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No assignment data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Workload Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar 
              dataKey="assigned" 
              name="Assigned" 
              stackId="a" 
              fill="hsl(var(--primary))"
              onClick={(data) => onTechnicianClick?.(data.name)}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="inProgress" 
              name="In Progress" 
              stackId="a" 
              fill="hsl(var(--chart-2))"
              onClick={(data) => onTechnicianClick?.(data.name)}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="overdue" 
              name="Overdue" 
              stackId="a" 
              fill="hsl(var(--destructive))"
              onClick={(data) => onTechnicianClick?.(data.name)}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="resolved" 
              name="Resolved" 
              stackId="a" 
              fill="hsl(var(--chart-4))"
              onClick={(data) => onTechnicianClick?.(data.name)}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
