import { Card, CardContent } from '@/components/ui/card';
import { Flame, Wind, Thermometer, ShieldCheck, FolderKanban, CheckCircle2 } from 'lucide-react';
import { SpecializedToolsComparisonSummary } from '@/hooks/useSpecializedToolsComparison';
import { SPECIALIZED_TOOL_COLORS } from '@/lib/design-completeness-utils';

interface SpecializedToolsComparisonStatsProps {
  summary: SpecializedToolsComparisonSummary;
  isLoading?: boolean;
}

export function SpecializedToolsComparisonStats({ summary, isLoading }: SpecializedToolsComparisonStatsProps) {
  const stats = [
    {
      label: 'Projects Compared',
      value: summary.totalProjects,
      subValue: `${summary.averageScore}% avg score`,
      icon: FolderKanban,
      color: 'hsl(var(--primary))',
    },
    {
      label: 'Hot Water Plant',
      value: `${summary.projectsWithHotWaterPlant}/${summary.totalProjects}`,
      subValue: `${summary.totalProjects > 0 ? Math.round((summary.projectsWithHotWaterPlant / summary.totalProjects) * 100) : 0}%`,
      icon: Flame,
      color: SPECIALIZED_TOOL_COLORS.hwPlant,
    },
    {
      label: 'Smoke Control',
      value: `${summary.projectsWithSmokeControl}/${summary.totalProjects}`,
      subValue: `${summary.totalProjects > 0 ? Math.round((summary.projectsWithSmokeControl / summary.totalProjects) * 100) : 0}%`,
      icon: Wind,
      color: SPECIALIZED_TOOL_COLORS.smokeControl,
    },
    {
      label: 'Thermal Comfort',
      value: `${summary.projectsWithThermalComfort}/${summary.totalProjects}`,
      subValue: `${summary.totalProjects > 0 ? Math.round((summary.projectsWithThermalComfort / summary.totalProjects) * 100) : 0}%`,
      icon: Thermometer,
      color: SPECIALIZED_TOOL_COLORS.thermalComfort,
    },
    {
      label: 'SBC Compliance',
      value: `${summary.projectsWithSBCCompliance}/${summary.totalProjects}`,
      subValue: `${summary.totalProjects > 0 ? Math.round((summary.projectsWithSBCCompliance / summary.totalProjects) * 100) : 0}%`,
      icon: ShieldCheck,
      color: SPECIALIZED_TOOL_COLORS.sbcCompliance,
    },
    {
      label: 'Fully Complete',
      value: summary.fullyCompleteProjects,
      subValue: `${summary.totalProjects > 0 ? Math.round((summary.fullyCompleteProjects / summary.totalProjects) * 100) : 0}% of projects`,
      icon: CheckCircle2,
      color: 'hsl(142, 76%, 40%)',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.subValue}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
