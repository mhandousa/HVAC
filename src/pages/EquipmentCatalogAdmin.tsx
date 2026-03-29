import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Upload,
  Loader2,
  Database,
  Thermometer,
  Flame,
  Wind,
  Droplets,
  Fan,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

type EquipmentCategory = 'chiller' | 'boiler' | 'ahu' | 'fcu' | 'pump' | 'cooling-tower';

interface EquipmentItem {
  id: string;
  manufacturer: string | null;
  model_number: string | null;
  equipment_category: string;
  equipment_subcategory: string | null;
  cooling_capacity_tons: number | null;
  cooling_capacity_kw: number | null;
  eer: number | null;
  cop: number | null;
  iplv: number | null;
  list_price_sar: number | null;
  is_active: boolean | null;
  afue: number | null;
  thermal_efficiency: number | null;
  fuel_type: string | null;
  saso_certified: boolean | null;
}

const CATEGORY_ICONS: Record<EquipmentCategory, React.ReactNode> = {
  chiller: <Thermometer className="h-4 w-4" />,
  boiler: <Flame className="h-4 w-4" />,
  ahu: <Wind className="h-4 w-4" />,
  fcu: <Fan className="h-4 w-4" />,
  pump: <Droplets className="h-4 w-4" />,
  'cooling-tower': <Droplets className="h-4 w-4" />,
};

export default function EquipmentCatalogAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<EquipmentCategory>('chiller');
  const [search, setSearch] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  // Fetch equipment by category
  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment-catalog-admin', activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .eq('equipment_category', activeTab)
        .order('manufacturer', { ascending: true });
      
      if (error) throw error;
      return data as EquipmentItem[];
    },
  });

  // Get unique manufacturers
  const manufacturers = useMemo(() => {
    if (!equipment) return [];
    const unique = [...new Set(equipment.map(e => e.manufacturer).filter(Boolean))];
    return unique.sort() as string[];
  }, [equipment]);

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    
    return equipment.filter(item => {
      // Status filter
      if (filterStatus === 'active' && !item.is_active) return false;
      if (filterStatus === 'inactive' && item.is_active) return false;
      
      // Manufacturer filter
      if (filterManufacturer !== 'all' && item.manufacturer !== filterManufacturer) return false;
      
      // Search filter
      if (search) {
        const lower = search.toLowerCase();
        return (
          item.manufacturer?.toLowerCase().includes(lower) ||
          item.model_number?.toLowerCase().includes(lower) ||
          item.equipment_subcategory?.toLowerCase().includes(lower)
        );
      }
      
      return true;
    });
  }, [equipment, filterStatus, filterManufacturer, search]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_catalog')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-catalog-admin'] });
      toast.success('Equipment deleted');
    },
    onError: () => {
      toast.error('Failed to delete equipment');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('equipment_catalog')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-catalog-admin'] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Export to Excel
  const handleExport = () => {
    if (!filteredEquipment.length) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredEquipment.map(item => ({
      Manufacturer: item.manufacturer,
      Model: item.model_number,
      Category: item.equipment_category,
      Subcategory: item.equipment_subcategory,
      'Capacity (Tons)': item.cooling_capacity_tons,
      'Capacity (kW)': item.cooling_capacity_kw,
      EER: item.eer,
      COP: item.cop,
      IPLV: item.iplv,
      AFUE: item.afue,
      'Thermal Efficiency': item.thermal_efficiency,
      'Fuel Type': item.fuel_type,
      'Price (SAR)': item.list_price_sar,
      'SASO Certified': item.saso_certified ? 'Yes' : 'No',
      Active: item.is_active ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `equipment-catalog-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel');
  };

  // Import from Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      toast.info(`Found ${jsonData.length} rows. Import functionality coming soon.`);
    } catch (error) {
      toast.error('Failed to read Excel file');
    }

    event.target.value = '';
  };

  const getCategoryColumns = (category: EquipmentCategory) => {
    const commonColumns = ['Manufacturer', 'Model', 'Subcategory'];
    
    switch (category) {
      case 'chiller':
        return [...commonColumns, 'Capacity (Tons)', 'EER', 'IPLV', 'Price (SAR)', 'Status'];
      case 'boiler':
        return [...commonColumns, 'Capacity (BTU/h)', 'AFUE', 'Fuel Type', 'Price (SAR)', 'Status'];
      case 'ahu':
      case 'fcu':
        return [...commonColumns, 'Capacity (CFM)', 'Cooling (Tons)', 'Price (SAR)', 'Status'];
      case 'pump':
        return [...commonColumns, 'Flow (GPM)', 'Head (ft)', 'HP', 'Price (SAR)', 'Status'];
      case 'cooling-tower':
        return [...commonColumns, 'Capacity (Tons)', 'Approach (°F)', 'Price (SAR)', 'Status'];
      default:
        return commonColumns;
    }
  };

  const renderCellValue = (item: EquipmentItem, category: EquipmentCategory) => {
    switch (category) {
      case 'chiller':
        return (
          <>
            <TableCell className="text-right">{item.cooling_capacity_tons || '-'}</TableCell>
            <TableCell className="text-right">{item.eer?.toFixed(2) || '-'}</TableCell>
            <TableCell className="text-right">{item.iplv?.toFixed(2) || '-'}</TableCell>
          </>
        );
      case 'boiler':
        return (
          <>
            <TableCell className="text-right">
              {item.cooling_capacity_kw ? (item.cooling_capacity_kw * 3412).toLocaleString() : '-'}
            </TableCell>
            <TableCell className="text-right">{item.afue ? `${(item.afue * 100).toFixed(0)}%` : '-'}</TableCell>
            <TableCell>{item.fuel_type || '-'}</TableCell>
          </>
        );
      default:
        return (
          <>
            <TableCell className="text-right">{item.cooling_capacity_tons || '-'}</TableCell>
            <TableCell className="text-right">{item.eer?.toFixed(2) || '-'}</TableCell>
            <TableCell className="text-right">{item.cop?.toFixed(2) || '-'}</TableCell>
          </>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6" />
                Equipment Catalog Management
              </h1>
              <p className="text-muted-foreground">
                Manage equipment catalog data for selection tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="import-file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => {
              setEditingItem(null);
              setEditDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EquipmentCategory)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="chiller" className="gap-2">
              {CATEGORY_ICONS.chiller}
              Chillers
            </TabsTrigger>
            <TabsTrigger value="boiler" className="gap-2">
              {CATEGORY_ICONS.boiler}
              Boilers
            </TabsTrigger>
            <TabsTrigger value="ahu" className="gap-2">
              {CATEGORY_ICONS.ahu}
              AHUs
            </TabsTrigger>
            <TabsTrigger value="fcu" className="gap-2">
              {CATEGORY_ICONS.fcu}
              FCUs
            </TabsTrigger>
            <TabsTrigger value="pump" className="gap-2">
              {CATEGORY_ICONS.pump}
              Pumps
            </TabsTrigger>
            <TabsTrigger value="cooling-tower" className="gap-2">
              {CATEGORY_ICONS['cooling-tower']}
              Towers
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {CATEGORY_ICONS[activeTab]}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Catalog
                </CardTitle>
                <CardDescription>
                  {filteredEquipment.length} items found
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search manufacturer, model..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Manufacturers</SelectItem>
                      {manufacturers.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getCategoryColumns(activeTab).map(col => (
                            <TableHead key={col}>{col}</TableHead>
                          ))}
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEquipment.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.manufacturer}</TableCell>
                            <TableCell>{item.model_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.equipment_subcategory || '-'}
                              </Badge>
                            </TableCell>
                            {renderCellValue(item, activeTab)}
                            <TableCell className="text-right">
                              {item.list_price_sar?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {item.manufacturer} {item.model_number}?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(item.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredEquipment.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={getCategoryColumns(activeTab).length + 1} className="h-24 text-center text-muted-foreground">
                              No equipment found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Equipment' : 'Add Equipment'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update equipment details' : 'Add new equipment to the catalog'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input 
                    defaultValue={editingItem?.manufacturer || ''} 
                    placeholder="e.g., Carrier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model Number</Label>
                  <Input 
                    defaultValue={editingItem?.model_number || ''} 
                    placeholder="e.g., 19XR-0500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select defaultValue={activeTab}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chiller">Chiller</SelectItem>
                      <SelectItem value="boiler">Boiler</SelectItem>
                      <SelectItem value="ahu">AHU</SelectItem>
                      <SelectItem value="fcu">FCU</SelectItem>
                      <SelectItem value="pump">Pump</SelectItem>
                      <SelectItem value="cooling-tower">Cooling Tower</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Input 
                    defaultValue={editingItem?.equipment_subcategory || ''} 
                    placeholder="e.g., water-cooled-centrifugal"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Capacity (Tons)</Label>
                  <Input 
                    type="number"
                    defaultValue={editingItem?.cooling_capacity_tons || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>EER</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    defaultValue={editingItem?.eer || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>IPLV</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    defaultValue={editingItem?.iplv || ''} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>List Price (SAR)</Label>
                  <Input 
                    type="number"
                    defaultValue={editingItem?.list_price_sar || ''} 
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Switch defaultChecked={editingItem?.is_active ?? true} />
                  <Label>Active</Label>
                  <Switch defaultChecked={editingItem?.saso_certified ?? false} />
                  <Label>SASO Certified</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.info('Save functionality coming soon');
                setEditDialogOpen(false);
              }}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
