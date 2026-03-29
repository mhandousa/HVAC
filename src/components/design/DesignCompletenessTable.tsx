import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { 
  Check, 
  X, 
  MoreHorizontal, 
  Plus, 
  Search,
  Building2,
  Layers,
  Thermometer,
  Wind,
  Box,
  Volume2,
  ArrowRight,
  Calculator,
  Package,
  GitBranch
} from 'lucide-react';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { cn } from '@/lib/utils';
import { ZoneAssignToSystemDialog } from './ZoneAssignToSystemDialog';

interface DesignCompletenessTableProps {
  zones: ZoneCompleteness[];
  projectId: string;
  activeFilter: string | null;
}

export function DesignCompletenessTable({ 
  zones, 
  projectId,
  activeFilter 
}: DesignCompletenessTableProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneCompleteness | null>(null);

  const filteredZones = useMemo(() => {
    let result = [...zones];

    // Apply filter based on activeFilter
    if (activeFilter === 'load_calc') {
      result = result.filter(z => !z.hasLoadCalculation);
    } else if (activeFilter === 'equipment') {
      result = result.filter(z => !z.hasEquipmentSelection);
    } else if (activeFilter === 'distribution') {
      result = result.filter(z => !z.hasDistributionSystem);
    } else if (activeFilter === 'ventilation') {
      result = result.filter(z => !z.hasVentilationCalc);
    } else if (activeFilter === 'erv') {
      result = result.filter(z => !z.hasERVSizing);
    } else if (activeFilter === 'acoustic') {
      result = result.filter(z => !z.hasAcousticAnalysis);
    } else if (activeFilter === 'complete') {
      result = result.filter(z => z.completenessScore === 100);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(z => 
        z.zoneName.toLowerCase().includes(query) ||
        z.floorName.toLowerCase().includes(query) ||
        z.buildingName.toLowerCase().includes(query)
      );
    }

    // Sort by building, floor, zone
    result.sort((a, b) => {
      if (a.buildingName !== b.buildingName) {
        return a.buildingName.localeCompare(b.buildingName);
      }
      if (a.floorName !== b.floorName) {
        return a.floorName.localeCompare(b.floorName);
      }
      return a.zoneName.localeCompare(b.zoneName);
    });

    return result;
  }, [zones, activeFilter, searchQuery]);

  const getProgressColor = (score: number) => {
    if (score === 100) return 'bg-emerald-500';
    if (score >= 67) return 'bg-amber-500';
    if (score >= 34) return 'bg-orange-500';
    return 'bg-destructive';
  };

  const StatusIcon = ({ complete }: { complete: boolean }) => (
    complete ? (
      <Check className="h-4 w-4 text-emerald-500" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground" />
    )
  );

  const handleAddLoadCalc = (zone: ZoneCompleteness) => {
    navigate(`/design/load-calculation?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddEquipment = (zone: ZoneCompleteness) => {
    navigate(`/design/equipment-selection?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAssignToSystem = (zone: ZoneCompleteness) => {
    setSelectedZone(zone);
    setAssignDialogOpen(true);
  };

  const handleAddVentilation = (zone: ZoneCompleteness) => {
    navigate(`/design/ventilation-calculator?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddERVSizing = (zone: ZoneCompleteness) => {
    navigate(`/design/erv-sizing?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddPsychrometric = (zone: ZoneCompleteness) => {
    navigate(`/design/psychrometric-chart?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddDiffusers = (zone: ZoneCompleteness) => {
    navigate(`/design/diffuser-selection?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddTerminalUnits = (zone: ZoneCompleteness) => {
    navigate(`/design/terminal-unit-sizing?project=${projectId}&zone=${zone.zoneId}`);
  };

  const handleAddAcoustic = (zone: ZoneCompleteness) => {
    navigate(`/acoustic/noise-path?project=${projectId}&zone=${zone.zoneId}`);
  };

  // Group zones by building for visual hierarchy
  const groupedByBuilding = useMemo(() => {
    const groups: Record<string, ZoneCompleteness[]> = {};
    filteredZones.forEach(zone => {
      if (!groups[zone.buildingId]) {
        groups[zone.buildingId] = [];
      }
      groups[zone.buildingId].push(zone);
    });
    return groups;
  }, [filteredZones]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredZones.length} of {zones.length} zones
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead className="text-center">Load Calc</TableHead>
              <TableHead className="text-center">Equipment</TableHead>
              <TableHead className="text-center">Distribution</TableHead>
              <TableHead className="text-center">Ventilation</TableHead>
              <TableHead className="text-center">ERV/HRV</TableHead>
              <TableHead className="text-center">Acoustic</TableHead>
              <TableHead className="text-center">Psychro</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Next Step</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  {zones.length === 0 
                    ? 'No zones found in this project' 
                    : 'No zones match the current filter'}
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone, index) => {
                const prevZone = index > 0 ? filteredZones[index - 1] : null;
                const showBuilding = !prevZone || prevZone.buildingId !== zone.buildingId;
                const showFloor = !prevZone || prevZone.floorId !== zone.floorId;

                return (
                  <TableRow key={zone.zoneId}>
                    <TableCell>
                      {showBuilding ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{zone.buildingName}</span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {showFloor ? (
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>{zone.floorName}</span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{zone.zoneName}</div>
                        {zone.areaSqm > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {zone.areaSqm.toLocaleString()} m²
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon complete={zone.hasLoadCalculation} />
                    </TableCell>
                    <TableCell className="text-center">
                      {zone.hasEquipmentSelection ? (
                        <div className="flex items-center justify-center gap-1">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center">
                                  {zone.hasTerminalUnitSelection ? (
                                    <span className="flex items-center">
                                      <Box className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-xs text-emerald-600 ml-0.5">
                                        {zone.terminalUnitTotalQuantity}
                                      </span>
                                    </span>
                                  ) : (
                                    <Box className="h-3.5 w-3.5 text-amber-400" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {zone.hasTerminalUnitSelection 
                                  ? `${zone.terminalUnitTotalQuantity} terminal unit(s): ${zone.terminalUnitTypes.join(', ')}`
                                  : 'No VAV/FCU units sized'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {zone.hasDistributionSystem ? (
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {zone.distributionSystemType?.toUpperCase()}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center">
                                  {zone.hasDiffuserSelection ? (
                                    <span className="flex items-center">
                                      <Wind className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-xs text-emerald-600 ml-0.5">
                                        {zone.diffuserTotalQuantity}
                                      </span>
                                    </span>
                                  ) : (
                                    <Wind className="h-3.5 w-3.5 text-amber-400" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {zone.hasDiffuserSelection 
                                  ? `${zone.diffuserTotalQuantity} terminal device(s) selected` 
                                  : 'No terminal devices selected'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon complete={zone.hasVentilationCalc} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon complete={zone.hasERVSizing} />
                    </TableCell>
                    <TableCell className="text-center">
                      {zone.hasAcousticAnalysis ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center">
                                {zone.acousticMeetsTarget === true ? (
                                  <Volume2 className="h-4 w-4 text-emerald-500" />
                                ) : zone.acousticMeetsTarget === false ? (
                                  <Volume2 className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {zone.acousticCalculationCount} calculation(s): {zone.acousticCalculationTypes.join(', ')}
                              {zone.acousticMeetsTarget === true && ' - All passing NC target'}
                              {zone.acousticMeetsTarget === false && ' - Some not meeting NC target'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {zone.hasPsychrometricAnalysis ? (
                        <Thermometer className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress 
                          value={zone.completenessScore} 
                          className="h-2 flex-1"
                          indicatorClassName={getProgressColor(zone.completenessScore)}
                        />
                        <span className="text-sm text-muted-foreground w-10">
                          {zone.completenessScore}%
                        </span>
                      </div>
                    </TableCell>
                    {/* Quick Action - Next Step */}
                    <TableCell>
                      {!zone.hasLoadCalculation ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAddLoadCalc(zone)}
                        >
                          <Calculator className="h-3 w-3" />
                          Load Calc
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : !zone.hasEquipmentSelection ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAddEquipment(zone)}
                        >
                          <Package className="h-3 w-3" />
                          Equipment
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : !zone.hasDistributionSystem ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAssignToSystem(zone)}
                        >
                          <GitBranch className="h-3 w-3" />
                          System
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : !zone.hasVentilationCalc ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAddVentilation(zone)}
                        >
                          <Wind className="h-3 w-3" />
                          Ventilation
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : zone.completenessScore === 100 ? (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!zone.hasLoadCalculation && (
                            <DropdownMenuItem onClick={() => handleAddLoadCalc(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Load Calculation
                            </DropdownMenuItem>
                          )}
                          {!zone.hasEquipmentSelection && (
                            <DropdownMenuItem onClick={() => handleAddEquipment(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Equipment Selection
                            </DropdownMenuItem>
                          )}
                          {!zone.hasDistributionSystem && (
                            <DropdownMenuItem onClick={() => handleAssignToSystem(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Assign to System
                            </DropdownMenuItem>
                          )}
                          {!zone.hasVentilationCalc && (
                            <DropdownMenuItem onClick={() => handleAddVentilation(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Ventilation Calc
                            </DropdownMenuItem>
                          )}
                          {!zone.hasERVSizing && (
                            <DropdownMenuItem onClick={() => handleAddERVSizing(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add ERV/HRV Sizing
                            </DropdownMenuItem>
                          )}
                          {zone.hasDistributionSystem && !zone.hasDiffuserSelection && (
                            <DropdownMenuItem onClick={() => handleAddDiffusers(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Diffusers/Grilles
                            </DropdownMenuItem>
                          )}
                          {zone.hasEquipmentSelection && !zone.hasTerminalUnitSelection && (
                            <DropdownMenuItem onClick={() => handleAddTerminalUnits(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Size VAV/FCU Units
                            </DropdownMenuItem>
                          )}
                          {!zone.hasPsychrometricAnalysis && (
                            <DropdownMenuItem onClick={() => handleAddPsychrometric(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Psychrometric Analysis
                            </DropdownMenuItem>
                          )}
                          {!zone.hasAcousticAnalysis && (
                            <DropdownMenuItem onClick={() => handleAddAcoustic(zone)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Acoustic Analysis
                            </DropdownMenuItem>
                          )}
                          {zone.completenessScore === 100 && (
                            <DropdownMenuItem disabled>
                              <Check className="mr-2 h-4 w-4" />
                              Design Complete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ZoneAssignToSystemDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        zone={selectedZone}
        projectId={projectId}
      />
    </div>
  );
}
