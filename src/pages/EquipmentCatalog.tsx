import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useEquipmentCatalog, useManufacturers, type EquipmentCategory } from '@/hooks/useEquipmentCatalog';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Loader2,
  Zap,
  Thermometer,
  DollarSign,
  Star,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react';

const categoryLabels: Record<EquipmentCategory, string> = {
  chiller: 'Chillers',
  ahu: 'Air Handling Units',
  fan_coil: 'Fan Coil Units',
  vrf: 'VRF Systems',
  package_unit: 'Package Units',
  boiler: 'Boilers',
  cooling_tower: 'Cooling Towers',
  pump: 'Pumps',
  split_system: 'Split Systems',
  mini_split: 'Mini Splits',
  heat_pump: 'Heat Pumps',
  erv: 'Energy Recovery',
};

const categoryColors: Record<string, string> = {
  chiller: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ahu: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  fan_coil: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  vrf: 'bg-green-500/10 text-green-500 border-green-500/20',
  package_unit: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  cooling_tower: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  pump: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  split_system: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  mini_split: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function EquipmentCatalog() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId || null;

  // Sync zone context
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 500]);
  const [sasoOnly, setSasoOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: manufacturers } = useManufacturers();
  const { data: equipment, isLoading } = useEquipmentCatalog({
    category: selectedCategory !== 'all' ? selectedCategory as EquipmentCategory : undefined,
    manufacturer: selectedManufacturer !== 'all' ? selectedManufacturer : undefined,
    sasoOnly,
  });

  if (!authLoading && !user) {
    navigate('/auth');
  }

  const filteredEquipment = equipment?.filter((item) => {
    const matchesSearch =
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.equipment_subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCapacity =
      !item.cooling_capacity_tons ||
      (item.cooling_capacity_tons >= capacityRange[0] && item.cooling_capacity_tons <= capacityRange[1]);
    
    return matchesSearch && matchesCapacity;
  });

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipment Catalog</h1>
            <p className="text-muted-foreground">
              Browse HVAC equipment from leading manufacturers with Saudi certifications
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/design')}>
            Back to Design Tools
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{equipment?.length || 0}</p>
                </div>
                <Thermometer className="w-8 h-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturers</p>
                  <p className="text-2xl font-bold">{manufacturers?.length || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SASO Certified</p>
                  <p className="text-2xl font-bold">
                    {equipment?.filter((e) => e.saso_certified).length || 0}
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">
                    {new Set(equipment?.map((e) => e.equipment_category)).size || 0}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by manufacturer, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {manufacturers?.map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {showFilters && (
                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                  <div className="space-y-3">
                    <Label>Capacity Range (Tons): {capacityRange[0]} - {capacityRange[1]}</Label>
                    <Slider
                      value={capacityRange}
                      onValueChange={(v) => setCapacityRange(v as [number, number])}
                      min={0}
                      max={500}
                      step={10}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="saso"
                      checked={sasoOnly}
                      onCheckedChange={(c) => setSasoOnly(!!c)}
                    />
                    <Label htmlFor="saso">SASO Certified Only</Label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedManufacturer('all');
                        setCapacityRange([0, 500]);
                        setSasoOnly(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>
              {filteredEquipment?.length || 0} items found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEquipment && filteredEquipment.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.manufacturer}</p>
                            <p className="text-sm text-muted-foreground">{item.model_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={categoryColors[item.equipment_category] || ''}
                          >
                            {categoryLabels[item.equipment_category as EquipmentCategory] || item.equipment_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.cooling_capacity_tons ? (
                            <span className="font-mono">{item.cooling_capacity_tons} TR</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.eer || item.seer ? (
                            <div className="text-sm">
                              {item.seer && <span>SEER {item.seer}</span>}
                              {item.eer && !item.seer && <span>EER {item.eer}</span>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.energy_rating_stars ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: item.energy_rating_stars }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {formatPrice(item.list_price_sar)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Thermometer className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">No equipment found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.manufacturer} {selectedItem?.model_number}
              </DialogTitle>
              <DialogDescription>
                {selectedItem?.equipment_subcategory || categoryLabels[selectedItem?.equipment_category as EquipmentCategory]}
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="grid gap-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={categoryColors[selectedItem.equipment_category] || ''}>
                    {categoryLabels[selectedItem.equipment_category as EquipmentCategory]}
                  </Badge>
                  {selectedItem.saso_certified && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      SASO Certified
                    </Badge>
                  )}
                  {selectedItem.ashrae_compliant && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      ASHRAE Compliant
                    </Badge>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Capacity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedItem.cooling_capacity_tons && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cooling</span>
                          <span className="font-mono">{selectedItem.cooling_capacity_tons} TR ({selectedItem.cooling_capacity_kw} kW)</span>
                        </div>
                      )}
                      {selectedItem.heating_capacity_kw && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Heating</span>
                          <span className="font-mono">{selectedItem.heating_capacity_kw} kW</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedItem.cop && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">COP</span>
                          <span className="font-mono">{selectedItem.cop}</span>
                        </div>
                      )}
                      {selectedItem.eer && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EER</span>
                          <span className="font-mono">{selectedItem.eer}</span>
                        </div>
                      )}
                      {selectedItem.seer && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SEER</span>
                          <span className="font-mono">{selectedItem.seer}</span>
                        </div>
                      )}
                      {selectedItem.iplv && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IPLV</span>
                          <span className="font-mono">{selectedItem.iplv}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Electrical</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedItem.power_input_kw && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Power Input</span>
                          <span className="font-mono">{selectedItem.power_input_kw} kW</span>
                        </div>
                      )}
                      {selectedItem.voltage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Voltage</span>
                          <span className="font-mono">{selectedItem.voltage} / {selectedItem.phases}ph</span>
                        </div>
                      )}
                      {selectedItem.full_load_amps && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">FLA</span>
                          <span className="font-mono">{selectedItem.full_load_amps} A</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">List Price</span>
                        <span className="font-mono font-bold text-primary">
                          {formatPrice(selectedItem.list_price_sar)}
                        </span>
                      </div>
                      {selectedItem.refrigerant_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Refrigerant</span>
                          <span className="font-mono">{selectedItem.refrigerant_type}</span>
                        </div>
                      )}
                      {selectedItem.energy_rating_stars && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Energy Rating</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: selectedItem.energy_rating_stars }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/equipment-catalog"
          projectId={projectIdFromUrl || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
