import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Calculator, RefreshCw } from 'lucide-react';
import { AddVRFIndoorUnitDialog } from './AddVRFIndoorUnitDialog';
import { getPipeSizeName } from '@/lib/vrf-refrigerant-calculations';
import type { VRFIndoorUnit, VRFBranchSelector } from '@/hooks/useVRFSystems';

interface VRFIndoorUnitPanelProps {
  units: VRFIndoorUnit[];
  branchSelectors: VRFBranchSelector[];
  systemId: string;
  systemType: 'heat_pump' | 'heat_recovery';
  onAdd: (unit: Partial<VRFIndoorUnit>) => void;
  onUpdate: (unit: Partial<VRFIndoorUnit> & { id: string }) => void;
  onRemove: (id: string) => void;
  onImportClick?: () => void;
  onSyncClick?: () => void;
  readOnly?: boolean;
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  wall_mounted: 'Wall Mounted',
  ceiling_cassette: 'Ceiling Cassette',
  ducted: 'Ducted',
  floor_standing: 'Floor Standing',
  ceiling_suspended: 'Ceiling Suspended',
  console: 'Console',
};

export function VRFIndoorUnitPanel({
  units,
  branchSelectors,
  systemId,
  systemType,
  onAdd,
  onUpdate,
  onRemove,
  onImportClick,
  onSyncClick,
  readOnly,
}: VRFIndoorUnitPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<VRFIndoorUnit | null>(null);
  
  const totalCapacity = units.reduce((sum, u) => sum + u.cooling_capacity_kw, 0);
  const totalLength = units.reduce((sum, u) => sum + u.liquid_line_length_ft, 0);
  
  // Count units linked to load calculations (have zone_id)
  const linkedUnitCount = useMemo(() => 
    units.filter(u => u.zone_id).length, 
    [units]
  );
  
  const handleAdd = (unit: Partial<VRFIndoorUnit>) => {
    onAdd({ ...unit, vrf_system_id: systemId });
    setDialogOpen(false);
  };
  
  const handleEdit = (unit: VRFIndoorUnit) => {
    setEditingUnit(unit);
    setDialogOpen(true);
  };
  
  const handleSave = (unit: Partial<VRFIndoorUnit>) => {
    if (editingUnit) {
      onUpdate({ ...unit, id: editingUnit.id });
    } else {
      handleAdd(unit);
    }
    setEditingUnit(null);
    setDialogOpen(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{units.length}</div>
            <div className="text-sm text-muted-foreground">Indoor Units</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalCapacity.toFixed(1)} kW</div>
            <div className="text-sm text-muted-foreground">Total Capacity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{(totalCapacity / 3.517).toFixed(1)} Tons</div>
            <div className="text-sm text-muted-foreground">Total Capacity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalLength.toFixed(0)} ft</div>
            <div className="text-sm text-muted-foreground">Total Piping</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Units Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Indoor Units</CardTitle>
          {!readOnly && (
            <div className="flex gap-2">
              {onSyncClick && linkedUnitCount > 0 && (
                <Button variant="outline" onClick={onSyncClick} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync ({linkedUnitCount})
                </Button>
              )}
              {onImportClick && (
                <Button variant="outline" onClick={onImportClick} size="sm">
                  <Calculator className="mr-2 h-4 w-4" />
                  Import from Load Calc
                </Button>
              )}
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No indoor units added yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Unit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Capacity (kW)</TableHead>
                  <TableHead className="text-right">Piping (ft)</TableHead>
                  <TableHead className="text-right">Elevation (ft)</TableHead>
                  <TableHead>Liquid</TableHead>
                  <TableHead>Suction</TableHead>
                  <TableHead>Oil Return</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_tag}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{UNIT_TYPE_LABELS[unit.unit_type]}</Badge>
                    </TableCell>
                    <TableCell>{unit.zone_name || '-'}</TableCell>
                    <TableCell className="text-right">{unit.cooling_capacity_kw.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{unit.liquid_line_length_ft.toFixed(0)}</TableCell>
                    <TableCell className="text-right">
                      {unit.is_above_outdoor ? '+' : '-'}{Math.abs(unit.elevation_from_outdoor_ft).toFixed(0)}
                    </TableCell>
                    <TableCell>
                      {unit.liquid_line_size_in 
                        ? getPipeSizeName(unit.liquid_line_size_in)
                        : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      {unit.suction_line_size_in 
                        ? getPipeSizeName(unit.suction_line_size_in)
                        : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      {unit.oil_return_ok === null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : unit.oil_return_ok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {!readOnly && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(unit)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(unit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddVRFIndoorUnitDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingUnit(null);
        }}
        onSave={handleSave}
        existingUnit={editingUnit}
        branchSelectors={branchSelectors}
        systemType={systemType}
        unitCount={units.length}
      />
    </div>
  );
}
