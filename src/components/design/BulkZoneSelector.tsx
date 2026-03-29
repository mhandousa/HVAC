import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Building2, Layers, MapPin, ChevronDown, ChevronRight, Search, Square, CheckSquare } from 'lucide-react';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZones, Zone } from '@/hooks/useZones';

export interface ZoneWithHierarchy extends Zone {
  building_id?: string;
  building_name?: string;
  floor_name?: string;
}

interface BulkZoneSelectorProps {
  projectId: string;
  selectedZoneIds: string[];
  onSelectionChange: (zoneIds: string[]) => void;
  showStats?: boolean;
  filterTypes?: string[];
  excludeZoneIds?: string[];
  maxHeight?: string;
}

interface BuildingGroup {
  id: string;
  name: string;
  floors: FloorGroup[];
}

interface FloorGroup {
  id: string;
  name: string;
  buildingId: string;
  zones: ZoneWithHierarchy[];
}

export function BulkZoneSelector({
  projectId,
  selectedZoneIds,
  onSelectionChange,
  showStats = true,
  filterTypes,
  excludeZoneIds = [],
  maxHeight = '400px',
}: BulkZoneSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuildingId, setFilterBuildingId] = useState<string>('all');
  const [filterZoneType, setFilterZoneType] = useState<string>('all');
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  const { data: buildings } = useBuildings(projectId);
  
  // Get all building IDs to fetch floors
  const buildingIds = useMemo(() => buildings?.map(b => b.id) || [], [buildings]);
  
  // Fetch floors for all buildings
  const { data: allFloors } = useFloors(buildingIds.length > 0 ? buildingIds[0] : undefined);
  
  // Fetch zones for all floors (using first building for now - we'll aggregate)
  const floorIds = useMemo(() => allFloors?.map(f => f.id) || [], [allFloors]);
  const { data: allZones } = useZones(floorIds.length > 0 ? floorIds[0] : undefined);

  // Build hierarchy structure
  const buildingGroups = useMemo(() => {
    if (!buildings || !allFloors || !allZones) return [];

    const groups: BuildingGroup[] = [];

    buildings.forEach(building => {
      const buildingFloors = allFloors.filter(f => f.building_id === building.id);
      const floorGroups: FloorGroup[] = [];

      buildingFloors.forEach(floor => {
        let floorZones = allZones.filter(z => z.floor_id === floor.id);
        
        // Apply filters
        if (excludeZoneIds.length > 0) {
          floorZones = floorZones.filter(z => !excludeZoneIds.includes(z.id));
        }
        if (filterTypes && filterTypes.length > 0) {
          floorZones = floorZones.filter(z => filterTypes.includes(z.zone_type));
        }
        if (filterZoneType !== 'all') {
          floorZones = floorZones.filter(z => z.zone_type === filterZoneType);
        }
        if (filterBuildingId !== 'all' && filterBuildingId !== building.id) {
          return;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          floorZones = floorZones.filter(z => 
            z.name.toLowerCase().includes(query) ||
            z.zone_type.toLowerCase().includes(query)
          );
        }

        if (floorZones.length > 0) {
          floorGroups.push({
            id: floor.id,
            name: floor.name,
            buildingId: building.id,
            zones: floorZones.map(z => ({
              ...z,
              building_id: building.id,
              building_name: building.name,
              floor_name: floor.name,
            })),
          });
        }
      });

      if (floorGroups.length > 0 || filterBuildingId === 'all') {
        groups.push({
          id: building.id,
          name: building.name,
          floors: floorGroups,
        });
      }
    });

    return groups;
  }, [buildings, allFloors, allZones, excludeZoneIds, filterTypes, filterZoneType, filterBuildingId, searchQuery]);

  // Get all available zone types
  const zoneTypes = useMemo(() => {
    if (!allZones) return [];
    const types = new Set(allZones.map(z => z.zone_type));
    return Array.from(types).sort();
  }, [allZones]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!allZones) return { totalZones: 0, selectedCount: 0, totalArea: 0 };
    
    const selectedZones = allZones.filter(z => selectedZoneIds.includes(z.id));
    return {
      totalZones: allZones.length - excludeZoneIds.length,
      selectedCount: selectedZoneIds.length,
      totalArea: selectedZones.reduce((sum, z) => sum + (z.area_sqm || 0), 0),
    };
  }, [allZones, selectedZoneIds, excludeZoneIds]);

  // Toggle functions
  const toggleZone = useCallback((zoneId: string) => {
    const newSelection = selectedZoneIds.includes(zoneId)
      ? selectedZoneIds.filter(id => id !== zoneId)
      : [...selectedZoneIds, zoneId];
    onSelectionChange(newSelection);
  }, [selectedZoneIds, onSelectionChange]);

  const toggleFloor = useCallback((floorGroup: FloorGroup) => {
    const floorZoneIds = floorGroup.zones.map(z => z.id);
    const allSelected = floorZoneIds.every(id => selectedZoneIds.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedZoneIds.filter(id => !floorZoneIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedZoneIds, ...floorZoneIds])];
      onSelectionChange(newSelection);
    }
  }, [selectedZoneIds, onSelectionChange]);

  const toggleBuilding = useCallback((buildingGroup: BuildingGroup) => {
    const buildingZoneIds = buildingGroup.floors.flatMap(f => f.zones.map(z => z.id));
    const allSelected = buildingZoneIds.every(id => selectedZoneIds.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedZoneIds.filter(id => !buildingZoneIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedZoneIds, ...buildingZoneIds])];
      onSelectionChange(newSelection);
    }
  }, [selectedZoneIds, onSelectionChange]);

  const selectAll = useCallback(() => {
    const allZoneIds = buildingGroups.flatMap(b => b.floors.flatMap(f => f.zones.map(z => z.id)));
    onSelectionChange(allZoneIds);
  }, [buildingGroups, onSelectionChange]);

  const deselectAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const toggleBuildingExpand = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const toggleFloorExpand = (floorId: string) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId);
    } else {
      newExpanded.add(floorId);
    }
    setExpandedFloors(newExpanded);
  };

  const isFloorFullySelected = (floorGroup: FloorGroup) => {
    return floorGroup.zones.every(z => selectedZoneIds.includes(z.id));
  };

  const isFloorPartiallySelected = (floorGroup: FloorGroup) => {
    const selected = floorGroup.zones.filter(z => selectedZoneIds.includes(z.id));
    return selected.length > 0 && selected.length < floorGroup.zones.length;
  };

  const isBuildingFullySelected = (buildingGroup: BuildingGroup) => {
    return buildingGroup.floors.every(f => isFloorFullySelected(f));
  };

  const isBuildingPartiallySelected = (buildingGroup: BuildingGroup) => {
    const hasAnySelected = buildingGroup.floors.some(f => 
      f.zones.some(z => selectedZoneIds.includes(z.id))
    );
    return hasAnySelected && !isBuildingFullySelected(buildingGroup);
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterBuildingId} onValueChange={setFilterBuildingId}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Buildings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {buildings?.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterZoneType} onValueChange={setFilterZoneType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {zoneTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Select All / Deselect All */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>
            <Square className="h-4 w-4 mr-1" />
            Deselect All
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {stats.selectedCount} of {stats.totalZones} zones selected
        </span>
      </div>

      {/* Hierarchical Zone List */}
      <ScrollArea style={{ height: maxHeight }}>
        <div className="space-y-1 pr-4">
          {buildingGroups.map(building => (
            <Collapsible
              key={building.id}
              open={expandedBuildings.has(building.id)}
              onOpenChange={() => toggleBuildingExpand(building.id)}
            >
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedBuildings.has(building.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Checkbox
                  checked={isBuildingFullySelected(building)}
                  ref={(el) => {
                    if (el && isBuildingPartiallySelected(building)) {
                      (el as unknown as HTMLInputElement).indeterminate = true;
                    }
                  }}
                  onCheckedChange={() => toggleBuilding(building)}
                />
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium flex-1">{building.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {building.floors.reduce((sum, f) => sum + f.zones.length, 0)} zones
                </Badge>
              </div>

              <CollapsibleContent className="pl-6">
                {building.floors.map(floor => (
                  <Collapsible
                    key={floor.id}
                    open={expandedFloors.has(floor.id)}
                    onOpenChange={() => toggleFloorExpand(floor.id)}
                  >
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 mt-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          {expandedFloors.has(floor.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Checkbox
                        checked={isFloorFullySelected(floor)}
                        ref={(el) => {
                          if (el && isFloorPartiallySelected(floor)) {
                            (el as unknown as HTMLInputElement).indeterminate = true;
                          }
                        }}
                        onCheckedChange={() => toggleFloor(floor)}
                      />
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm flex-1">{floor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {floor.zones.length}
                      </Badge>
                    </div>

                    <CollapsibleContent className="pl-8 space-y-0.5">
                      {floor.zones.map(zone => (
                        <div
                          key={zone.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted/20 cursor-pointer"
                          onClick={() => toggleZone(zone.id)}
                        >
                          <Checkbox
                            checked={selectedZoneIds.includes(zone.id)}
                            onCheckedChange={() => toggleZone(zone.id)}
                          />
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate">{zone.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {zone.zone_type}
                          </Badge>
                          {zone.area_sqm && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(zone.area_sqm * 10.764).toLocaleString()} SF
                            </span>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {buildingGroups.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No zones found matching your criteria
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      {showStats && stats.selectedCount > 0 && (
        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
          <span>
            <strong>{stats.selectedCount}</strong> zones selected
          </span>
          {stats.totalArea > 0 && (
            <span>
              <strong>{Math.round(stats.totalArea * 10.764).toLocaleString()}</strong> SF total
            </span>
          )}
        </div>
      )}
    </div>
  );
}
