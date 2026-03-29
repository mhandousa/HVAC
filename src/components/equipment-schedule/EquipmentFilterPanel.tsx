import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GroupingMode } from '@/hooks/useEquipmentSchedule';

interface Building {
  id: string;
  name: string;
  floors: { id: string; name: string }[];
}

interface EquipmentFilterPanelProps {
  equipmentTypes: string[];
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  buildings: Building[];
  selectedBuildingIds: string[];
  onBuildingsChange: (ids: string[]) => void;
  groupingMode: GroupingMode;
  onGroupingModeChange: (mode: GroupingMode) => void;
  totalCount: number;
  filteredCount: number;
}

export function EquipmentFilterPanel({
  equipmentTypes,
  selectedTypes,
  onTypesChange,
  buildings,
  selectedBuildingIds,
  onBuildingsChange,
  groupingMode,
  onGroupingModeChange,
  totalCount,
  filteredCount,
}: EquipmentFilterPanelProps) {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleBuilding = (buildingId: string) => {
    if (selectedBuildingIds.includes(buildingId)) {
      onBuildingsChange(selectedBuildingIds.filter(id => id !== buildingId));
    } else {
      onBuildingsChange([...selectedBuildingIds, buildingId]);
    }
  };

  const selectAllTypes = () => onTypesChange([...equipmentTypes]);
  const clearTypes = () => onTypesChange([]);
  const selectAllBuildings = () => onBuildingsChange(buildings.map(b => b.id));
  const clearBuildings = () => onBuildingsChange([]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          <Badge variant="secondary">
            {filteredCount} of {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grouping Mode */}
        <div className="space-y-2">
          <Label>Group By</Label>
          <Select value={groupingMode} onValueChange={(v) => onGroupingModeChange(v as GroupingMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="by_building">Building</SelectItem>
              <SelectItem value="by_floor">Floor</SelectItem>
              <SelectItem value="by_type">Equipment Type</SelectItem>
              <SelectItem value="by_zone">Zone</SelectItem>
              <SelectItem value="flat">No Grouping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment Types */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Equipment Types</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAllTypes}>
                All
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearTypes}>
                None
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[120px] border rounded-md p-2">
            <div className="space-y-2">
              {equipmentTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No equipment types found</p>
              ) : (
                equipmentTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Buildings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Buildings</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAllBuildings}>
                All
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearBuildings}>
                None
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[120px] border rounded-md p-2">
            <div className="space-y-2">
              {buildings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No buildings found</p>
              ) : (
                buildings.map(building => (
                  <div key={building.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`building-${building.id}`}
                      checked={selectedBuildingIds.includes(building.id)}
                      onCheckedChange={() => toggleBuilding(building.id)}
                    />
                    <label
                      htmlFor={`building-${building.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {building.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
