import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { DeficiencyStats, DeficiencyFilters } from '@/hooks/useDeficiencyDashboard';
import { DeficiencySeverity } from '@/lib/deficiency-types';
import { cn } from '@/lib/utils';

interface DeficiencyStatsCardsProps {
  stats: DeficiencyStats;
  filters: DeficiencyFilters;
  onFilterBySeverity: (severity: DeficiencySeverity | null) => void;
}

export function DeficiencyStatsCards({ stats, filters, onFilterBySeverity }: DeficiencyStatsCardsProps) {
  const cards = [
    {
      title: 'Total Deficiencies',
      value: stats.total,
      icon: AlertTriangle,
      color: 'text-foreground',
      bgColor: 'bg-muted',
      severity: null as DeficiencySeverity | null,
    },
    {
      title: 'Critical',
      value: stats.critical,
      icon: AlertOctagon,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      severity: 'critical' as DeficiencySeverity,
    },
    {
      title: 'Major',
      value: stats.major,
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      severity: 'major' as DeficiencySeverity,
    },
    {
      title: 'Minor',
      value: stats.minor,
      icon: AlertTriangle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      severity: 'minor' as DeficiencySeverity,
    },
  ];

  const isActive = (severity: DeficiencySeverity | null) => {
    if (severity === null) {
      return filters.severities.length === 0;
    }
    return filters.severities.length === 1 && filters.severities[0] === severity;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            isActive(card.severity) && 'ring-2 ring-primary'
          )}
          onClick={() => onFilterBySeverity(isActive(card.severity) ? null : card.severity)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn('p-2 rounded-lg', card.bgColor)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', card.color)}>{card.value}</div>
            {card.severity && (
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0
                  ? `${Math.round((card.value / stats.total) * 100)}% of total`
                  : 'No deficiencies'}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
