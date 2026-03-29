import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Calculator, 
  Cpu, 
  GitBranch, 
  CheckCircle2,
  Wind,
  RefreshCcw,
  Box,
  Volume2,
  type LucideIcon
} from 'lucide-react';
import { ProjectCompleteness } from '@/hooks/useDesignCompleteness';
import { cn } from '@/lib/utils';
interface DesignCompletenessCardsProps {
  data: ProjectCompleteness;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function DesignCompletenessCards({ 
  data, 
  activeFilter, 
  onFilterChange 
}: DesignCompletenessCardsProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const cards: {
    id: string | null;
    label: string;
    value: string | number;
    subValue: number | null;
    percentage: number | null;
    icon: LucideIcon;
    color: string;
    secondaryValue?: string | null;
    secondaryIcon?: LucideIcon;
  }[] = [
    {
      id: null,
      label: 'Total Zones',
      value: data.totalZones,
      subValue: null,
      percentage: null,
      icon: MapPin,
      color: 'text-primary',
    },
    {
      id: 'load_calc',
      label: 'Load Calcs',
      value: `${data.zonesWithLoadCalc}/${data.totalZones}`,
      subValue: data.totalZones > 0 ? Math.round((data.zonesWithLoadCalc / data.totalZones) * 100) : 0,
      percentage: data.totalZones > 0 ? (data.zonesWithLoadCalc / data.totalZones) * 100 : 0,
      icon: Calculator,
      color: 'text-blue-500',
    },
    {
      id: 'equipment',
      label: 'Equipment',
      value: `${data.zonesWithEquipment}/${data.totalZones}`,
      subValue: data.totalZones > 0 ? Math.round((data.zonesWithEquipment / data.totalZones) * 100) : 0,
      percentage: data.totalZones > 0 ? (data.zonesWithEquipment / data.totalZones) * 100 : 0,
      icon: Cpu,
      color: 'text-green-500',
      secondaryValue: data.totalTerminalUnitCount > 0 
        ? `${data.totalTerminalUnitCount} VAV/FCU` 
        : null,
      secondaryIcon: Box,
    },
    {
      id: 'distribution',
      label: 'Distribution',
      value: `${data.zonesWithDistribution}/${data.totalZones}`,
      subValue: data.totalZones > 0 ? Math.round((data.zonesWithDistribution / data.totalZones) * 100) : 0,
      percentage: data.totalZones > 0 ? (data.zonesWithDistribution / data.totalZones) * 100 : 0,
      icon: GitBranch,
      color: 'text-purple-500',
      secondaryValue: data.totalDiffuserCount > 0 
        ? `${data.totalDiffuserCount} terminals` 
        : null,
    },
    {
      id: 'ventilation',
      label: 'Ventilation',
      value: `${data.zonesWithVentilation}/${data.totalZones}`,
      subValue: data.totalZones > 0 ? Math.round((data.zonesWithVentilation / data.totalZones) * 100) : 0,
      percentage: data.totalZones > 0 ? (data.zonesWithVentilation / data.totalZones) * 100 : 0,
      icon: Wind,
      color: 'text-cyan-500',
    },
    {
      id: 'erv',
      label: 'ERV/HRV',
      value: `${data.zonesWithERV}/${data.totalZones}`,
      subValue: data.totalZones > 0 ? Math.round((data.zonesWithERV / data.totalZones) * 100) : 0,
      percentage: data.totalZones > 0 ? (data.zonesWithERV / data.totalZones) * 100 : 0,
      icon: RefreshCcw,
      color: 'text-pink-500',
    },
    {
      id: 'acoustic',
      label: 'Acoustic',
      value: `${data.zonesPassingAcousticTarget}/${data.zonesWithAcousticAnalysis}`,
      subValue: data.zonesWithAcousticAnalysis > 0 
        ? Math.round((data.zonesPassingAcousticTarget / data.zonesWithAcousticAnalysis) * 100) 
        : 0,
      percentage: data.zonesWithAcousticAnalysis > 0 
        ? (data.zonesPassingAcousticTarget / data.zonesWithAcousticAnalysis) * 100 
        : 0,
      icon: Volume2,
      color: 'text-violet-500',
      secondaryValue: data.totalAcousticCalculations > 0 
        ? `${data.totalAcousticCalculations} calcs` 
        : null,
    },
    {
      id: 'complete',
      label: 'Complete',
      value: `${data.fullyCompleteZones}/${data.totalZones}`,
      subValue: data.overallCompleteness,
      percentage: data.overallCompleteness,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <Card 
            key={card.label}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isActive && "ring-2 ring-primary"
            )}
            onClick={() => onFilterChange(isActive ? null : card.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <Icon className={cn("h-4 w-4", card.color)} />
                {card.subValue !== null && (
                  <span className="text-xs text-muted-foreground">{card.subValue}%</span>
                )}
              </div>
              <div className="text-xl font-bold">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
              {card.secondaryValue && (
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  {card.secondaryIcon ? <card.secondaryIcon className="h-3 w-3" /> : <Wind className="h-3 w-3" />}
                  {card.secondaryValue}
                </div>
              )}
              {card.percentage !== null && (
                <Progress 
                  value={card.percentage} 
                  className="h-1 mt-2"
                  indicatorClassName={getProgressColor(card.percentage)}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
