import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, Calculator, Box, GitBranch, ExternalLink, Wind, Volume2 } from 'lucide-react';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { ZoneAssignToSystemDialog } from './ZoneAssignToSystemDialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TerminalUnitIcon, getTerminalUnitLabel } from './TerminalUnitIcons';

interface ZoneHeatMapPopoverProps {
  zone: ZoneCompleteness;
  projectId: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ZoneHeatMapPopover({
  zone,
  projectId,
  children,
  open,
  onOpenChange,
}: ZoneHeatMapPopoverProps) {
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-green-600 dark:text-green-400';
    if (score >= 67) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 33) return 'text-orange-600 dark:text-orange-400';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 100) return 'bg-green-500';
    if (score >= 67) return 'bg-yellow-500';
    if (score >= 33) return 'bg-orange-500';
    return 'bg-destructive';
  };

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h4 className="font-semibold text-base">{zone.zoneName}</h4>
              <p className="text-sm text-muted-foreground">
                {zone.buildingName} • {zone.floorName}
              </p>
            </div>

            {/* Zone info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Area:</span>
              <span className="font-medium">{zone.areaSqm} m²</span>
            </div>

            {/* Completeness score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completeness:</span>
                <span className={cn('font-bold', getScoreColor(zone.completenessScore))}>
                  {zone.completenessScore}%
                </span>
              </div>
              <Progress 
                value={zone.completenessScore} 
                className="h-2"
                indicatorClassName={getProgressColor(zone.completenessScore)}
              />
            </div>

            {/* Status items */}
            <div className="space-y-2 border-t pt-3">
              <div className="text-sm font-medium mb-2">Status:</div>
              
              {/* Load Calculation */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {zone.hasLoadCalculation ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span>Load Calculation</span>
                </div>
                {zone.hasLoadCalculation && zone.coolingLoadTons && (
                  <span className="text-muted-foreground">
                    {zone.coolingLoadTons.toFixed(1)} tons
                  </span>
                )}
              </div>

              {/* Equipment Selection */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {zone.hasEquipmentSelection ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span>Equipment Selection</span>
                </div>
              </div>

              {/* Distribution System */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {zone.hasDistributionSystem ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span>Distribution System</span>
                </div>
                {zone.hasDistributionSystem && zone.distributionSystemType && (
                  <span className="text-muted-foreground uppercase text-xs">
                    {zone.distributionSystemType}
                  </span>
                )}
              </div>

              {/* Terminal Units (VAV/FCU) */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {zone.hasTerminalUnitSelection ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span>Terminal Units (VAV/FCU)</span>
                </div>
                {zone.hasTerminalUnitSelection && zone.terminalUnitTotalQuantity > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {zone.terminalUnitTotalQuantity} unit{zone.terminalUnitTotalQuantity > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Terminal Unit Type Breakdown */}
              {zone.hasTerminalUnitSelection && zone.terminalUnitTypes && zone.terminalUnitTypes.length > 0 && (
                <div className="ml-10 flex flex-wrap gap-1">
                  {zone.terminalUnitTypes.map(type => (
                    <span 
                      key={type}
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-muted rounded"
                    >
                      <TerminalUnitIcon type={type} size={10} />
                      {getTerminalUnitLabel(type)}
                    </span>
                  ))}
                </div>
              )}

              {/* Acoustic Analysis */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {zone.hasAcousticAnalysis ? (
                    zone.acousticMeetsTarget === true ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : zone.acousticMeetsTarget === false ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : (
                      <Check className="h-4 w-4 text-amber-500" />
                    )
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span>Acoustic Analysis</span>
                </div>
                {zone.hasAcousticAnalysis && (
                  <span className={cn(
                    "text-xs",
                    zone.acousticMeetsTarget === true 
                      ? "text-emerald-500" 
                      : zone.acousticMeetsTarget === false 
                        ? "text-destructive" 
                        : "text-amber-500"
                  )}>
                    {zone.acousticMeetsTarget === true 
                      ? 'NC Compliant' 
                      : zone.acousticMeetsTarget === false 
                        ? 'NC Exceeded' 
                        : 'Pending'
                    }
                  </span>
                )}
              </div>

              {/* Acoustic Calculation Types */}
              {zone.hasAcousticAnalysis && zone.acousticCalculationTypes.length > 0 && (
                <div className="ml-10 flex flex-wrap gap-1">
                  {zone.acousticCalculationTypes.map(type => (
                    <span 
                      key={type}
                      className="text-[10px] px-1.5 py-0.5 bg-muted rounded capitalize"
                    >
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            {(zone.missingSteps.length > 0 || !zone.hasTerminalUnitSelection) && (
              <div className="space-y-2 border-t pt-3">
                <div className="text-sm font-medium">Quick Actions:</div>
                <div className="flex flex-wrap gap-2">
                  {!zone.hasLoadCalculation && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/load-calculation?zone=${zone.zoneId}`)}
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Add Load Calc
                    </Button>
                  )}
                  {!zone.hasEquipmentSelection && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/equipment-selection?zone=${zone.zoneId}`)}
                    >
                      <Box className="h-3 w-3 mr-1" />
                      Add Equipment
                    </Button>
                  )}
                  {!zone.hasDistributionSystem && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      Assign System
                    </Button>
                  )}
                  {!zone.hasTerminalUnitSelection && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/design/terminal-unit-sizing?zone=${zone.zoneId}&project=${projectId}`)}
                    >
                      <Wind className="h-3 w-3 mr-1" />
                      Size Terminal Units
                    </Button>
                  )}
                  {!zone.hasAcousticAnalysis && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/acoustic/noise-path?project=${projectId}&zone=${zone.zoneId}`)}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Add Acoustic
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* View details link */}
            <div className="border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate(`/zones/${zone.zoneId}`)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Zone Details
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ZoneAssignToSystemDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        projectId={projectId}
        zone={zone}
      />
    </>
  );
}
