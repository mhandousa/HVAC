import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { FittingsLibraryPanel } from './FittingsLibraryPanel';
import { DuctFitting } from '@/hooks/useFittingsLibrary';
import { SegmentFitting } from './SegmentPropertiesPanel';
import { Plus, Minus } from 'lucide-react';

interface AddFittingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ductShape: 'round' | 'rectangular';
  onAdd: (fitting: SegmentFitting) => void;
}

export function AddFittingDialog({
  open,
  onOpenChange,
  ductShape,
  onAdd,
}: AddFittingDialogProps) {
  const [selectedFitting, setSelectedFitting] = useState<DuctFitting | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleSelectFitting = (fitting: DuctFitting) => {
    setSelectedFitting(fitting);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!selectedFitting) return;

    const newFitting: SegmentFitting = {
      id: crypto.randomUUID(),
      fittingCode: selectedFitting.fitting_code,
      fittingName: selectedFitting.fitting_name,
      lossCoefficient: selectedFitting.loss_coefficient,
      quantity,
    };

    onAdd(newFitting);
    setSelectedFitting(null);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedFitting(null);
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Fitting</DialogTitle>
          <DialogDescription>
            Select a fitting from the ASHRAE library to add to this segment
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
          {/* Fittings Library */}
          <div className="border rounded-lg overflow-hidden h-[400px]">
            <FittingsLibraryPanel
              selectedShape={ductShape}
              onSelectFitting={handleSelectFitting}
            />
          </div>

          {/* Selected Fitting Preview */}
          <div className="border rounded-lg p-4 flex flex-col">
            <h4 className="text-sm font-medium mb-3">Selected Fitting</h4>

            {selectedFitting ? (
              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h5 className="font-semibold text-foreground">
                    {selectedFitting.fitting_name}
                  </h5>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedFitting.fitting_code}
                  </p>
                </div>

                {selectedFitting.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFitting.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground block">Loss Coefficient</span>
                    <span className="font-mono font-semibold text-lg">
                      K = {selectedFitting.loss_coefficient.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground block">Duct Shape</span>
                    <span className="font-medium capitalize">
                      {selectedFitting.duct_shape}
                    </span>
                  </div>
                  {selectedFitting.angle_degrees && (
                    <div className="p-3 rounded-md bg-muted/50">
                      <span className="text-xs text-muted-foreground block">Angle</span>
                      <span className="font-medium">{selectedFitting.angle_degrees}°</span>
                    </div>
                  )}
                  {selectedFitting.radius_ratio && (
                    <div className="p-3 rounded-md bg-muted/50">
                      <span className="text-xs text-muted-foreground block">R/D Ratio</span>
                      <span className="font-medium">{selectedFitting.radius_ratio}</span>
                    </div>
                  )}
                </div>

                {selectedFitting.ashrae_reference && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {selectedFitting.ashrae_reference}
                  </p>
                )}

                {/* Quantity */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <p className="text-sm">Click a fitting to select it</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedFitting}>
            <Plus className="w-4 h-4 mr-2" />
            Add Fitting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
