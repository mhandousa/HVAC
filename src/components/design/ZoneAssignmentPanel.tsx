import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZones } from '@/hooks/useZones';
import { Plus, Trash2, MapPin } from 'lucide-react';

export interface ZoneAssignment {
  zoneId: string;
  zoneName: string;
  floorName: string;
  buildingName: string;
  cfm: number;
}

interface ZoneAssignmentPanelProps {
  projectId?: string;
  selectedZones: ZoneAssignment[];
  onZonesChange: (zones: ZoneAssignment[]) => void;
  totalCfm?: number;
}

export function ZoneAssignmentPanel({
  projectId,
  selectedZones,
  onZonesChange,
  totalCfm,
}: ZoneAssignmentPanelProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [cfmToAdd, setCfmToAdd] = useState<number>(0);

  const { data: buildings } = useBuildings(projectId);
  const { data: floors } = useFloors(selectedBuildingId || undefined);
  const { data: zones } = useZones(selectedFloorId || undefined);

  // Reset dependent selections when parent changes
  useEffect(() => {
    setSelectedFloorId('');
    setSelectedZoneId('');
  }, [selectedBuildingId]);

  useEffect(() => {
    setSelectedZoneId('');
  }, [selectedFloorId]);

  const handleAddZone = () => {
    if (!selectedZoneId) return;

    const zone = zones?.find((z) => z.id === selectedZoneId);
    const floor = floors?.find((f) => f.id === selectedFloorId);
    const building = buildings?.find((b) => b.id === selectedBuildingId);

    if (!zone || !floor || !building) return;

    // Check if zone is already added
    if (selectedZones.some((z) => z.zoneId === selectedZoneId)) {
      return;
    }

    onZonesChange([
      ...selectedZones,
      {
        zoneId: zone.id,
        zoneName: zone.name,
        floorName: floor.name,
        buildingName: building.name,
        cfm: cfmToAdd || 0,
      },
    ]);

    // Reset selection
    setSelectedZoneId('');
    setCfmToAdd(0);
  };

  const handleRemoveZone = (zoneId: string) => {
    onZonesChange(selectedZones.filter((z) => z.zoneId !== zoneId));
  };

  const handleUpdateCfm = (zoneId: string, newCfm: number) => {
    onZonesChange(
      selectedZones.map((z) =>
        z.zoneId === zoneId ? { ...z, cfm: newCfm } : z
      )
    );
  };

  const totalAssignedCfm = selectedZones.reduce((sum, z) => sum + z.cfm, 0);

  const availableZones = zones?.filter(
    (z) => !selectedZones.some((sz) => sz.zoneId === z.id)
  );

  if (!projectId) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Link to a project to assign zones</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Zone Form */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Building</Label>
          <Select
            value={selectedBuildingId || 'none'}
            onValueChange={(v) => setSelectedBuildingId(v === 'none' ? '' : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select building</SelectItem>
              {buildings?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Floor</Label>
          <Select
            value={selectedFloorId || 'none'}
            onValueChange={(v) => setSelectedFloorId(v === 'none' ? '' : v)}
            disabled={!selectedBuildingId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select floor</SelectItem>
              {floors?.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Zone</Label>
          <Select
            value={selectedZoneId || 'none'}
            onValueChange={(v) => setSelectedZoneId(v === 'none' ? '' : v)}
            disabled={!selectedFloorId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select zone</SelectItem>
              {availableZones?.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">CFM</Label>
          <Input
            type="number"
            className="h-9"
            value={cfmToAdd || ''}
            onChange={(e) => setCfmToAdd(Number(e.target.value) || 0)}
            placeholder="CFM"
          />
        </div>

        <Button
          onClick={handleAddZone}
          disabled={!selectedZoneId}
          size="sm"
          className="h-9 gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Zone List */}
      {selectedZones.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">CFM</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedZones.map((zone) => (
                <TableRow key={zone.zoneId}>
                  <TableCell className="text-muted-foreground">
                    {zone.buildingName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {zone.floorName}
                  </TableCell>
                  <TableCell className="font-medium">{zone.zoneName}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="h-8 w-24 text-right ml-auto"
                      value={zone.cfm || ''}
                      onChange={(e) =>
                        handleUpdateCfm(zone.zoneId, Number(e.target.value) || 0)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveZone(zone.zoneId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="px-4 py-3 bg-muted/50 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedZones.length} zone{selectedZones.length !== 1 ? 's' : ''} assigned
            </span>
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="font-mono font-bold">
                {totalAssignedCfm.toLocaleString()} CFM
              </span>
              {totalCfm !== undefined && totalCfm > 0 && (
                <span
                  className={`text-xs ml-2 ${
                    totalAssignedCfm > totalCfm
                      ? 'text-destructive'
                      : totalAssignedCfm < totalCfm
                      ? 'text-warning'
                      : 'text-green-500'
                  }`}
                >
                  ({Math.round((totalAssignedCfm / totalCfm) * 100)}% of system)
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No zones assigned yet</p>
          <p className="text-xs mt-1">Select a zone above to add it</p>
        </div>
      )}
    </div>
  );
}
