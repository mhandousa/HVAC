import { useState } from 'react';
import { useCreateEquipmentSelection } from '@/hooks/useEquipmentSelections';
import { useProjects } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';

interface SelectedItem {
  id: string;
  manufacturer: string;
  model_number: string;
  cooling_capacity_tons: number | null;
  list_price_sar: number | null;
  power_input_kw: number | null;
}

interface SaveEquipmentSelectionDialogProps {
  selectedItems: SelectedItem[];
  requiredCapacity: number;
  equipmentCategory: string;
  loadCalculationId?: string;
  zoneId?: string;
  lifecycleCosts: Array<{
    purchase: number;
    energy: number;
    total: number;
    annualEnergy: number;
  }>;
  onSave: (selectionId: string) => void;
}

export function SaveEquipmentSelectionDialog({
  selectedItems,
  requiredCapacity,
  equipmentCategory,
  loadCalculationId,
  zoneId,
  lifecycleCosts,
  onSave,
}: SaveEquipmentSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectionName, setSelectionName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: projects = [] } = useProjects();
  const createSelection = useCreateEquipmentSelection();

  const totalPurchase = selectedItems.reduce((sum, i) => sum + (i.list_price_sar || 0), 0);
  const totalLifecycle = lifecycleCosts.reduce((sum, lc) => sum + lc.total, 0);

  const handleSave = async () => {
    if (!selectionName.trim()) return;

    setIsLoading(true);
    try {
      const result = await createSelection.mutateAsync({
        selection_name: selectionName,
        equipment_category: equipmentCategory,
        required_capacity_tons: requiredCapacity,
        selected_equipment: selectedItems.map((item, i) => ({
          catalog_id: item.id,
          quantity: 1,
          notes: `${item.manufacturer} ${item.model_number}`,
        })),
        lifecycle_cost_analysis: {
          purchase: totalPurchase,
          energy: lifecycleCosts.reduce((sum, lc) => sum + lc.energy, 0),
          total: totalLifecycle,
          annualEnergy: lifecycleCosts.reduce((sum, lc) => sum + lc.annualEnergy, 0),
        },
        comparison_notes: notes || undefined,
        project_id: projectId || undefined,
        load_calculation_id: loadCalculationId,
        zone_id: zoneId,
        status: 'draft',
      });

      onSave(result.id);
      setOpen(false);
      setSelectionName('');
      setProjectId('');
      setNotes('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Save Selection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Equipment Selection</DialogTitle>
          <DialogDescription>
            Save this equipment selection for future reference or approval
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="selection-name">Selection Name *</Label>
            <Input
              id="selection-name"
              value={selectionName}
              onChange={(e) => setSelectionName(e.target.value)}
              placeholder="e.g., Office Building VRF Selection"
            />
          </div>
          <div className="space-y-2">
            <Label>Link to Project (optional)</Label>
            <Select
              value={projectId || "none"}
              onValueChange={(value) => setProjectId(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this selection..."
              rows={3}
            />
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-2">Selection Summary</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Equipment:</span>
              <span className="text-foreground">{selectedItems.length} items</span>
              <span>Required Capacity:</span>
              <span className="text-foreground">{requiredCapacity} TR</span>
              <span>Total Purchase:</span>
              <span className="text-foreground">
                {new Intl.NumberFormat('en-SA', {
                  style: 'currency',
                  currency: 'SAR',
                  maximumFractionDigits: 0,
                }).format(totalPurchase)}
              </span>
              <span>15-Year Lifecycle:</span>
              <span className="text-foreground">
                {new Intl.NumberFormat('en-SA', {
                  style: 'currency',
                  currency: 'SAR',
                  maximumFractionDigits: 0,
                }).format(totalLifecycle)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectionName.trim() || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
