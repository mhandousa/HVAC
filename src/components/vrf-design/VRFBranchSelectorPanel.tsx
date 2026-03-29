import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Box } from 'lucide-react';
import { getPipeSizeName } from '@/lib/vrf-refrigerant-calculations';
import type { VRFBranchSelector, VRFIndoorUnit } from '@/hooks/useVRFSystems';

interface VRFBranchSelectorPanelProps {
  branchSelectors: VRFBranchSelector[];
  units: VRFIndoorUnit[];
  systemId: string;
  onAdd: (selector: Partial<VRFBranchSelector>) => void;
  onUpdate: (selector: Partial<VRFBranchSelector> & { id: string }) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

export function VRFBranchSelectorPanel({
  branchSelectors,
  units,
  systemId,
  onAdd,
  onUpdate,
  onRemove,
  readOnly,
}: VRFBranchSelectorPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSelector, setEditingSelector] = useState<VRFBranchSelector | null>(null);
  const [formData, setFormData] = useState<Partial<VRFBranchSelector>>({});
  
  const getConnectedUnits = (selectorId: string) => {
    return units.filter(u => u.branch_selector_id === selectorId);
  };
  
  const handleOpenDialog = (selector?: VRFBranchSelector) => {
    if (selector) {
      setEditingSelector(selector);
      setFormData(selector);
    } else {
      setEditingSelector(null);
      setFormData({
        selector_tag: `BS-${String(branchSelectors.length + 1).padStart(2, '0')}`,
        distance_from_outdoor_ft: 30,
        elevation_from_outdoor_ft: 0,
        selector_model: '',
      });
    }
    setDialogOpen(true);
  };
  
  const handleSave = () => {
    if (editingSelector) {
      onUpdate({ ...formData, id: editingSelector.id });
    } else {
      onAdd({
        ...formData,
        vrf_system_id: systemId,
        sort_order: branchSelectors.length,
      });
    }
    setDialogOpen(false);
    setEditingSelector(null);
  };
  
  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Box className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="font-medium text-purple-700 dark:text-purple-300">
                Branch Selector Boxes (Heat Recovery)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Branch selectors allow individual indoor units to operate in heating or cooling mode
                simultaneously. They're required for heat recovery (3-pipe) VRF systems.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Branch Selectors Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Branch Selectors</CardTitle>
          {!readOnly && (
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Branch Selector
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {branchSelectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Box className="h-12 w-12 mb-4 opacity-30" />
              <p>No branch selectors added</p>
              <p className="text-sm">Add branch selectors for heat recovery operation</p>
              {!readOnly && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Branch Selector
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Distance (ft)</TableHead>
                  <TableHead className="text-right">Elevation (ft)</TableHead>
                  <TableHead>Connected Units</TableHead>
                  <TableHead className="text-right">Total Capacity</TableHead>
                  <TableHead>Liquid</TableHead>
                  <TableHead>Suction</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchSelectors.map((bs) => {
                  const connectedUnits = getConnectedUnits(bs.id);
                  const totalCapacity = connectedUnits.reduce((sum, u) => sum + u.cooling_capacity_kw, 0);
                  
                  return (
                    <TableRow key={bs.id}>
                      <TableCell className="font-medium">{bs.selector_tag}</TableCell>
                      <TableCell>{bs.selector_model || '-'}</TableCell>
                      <TableCell className="text-right">
                        {bs.distance_from_outdoor_ft?.toFixed(0) || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {bs.elevation_from_outdoor_ft !== 0 
                          ? `${bs.elevation_from_outdoor_ft > 0 ? '+' : ''}${bs.elevation_from_outdoor_ft.toFixed(0)}`
                          : '0'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{connectedUnits.length} units</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {totalCapacity.toFixed(1)} kW
                      </TableCell>
                      <TableCell>
                        {bs.liquid_line_size_in 
                          ? getPipeSizeName(bs.liquid_line_size_in)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {bs.suction_line_size_in 
                          ? getPipeSizeName(bs.suction_line_size_in)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {!readOnly && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(bs)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemove(bs.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSelector ? 'Edit Branch Selector' : 'Add Branch Selector'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="selector_tag">Selector Tag *</Label>
                <Input
                  id="selector_tag"
                  value={formData.selector_tag || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, selector_tag: e.target.value }))}
                  placeholder="e.g., BS-01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selector_model">Model Number</Label>
                <Input
                  id="selector_model"
                  value={formData.selector_model || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, selector_model: e.target.value }))}
                  placeholder="e.g., BSVQ6P"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance from ODU (ft)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance_from_outdoor_ft || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    distance_from_outdoor_ft: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="elevation">Elevation from ODU (ft)</Label>
                <Input
                  id="elevation"
                  type="number"
                  value={formData.elevation_from_outdoor_ft || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    elevation_from_outdoor_ft: parseFloat(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Positive = above ODU, Negative = below
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSelector ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
