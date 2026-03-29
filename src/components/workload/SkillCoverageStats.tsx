import { Card, CardContent } from '@/components/ui/card';
import { SkillsMatrixStats } from '@/hooks/useSkillsMatrix';
import { Layers, Percent, AlertTriangle, Award, Users } from 'lucide-react';

interface SkillCoverageStatsProps {
  stats: SkillsMatrixStats;
}

export function SkillCoverageStats({ stats }: SkillCoverageStatsProps) {
  const cards = [
    {
      title: 'Total Skills',
      value: stats.totalSkills,
      subtitle: 'tracked skills',
      icon: Layers,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Avg Coverage',
      value: `${Math.round(stats.avgCoverage)}%`,
      subtitle: 'per skill',
      icon: Percent,
      color: stats.avgCoverage >= 60 ? 'text-emerald-600' : stats.avgCoverage >= 40 ? 'text-amber-600' : 'text-destructive',
      bgColor: stats.avgCoverage >= 60 ? 'bg-emerald-100 dark:bg-emerald-900/30' : stats.avgCoverage >= 40 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-destructive/10',
    },
    {
      title: 'Skill Gaps',
      value: stats.criticalGaps,
      subtitle: 'critical (<30%)',
      icon: AlertTriangle,
      color: stats.criticalGaps > 0 ? 'text-destructive' : 'text-emerald-600',
      bgColor: stats.criticalGaps > 0 ? 'bg-destructive/10' : 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Certifications',
      value: stats.totalCertifications,
      subtitle: 'active',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Team Coverage',
      value: `${stats.techniciansWithSkills}/${stats.totalTechnicians}`,
      subtitle: 'with skills',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
