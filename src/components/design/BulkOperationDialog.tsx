import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Wind,
  Thermometer,
  Volume2,
  Box,
} from 'lucide-react';
import { BulkZoneSelector } from './BulkZoneSelector';
import { useZoneHierarchyBatch } from '@/hooks/useZoneHierarchy';

export type BulkOperationType = 
  | 'apply_load_defaults'
  | 'set_ventilation_rates'
  | 'assign_ahu_system'
  | 'set_terminal_type'
  | 'apply_acoustic_target';

interface BulkOperationConfig {
  type: BulkOperationType;
  label: string;
  description: string;
  icon: React.ElementType;
  fields: OperationField[];
}

interface OperationField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  placeholder?: string;
  unit?: string;
}

const OPERATION_CONFIGS: Record<BulkOperationType, BulkOperationConfig> = {
  apply_load_defaults: {
    type: 'apply_load_defaults',
    label: 'Apply Load Defaults',
    description: 'Set default envelope and internal load values for selected zones',
    icon: Thermometer,
    fields: [
      { key: 'wall_r_value', label: 'Wall R-Value', type: 'number', defaultValue: 13, unit: 'R' },
      { key: 'roof_r_value', label: 'Roof R-Value', type: 'number', defaultValue: 30, unit: 'R' },
      { key: 'lighting_wpf', label: 'Lighting Power Density', type: 'number', defaultValue: 1.0, unit: 'W/SF' },
      { key: 'equipment_wpf', label: 'Equipment Power Density', type: 'number', defaultValue: 1.5, unit: 'W/SF' },
    ],
  },
  set_ventilation_rates: {
    type: 'set_ventilation_rates',
    label: 'Set Ventilation Rates',
    description: 'Apply ASHRAE 62.1 ventilation rates based on space type',
    icon: Wind,
    fields: [
      { 
        key: 'space_type', 
        label: 'Space Type', 
        type: 'select',
        options: [
          { value: 'office', label: 'Office Space (5 CFM/person + 0.06 CFM/SF)' },
          { value: 'conference', label: 'Conference Room (5 CFM/person + 0.06 CFM/SF)' },
          { value: 'lobby', label: 'Lobby (5 CFM/person + 0.06 CFM/SF)' },
          { value: 'retail', label: 'Retail (7.5 CFM/person + 0.12 CFM/SF)' },
          { value: 'classroom', label: 'Classroom (10 CFM/person + 0.12 CFM/SF)' },
        ],
        defaultValue: 'office',
      },
      { key: 'occupant_density', label: 'Occupant Density', type: 'number', defaultValue: 150, unit: 'SF/person' },
    ],
  },
  assign_ahu_system: {
    type: 'assign_ahu_system',
    label: 'Assign to AHU System',
    description: 'Link selected zones to an AHU configuration',
    icon: Box,
    fields: [
      { 
        key: 'ahu_id', 
        label: 'AHU System', 
        type: 'select',
        options: [], // Will be populated dynamically
        placeholder: 'Select AHU system',
      },
    ],
  },
  set_terminal_type: {
    type: 'set_terminal_type',
    label: 'Set Terminal Unit Type',
    description: 'Create terminal unit selections for all selected zones',
    icon: Box,
    fields: [
      { 
        key: 'unit_type', 
        label: 'Terminal Unit Type', 
        type: 'select',
        options: [
          { value: 'vav_reheat', label: 'VAV with Reheat' },
          { value: 'vav_cooling', label: 'VAV Cooling Only' },
          { value: 'fcu_2pipe', label: 'FCU 2-Pipe' },
          { value: 'fcu_4pipe', label: 'FCU 4-Pipe' },
        ],
        defaultValue: 'vav_reheat',
      },
      { key: 'sizing_factor', label: 'Sizing Factor', type: 'number', defaultValue: 1.0 },
    ],
  },
  apply_acoustic_target: {
    type: 'apply_acoustic_target',
    label: 'Apply Acoustic Target',
    description: 'Set NC rating targets for selected zones',
    icon: Volume2,
    fields: [
      { 
        key: 'target_nc', 
        label: 'Target NC Rating', 
        type: 'select',
        options: [
          { value: '25', label: 'NC-25 (Concert Halls, Recording Studios)' },
          { value: '30', label: 'NC-30 (Private Offices, Hospitals)' },
          { value: '35', label: 'NC-35 (Open Offices, Libraries)' },
          { value: '40', label: 'NC-40 (General Offices, Corridors)' },
          { value: '45', label: 'NC-45 (Lobbies, Circulation Areas)' },
        ],
        defaultValue: '35',
      },
    ],
  },
};

interface BulkOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  operationType?: BulkOperationType;
  preSelectedZoneIds?: string[];
  onComplete?: (results: BulkOperationResult) => void;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

type OperationStep = 'select-zones' | 'configure' | 'executing' | 'complete';

export function BulkOperationDialog({
  open,
  onOpenChange,
  projectId,
  operationType: initialOperationType,
  preSelectedZoneIds = [],
  onComplete,
}: BulkOperationDialogProps) {
  const [step, setStep] = useState<OperationStep>('select-zones');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(preSelectedZoneIds);
  const [operationType, setOperationType] = useState<BulkOperationType>(initialOperationType || 'apply_load_defaults');
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkOperationResult | null>(null);

  const config = OPERATION_CONFIGS[operationType];

  // Get zone hierarchy for display
  const { data: zoneHierarchy } = useZoneHierarchyBatch(selectedZoneIds);

  // Initialize field values with defaults
  const initializeDefaults = () => {
    const defaults: Record<string, string | number> = {};
    config.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    });
    setFieldValues(defaults);
  };

  const handleOperationTypeChange = (type: BulkOperationType) => {
    setOperationType(type);
    const newConfig = OPERATION_CONFIGS[type];
    const defaults: Record<string, string | number> = {};
    newConfig.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    });
    setFieldValues(defaults);
  };

  const handleFieldChange = (key: string, value: string | number) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    if (step === 'select-zones') {
      initializeDefaults();
      setStep('configure');
    } else if (step === 'configure') {
      executeOperation();
    }
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select-zones');
    }
  };

  const executeOperation = async () => {
    setStep('executing');
    setProgress(0);

    // Simulate bulk operation execution
    const total = selectedZoneIds.length;
    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < total; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // In a real implementation, this would call the appropriate mutation
      // For now, we'll simulate a 95% success rate
      if (Math.random() > 0.05) {
        success++;
      } else {
        errors.push(`Failed to process zone ${i + 1}`);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    const operationResult: BulkOperationResult = {
      success,
      failed: total - success,
      errors,
    };

    setResult(operationResult);
    setStep('complete');
    onComplete?.(operationResult);
  };

  const handleClose = () => {
    setStep('select-zones');
    setSelectedZoneIds(preSelectedZoneIds);
    setFieldValues({});
    setProgress(0);
    setResult(null);
    onOpenChange(false);
  };

  const selectedZoneSummary = useMemo(() => {
    if (!zoneHierarchy) return null;
    
    const buildings = new Set(zoneHierarchy.map(z => z.building_name));
    const floors = new Set(zoneHierarchy.map(z => z.floor_name));
    
    return {
      zoneCount: selectedZoneIds.length,
      buildingCount: buildings.size,
      floorCount: floors.size,
    };
  }, [zoneHierarchy, selectedZoneIds]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            Bulk Operation: {config.label}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'select-zones' && (
            <div className="space-y-4">
              {/* Operation Type Selector */}
              <div className="space-y-2">
                <Label>Operation Type</Label>
                <Select value={operationType} onValueChange={(v) => handleOperationTypeChange(v as BulkOperationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OPERATION_CONFIGS).map(op => (
                      <SelectItem key={op.type} value={op.type}>
                        <div className="flex items-center gap-2">
                          <op.icon className="h-4 w-4" />
                          {op.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Selector */}
              <BulkZoneSelector
                projectId={projectId}
                selectedZoneIds={selectedZoneIds}
                onSelectionChange={setSelectedZoneIds}
                maxHeight="300px"
              />
            </div>
          )}

          {step === 'configure' && (
            <div className="space-y-6">
              {/* Selected Zones Summary */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  This operation will be applied to{' '}
                  <strong>{selectedZoneSummary?.zoneCount} zones</strong>
                  {selectedZoneSummary && selectedZoneSummary.buildingCount > 0 && (
                    <> across {selectedZoneSummary.buildingCount} building(s)</>
                  )}
                </AlertDescription>
              </Alert>

              {/* Operation Fields */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Configuration</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {config.fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select
                          value={String(fieldValues[field.key] || field.defaultValue || '')}
                          onValueChange={(v) => handleFieldChange(field.key, v)}
                        >
                          <SelectTrigger id={field.key}>
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={fieldValues[field.key] ?? field.defaultValue ?? ''}
                          onChange={(e) => handleFieldChange(field.key, 
                            field.type === 'number' ? Number(e.target.value) : e.target.value
                          )}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview of affected zones */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Affected Zones Preview</Label>
                <ScrollArea className="h-[120px] border rounded-md p-2">
                  <div className="flex flex-wrap gap-1">
                    {zoneHierarchy?.slice(0, 20).map(zone => (
                      <Badge key={zone.zone_id} variant="secondary" className="text-xs">
                        {zone.zone_name}
                      </Badge>
                    ))}
                    {selectedZoneIds.length > 20 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedZoneIds.length - 20} more
                      </Badge>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === 'executing' && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-medium">Applying {config.label}...</p>
                <p className="text-muted-foreground">
                  Processing {selectedZoneIds.length} zones
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-center text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            </div>
          )}

          {step === 'complete' && result && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                ) : (
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                )}
                <p className="text-lg font-medium">Operation Complete</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary">{result.success}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                {result.failed > 0 && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Errors</Label>
                  <ScrollArea className="h-[100px] border rounded-md p-2">
                    {result.errors.map((error, i) => (
                      <p key={i} className="text-sm text-destructive">{error}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'select-zones' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={selectedZoneIds.length === 0}>
                Next: Configure
              </Button>
            </>
          )}

          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                <Zap className="h-4 w-4 mr-2" />
                Apply to {selectedZoneIds.length} Zones
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
