import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Plus, Circle, Square, Loader2 } from 'lucide-react';
import { useFittingsByCategory, DuctFitting, FITTING_CATEGORY_LABELS } from '@/hooks/useFittingsLibrary';

interface FittingsLibraryPanelProps {
  selectedShape: 'round' | 'rectangular' | 'both';
  onSelectFitting: (fitting: DuctFitting) => void;
}

export function FittingsLibraryPanel({ selectedShape, onSelectFitting }: FittingsLibraryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [shapeFilter, setShapeFilter] = useState<'all' | 'round' | 'rectangular'>(
    selectedShape === 'both' ? 'all' : selectedShape
  );

  const { groupedFittings, categories, isLoading, error } = useFittingsByCategory();

  // Filter fittings based on search and shape
  const filterFittings = (fittings: DuctFitting[]) => {
    return fittings.filter((fitting) => {
      const matchesSearch =
        searchTerm === '' ||
        fitting.fitting_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fitting.fitting_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesShape =
        shapeFilter === 'all' ||
        fitting.duct_shape === shapeFilter ||
        fitting.duct_shape === 'both';

      return matchesSearch && matchesShape;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p className="text-sm">Failed to load fittings library</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search fittings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs
          value={shapeFilter}
          onValueChange={(v) => setShapeFilter(v as typeof shapeFilter)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="round" className="text-xs gap-1">
              <Circle className="w-3 h-3" /> Round
            </TabsTrigger>
            <TabsTrigger value="rectangular" className="text-xs gap-1">
              <Square className="w-3 h-3" /> Rect
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Fittings List */}
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={categories} className="px-2">
          {categories.map((category) => {
            const fittings = filterFittings(groupedFittings?.[category] || []);
            if (fittings.length === 0) return null;

            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {FITTING_CATEGORY_LABELS[category] || category}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5">
                      {fittings.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pb-2">
                    {fittings.map((fitting) => (
                      <FittingItem
                        key={fitting.id}
                        fitting={fitting}
                        onSelect={() => onSelectFitting(fitting)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {categories.every((cat) => filterFittings(groupedFittings?.[cat] || []).length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No fittings match your filters</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface FittingItemProps {
  fitting: DuctFitting;
  onSelect: () => void;
}

function FittingItem({ fitting, onSelect }: FittingItemProps) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{fitting.fitting_name}</span>
          {fitting.duct_shape !== 'both' && (
            <Badge variant="outline" className="text-xs h-4 px-1">
              {fitting.duct_shape === 'round' ? (
                <Circle className="w-2.5 h-2.5" />
              ) : (
                <Square className="w-2.5 h-2.5" />
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{fitting.fitting_code}</span>
          {fitting.angle_degrees && <span>• {fitting.angle_degrees}°</span>}
          {fitting.radius_ratio && <span>• R/D={fitting.radius_ratio}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          K={fitting.loss_coefficient.toFixed(2)}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
