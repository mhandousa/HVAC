import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Volume2,
  Layers,
  Download,
  Settings2,
  AlertTriangle,
  Building2,
  Filter,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useFloors } from '@/hooks/useFloors';
import { useZoneAcousticSettings } from '@/hooks/useZoneAcousticSettings';
import { MultiZoneAcousticChart } from '@/components/acoustic/MultiZoneAcousticChart';
import type { ZoneConfig } from '@/hooks/useMultiZoneAcousticReadings';
import type { TimeRange } from '@/hooks/useAcousticReadings';

const MAX_ZONES = 8;

export default function AcousticComparison() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Get floors for selected project
  const { data: floors = [] } = useFloors(selectedProjectId || undefined);

  // Get zones with acoustic settings
  const { data: zones = [] } = useZoneAcousticSettings(
    selectedProjectId || undefined,
    selectedFloorId !== 'all' ? selectedFloorId : undefined
  );

  // Filter zones by floor if selected
  const filteredZones = useMemo(() => {
    if (selectedFloorId === 'all') return zones;
    return zones.filter(z => z.floor_id === selectedFloorId);
  }, [zones, selectedFloorId]);

  // Build zone configs for selected zones
  const selectedZoneConfigs: ZoneConfig[] = useMemo(() => {
    return filteredZones
      .filter(z => selectedZoneIds.has(z.id))
      .map(z => ({
        id: z.id,
        name: z.name,
        deviceId: z.acoustic_measurement_device_id || undefined,
        targetNC: z.target_nc || 35,
      }));
  }, [filteredZones, selectedZoneIds]);

  const handleZoneToggle = (zoneId: string, checked: boolean) => {
    const newSet = new Set(selectedZoneIds);
    if (checked && newSet.size < MAX_ZONES) {
      newSet.add(zoneId);
    } else {
      newSet.delete(zoneId);
    }
    setSelectedZoneIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedZoneIds.size === filteredZones.length || selectedZoneIds.size >= MAX_ZONES) {
      setSelectedZoneIds(new Set());
    } else {
      setSelectedZoneIds(new Set(filteredZones.slice(0, MAX_ZONES).map(z => z.id)));
    }
  };

  const handleQuickSelect = (type: 'exceeding' | 'floor' | 'clear') => {
    if (type === 'clear') {
      setSelectedZoneIds(new Set());
      return;
    }

    // For exceeding zones, we'd need actual reading data
    // For now, just select first few zones as demo
    const zonesToSelect = filteredZones.slice(0, Math.min(4, MAX_ZONES));
    setSelectedZoneIds(new Set(zonesToSelect.map(z => z.id)));
  };

  const exportCSV = () => {
    if (selectedZoneConfigs.length === 0) return;

    const headers = ['Zone', 'Target NC', 'Device Linked'];
    const rows = selectedZoneConfigs.map(z => [
      z.name,
      `NC-${z.targetNC}`,
      z.deviceId ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acoustic-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Acoustic Dashboard', href: '/design/acoustic-dashboard' },
            { label: 'Zone Comparison' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acoustic Zone Comparison</h1>
              <p className="text-muted-foreground">
                Compare NC levels across multiple zones for commissioning diagnostics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={exportCSV}
              disabled={selectedZoneConfigs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/design/acoustic-settings')}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Zone Settings
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Zone Selection Panel */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Zones</CardTitle>
              <CardDescription>
                Choose up to {MAX_ZONES} zones to compare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Floor Filter */}
              {selectedProjectId && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Floor</Label>
                  <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All floors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      {floors.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quick Actions */}
              {selectedProjectId && filteredZones.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {selectedZoneIds.size > 0 ? 'Clear All' : 'Select All'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickSelect('exceeding')}
                    className="text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Exceeding
                  </Button>
                </div>
              )}

              {/* Zone Checkboxes */}
              {!selectedProjectId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a project to view zones</p>
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No zones found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredZones.map(zone => {
                    const isSelected = selectedZoneIds.has(zone.id);
                    const isDisabled = !isSelected && selectedZoneIds.size >= MAX_ZONES;

                    return (
                      <label
                        key={zone.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleZoneToggle(zone.id, !!checked)}
                          disabled={isDisabled}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Target: NC-{zone.target_nc}
                            {zone.acoustic_measurement_device_id && (
                              <Badge variant="outline" className="ml-2 text-xs py-0">
                                Device
                              </Badge>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedZoneIds.size > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {selectedZoneIds.size} of {MAX_ZONES} zones selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Area */}
          <div className="lg:col-span-3">
            <MultiZoneAcousticChart
              zones={selectedZoneConfigs}
              timeRange={timeRange}
              height={350}
              showTargetLine
              showLegend
              showSummaryTable
              title="NC Level Comparison"
              description={`Comparing ${selectedZoneConfigs.length} zone${selectedZoneConfigs.length !== 1 ? 's' : ''} over ${timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}`}
              onZoneClick={(zoneId) => navigate(`/design/acoustic-settings?zone=${zoneId}`)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
