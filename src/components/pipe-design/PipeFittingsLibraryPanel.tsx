import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePipeFittingsByCategory, FITTING_CATEGORY_LABELS, PipeFitting } from '@/hooks/usePipeFittingsLibrary';

interface PipeFittingsLibraryPanelProps {
  onSelectFitting: (fitting: PipeFitting) => void;
}

export function PipeFittingsLibraryPanel({ onSelectFitting }: PipeFittingsLibraryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: groupedFittings, categories, isLoading } = usePipeFittingsByCategory();

  const filterFittings = (fittings: PipeFitting[] | undefined) => {
    if (!fittings) return [];
    if (!searchTerm) return fittings;
    
    const term = searchTerm.toLowerCase();
    return fittings.filter(
      (f) =>
        f.fitting_name.toLowerCase().includes(term) ||
        f.fitting_code.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-pulse text-muted-foreground">Loading fittings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fittings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Fittings List */}
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={categories} className="w-full">
          {categories.map((category) => {
            const fittings = filterFittings(groupedFittings?.[category]);
            if (fittings.length === 0) return null;

            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>{FITTING_CATEGORY_LABELS[category] || category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {fittings.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 px-2 pb-2">
                    {fittings.map((fitting) => (
                      <div
                        key={fitting.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group"
                        onClick={() => onSelectFitting(fitting)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {fitting.fitting_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>K = {fitting.k_factor}</span>
                            {fitting.equivalent_length_factor && (
                              <span>• L/D = {fitting.equivalent_length_factor}</span>
                            )}
                          </div>
                          {fitting.description && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {fitting.description}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Filter className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No fittings found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
