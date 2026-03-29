import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { VRFIndoorUnit, VRFBranchSelector } from '@/hooks/useVRFSystems';

interface AddVRFIndoorUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (unit: Partial<VRFIndoorUnit>) => void;
  existingUnit?: VRFIndoorUnit | null;
  branchSelectors: VRFBranchSelector[];
  systemType: 'heat_pump' | 'heat_recovery';
  unitCount: number;
}

const UNIT_TYPES = [
  { value: 'wall_mounted', label: 'Wall Mounted' },
  { value: 'ceiling_cassette', label: 'Ceiling Cassette' },
  { value: 'ducted', label: 'Ducted' },
  { value: 'floor_standing', label: 'Floor Standing' },
  { value: 'ceiling_suspended', label: 'Ceiling Suspended' },
  { value: 'console', label: 'Console' },
];

const CONNECTION_TYPES = [
  { value: 'direct', label: 'Direct to Outdoor Unit' },
  { value: 'branch', label: 'Via Branch Selector' },
  { value: 'sub-branch', label: 'Sub-Branch' },
];

export function AddVRFIndoorUnitDialog({
  open,
  onOpenChange,
  onSave,
  existingUnit,
  branchSelectors,
  systemType,
  unitCount,
}: AddVRFIndoorUnitDialogProps) {
  const [formData, setFormData] = useState<Partial<VRFIndoorUnit>>({
    unit_tag: '',
    unit_type: 'ceiling_cassette',
    zone_name: '',
    cooling_capacity_kw: 0,
    heating_capacity_kw: 0,
    liquid_line_length_ft: 0,
    suction_line_length_ft: 0,
    elevation_from_outdoor_ft: 0,
    is_above_outdoor: true,
    connection_type: 'direct',
    branch_selector_id: null,
    liquid_line_equiv_length_ft: 0,
    suction_line_equiv_length_ft: 0,
    model_number: '',
  });
  
  useEffect(() => {
    if (existingUnit) {
      setFormData(existingUnit);
    } else {
      setFormData({
        unit_tag: `IDU-${String(unitCount + 1).padStart(2, '0')}`,
        unit_type: 'ceiling_cassette',
        zone_name: '',
        cooling_capacity_kw: 7.1,
        heating_capacity_kw: 8.0,
        liquid_line_length_ft: 30,
        suction_line_length_ft: 30,
        elevation_from_outdoor_ft: 0,
        is_above_outdoor: true,
        connection_type: 'direct',
        branch_selector_id: null,
        liquid_line_equiv_length_ft: 5,
        suction_line_equiv_length_ft: 5,
        model_number: '',
      });
    }
  }, [existingUnit, unitCount, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate BTU
    const cooling_capacity_btu = (formData.cooling_capacity_kw || 0) * 3412.14;
    
    onSave({
      ...formData,
      cooling_capacity_btu,
      sort_order: existingUnit?.sort_order || unitCount,
    });
  };
  
  const updateField = <K extends keyof VRFIndoorUnit>(field: K, value: VRFIndoorUnit[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingUnit ? 'Edit Indoor Unit' : 'Add Indoor Unit'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identification */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit_tag">Unit Tag *</Label>
              <Input
                id="unit_tag"
                value={formData.unit_tag || ''}
                onChange={(e) => updateField('unit_tag', e.target.value)}
                placeholder="e.g., IDU-01"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit_type">Unit Type *</Label>
              <Select
                value={formData.unit_type || 'ceiling_cassette'}
                onValueChange={(value) => updateField('unit_type', value as VRFIndoorUnit['unit_type'])}
              >
                <SelectTrigger id="unit_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zone_name">Zone / Area Name</Label>
              <Input
                id="zone_name"
                value={formData.zone_name || ''}
                onChange={(e) => updateField('zone_name', e.target.value)}
                placeholder="e.g., Conference Room 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                value={formData.model_number || ''}
                onChange={(e) => updateField('model_number', e.target.value)}
                placeholder="e.g., FXAQ32PAVE"
              />
            </div>
          </div>
          
          {/* Capacity */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cooling_capacity_kw">Cooling Capacity (kW) *</Label>
              <Input
                id="cooling_capacity_kw"
                type="number"
                step="0.1"
                min="0"
                value={formData.cooling_capacity_kw || ''}
                onChange={(e) => updateField('cooling_capacity_kw', parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {((formData.cooling_capacity_kw || 0) * 3412.14).toFixed(0)} BTU/hr
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="heating_capacity_kw">Heating Capacity (kW)</Label>
              <Input
                id="heating_capacity_kw"
                type="number"
                step="0.1"
                min="0"
                value={formData.heating_capacity_kw || ''}
                onChange={(e) => updateField('heating_capacity_kw', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          {/* Piping */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="liquid_line_length_ft">Liquid Line Length (ft) *</Label>
              <Input
                id="liquid_line_length_ft"
                type="number"
                step="1"
                min="0"
                value={formData.liquid_line_length_ft || ''}
                onChange={(e) => updateField('liquid_line_length_ft', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suction_line_length_ft">Suction Line Length (ft)</Label>
              <Input
                id="suction_line_length_ft"
                type="number"
                step="1"
                min="0"
                value={formData.suction_line_length_ft || formData.liquid_line_length_ft || ''}
                onChange={(e) => updateField('suction_line_length_ft', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Usually same as liquid line</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="liquid_line_equiv_length_ft">Liquid Line Equiv. Length (ft)</Label>
              <Input
                id="liquid_line_equiv_length_ft"
                type="number"
                step="1"
                min="0"
                value={formData.liquid_line_equiv_length_ft || ''}
                onChange={(e) => updateField('liquid_line_equiv_length_ft', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">From fittings (elbows, tees, etc.)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suction_line_equiv_length_ft">Suction Line Equiv. Length (ft)</Label>
              <Input
                id="suction_line_equiv_length_ft"
                type="number"
                step="1"
                min="0"
                value={formData.suction_line_equiv_length_ft || ''}
                onChange={(e) => updateField('suction_line_equiv_length_ft', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          {/* Elevation */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="elevation_from_outdoor_ft">Elevation Difference (ft)</Label>
              <Input
                id="elevation_from_outdoor_ft"
                type="number"
                step="1"
                min="0"
                value={Math.abs(formData.elevation_from_outdoor_ft || 0)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  updateField('elevation_from_outdoor_ft', formData.is_above_outdoor ? val : -val);
                }}
              />
            </div>
            
            <div className="flex items-center space-x-4 pt-6">
              <Switch
                id="is_above_outdoor"
                checked={formData.is_above_outdoor ?? true}
                onCheckedChange={(checked) => {
                  updateField('is_above_outdoor', checked);
                  const absElev = Math.abs(formData.elevation_from_outdoor_ft || 0);
                  updateField('elevation_from_outdoor_ft', checked ? absElev : -absElev);
                }}
              />
              <Label htmlFor="is_above_outdoor">
                {formData.is_above_outdoor ? 'Above outdoor unit' : 'Below outdoor unit'}
              </Label>
            </div>
          </div>
          
          {/* Connection Type */}
          {systemType === 'heat_recovery' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="connection_type">Connection Type</Label>
                <Select
                  value={formData.connection_type || 'direct'}
                  onValueChange={(value) => updateField('connection_type', value as VRFIndoorUnit['connection_type'])}
                >
                  <SelectTrigger id="connection_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.connection_type === 'branch' && branchSelectors.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="branch_selector_id">Branch Selector</Label>
                  <Select
                    value={formData.branch_selector_id || ''}
                    onValueChange={(value) => updateField('branch_selector_id', value || null)}
                  >
                    <SelectTrigger id="branch_selector_id">
                      <SelectValue placeholder="Select branch selector" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchSelectors.map((bs) => (
                        <SelectItem key={bs.id} value={bs.id}>
                          {bs.selector_tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {existingUnit ? 'Update' : 'Add'} Unit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
