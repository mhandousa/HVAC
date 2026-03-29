import { Building2, Layers, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocationHierarchyFilter } from '@/hooks/useLocationHierarchyFilter';

interface LocationFilterProps {
  buildingId: string;
  floorId: string;
  zoneId: string;
  onBuildingChange: (value: string) => void;
  onFloorChange: (value: string) => void;
  onZoneChange: (value: string) => void;
}

export function LocationFilter({
  buildingId,
  floorId,
  zoneId,
  onBuildingChange,
  onFloorChange,
  onZoneChange,
}: LocationFilterProps) {
  const { data, isLoading } = useLocationHierarchyFilter();

  const buildings = data?.buildings || [];
  const floors = (data?.floors || []).filter(
    f => buildingId === 'all' || f.building_id === buildingId
  );
  const zones = (data?.zones || []).filter(
    z => floorId === 'all' || z.floor_id === floorId
  );

  const handleBuildingChange = (value: string) => {
    onBuildingChange(value);
    onFloorChange('all');
    onZoneChange('all');
  };

  const handleFloorChange = (value: string) => {
    onFloorChange(value);
    onZoneChange('all');
  };

  if (isLoading || buildings.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Select value={buildingId} onValueChange={handleBuildingChange}>
        <SelectTrigger className="w-[160px]">
          <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Building" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Buildings</SelectItem>
          {buildings.map(b => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={floorId} 
        onValueChange={handleFloorChange}
        disabled={buildingId === 'all'}
      >
        <SelectTrigger className="w-[140px]">
          <Layers className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Floors</SelectItem>
          {floors.map(f => (
            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={zoneId} 
        onValueChange={onZoneChange}
        disabled={floorId === 'all'}
      >
        <SelectTrigger className="w-[140px]">
          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Zone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Zones</SelectItem>
          {zones.map(z => (
            <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
