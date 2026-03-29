import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZones } from '@/hooks/useZones';
import { Building2, Layers, MapPin, FolderKanban } from 'lucide-react';

interface LocationSelectorProps {
  projectId?: string;
  buildingId?: string;
  floorId?: string;
  zoneId?: string;
  onProjectChange?: (projectId: string | undefined) => void;
  onBuildingChange?: (buildingId: string | undefined) => void;
  onFloorChange?: (floorId: string | undefined) => void;
  onZoneChange?: (zoneId: string | undefined) => void;
  showLabels?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function LocationSelector({
  projectId,
  buildingId,
  floorId,
  zoneId,
  onProjectChange,
  onBuildingChange,
  onFloorChange,
  onZoneChange,
  showLabels = true,
  compact = false,
  disabled = false,
}: LocationSelectorProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildingId || '');
  const [selectedFloorId, setSelectedFloorId] = useState(floorId || '');
  const [selectedZoneId, setSelectedZoneId] = useState(zoneId || '');

  const { data: projects } = useProjects();
  const { data: buildings } = useBuildings(selectedProjectId || undefined);
  const { data: floors } = useFloors(selectedBuildingId || undefined);
  const { data: zones } = useZones(selectedFloorId || undefined);

  // Sync external values with internal state
  useEffect(() => {
    setSelectedProjectId(projectId || '');
  }, [projectId]);

  useEffect(() => {
    setSelectedBuildingId(buildingId || '');
  }, [buildingId]);

  useEffect(() => {
    setSelectedFloorId(floorId || '');
  }, [floorId]);

  useEffect(() => {
    setSelectedZoneId(zoneId || '');
  }, [zoneId]);

  const handleProjectChange = (value: string) => {
    const newValue = value === 'none' ? '' : value;
    setSelectedProjectId(newValue);
    setSelectedBuildingId('');
    setSelectedFloorId('');
    setSelectedZoneId('');
    onProjectChange?.(newValue || undefined);
    onBuildingChange?.(undefined);
    onFloorChange?.(undefined);
    onZoneChange?.(undefined);
  };

  const handleBuildingChange = (value: string) => {
    const newValue = value === 'none' ? '' : value;
    setSelectedBuildingId(newValue);
    setSelectedFloorId('');
    setSelectedZoneId('');
    onBuildingChange?.(newValue || undefined);
    onFloorChange?.(undefined);
    onZoneChange?.(undefined);
  };

  const handleFloorChange = (value: string) => {
    const newValue = value === 'none' ? '' : value;
    setSelectedFloorId(newValue);
    setSelectedZoneId('');
    onFloorChange?.(newValue || undefined);
    onZoneChange?.(undefined);
  };

  const handleZoneChange = (value: string) => {
    const newValue = value === 'none' ? '' : value;
    setSelectedZoneId(newValue);
    onZoneChange?.(newValue || undefined);
  };

  const gridClass = compact
    ? 'grid grid-cols-2 gap-2 sm:grid-cols-4'
    : 'grid gap-3 sm:grid-cols-2';

  return (
    <div className={gridClass}>
      {/* Project Selector */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="text-xs flex items-center gap-1">
            <FolderKanban className="w-3 h-3" />
            Project
          </Label>
        )}
        <Select value={selectedProjectId || 'none'} onValueChange={handleProjectChange} disabled={disabled}>
          <SelectTrigger className={compact ? 'h-8 text-xs' : ''}>
            <SelectValue placeholder="Select project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Building Selector */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="text-xs flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Building
          </Label>
        )}
        <Select
          value={selectedBuildingId || 'none'}
          onValueChange={handleBuildingChange}
          disabled={disabled || !selectedProjectId}
        >
          <SelectTrigger className={compact ? 'h-8 text-xs' : ''}>
            <SelectValue placeholder={selectedProjectId ? 'Select building...' : 'Select project first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No building</SelectItem>
            {buildings?.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Floor Selector */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="text-xs flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Floor
          </Label>
        )}
        <Select
          value={selectedFloorId || 'none'}
          onValueChange={handleFloorChange}
          disabled={disabled || !selectedBuildingId}
        >
          <SelectTrigger className={compact ? 'h-8 text-xs' : ''}>
            <SelectValue placeholder={selectedBuildingId ? 'Select floor...' : 'Select building first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No floor</SelectItem>
            {floors?.map((floor) => (
              <SelectItem key={floor.id} value={floor.id}>
                {floor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zone Selector */}
      <div className="space-y-1.5">
        {showLabels && (
          <Label className="text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Zone
          </Label>
        )}
        <Select
          value={selectedZoneId || 'none'}
          onValueChange={handleZoneChange}
          disabled={disabled || !selectedFloorId}
        >
          <SelectTrigger className={compact ? 'h-8 text-xs' : ''}>
            <SelectValue placeholder={selectedFloorId ? 'Select zone...' : 'Select floor first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No zone</SelectItem>
            {zones?.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
