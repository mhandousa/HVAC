import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Check, Circle, Flame, Wind, Thermometer, ShieldCheck, Snowflake, Zap,
  Fan, Droplets, Layers, ListOrdered, Filter, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SpecializedToolsBadgesProps {
  // Original 6 tools
  hasChilledWaterPlant: boolean;
  hasHotWaterPlant: boolean;
  hasSmokeControl: boolean;
  hasThermalComfort: boolean;
  hasSBCCompliance: boolean;
  hasASHRAE90_1Compliance: boolean;
  // 8 additional tools
  hasAHUConfiguration?: boolean;
  hasFanSelections?: boolean;
  hasPumpSelections?: boolean;
  hasInsulationCalculations?: boolean;
  hasSequenceOfOperations?: boolean;
  hasCoilSelections?: boolean;
  hasFilterSelections?: boolean;
  hasCoolingTowerSelections?: boolean;
  // Phase 18: 5 new tools
  hasEconomizerSelections?: boolean;
  hasControlValveSelections?: boolean;
  hasExpansionTankSelections?: boolean;
  hasSilencerSelections?: boolean;
  hasVibrationIsolationSelections?: boolean;
  compact?: boolean;
}

interface ToolDefinition {
  key: string;
  label: string;
  fullLabel: string;
  icon: LucideIcon;
}

const tools: ToolDefinition[] = [
  // Original 6
  { key: 'chwPlant', label: 'CHW', fullLabel: 'Chilled Water Plant', icon: Snowflake },
  { key: 'hwPlant', label: 'HW', fullLabel: 'Hot Water Plant', icon: Flame },
  { key: 'smoke', label: 'Smoke', fullLabel: 'Smoke Control', icon: Wind },
  { key: 'thermal', label: 'Thermal', fullLabel: 'Thermal Comfort', icon: Thermometer },
  { key: 'sbc', label: 'SBC', fullLabel: 'SBC Compliance', icon: ShieldCheck },
  { key: 'ashrae', label: '90.1', fullLabel: 'ASHRAE 90.1 Compliance', icon: Zap },
  // 8 additional tools
  { key: 'ahu', label: 'AHU', fullLabel: 'AHU Configuration', icon: Fan },
  { key: 'fans', label: 'Fans', fullLabel: 'Fan Selections', icon: Fan },
  { key: 'pumps', label: 'Pumps', fullLabel: 'Pump Selections', icon: Droplets },
  { key: 'insulation', label: 'Insul', fullLabel: 'Insulation Calculations', icon: Layers },
  { key: 'sequence', label: 'SOO', fullLabel: 'Sequence of Operations', icon: ListOrdered },
  { key: 'coils', label: 'Coils', fullLabel: 'Coil Selections', icon: Layers },
  { key: 'filters', label: 'Filters', fullLabel: 'Filter Selections', icon: Filter },
  { key: 'towers', label: 'CT', fullLabel: 'Cooling Tower Selections', icon: Droplets },
  // Phase 18: 5 new tools
  { key: 'economizer', label: 'Econ', fullLabel: 'Economizer Selection', icon: Wind },
  { key: 'controlValve', label: 'CV', fullLabel: 'Control Valve Selection', icon: Gauge },
  { key: 'expansionTank', label: 'ET', fullLabel: 'Expansion Tank Selection', icon: Droplets },
  { key: 'silencer', label: 'Sil', fullLabel: 'Silencer Selection', icon: Wind },
  { key: 'vibrationIsolation', label: 'VI', fullLabel: 'Vibration Isolation', icon: Layers },
];

export function SpecializedToolsBadges({
  hasChilledWaterPlant,
  hasHotWaterPlant,
  hasSmokeControl,
  hasThermalComfort,
  hasSBCCompliance,
  hasASHRAE90_1Compliance,
  hasAHUConfiguration = false,
  hasFanSelections = false,
  hasPumpSelections = false,
  hasInsulationCalculations = false,
  hasSequenceOfOperations = false,
  hasCoilSelections = false,
  hasFilterSelections = false,
  hasCoolingTowerSelections = false,
  hasEconomizerSelections = false,
  hasControlValveSelections = false,
  hasExpansionTankSelections = false,
  hasSilencerSelections = false,
  hasVibrationIsolationSelections = false,
  compact = false,
}: SpecializedToolsBadgesProps) {
  const completionStatus = [
    // Original 6
    hasChilledWaterPlant, hasHotWaterPlant, hasSmokeControl, hasThermalComfort, 
    hasSBCCompliance, hasASHRAE90_1Compliance,
    // 8 additional tools
    hasAHUConfiguration, hasFanSelections, hasPumpSelections,
    hasInsulationCalculations, hasSequenceOfOperations,
    hasCoilSelections, hasFilterSelections, hasCoolingTowerSelections,
    // Phase 18: 5 new tools
    hasEconomizerSelections, hasControlValveSelections,
    hasExpansionTankSelections, hasSilencerSelections,
    hasVibrationIsolationSelections,
  ];

  const completedCount = completionStatus.filter(Boolean).length;
  const totalCount = completionStatus.length;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {tools.map((tool, index) => {
            const completed = completionStatus[index];
            const Icon = tool.icon;
            return (
              <Tooltip key={tool.key}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                      completed
                        ? 'bg-success/20 text-success'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tool.fullLabel}: {completed ? 'Complete' : 'Not started'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <span className="text-xs text-muted-foreground ml-1 self-center">
            {completedCount}/{totalCount}
          </span>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool, index) => {
          const completed = completionStatus[index];
          const Icon = tool.icon;
          return (
            <Tooltip key={tool.key}>
              <TooltipTrigger asChild>
                <span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs cursor-default transition-colors',
                      completed
                        ? 'bg-success/10 text-success border-success/30'
                        : 'bg-muted/30 text-muted-foreground border-dashed opacity-60'
                    )}
                  >
                    {completed ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Circle className="w-3 h-3 mr-1" />
                    )}
                    {tool.label}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.fullLabel}: {completed ? 'Complete' : 'Not started'}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
