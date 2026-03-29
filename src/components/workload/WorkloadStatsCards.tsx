import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkloadStats } from '@/hooks/useTechnicianWorkload';
import { Users, Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkloadStatsCardsProps {
  stats: WorkloadStats;
  balanceScore?: number;
}

export function WorkloadStatsCards({ stats, balanceScore }: WorkloadStatsCardsProps) {
  const getBalanceInfo = () => {
    if (balanceScore === undefined) return null;
    if (balanceScore >= 90) return { color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Excellent' };
    if (balanceScore >= 70) return { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Good' };
    if (balanceScore >= 50) return { color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Needs Attention' };
    return { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Critical' };
  };

  const balanceInfo = getBalanceInfo();

  const cards = [
    {
      title: 'Total Assigned',
      value: stats.totalAssignments,
      description: `${stats.totalActive} active`,
      icon: Users,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Avg Resolution Time',
      value: `${stats.avgResolutionDays.toFixed(1)}`,
      description: 'days',
      icon: Clock,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Overdue Items',
      value: stats.totalOverdue,
      description: stats.totalOverdue > 0 ? 'Need attention' : 'All on track',
      icon: AlertTriangle,
      iconColor: stats.totalOverdue > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: stats.totalOverdue > 0 ? 'bg-destructive/10' : 'bg-muted',
    },
    {
      title: 'Team Resolution Rate',
      value: `${stats.avgOnTimeRate.toFixed(0)}%`,
      description: 'on-time completion',
      icon: stats.avgOnTimeRate >= 80 ? TrendingUp : TrendingDown,
      iconColor: stats.avgOnTimeRate >= 80 ? 'text-green-500' : 'text-warning',
      bgColor: stats.avgOnTimeRate >= 80 ? 'bg-green-500/10' : 'bg-warning/10',
    },
  ];

  // Add balance score card if available
  if (balanceScore !== undefined && balanceInfo) {
    cards.push({
      title: 'Balance Score',
      value: `${balanceScore}%`,
      description: balanceInfo.label,
      icon: Scale,
      iconColor: balanceInfo.color,
      bgColor: balanceInfo.bgColor,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn('rounded-lg p-2', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
