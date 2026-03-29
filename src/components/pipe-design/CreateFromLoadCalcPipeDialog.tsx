import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjects } from '@/hooks/useProjects';
import { useLoadCalculationsWithZones, LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { Loader2, Droplets, Building2 } from 'lucide-react';

import { PipeNodeType } from './PipeEquipmentIcons';

export interface PipeSegmentData {
  id: string;
  name: string;
  flowGPM: number;
  lengthFt: number;
  parentId: string | null;
  nodeType: PipeNodeType;
  material: string;
  nominalSize: number | null;
  zoneId?: string | null;
}

interface CreateFromLoadCalcPipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSystem: (config: {
    systemName: string;
    segments: PipeSegmentData[];
    loadCalculationId: string | null;
    systemType: string;
    fluidTempF: number;
  }) => void;
  defaultProjectId?: string | null;
}

export function CreateFromLoadCalcPipeDialog({
  open,
  onOpenChange,
  onCreateSystem,
  defaultProjectId,
}: CreateFromLoadCalcPipeDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(defaultProjectId || null);
  const [selectedCalcs, setSelectedCalcs] = useState<Set<string>>(new Set());
  const [defaultLength, setDefaultLength] = useState(50);
  const [deltaT, setDeltaT] = useState(10);
  const [pipeMaterial, setPipeMaterial] = useState('steel');
  const [createMainHeader, setCreateMainHeader] = useState(true);
  const [systemType, setSystemType] = useState('chilled_water');

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: loadCalcs, isLoading: calcsLoading } = useLoadCalculationsWithZones(selectedProjectId || undefined);

  // Calculate GPM from cooling load: GPM = BTU/h / (500 × ΔT)
  const calculateGPM = (btuh: number | null): number => {
    if (!btuh || deltaT <= 0) return 0;
    return btuh / (500 * deltaT);
  };

  const calcsWithGPM = useMemo(() => {
    return (loadCalcs || []).map(calc => ({
      ...calc,
      calculatedGPM: calculateGPM(calc.cooling_load_btuh),
    }));
  }, [loadCalcs, deltaT]);

  const selectedCalcsData = useMemo(() => {
    return calcsWithGPM.filter(c => selectedCalcs.has(c.id));
  }, [calcsWithGPM, selectedCalcs]);

  const totalGPM = useMemo(() => {
    return selectedCalcsData.reduce((sum, c) => sum + c.calculatedGPM, 0);
  }, [selectedCalcsData]);

  const handleToggleCalc = (calcId: string) => {
    setSelectedCalcs(prev => {
      const next = new Set(prev);
      if (next.has(calcId)) {
        next.delete(calcId);
      } else {
        next.add(calcId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedCalcs.size === calcsWithGPM.length) {
      setSelectedCalcs(new Set());
    } else {
      setSelectedCalcs(new Set(calcsWithGPM.map(c => c.id)));
    }
  };

  const getFluidTemp = (type: string): number => {
    switch (type) {
      case 'chilled_water': return 45;
      case 'hot_water': return 180;
      case 'condenser_water': return 85;
      default: return 60;
    }
  };

  const handleCreate = () => {
    if (selectedCalcsData.length === 0) return;

    const segments: PipeSegmentData[] = [];
    let mainHeaderId: string | null = null;

    // Create main header if enabled
    if (createMainHeader) {
      mainHeaderId = crypto.randomUUID();
      segments.push({
        id: mainHeaderId,
        name: 'Main Supply Header',
        flowGPM: totalGPM,
        lengthFt: defaultLength * 2,
        parentId: null,
        nodeType: 'pipe',
        material: pipeMaterial,
        nominalSize: null,
        zoneId: null,
      });
    }

    // Create zone branch segments
    selectedCalcsData.forEach(calc => {
      const segmentName = calc.zone_name 
        ? `${calc.zone_name}${calc.floor_name ? ` (${calc.floor_name})` : ''}`
        : calc.calculation_name;

      segments.push({
        id: crypto.randomUUID(),
        name: segmentName,
        flowGPM: calc.calculatedGPM,
        lengthFt: defaultLength,
        parentId: mainHeaderId,
        nodeType: 'pipe',
        material: pipeMaterial,
        nominalSize: null,
        zoneId: calc.zone_id,
      });
    });

    const projectName = projects?.find(p => p.id === selectedProjectId)?.name || 'Project';
    const systemName = `${projectName} - ${systemType === 'chilled_water' ? 'CHW' : systemType === 'hot_water' ? 'HW' : 'CW'} System`;

    onCreateSystem({
      systemName,
      segments,
      loadCalculationId: selectedCalcsData[0]?.id || null,
      systemType,
      fluidTempF: getFluidTemp(systemType),
    });

    // Reset state
    setSelectedCalcs(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Create Pipe System from Load Calculations
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={selectedProjectId || ''}
              onValueChange={(value) => {
                setSelectedProjectId(value || null);
                setSelectedCalcs(new Set());
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Load Calculations List */}
          {selectedProjectId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Load Calculations</Label>
                {calcsWithGPM.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedCalcs.size === calcsWithGPM.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[200px] border rounded-md">
                {calcsLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading calculations...</p>
                  </div>
                ) : calcsWithGPM.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No load calculations found for this project.</p>
                    <p className="text-xs mt-1">Create load calculations first to use this feature.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {calcsWithGPM.map(calc => (
                      <div
                        key={calc.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedCalcs.has(calc.id) 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleToggleCalc(calc.id)}
                      >
                        <Checkbox
                          checked={selectedCalcs.has(calc.id)}
                          onCheckedChange={() => handleToggleCalc(calc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {calc.zone_name || calc.calculation_name}
                          </p>
                          {calc.floor_name && (
                            <p className="text-xs text-muted-foreground">
                              {calc.building_name} • {calc.floor_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{calc.calculatedGPM.toFixed(1)} GPM</p>
                          <p className="text-xs text-muted-foreground">
                            {calc.cooling_load_tons?.toFixed(1) || '—'} TR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Design Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>System Type</Label>
              <Select value={systemType} onValueChange={setSystemType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chilled_water">Chilled Water</SelectItem>
                  <SelectItem value="hot_water">Hot Water</SelectItem>
                  <SelectItem value="condenser_water">Condenser Water</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delta T (°F)</Label>
              <Input
                type="number"
                value={deltaT}
                onChange={(e) => setDeltaT(Number(e.target.value) || 10)}
                min={1}
                max={40}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Length (ft)</Label>
              <Input
                type="number"
                value={defaultLength}
                onChange={(e) => setDefaultLength(Number(e.target.value) || 50)}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Pipe Material</Label>
              <Select value={pipeMaterial} onValueChange={setPipeMaterial}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steel">Steel Schedule 40</SelectItem>
                  <SelectItem value="copper">Copper Type L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="createMainHeader"
              checked={createMainHeader}
              onCheckedChange={(checked) => setCreateMainHeader(checked === true)}
            />
            <Label htmlFor="createMainHeader" className="cursor-pointer">
              Create main supply header segment
            </Label>
          </div>

          {/* Preview */}
          {selectedCalcs.size > 0 && (
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm font-medium">
                Preview: {selectedCalcs.size + (createMainHeader ? 1 : 0)} segments
              </p>
              <p className="text-sm text-muted-foreground">
                Total Flow: {totalGPM.toFixed(1)} GPM • 
                Formula: GPM = BTU/h ÷ (500 × {deltaT}°F ΔT)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedCalcs.size === 0}
          >
            <Droplets className="h-4 w-4 mr-1" />
            Create System
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
