import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Building, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Zone {
  id: string;
  name: string;
  building_id?: string;
  floor_number?: number;
  space_type?: string;
}

interface Building {
  id: string;
  name: string;
}

interface WizardZoneSelectorProps {
  zones: Zone[];
  buildings?: Building[];
  selectedZoneIds: string[];
  onSelectionChange: (zoneIds: string[]) => void;
  className?: string;
}

export function WizardZoneSelector({
  zones,
  buildings = [],
  selectedZoneIds,
  onSelectionChange,
  className,
}: WizardZoneSelectorProps) {
  const [expandedBuildings, setExpandedBuildings] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');

  // Group zones by building
  const zonesByBuilding = useMemo(() => {
    const grouped: Record<string, Zone[]> = { ungrouped: [] };
    
    zones.forEach(zone => {
      const buildingId = zone.building_id || 'ungrouped';
      if (!grouped[buildingId]) {
        grouped[buildingId] = [];
      }
      grouped[buildingId].push(zone);
    });

    return grouped;
  }, [zones]);

  const filteredZones = useMemo(() => {
    if (!filterText) return zones;
    const lower = filterText.toLowerCase();
    return zones.filter(z => 
      z.name.toLowerCase().includes(lower) ||
      z.space_type?.toLowerCase().includes(lower)
    );
  }, [zones, filterText]);

  const handleSelectAll = () => {
    onSelectionChange(zones.map(z => z.id));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const handleToggleZone = (zoneId: string) => {
    if (selectedZoneIds.includes(zoneId)) {
      onSelectionChange(selectedZoneIds.filter(id => id !== zoneId));
    } else {
      onSelectionChange([...selectedZoneIds, zoneId]);
    }
  };

  const handleToggleBuilding = (buildingId: string) => {
    const buildingZones = zonesByBuilding[buildingId] || [];
    const buildingZoneIds = buildingZones.map(z => z.id);
    const allSelected = buildingZoneIds.every(id => selectedZoneIds.includes(id));

    if (allSelected) {
      onSelectionChange(selectedZoneIds.filter(id => !buildingZoneIds.includes(id)));
    } else {
      const newSelection = new Set([...selectedZoneIds, ...buildingZoneIds]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  const toggleBuildingExpand = (buildingId: string) => {
    setExpandedBuildings(prev => 
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const getBuildingSelectionStatus = (buildingId: string) => {
    const buildingZones = zonesByBuilding[buildingId] || [];
    const selectedCount = buildingZones.filter(z => selectedZoneIds.includes(z.id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === buildingZones.length) return 'all';
    return 'partial';
  };

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Header */}
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Zone Selection
          </span>
          <Badge variant="secondary" className="text-xs">
            {selectedZoneIds.length}/{zones.length}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleSelectAll}>
            All
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSelectNone}>
            None
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Filter zones..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Zone list */}
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {buildings.length > 0 ? (
            // Grouped by building
            Object.entries(zonesByBuilding).map(([buildingId, buildingZones]) => {
              if (buildingId === 'ungrouped' && buildingZones.length === 0) return null;
              
              const building = buildings.find(b => b.id === buildingId);
              const isExpanded = expandedBuildings.includes(buildingId);
              const selectionStatus = getBuildingSelectionStatus(buildingId);
              const visibleZones = filterText 
                ? buildingZones.filter(z => filteredZones.includes(z))
                : buildingZones;

              if (visibleZones.length === 0) return null;

              return (
                <Collapsible 
                  key={buildingId} 
                  open={isExpanded}
                  onOpenChange={() => toggleBuildingExpand(buildingId)}
                >
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                    <Checkbox
                      checked={selectionStatus === 'all'}
                      onCheckedChange={() => handleToggleBuilding(buildingId)}
                      className={cn(
                        selectionStatus === 'partial' && "data-[state=checked]:bg-primary/50"
                      )}
                    />
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {building?.name || 'Ungrouped'}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {visibleZones.filter(z => selectedZoneIds.includes(z.id)).length}/{visibleZones.length}
                      </Badge>
                      <ChevronsUpDown className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="pl-8 space-y-1">
                    {visibleZones.map(zone => (
                      <div 
                        key={zone.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedZoneIds.includes(zone.id)}
                          onCheckedChange={() => handleToggleZone(zone.id)}
                        />
                        <span className="text-sm">{zone.name}</span>
                        {zone.space_type && (
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {zone.space_type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            // Flat list
            filteredZones.map(zone => (
              <div 
                key={zone.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedZoneIds.includes(zone.id)}
                  onCheckedChange={() => handleToggleZone(zone.id)}
                />
                <span className="text-sm">{zone.name}</span>
                {zone.space_type && (
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {zone.space_type}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
