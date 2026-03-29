import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, MapPin } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useLoadCalculationsWithZones, type LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import type { VRFIndoorUnit } from '@/hooks/useVRFSystems';

type UnitType = 'ceiling_cassette' | 'ceiling_suspended' | 'console' | 'ducted' | 'floor_standing' | 'wall_mounted';

interface ImportFromLoadCalcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  existingUnitCount: number;
  projectId?: string | null;
  onImport: (units: Partial<VRFIndoorUnit>[]) => void;
}

const UNIT_TYPES = [
  { value: 'ceiling_cassette', label: 'Ceiling Cassette' },
  { value: 'ducted', label: 'Ducted' },
  { value: 'wall_mounted', label: 'Wall Mounted' },
  { value: 'ceiling_suspended', label: 'Ceiling Suspended' },
  { value: 'floor_standing', label: 'Floor Standing' },
  { value: 'console', label: 'Console' },
];

export function ImportFromLoadCalcDialog({
  open,
  onOpenChange,
  systemId,
  existingUnitCount,
  projectId: initialProjectId,
  onImport,
}: ImportFromLoadCalcDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedCalcIds, setSelectedCalcIds] = useState<Set<string>>(new Set());
  const [unitType, setUnitType] = useState<UnitType>('ceiling_cassette');
  const [defaultPipingLength, setDefaultPipingLength] = useState(30);
  const [defaultElevation, setDefaultElevation] = useState(0);
  const [autoGenerateTags, setAutoGenerateTags] = useState(true);

  const { data: projects = [] } = useProjects();
  const { data: loadCalculations = [], isLoading } = useLoadCalculationsWithZones(selectedProjectId || undefined);

  // Filter calculations that have cooling load data
  const validCalculations = useMemo(() => {
    return loadCalculations.filter(calc => 
      calc.cooling_load_tons !== null && calc.cooling_load_tons > 0
    );
  }, [loadCalculations]);

  const selectedCalcs = useMemo(() => {
    return validCalculations.filter(calc => selectedCalcIds.has(calc.id));
  }, [validCalculations, selectedCalcIds]);

  const totalCapacityTons = useMemo(() => {
    return selectedCalcs.reduce((sum, calc) => sum + (calc.cooling_load_tons || 0), 0);
  }, [selectedCalcs]);

  const totalCapacityKw = totalCapacityTons * 3.517;

  const handleSelectAll = () => {
    setSelectedCalcIds(new Set(validCalculations.map(c => c.id)));
  };

  const handleClearAll = () => {
    setSelectedCalcIds(new Set());
  };

  const toggleCalc = (calcId: string) => {
    const newSet = new Set(selectedCalcIds);
    if (newSet.has(calcId)) {
      newSet.delete(calcId);
    } else {
      newSet.add(calcId);
    }
    setSelectedCalcIds(newSet);
  };

  const handleImport = () => {
    const unitsToCreate: Partial<VRFIndoorUnit>[] = selectedCalcs.map((calc, index) => {
      const coolingCapacityKw = (calc.cooling_load_tons || 0) * 3.517;
      const heatingCapacityKw = coolingCapacityKw * 1.1; // 10% higher for heat pump
      const unitTag = autoGenerateTags 
        ? `IDU-${String(existingUnitCount + index + 1).padStart(2, '0')}`
        : '';

      return {
        vrf_system_id: systemId,
        unit_tag: unitTag,
        unit_type: unitType,
        zone_name: calc.zone_name || calc.calculation_name,
        zone_id: calc.zone_id || undefined,
        cooling_capacity_kw: coolingCapacityKw,
        cooling_capacity_btu: calc.cooling_load_btuh || 0,
        heating_capacity_kw: heatingCapacityKw,
        liquid_line_length_ft: defaultPipingLength,
        suction_line_length_ft: defaultPipingLength,
        elevation_from_outdoor_ft: Math.abs(defaultElevation),
        is_above_outdoor: defaultElevation >= 0,
        connection_type: 'direct' as const,
        liquid_line_equiv_length_ft: 5,
        suction_line_equiv_length_ft: 5,
        sort_order: existingUnitCount + index,
      };
    });

    onImport(unitsToCreate);
    onOpenChange(false);
    
    // Reset state
    setSelectedCalcIds(new Set());
  };

  const getLocationString = (calc: LoadCalculationWithZone) => {
    const parts = [calc.building_name, calc.floor_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' > ') : 'No location';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Import Indoor Units from Load Calculations
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Load Calculations List */}
          {selectedProjectId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Load Calculations</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-48 border rounded-md">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading...
                  </div>
                ) : validCalculations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                    No load calculations with cooling data found for this project
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {validCalculations.map(calc => (
                      <div
                        key={calc.id}
                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedCalcIds.has(calc.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleCalc(calc.id)}
                      >
                        <Checkbox 
                          checked={selectedCalcIds.has(calc.id)}
                          onCheckedChange={() => toggleCalc(calc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {calc.zone_name || calc.calculation_name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {getLocationString(calc)}
                          </div>
                          <div className="flex items-center gap-4 text-sm mt-1">
                            <Badge variant="secondary">
                              {calc.cooling_load_tons?.toFixed(1)} Tons
                            </Badge>
                            <span className="text-muted-foreground">
                              {((calc.cooling_load_tons || 0) * 3.517).toFixed(1)} kW
                            </span>
                            {calc.cfm_required && (
                              <span className="text-muted-foreground">
                                {calc.cfm_required.toLocaleString()} CFM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Import Settings */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit Type</Label>
                  <Select value={unitType} onValueChange={(value) => setUnitType(value as UnitType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Piping (ft)</Label>
                  <Input
                    type="number"
                    value={defaultPipingLength}
                    onChange={(e) => setDefaultPipingLength(Number(e.target.value))}
                    min={1}
                    max={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation (ft)</Label>
                  <Input
                    type="number"
                    value={defaultElevation}
                    onChange={(e) => setDefaultElevation(Number(e.target.value))}
                    min={-100}
                    max={100}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoTags"
                  checked={autoGenerateTags}
                  onCheckedChange={(checked) => setAutoGenerateTags(!!checked)}
                />
                <Label htmlFor="autoTags" className="cursor-pointer">
                  Auto-generate unit tags (IDU-01, IDU-02, ...)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedCalcs.length > 0 && (
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <span className="font-medium">{selectedCalcs.length} units</span>
              <span className="text-muted-foreground"> • </span>
              <span>{totalCapacityTons.toFixed(1)} Tons</span>
              <span className="text-muted-foreground"> ({totalCapacityKw.toFixed(1)} kW) total</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={selectedCalcs.length === 0}
          >
            Import {selectedCalcs.length} Units
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
