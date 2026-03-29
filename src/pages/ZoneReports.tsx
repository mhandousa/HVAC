import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useZoneReports, ZoneReportData } from '@/hooks/useZoneReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Building2,
  Layers,
  Box,
  Wrench,
  Thermometer,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ZONE_TYPE_COLORS: Record<string, string> = {
  office: 'hsl(var(--chart-1))',
  meeting: 'hsl(var(--chart-2))',
  lobby: 'hsl(var(--chart-3))',
  server_room: 'hsl(var(--chart-4))',
  storage: 'hsl(var(--chart-5))',
  general: 'hsl(var(--muted-foreground))',
};

export default function ZoneReports() {
  const { data, isLoading } = useZoneReports();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'equipment' | 'work_orders' | 'area'>('name');

  const zones = data?.zones || [];
  const summary = data?.summary;

  // Get unique projects and buildings for filters
  const projects = useMemo(() => {
    const uniqueProjects = new Map<string, string>();
    zones.forEach((z) => {
      if (z.project_id) uniqueProjects.set(z.project_id, z.project_name);
    });
    return Array.from(uniqueProjects, ([id, name]) => ({ id, name }));
  }, [zones]);

  const buildings = useMemo(() => {
    const uniqueBuildings = new Map<string, string>();
    zones
      .filter((z) => filterProject === 'all' || z.project_id === filterProject)
      .forEach((z) => {
        if (z.building_id) uniqueBuildings.set(z.building_id, z.building_name);
      });
    return Array.from(uniqueBuildings, ([id, name]) => ({ id, name }));
  }, [zones, filterProject]);

  // Filter and sort zones
  const filteredZones = useMemo(() => {
    let result = zones.filter((z) => {
      const matchesSearch =
        z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.building_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.floor_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = filterProject === 'all' || z.project_id === filterProject;
      const matchesBuilding = filterBuilding === 'all' || z.building_id === filterBuilding;
      return matchesSearch && matchesProject && matchesBuilding;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'equipment':
          return b.equipment_count - a.equipment_count;
        case 'work_orders':
          return b.work_order_count - a.work_order_count;
        case 'area':
          return b.area_sqm - a.area_sqm;
        default:
          return a.zone_name.localeCompare(b.zone_name);
      }
    });

    return result;
  }, [zones, searchQuery, filterProject, filterBuilding, sortBy]);

  // Chart data
  const equipmentByBuildingData = useMemo(() => {
    const byBuilding = new Map<string, number>();
    filteredZones.forEach((z) => {
      byBuilding.set(z.building_name, (byBuilding.get(z.building_name) || 0) + z.equipment_count);
    });
    return Array.from(byBuilding, ([name, count]) => ({ name, equipment: count })).slice(0, 10);
  }, [filteredZones]);

  const zoneTypeData = useMemo(() => {
    if (!summary?.zones_by_type) return [];
    return Object.entries(summary.zones_by_type).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count,
      fill: ZONE_TYPE_COLORS[type] || ZONE_TYPE_COLORS.general,
    }));
  }, [summary]);

  const handleExport = () => {
    const csv = [
      ['Zone', 'Type', 'Floor', 'Building', 'Project', 'Area (sqm)', 'Equipment', 'Work Orders', 'Open WOs', 'Cooling Load (tons)'],
      ...filteredZones.map((z) => [
        z.zone_name,
        z.zone_type,
        z.floor_name,
        z.building_name,
        z.project_name,
        z.area_sqm,
        z.equipment_count,
        z.work_order_count,
        z.open_work_orders,
        z.total_cooling_load_tons,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zone-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
          <SkeletonCard lines={6} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zone Reports</h1>
            <p className="text-muted-foreground">Analytics and insights by zone</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Zones</CardTitle>
              <Layers className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total_zones || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.total_area_sqm?.toLocaleString() || 0} sqm total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment</CardTitle>
              <Box className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total_equipment || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.avg_equipment_per_zone?.toFixed(1) || 0} avg per zone
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Work Orders</CardTitle>
              <Wrench className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total_work_orders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.open_work_orders || 0} open
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              <Thermometer className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.completion_rate?.toFixed(0) || 0}%</div>
              <Progress value={summary?.completion_rate || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Equipment by Building</CardTitle>
              <CardDescription>Distribution of equipment across buildings</CardDescription>
            </CardHeader>
            <CardContent>
              {equipmentByBuildingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={equipmentByBuildingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="equipment" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone Types</CardTitle>
              <CardDescription>Distribution by zone type</CardDescription>
            </CardHeader>
            <CardContent>
              {zoneTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={zoneTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {zoneTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search zones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filterProject} onValueChange={(v) => { setFilterProject(v); setFilterBuilding('all'); }}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-[180px]">
                  <Layers className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Buildings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="work_orders">Work Orders</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone List */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredZones.length > 0 ? (
              filteredZones.map((zone) => (
                <ZoneCard key={zone.zone_id} zone={zone} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No zones found matching your criteria
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Area</TableHead>
                    <TableHead className="text-right">Equipment</TableHead>
                    <TableHead className="text-right">Work Orders</TableHead>
                    <TableHead className="text-right">Open WOs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredZones.length > 0 ? (
                    filteredZones.map((zone) => (
                      <TableRow key={zone.zone_id}>
                        <TableCell className="font-medium">{zone.zone_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {zone.zone_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {zone.building_name} → {zone.floor_name}
                        </TableCell>
                        <TableCell className="text-right">{zone.area_sqm} sqm</TableCell>
                        <TableCell className="text-right">{zone.equipment_count}</TableCell>
                        <TableCell className="text-right">{zone.work_order_count}</TableCell>
                        <TableCell className="text-right">
                          {zone.open_work_orders > 0 ? (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {zone.open_work_orders}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No zones found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function ZoneCard({ zone }: { zone: ZoneReportData }) {
  const completionRate = zone.work_order_count > 0
    ? (zone.completed_work_orders / zone.work_order_count) * 100
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{zone.zone_name}</CardTitle>
            <CardDescription className="text-xs">
              {zone.building_name} → {zone.floor_name}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize text-xs">
            {zone.zone_type.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Equipment</p>
            <p className="font-semibold">{zone.equipment_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Work Orders</p>
            <p className="font-semibold">
              {zone.work_order_count}
              {zone.open_work_orders > 0 && (
                <span className="text-warning ml-1">({zone.open_work_orders} open)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Area</p>
            <p className="font-semibold">{zone.area_sqm} sqm</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cooling Load</p>
            <p className="font-semibold">
              {zone.total_cooling_load_tons > 0 ? `${zone.total_cooling_load_tons.toFixed(1)} tons` : '—'}
            </p>
          </div>
        </div>

        {zone.work_order_count > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>WO Completion</span>
              <span>{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
