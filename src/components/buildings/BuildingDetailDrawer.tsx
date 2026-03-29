import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  MapPin,
  Layers,
  Ruler,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Square,
  Users,
  Wrench,
  Box,
  Package,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, useUpdateBuilding, useDeleteBuilding } from '@/hooks/useBuildings';
import { useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor, Floor } from '@/hooks/useFloors';
import { useZonesByFloorIds, useCreateZone, useUpdateZone, useDeleteZone, Zone } from '@/hooks/useZones';
import { useEquipmentCountsByZone, useEquipmentDetailsByZoneIds } from '@/hooks/useEquipmentByLocation';
import { useCreateEquipment, Equipment } from '@/hooks/useEquipment';
import { EquipmentDetailDrawer } from '@/components/equipment/EquipmentDetailDrawer';
import { cn } from '@/lib/utils';

const equipmentTypes = [
  { value: 'ahu', label: 'Air Handling Unit' },
  { value: 'chiller', label: 'Chiller' },
  { value: 'boiler', label: 'Boiler' },
  { value: 'pump', label: 'Pump' },
  { value: 'fan', label: 'Fan' },
  { value: 'vav', label: 'VAV Box' },
  { value: 'fcu', label: 'Fan Coil Unit' },
  { value: 'vrf', label: 'VRF System' },
  { value: 'cooling_tower', label: 'Cooling Tower' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'controller', label: 'Controller' },
];

interface BuildingDetailDrawerProps {
  building: Building | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuildingDeleted?: () => void;
}

const zoneTypes = [
  { value: 'office', label: 'Office' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'corridor', label: 'Corridor' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'server_room', label: 'Server Room' },
  { value: 'storage', label: 'Storage' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'common_area', label: 'Common Area' },
  { value: 'other', label: 'Other' },
];

export function BuildingDetailDrawer({ building, open, onOpenChange, onBuildingDeleted }: BuildingDetailDrawerProps) {
  const { data: floors, isLoading: floorsLoading } = useFloors(building?.id);
  const floorIds = floors?.map(f => f.id) || [];
  const { data: allZones } = useZonesByFloorIds(floorIds);
  const zoneIds = allZones?.map(z => z.id) || [];
  const { getZoneCount, totalCount: totalEquipment } = useEquipmentCountsByZone(zoneIds);
  const { data: allEquipmentDetails = [] } = useEquipmentDetailsByZoneIds(zoneIds);
  
  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();
  const updateBuilding = useUpdateBuilding();
  const deleteBuilding = useDeleteBuilding();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const createEquipment = useCreateEquipment();

  // Floor state
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  // Building state
  const [isEditBuildingOpen, setIsEditBuildingOpen] = useState(false);
  const [isDeleteBuildingOpen, setIsDeleteBuildingOpen] = useState(false);

  // Zone state
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isEditZoneOpen, setIsEditZoneOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneFloorId, setZoneFloorId] = useState<string | null>(null);

  // Equipment state
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [equipmentZoneId, setEquipmentZoneId] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEquipmentDetailOpen, setIsEquipmentDetailOpen] = useState(false);

  const [floorFormData, setFloorFormData] = useState({
    floor_number: '',
    name: '',
    area_sqm: '',
  });

  const [buildingFormData, setBuildingFormData] = useState({
    name: '',
    address: '',
    total_floors: '',
    total_area_sqm: '',
    year_built: '',
  });

  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    zone_type: 'office',
    area_sqm: '',
    occupancy_capacity: '',
  });

  const [equipmentFormData, setEquipmentFormData] = useState({
    tag: '',
    name: '',
    equipment_type: '',
  });

  const getFloorZones = (floorId: string) => {
    return (allZones || []).filter(z => z.floor_id === floorId);
  };

  const getZoneEquipment = (zoneId: string) => {
    return allEquipmentDetails.filter(eq => eq.zone_id === zoneId);
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-success/10 text-success border-success/20';
      case 'maintenance':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'offline':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const openEquipmentDetail = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsEquipmentDetailOpen(true);
  };

  const toggleFloorExpanded = (floorId: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(floorId)) {
        next.delete(floorId);
      } else {
        next.add(floorId);
      }
      return next;
    });
  };

  // Floor handlers
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building) return;

    await createFloor.mutateAsync({
      building_id: building.id,
      floor_number: parseInt(floorFormData.floor_number),
      name: floorFormData.name,
      area_sqm: floorFormData.area_sqm ? parseFloat(floorFormData.area_sqm) : undefined,
    });

    setIsAddFloorOpen(false);
    setFloorFormData({ floor_number: '', name: '', area_sqm: '' });
  };

  const handleEditFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloor) return;

    await updateFloor.mutateAsync({
      id: selectedFloor.id,
      floor_number: parseInt(floorFormData.floor_number),
      name: floorFormData.name,
      area_sqm: floorFormData.area_sqm ? parseFloat(floorFormData.area_sqm) : null,
    });

    setIsEditFloorOpen(false);
    setSelectedFloor(null);
    setFloorFormData({ floor_number: '', name: '', area_sqm: '' });
  };

  const handleDeleteFloor = async (floor: Floor) => {
    if (!building) return;
    await deleteFloor.mutateAsync({ id: floor.id, buildingId: building.id });
  };

  const openEditFloorDialog = (floor: Floor) => {
    setSelectedFloor(floor);
    setFloorFormData({
      floor_number: floor.floor_number.toString(),
      name: floor.name,
      area_sqm: floor.area_sqm?.toString() || '',
    });
    setIsEditFloorOpen(true);
  };

  const openAddFloorDialog = () => {
    const nextFloorNumber = floors?.length ? Math.max(...floors.map(f => f.floor_number)) + 1 : 1;
    setFloorFormData({
      floor_number: nextFloorNumber.toString(),
      name: `Floor ${nextFloorNumber}`,
      area_sqm: '',
    });
    setIsAddFloorOpen(true);
  };

  // Building handlers
  const openEditBuildingDialog = () => {
    if (!building) return;
    setBuildingFormData({
      name: building.name,
      address: building.address || '',
      total_floors: building.total_floors?.toString() || '',
      total_area_sqm: building.total_area_sqm?.toString() || '',
      year_built: building.year_built?.toString() || '',
    });
    setIsEditBuildingOpen(true);
  };

  const handleEditBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building) return;

    await updateBuilding.mutateAsync({
      id: building.id,
      name: buildingFormData.name,
      address: buildingFormData.address || null,
      total_floors: buildingFormData.total_floors ? parseInt(buildingFormData.total_floors) : null,
      total_area_sqm: buildingFormData.total_area_sqm ? parseFloat(buildingFormData.total_area_sqm) : null,
      year_built: buildingFormData.year_built ? parseInt(buildingFormData.year_built) : null,
    });

    setIsEditBuildingOpen(false);
  };

  const handleDeleteBuilding = async () => {
    if (!building) return;
    await deleteBuilding.mutateAsync(building.id);
    setIsDeleteBuildingOpen(false);
    onOpenChange(false);
    onBuildingDeleted?.();
  };

  // Zone handlers
  const openAddZoneDialog = (floorId: string) => {
    setZoneFloorId(floorId);
    setZoneFormData({
      name: '',
      zone_type: 'office',
      area_sqm: '',
      occupancy_capacity: '',
    });
    setIsAddZoneOpen(true);
  };

  const openEditZoneDialog = (zone: Zone) => {
    setSelectedZone(zone);
    setZoneFormData({
      name: zone.name,
      zone_type: zone.zone_type || 'office',
      area_sqm: zone.area_sqm?.toString() || '',
      occupancy_capacity: zone.occupancy_capacity?.toString() || '',
    });
    setIsEditZoneOpen(true);
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFloorId) return;

    await createZone.mutateAsync({
      floor_id: zoneFloorId,
      name: zoneFormData.name,
      zone_type: zoneFormData.zone_type,
      area_sqm: zoneFormData.area_sqm ? parseFloat(zoneFormData.area_sqm) : undefined,
      occupancy_capacity: zoneFormData.occupancy_capacity ? parseInt(zoneFormData.occupancy_capacity) : undefined,
    });

    setIsAddZoneOpen(false);
    setZoneFloorId(null);
    setZoneFormData({ name: '', zone_type: 'office', area_sqm: '', occupancy_capacity: '' });
  };

  const handleEditZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    await updateZone.mutateAsync({
      id: selectedZone.id,
      name: zoneFormData.name,
      zone_type: zoneFormData.zone_type,
      area_sqm: zoneFormData.area_sqm ? parseFloat(zoneFormData.area_sqm) : 0,
      occupancy_capacity: zoneFormData.occupancy_capacity ? parseInt(zoneFormData.occupancy_capacity) : 0,
    });

    setIsEditZoneOpen(false);
    setSelectedZone(null);
    setZoneFormData({ name: '', zone_type: 'office', area_sqm: '', occupancy_capacity: '' });
  };

  const handleDeleteZone = async (zone: Zone) => {
    await deleteZone.mutateAsync({ id: zone.id, floorId: zone.floor_id });
  };

  // Equipment handlers
  const openAddEquipmentDialog = (zoneId: string) => {
    setEquipmentZoneId(zoneId);
    setEquipmentFormData({ tag: '', name: '', equipment_type: '' });
    setIsAddEquipmentOpen(true);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentZoneId || !equipmentFormData.tag || !equipmentFormData.name) return;

    // Note: project_id is automatically assigned by database trigger based on zone hierarchy
    await createEquipment.mutateAsync({
      tag: equipmentFormData.tag,
      name: equipmentFormData.name,
      equipment_type: equipmentFormData.equipment_type || undefined,
      zone_id: equipmentZoneId,
    });

    setIsAddEquipmentOpen(false);
    setEquipmentZoneId(null);
    setEquipmentFormData({ tag: '', name: '', equipment_type: '' });
  };

  if (!building) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DrawerTitle>{building.name}</DrawerTitle>
                  <DrawerDescription>
                    {building.address || 'No address specified'}
                  </DrawerDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={openEditBuildingDialog}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setIsDeleteBuildingOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto space-y-6">
            {/* Building Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {building.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{building.address}</span>
                </div>
              )}
              {building.total_floors && (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span>{building.total_floors} floors</span>
                </div>
              )}
              {building.total_area_sqm && (
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span>{building.total_area_sqm.toLocaleString()} m²</span>
                </div>
              )}
              {building.year_built && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span>Built {building.year_built}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{floors?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Floors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{allZones?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Zones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{totalEquipment}</p>
                  <p className="text-xs text-muted-foreground">Equipment</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {floors?.reduce((sum, f) => sum + (f.area_sqm || 0), 0).toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total m²</p>
                </CardContent>
              </Card>
            </div>

            {/* Floors Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Floors & Zones</h3>
                <Button size="sm" variant="outline" onClick={openAddFloorDialog}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Floor
                </Button>
              </div>

              {floorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : floors && floors.length > 0 ? (
                <div className="space-y-2">
                  {floors.map((floor) => {
                    const floorZones = getFloorZones(floor.id);
                    const isExpanded = expandedFloors.has(floor.id);

                    return (
                      <Collapsible key={floor.id} open={isExpanded}>
                        <Card className="group">
                          <CardContent className="p-0">
                            <CollapsibleTrigger asChild>
                              <div
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleFloorExpanded(floor.id)}
                              >
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <Badge variant="secondary" className="min-w-[60px] justify-center">
                                    {floor.floor_number === 0
                                      ? 'GF'
                                      : floor.floor_number < 0
                                      ? `B${Math.abs(floor.floor_number)}`
                                      : `F${floor.floor_number}`}
                                  </Badge>
                                  <div>
                                    <p className="text-sm font-medium">{floor.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {floor.area_sqm ? `${floor.area_sqm.toLocaleString()} m²` : ''}
                                      {floorZones.length > 0 && ` • ${floorZones.length} zone${floorZones.length > 1 ? 's' : ''}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => openAddZoneDialog(floor.id)}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => openEditFloorDialog(floor)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteFloor(floor)}
                                    disabled={deleteFloor.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-3 pb-3 pl-10 space-y-2">
                                {floorZones.length > 0 ? (
                                  floorZones.map((zone) => {
                                    const zoneEquipment = getZoneEquipment(zone.id);
                                    
                                    return (
                                      <div key={zone.id} className="space-y-2">
                                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 group/zone">
                                          <div className="flex items-center gap-2">
                                            <Square className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-sm">{zone.name}</span>
                                            <Badge variant="outline" className="text-xs capitalize">
                                              {zone.zone_type?.replace('_', ' ') || 'Office'}
                                            </Badge>
                                            {getZoneCount(zone.id) > 0 && (
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Wrench className="w-3 h-3" />
                                                {getZoneCount(zone.id)}
                                              </span>
                                            )}
                                            {zone.area_sqm > 0 && (
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Ruler className="w-3 h-3" />
                                                {zone.area_sqm} m²
                                              </span>
                                            )}
                                            {zone.occupancy_capacity > 0 && (
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {zone.occupancy_capacity}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/zone:opacity-100 transition-opacity">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6"
                                              title="Add Equipment"
                                              onClick={() => openAddEquipmentDialog(zone.id)}
                                            >
                                              <Box className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6"
                                              onClick={() => openEditZoneDialog(zone)}
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6 text-destructive hover:text-destructive"
                                              onClick={() => handleDeleteZone(zone)}
                                              disabled={deleteZone.isPending}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {/* Equipment List */}
                                        {zoneEquipment.length > 0 && (
                                          <div className="ml-5 space-y-1">
                                            {zoneEquipment.map((eq) => (
                                              <div
                                                key={eq.id}
                                                className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background border border-border/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                                                onClick={() => openEquipmentDetail(eq)}
                                              >
                                                <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium truncate">{eq.name}</p>
                                                  <p className="text-[10px] text-muted-foreground truncate">
                                                    {eq.tag}
                                                    {eq.manufacturer && ` • ${eq.manufacturer}`}
                                                  </p>
                                                </div>
                                                <Badge
                                                  variant="outline"
                                                  className={cn(
                                                    'text-[10px] capitalize shrink-0',
                                                    getEquipmentStatusColor(eq.status)
                                                  )}
                                                >
                                                  {eq.status}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-4 text-sm text-muted-foreground">
                                    No zones yet.{' '}
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 h-auto"
                                      onClick={() => openAddZoneDialog(floor.id)}
                                    >
                                      Add one
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </CardContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Layers className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No floors added yet</p>
                    <Button
                      size="sm"
                      variant="link"
                      className="mt-2"
                      onClick={openAddFloorDialog}
                    >
                      Add your first floor
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Add Floor Dialog */}
      <Dialog open={isAddFloorOpen} onOpenChange={setIsAddFloorOpen}>
        <DialogContent>
          <form onSubmit={handleAddFloor}>
            <DialogHeader>
              <DialogTitle>Add Floor</DialogTitle>
              <DialogDescription>
                Add a new floor to {building.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor_number">Floor Number *</Label>
                  <Input
                    id="floor_number"
                    type="number"
                    placeholder="e.g., 1, -1 for basement"
                    value={floorFormData.floor_number}
                    onChange={(e) =>
                      setFloorFormData({ ...floorFormData, floor_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor_name">Floor Name *</Label>
                  <Input
                    id="floor_name"
                    placeholder="e.g., Ground Floor, Mezzanine"
                    value={floorFormData.name}
                    onChange={(e) =>
                      setFloorFormData({ ...floorFormData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_sqm">Area (m²)</Label>
                <Input
                  id="area_sqm"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={floorFormData.area_sqm}
                  onChange={(e) =>
                    setFloorFormData({ ...floorFormData, area_sqm: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddFloorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFloor.isPending}>
                {createFloor.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Floor'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Floor Dialog */}
      <Dialog open={isEditFloorOpen} onOpenChange={setIsEditFloorOpen}>
        <DialogContent>
          <form onSubmit={handleEditFloor}>
            <DialogHeader>
              <DialogTitle>Edit Floor</DialogTitle>
              <DialogDescription>Update floor details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_floor_number">Floor Number *</Label>
                  <Input
                    id="edit_floor_number"
                    type="number"
                    value={floorFormData.floor_number}
                    onChange={(e) =>
                      setFloorFormData({ ...floorFormData, floor_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_floor_name">Floor Name *</Label>
                  <Input
                    id="edit_floor_name"
                    value={floorFormData.name}
                    onChange={(e) =>
                      setFloorFormData({ ...floorFormData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_area_sqm">Area (m²)</Label>
                <Input
                  id="edit_area_sqm"
                  type="number"
                  step="0.01"
                  value={floorFormData.area_sqm}
                  onChange={(e) =>
                    setFloorFormData({ ...floorFormData, area_sqm: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditFloorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFloor.isPending}>
                {updateFloor.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Building Dialog */}
      <Dialog open={isEditBuildingOpen} onOpenChange={setIsEditBuildingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditBuilding}>
            <DialogHeader>
              <DialogTitle>Edit Building</DialogTitle>
              <DialogDescription>Update building details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_building_name">Building Name *</Label>
                <Input
                  id="edit_building_name"
                  value={buildingFormData.name}
                  onChange={(e) =>
                    setBuildingFormData({ ...buildingFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_building_address">Address</Label>
                <Input
                  id="edit_building_address"
                  value={buildingFormData.address}
                  onChange={(e) =>
                    setBuildingFormData({ ...buildingFormData, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_building_floors">Total Floors</Label>
                  <Input
                    id="edit_building_floors"
                    type="number"
                    value={buildingFormData.total_floors}
                    onChange={(e) =>
                      setBuildingFormData({ ...buildingFormData, total_floors: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_building_area">Area (m²)</Label>
                  <Input
                    id="edit_building_area"
                    type="number"
                    value={buildingFormData.total_area_sqm}
                    onChange={(e) =>
                      setBuildingFormData({ ...buildingFormData, total_area_sqm: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_building_year">Year Built</Label>
                  <Input
                    id="edit_building_year"
                    type="number"
                    value={buildingFormData.year_built}
                    onChange={(e) =>
                      setBuildingFormData({ ...buildingFormData, year_built: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditBuildingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBuilding.isPending}>
                {updateBuilding.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Building Confirmation */}
      <AlertDialog open={isDeleteBuildingOpen} onOpenChange={setIsDeleteBuildingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Building</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{building.name}"? This will also delete all floors and zones associated with this building. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteBuilding}
              disabled={deleteBuilding.isPending}
            >
              {deleteBuilding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Zone Dialog */}
      <Dialog open={isAddZoneOpen} onOpenChange={setIsAddZoneOpen}>
        <DialogContent>
          <form onSubmit={handleAddZone}>
            <DialogHeader>
              <DialogTitle>Add Zone</DialogTitle>
              <DialogDescription>Add a new zone to this floor</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zone_name">Zone Name *</Label>
                <Input
                  id="zone_name"
                  placeholder="e.g., Conference Room A, Open Office"
                  value={zoneFormData.name}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone_type">Zone Type</Label>
                <Select
                  value={zoneFormData.zone_type}
                  onValueChange={(value) => setZoneFormData({ ...zoneFormData, zone_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone_area">Area (m²)</Label>
                  <Input
                    id="zone_area"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={zoneFormData.area_sqm}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, area_sqm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone_occupancy">Occupancy Capacity</Label>
                  <Input
                    id="zone_occupancy"
                    type="number"
                    placeholder="e.g., 10"
                    value={zoneFormData.occupancy_capacity}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, occupancy_capacity: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddZoneOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createZone.isPending}>
                {createZone.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Zone'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={isEditZoneOpen} onOpenChange={setIsEditZoneOpen}>
        <DialogContent>
          <form onSubmit={handleEditZone}>
            <DialogHeader>
              <DialogTitle>Edit Zone</DialogTitle>
              <DialogDescription>Update zone details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_zone_name">Zone Name *</Label>
                <Input
                  id="edit_zone_name"
                  value={zoneFormData.name}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_zone_type">Zone Type</Label>
                <Select
                  value={zoneFormData.zone_type}
                  onValueChange={(value) => setZoneFormData({ ...zoneFormData, zone_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone type" />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_zone_area">Area (m²)</Label>
                  <Input
                    id="edit_zone_area"
                    type="number"
                    step="0.01"
                    value={zoneFormData.area_sqm}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, area_sqm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_zone_occupancy">Occupancy Capacity</Label>
                  <Input
                    id="edit_zone_occupancy"
                    type="number"
                    value={zoneFormData.occupancy_capacity}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, occupancy_capacity: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditZoneOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateZone.isPending}>
                {updateZone.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Equipment to Zone Dialog */}
      <Dialog open={isAddEquipmentOpen} onOpenChange={setIsAddEquipmentOpen}>
        <DialogContent>
          <form onSubmit={handleAddEquipment}>
            <DialogHeader>
              <DialogTitle>Add Equipment to Zone</DialogTitle>
              <DialogDescription>Add new equipment directly to this zone</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eq_tag">Equipment Tag *</Label>
                  <Input
                    id="eq_tag"
                    placeholder="e.g., AHU-01"
                    value={equipmentFormData.tag}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, tag: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eq_type">Type</Label>
                  <Select
                    value={equipmentFormData.equipment_type}
                    onValueChange={(value) => setEquipmentFormData({ ...equipmentFormData, equipment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq_name">Name *</Label>
                <Input
                  id="eq_name"
                  placeholder="e.g., Main Air Handler"
                  value={equipmentFormData.name}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                  required
                />
              </div>
              <Alert variant="default" className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The project will be assigned automatically based on the zone's building location.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEquipmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEquipment.isPending}>
                {createEquipment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Equipment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Equipment Detail Drawer */}
      <EquipmentDetailDrawer
        equipment={selectedEquipment}
        open={isEquipmentDetailOpen}
        onOpenChange={setIsEquipmentDetailOpen}
      />
    </>
  );
}
