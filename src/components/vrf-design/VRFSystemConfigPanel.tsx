import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Snowflake, Settings2 } from 'lucide-react';
import type { VRFSystem } from '@/hooks/useVRFSystems';

interface VRFSystemConfigPanelProps {
  system: Partial<VRFSystem>;
  onChange: (updates: Partial<VRFSystem>) => void;
  readOnly?: boolean;
}

const REFRIGERANT_OPTIONS = [
  { value: 'R410A', label: 'R-410A' },
  { value: 'R32', label: 'R-32' },
];

const SYSTEM_TYPE_OPTIONS = [
  { value: 'heat_pump', label: 'Heat Pump (2-Pipe)' },
  { value: 'heat_recovery', label: 'Heat Recovery (3-Pipe)' },
];

const MANUFACTURERS = [
  'Daikin',
  'Mitsubishi Electric',
  'LG',
  'Samsung',
  'Carrier',
  'Trane',
  'Fujitsu',
  'Panasonic',
  'Haier',
  'Midea',
];

export function VRFSystemConfigPanel({ system, onChange, readOnly }: VRFSystemConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* System Identification */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="system_name">System Name *</Label>
            <Input
              id="system_name"
              value={system.system_name || ''}
              onChange={(e) => onChange({ system_name: e.target.value })}
              placeholder="e.g., Office Building VRF-1"
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system_tag">System Tag</Label>
            <Input
              id="system_tag"
              value={system.system_tag || ''}
              onChange={(e) => onChange({ system_tag: e.target.value })}
              placeholder="e.g., VRF-01"
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refrigerant_type">Refrigerant Type</Label>
            <Select
              value={system.refrigerant_type || 'R410A'}
              onValueChange={(value) => onChange({ refrigerant_type: value })}
              disabled={readOnly}
            >
              <SelectTrigger id="refrigerant_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRIGERANT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system_type">System Type</Label>
            <Select
              value={system.system_type || 'heat_pump'}
              onValueChange={(value) => onChange({ system_type: value as 'heat_pump' | 'heat_recovery' })}
              disabled={readOnly}
            >
              <SelectTrigger id="system_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Outdoor Unit Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Snowflake className="h-5 w-5" />
            Outdoor Unit
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Select
              value={system.outdoor_unit_manufacturer || ''}
              onValueChange={(value) => onChange({ outdoor_unit_manufacturer: value })}
              disabled={readOnly}
            >
              <SelectTrigger id="manufacturer">
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {MANUFACTURERS.map((mfg) => (
                  <SelectItem key={mfg} value={mfg}>
                    {mfg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outdoor_model">Model Number</Label>
            <Input
              id="outdoor_model"
              value={system.outdoor_unit_model || ''}
              onChange={(e) => onChange({ outdoor_unit_model: e.target.value })}
              placeholder="e.g., RXYQ20TAVJU"
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="num_outdoor">Number of Units</Label>
            <Input
              id="num_outdoor"
              type="number"
              min={1}
              max={4}
              value={system.number_of_outdoor_units || 1}
              onChange={(e) => onChange({ number_of_outdoor_units: parseInt(e.target.value) || 1 })}
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outdoor_capacity_kw">Capacity (kW)</Label>
            <Input
              id="outdoor_capacity_kw"
              type="number"
              step="0.1"
              value={system.outdoor_unit_capacity_kw || ''}
              onChange={(e) => {
                const kw = parseFloat(e.target.value) || 0;
                onChange({
                  outdoor_unit_capacity_kw: kw,
                  outdoor_unit_capacity_tons: kw / 3.517,
                });
              }}
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outdoor_capacity_tons">Capacity (Tons)</Label>
            <Input
              id="outdoor_capacity_tons"
              type="number"
              step="0.1"
              value={system.outdoor_unit_capacity_tons?.toFixed(1) || ''}
              onChange={(e) => {
                const tons = parseFloat(e.target.value) || 0;
                onChange({
                  outdoor_unit_capacity_tons: tons,
                  outdoor_unit_capacity_kw: tons * 3.517,
                });
              }}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Piping Limits */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5" />
            Piping Design Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="max_piping_length">Max Piping Length (ft)</Label>
            <Input
              id="max_piping_length"
              type="number"
              value={system.max_piping_length_ft || 540}
              onChange={(e) => onChange({ max_piping_length_ft: parseFloat(e.target.value) || 540 })}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">Per manufacturer specifications</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_elevation">Max Elevation Difference (ft)</Label>
            <Input
              id="max_elevation"
              type="number"
              value={system.max_elevation_diff_ft || 160}
              onChange={(e) => onChange({ max_elevation_diff_ft: parseFloat(e.target.value) || 160 })}
              disabled={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="first_branch_max">Max First Branch Length (ft)</Label>
            <Input
              id="first_branch_max"
              type="number"
              value={system.first_branch_max_length_ft || 130}
              onChange={(e) => onChange({ first_branch_max_length_ft: parseFloat(e.target.value) || 130 })}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Status & Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Status & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={system.status || 'draft'}
                onValueChange={(value) => onChange({ status: value as VRFSystem['status'] })}
                disabled={readOnly}
              >
                <SelectTrigger id="status" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revision">Revision</Label>
              <Input
                id="revision"
                value={system.revision || 'A'}
                onChange={(e) => onChange({ revision: e.target.value })}
                className="w-20"
                disabled={readOnly}
              />
            </div>
            
            {system.system_type === 'heat_recovery' && (
              <Badge variant="secondary" className="mt-6">
                3-Pipe Heat Recovery
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={system.notes || ''}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Additional notes about the system design..."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
