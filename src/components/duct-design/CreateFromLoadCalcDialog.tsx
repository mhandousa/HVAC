import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, Wind, Building, Layers } from 'lucide-react';
import { useLoadCalculationsWithZones, LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { useProjects } from '@/hooks/useProjects';
import { SegmentData } from '@/components/duct-design/SegmentPropertiesPanel';

interface CreateFromLoadCalcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSystem: (config: {
    systemName: string;
    segments: SegmentData[];
    loadCalculationId: string | null;
  }) => void;
  defaultProjectId?: string | null;
}

export function CreateFromLoadCalcDialog({
  open,
  onOpenChange,
  onCreateSystem,
  defaultProjectId,
}: CreateFromLoadCalcDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    defaultProjectId || undefined
  );
  const [selectedCalcIds, setSelectedCalcIds] = useState<Set<string>>(new Set());
  const [systemName, setSystemName] = useState('');
  const [defaultLength, setDefaultLength] = useState(20);
  const [defaultShape, setDefaultShape] = useState<'round' | 'rectangular'>('rectangular');
  const [createMainTrunk, setCreateMainTrunk] = useState(true);

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: calculations, isLoading: calcsLoading } = useLoadCalculationsWithZones(
    selectedProjectId
  );

  // Filter calculations with CFM data
  const validCalculations = useMemo(() => 
    calculations?.filter(c => c.cfm_required && c.cfm_required > 0) || [],
    [calculations]
  );

  // Calculate totals
  const selectedCalcs = useMemo(() => 
    validCalculations.filter(c => selectedCalcIds.has(c.id)),
    [validCalculations, selectedCalcIds]
  );

  const totalCfm = useMemo(() => 
    selectedCalcs.reduce((sum, c) => sum + (c.cfm_required || 0), 0),
    [selectedCalcs]
  );

  const totalTons = useMemo(() => 
    selectedCalcs.reduce((sum, c) => sum + (c.cooling_load_tons || 0), 0),
    [selectedCalcs]
  );

  const handleToggleCalc = (calcId: string) => {
    setSelectedCalcIds(prev => {
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
    if (selectedCalcIds.size === validCalculations.length) {
      setSelectedCalcIds(new Set());
    } else {
      setSelectedCalcIds(new Set(validCalculations.map(c => c.id)));
    }
  };

  const handleCreate = () => {
    if (selectedCalcs.length === 0) return;

    const segments: SegmentData[] = [];
    let mainTrunkId: string | null = null;

    // Create main trunk if enabled
    if (createMainTrunk) {
      mainTrunkId = crypto.randomUUID();
      segments.push({
        id: mainTrunkId,
        name: 'Main Supply Trunk',
        cfm: totalCfm,
        lengthFt: defaultLength * 2, // Main trunk is typically longer
        shape: defaultShape,
        widthIn: defaultShape === 'rectangular' ? 24 : undefined,
        heightIn: defaultShape === 'rectangular' ? 16 : undefined,
        diameterIn: defaultShape === 'round' ? 18 : undefined,
        material: 'galvanized_steel',
        hasDamper: false,
        fittings: [],
        parentId: null,
      });
    }

    // Create branch segments for each selected calculation
    selectedCalcs.forEach((calc, index) => {
      const segmentName = calc.zone_name 
        ? `${calc.zone_name}${calc.floor_name ? ` (${calc.floor_name})` : ''}`
        : calc.calculation_name;

      segments.push({
        id: crypto.randomUUID(),
        name: segmentName,
        cfm: calc.cfm_required || 0,
        lengthFt: defaultLength,
        shape: defaultShape,
        widthIn: defaultShape === 'rectangular' ? 16 : undefined,
        heightIn: defaultShape === 'rectangular' ? 10 : undefined,
        diameterIn: defaultShape === 'round' ? 12 : undefined,
        material: 'galvanized_steel',
        hasDamper: false,
        fittings: [],
        parentId: mainTrunkId,
        zoneId: calc.zone_id || undefined,
      });
    });

    const finalSystemName = systemName.trim() || 
      `${selectedCalcs[0]?.building_name || 'New'} Supply System`;

    onCreateSystem({
      systemName: finalSystemName,
      segments,
      loadCalculationId: selectedCalcs[0]?.id || null,
    });

    // Reset state
    setSelectedCalcIds(new Set());
    setSystemName('');
    onOpenChange(false);
  };

  const isLoading = projectsLoading || calcsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Create Duct System from Load Calculations
          </DialogTitle>
          <DialogDescription>
            Select load calculations to auto-generate duct segments with CFM values
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={(value) => {
                setSelectedProjectId(value);
                setSelectedCalcIds(new Set());
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Load Calculations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Load Calculations</Label>
              {validCalculations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedCalcIds.size === validCalculations.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            <ScrollArea className="h-[240px] border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-full p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !selectedProjectId ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <Building className="h-8 w-8 mb-2" />
                  <p>Select a project to view load calculations</p>
                </div>
              ) : validCalculations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <Calculator className="h-8 w-8 mb-2" />
                  <p>No load calculations with CFM data found</p>
                  <p className="text-xs mt-1">Create load calculations first</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {validCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCalcIds.has(calc.id) 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted border border-transparent'
                      }`}
                      onClick={() => handleToggleCalc(calc.id)}
                    >
                      <Checkbox
                        checked={selectedCalcIds.has(calc.id)}
                        onCheckedChange={() => handleToggleCalc(calc.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {calc.zone_name || calc.calculation_name}
                          </span>
                          {calc.zone_name && (
                            <Badge variant="outline" className="text-xs">
                              {calc.floor_name}
                            </Badge>
                          )}
                        </div>
                        {calc.building_name && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {calc.building_name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium text-primary">
                          {calc.cfm_required?.toLocaleString()} CFM
                        </div>
                        {calc.cooling_load_tons && (
                          <div className="text-xs text-muted-foreground">
                            {calc.cooling_load_tons.toFixed(1)} TR
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Settings */}
          {selectedCalcs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder={`${selectedCalcs[0]?.building_name || 'New'} Supply System`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLength">Default Length (ft)</Label>
                <Input
                  id="defaultLength"
                  type="number"
                  value={defaultLength}
                  onChange={(e) => setDefaultLength(Number(e.target.value))}
                  min={1}
                  max={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Duct Shape</Label>
                <Select value={defaultShape} onValueChange={(v) => setDefaultShape(v as 'round' | 'rectangular')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="rectangular">Rectangular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="invisible">Options</Label>
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    id="createMainTrunk"
                    checked={createMainTrunk}
                    onCheckedChange={(checked) => setCreateMainTrunk(checked as boolean)}
                  />
                  <Label htmlFor="createMainTrunk" className="font-normal cursor-pointer">
                    Create main trunk segment
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex-1 flex items-center gap-4 text-sm">
            {selectedCalcs.length > 0 && (
              <>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span>{selectedCalcs.length + (createMainTrunk ? 1 : 0)} segments</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-primary">
                  <Wind className="h-4 w-4" />
                  <span>{totalCfm.toLocaleString()} CFM</span>
                </div>
                {totalTons > 0 && (
                  <span className="text-muted-foreground">
                    {totalTons.toFixed(1)} TR
                  </span>
                )}
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={selectedCalcs.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Create System
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
