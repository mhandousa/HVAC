import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePipeFittingsByCategory, FITTING_CATEGORY_LABELS, PipeFitting, COMMON_PIPE_FITTINGS } from '@/hooks/usePipeFittingsLibrary';

interface AddPipeFittingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (fitting: { code: string; name: string; kFactor: number; quantity: number }) => void;
}

export function AddPipeFittingDialog({
  open,
  onOpenChange,
  onAdd,
}: AddPipeFittingDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFitting, setSelectedFitting] = useState<PipeFitting | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('common');

  const { data: groupedFittings, categories, isLoading } = usePipeFittingsByCategory();

  const handleAdd = () => {
    if (selectedFitting) {
      onAdd({
        code: selectedFitting.fitting_code,
        name: selectedFitting.fitting_name,
        kFactor: selectedFitting.k_factor,
        quantity,
      });
      setSelectedFitting(null);
      setQuantity(1);
      onOpenChange(false);
    }
  };

  const handleQuickAdd = (fitting: typeof COMMON_PIPE_FITTINGS[0]) => {
    onAdd({
      code: fitting.code,
      name: fitting.name,
      kFactor: fitting.kFactor,
      quantity: 1,
    });
  };

  const filterFittings = (fittings: PipeFitting[] | undefined) => {
    if (!fittings) return [];
    if (!searchTerm) return fittings;
    
    const term = searchTerm.toLowerCase();
    return fittings.filter(
      (f) =>
        f.fitting_name.toLowerCase().includes(term) ||
        f.fitting_code.toLowerCase().includes(term)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Pipe Fitting</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="common">Quick Add</TabsTrigger>
            <TabsTrigger value="library">Full Library</TabsTrigger>
          </TabsList>

          <TabsContent value="common" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click to add commonly used fittings:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_PIPE_FITTINGS.map((fitting) => (
                <Button
                  key={fitting.code}
                  variant="outline"
                  className="justify-start h-auto py-2"
                  onClick={() => handleQuickAdd(fitting)}
                >
                  <div className="text-left">
                    <div className="font-medium">{fitting.name}</div>
                    <div className="text-xs text-muted-foreground">
                      K = {fitting.kFactor}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fittings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Fittings Grid */}
            <ScrollArea className="h-[300px] border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {categories.map((category) => {
                    const fittings = filterFittings(groupedFittings?.[category]);
                    if (fittings.length === 0) return null;

                    return (
                      <div key={category}>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          {FITTING_CATEGORY_LABELS[category] || category}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {fittings.map((fitting) => (
                            <div
                              key={fitting.id}
                              className={`p-2 rounded-md cursor-pointer transition-colors ${
                                selectedFitting?.id === fitting.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-accent'
                              }`}
                              onClick={() => setSelectedFitting(fitting)}
                            >
                              <div className="text-sm font-medium truncate">
                                {fitting.fitting_name}
                              </div>
                              <div className="text-xs opacity-80">
                                K = {fitting.k_factor}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Selected Fitting */}
            {selectedFitting && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{selectedFitting.fitting_name}</div>
                  <div className="text-sm text-muted-foreground">
                    K = {selectedFitting.k_factor}
                    {selectedFitting.equivalent_length_factor && (
                      <span> • L/D = {selectedFitting.equivalent_length_factor}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Qty:</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'library' && (
            <Button onClick={handleAdd} disabled={!selectedFitting}>
              <Plus className="h-4 w-4 mr-1" />
              Add Fitting
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
