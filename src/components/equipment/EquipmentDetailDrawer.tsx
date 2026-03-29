import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Shield,
  AlertTriangle,
  Clock,
  FileText,
  Wrench,
  Info,
  Download,
  Pencil,
  X,
  Loader2,
  Save,
  ClipboardCheck,
} from 'lucide-react';
import { Equipment, getWarrantyStatus, getEquipmentAge, useUpdateEquipment, UpdateEquipmentInput } from '@/hooks/useEquipment';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useDocuments, getSignedUrl } from '@/hooks/useDocuments';
import { toast } from 'sonner';
import { CreateChecklistFromEquipmentDialog } from './CreateChecklistFromEquipmentDialog';

interface EquipmentDetailDrawerProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDetailDrawer({
  equipment,
  open,
  onOpenChange,
}: EquipmentDetailDrawerProps) {
  const { data: workOrders = [] } = useWorkOrders();
  const { data: documents = [] } = useDocuments();
  const updateEquipment = useUpdateEquipment();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UpdateEquipmentInput>>({});
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);

  // Reset form when equipment changes or drawer closes
  useEffect(() => {
    if (equipment) {
      setEditForm({
        id: equipment.id,
        name: equipment.name,
        tag: equipment.tag,
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        equipment_type: equipment.equipment_type || '',
        capacity_value: equipment.capacity_value || undefined,
        capacity_unit: equipment.capacity_unit || '',
        install_date: equipment.install_date || '',
        warranty_expiry: equipment.warranty_expiry || '',
        status: equipment.status,
      });
    }
    if (!open) {
      setIsEditing(false);
    }
  }, [equipment, open]);

  if (!equipment) return null;

  const warrantyStatus = getWarrantyStatus(equipment.warranty_expiry);
  const equipmentAge = getEquipmentAge(equipment.install_date);

  // Filter work orders for this equipment
  const equipmentWorkOrders = workOrders.filter(
    (wo) => wo.equipment_id === equipment.id
  );

  // Filter documents for this equipment
  const equipmentDocuments = documents.filter(
    (doc) => doc.equipment_id === equipment.id
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'offline':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getWarrantyBadge = () => {
    if (warrantyStatus.status === 'expired') {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Warranty Expired
        </Badge>
      );
    }
    if (warrantyStatus.status === 'expiring-soon') {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
          <Clock className="w-3 h-3" />
          Warranty Expiring Soon
        </Badge>
      );
    }
    if (warrantyStatus.status === 'valid') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
          <Shield className="w-3 h-3" />
          Under Warranty
        </Badge>
      );
    }
    return null;
  };

  const getWorkOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600';
      case 'open':
        return 'bg-yellow-500/10 text-yellow-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDownload = async (doc: { file_path: string; name: string }) => {
    try {
      const url = await getSignedUrl(doc.file_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.click();
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleSave = async () => {
    if (!editForm.id) return;

    try {
      await updateEquipment.mutateAsync(editForm as UpdateEquipmentInput);
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    setEditForm({
      id: equipment.id,
      name: equipment.name,
      tag: equipment.tag,
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      equipment_type: equipment.equipment_type || '',
      capacity_value: equipment.capacity_value || undefined,
      capacity_unit: equipment.capacity_unit || '',
      install_date: equipment.install_date || '',
      warranty_expiry: equipment.warranty_expiry || '',
      status: equipment.status,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{equipment.name}</SheetTitle>
              <SheetDescription className="font-mono text-sm">
                {equipment.tag}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(equipment.status)}>
                {equipment.status}
              </Badge>
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">
                History ({equipmentWorkOrders.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Docs ({equipmentDocuments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {isEditing ? (
                // Edit Mode
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Pencil className="w-4 h-4" />
                        Edit Equipment
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updateEquipment.isPending}>
                          {updateEquipment.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tag">Tag</Label>
                        <Input
                          id="tag"
                          value={editForm.tag || ''}
                          onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editForm.status || 'operational'}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="equipment_type">Type</Label>
                        <Input
                          id="equipment_type"
                          value={editForm.equipment_type || ''}
                          onChange={(e) => setEditForm({ ...editForm, equipment_type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                          id="manufacturer"
                          value={editForm.manufacturer || ''}
                          onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={editForm.model || ''}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serial_number">Serial Number</Label>
                        <Input
                          id="serial_number"
                          value={editForm.serial_number || ''}
                          onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity_value">Capacity</Label>
                        <Input
                          id="capacity_value"
                          type="number"
                          value={editForm.capacity_value || ''}
                          onChange={(e) => setEditForm({ ...editForm, capacity_value: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity_unit">Unit</Label>
                        <Input
                          id="capacity_unit"
                          value={editForm.capacity_unit || ''}
                          onChange={(e) => setEditForm({ ...editForm, capacity_unit: e.target.value })}
                          placeholder="e.g., tons, kW, CFM"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="install_date">Install Date</Label>
                        <Input
                          id="install_date"
                          type="date"
                          value={editForm.install_date || ''}
                          onChange={(e) => setEditForm({ ...editForm, install_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                        <Input
                          id="warranty_expiry"
                          type="date"
                          value={editForm.warranty_expiry || ''}
                          onChange={(e) => setEditForm({ ...editForm, warranty_expiry: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // View Mode
                <>
                  {/* Lifecycle Section */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Lifecycle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Install Date</p>
                          <p className="text-sm font-medium">
                            {equipment.install_date
                              ? format(new Date(equipment.install_date), 'MMM d, yyyy')
                              : 'Not set'}
                          </p>
                          {equipmentAge.years !== null && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {equipmentAge.label}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Warranty Expiry</p>
                          <p className="text-sm font-medium">
                            {equipment.warranty_expiry
                              ? format(new Date(equipment.warranty_expiry), 'MMM d, yyyy')
                              : 'Not set'}
                          </p>
                          <div className="mt-1">{getWarrantyBadge()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equipment Details */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Equipment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm font-medium">
                            {equipment.equipment_type || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Manufacturer</p>
                          <p className="text-sm font-medium">
                            {equipment.manufacturer || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Model</p>
                          <p className="text-sm font-medium">
                            {equipment.model || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Serial Number</p>
                          <p className="text-sm font-medium font-mono">
                            {equipment.serial_number || 'Not specified'}
                          </p>
                        </div>
                        {equipment.capacity_value && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Capacity</p>
                            <p className="text-sm font-medium">
                              {equipment.capacity_value} {equipment.capacity_unit}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">
                          {equipmentWorkOrders.filter((wo) => wo.status === 'completed').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed WOs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">
                          {equipmentWorkOrders.filter((wo) => wo.status !== 'completed').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Open WOs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">{equipmentDocuments.length}</p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Create Commissioning Checklist Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowChecklistDialog(true)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Create Commissioning Checklist
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {equipmentWorkOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No service history for this equipment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {equipmentWorkOrders.map((wo) => (
                    <Card key={wo.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{wo.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {wo.description || 'No description'}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getWorkOrderStatusColor(wo.status)}
                          >
                            {wo.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            Created: {format(new Date(wo.created_at), 'MMM d, yyyy')}
                          </span>
                          {wo.completed_at && (
                            <span>
                              Completed: {format(new Date(wo.completed_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              {equipmentDocuments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No documents attached to this equipment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {equipmentDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.document_type || 'Document'} •{' '}
                                {format(new Date(doc.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Commissioning Checklist Dialog */}
        <CreateChecklistFromEquipmentDialog
          equipment={equipment}
          open={showChecklistDialog}
          onOpenChange={setShowChecklistDialog}
        />
      </SheetContent>
    </Sheet>
  );
}
