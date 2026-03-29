import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Volume2,
  Settings2,
  Bell,
  Target,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { useProjects } from '@/hooks/useProjects';
import { useFloors } from '@/hooks/useFloors';
import { 
  useZoneAcousticSettings, 
  useUpdateZoneAcousticSettings,
  useBulkUpdateZoneAcousticSettings,
  useAcousticDevices,
  NC_PRESETS,
  type ZoneAcousticSettings as ZoneSettings,
} from '@/hooks/useZoneAcousticSettings';

export default function ZoneAcousticSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const initialProjectId = searchParams.get('project') || storedProjectId || '';
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  
  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [editingZone, setEditingZone] = useState<ZoneSettings | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [bulkSettings, setBulkSettings] = useState({ target_nc: 35, nc_tolerance: 3 });
  
  const { data: projects = [] } = useProjects();
  const { data: floors = [] } = useFloors(selectedProjectId);
  const { data: zones = [], isLoading } = useZoneAcousticSettings(selectedProjectId, selectedFloorId);
  const { data: acousticDevices = [] } = useAcousticDevices();
  
  const updateSettings = useUpdateZoneAcousticSettings();
  const bulkUpdate = useBulkUpdateZoneAcousticSettings();
  
  // Summary stats
  const stats = useMemo(() => {
    if (zones.length === 0) return { total: 0, alertsEnabled: 0, avgNC: 0 };
    return {
      total: zones.length,
      alertsEnabled: zones.filter(z => z.acoustic_alerts_enabled).length,
      avgNC: Math.round(zones.reduce((sum, z) => sum + z.target_nc, 0) / zones.length),
    };
  }, [zones]);
  
  const handleSaveZone = async (zone: ZoneSettings) => {
    await updateSettings.mutateAsync({
      id: zone.id,
      target_nc: zone.target_nc,
      nc_tolerance: zone.nc_tolerance,
      acoustic_alerts_enabled: zone.acoustic_alerts_enabled,
      acoustic_alert_severity: zone.acoustic_alert_severity,
      acoustic_measurement_device_id: zone.acoustic_measurement_device_id,
    });
    setEditingZone(null);
  };
  
  const handleBulkUpdate = async () => {
    if (selectedZoneIds.length === 0) return;
    await bulkUpdate.mutateAsync({
      zoneIds: selectedZoneIds,
      settings: bulkSettings,
    });
    setSelectedZoneIds([]);
    setBulkEditOpen(false);
  };
  
  const handleApplyPreset = (zoneType: string) => {
    const preset = NC_PRESETS[zoneType];
    if (preset && editingZone) {
      setEditingZone({ ...editingZone, target_nc: preset.nc });
    }
  };
  
  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };
  
  const selectAllZones = () => {
    if (selectedZoneIds.length === zones.length) {
      setSelectedZoneIds([]);
    } else {
      setSelectedZoneIds(zones.map(z => z.id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Volume2 className="h-6 w-6" />
              Zone Acoustic Settings
            </h1>
            <p className="text-muted-foreground">
              Configure target NC levels, tolerances, and alerts for each zone
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedZoneIds.length > 0 && (
              <Button variant="outline" onClick={() => setBulkEditOpen(true)}>
                <Layers className="h-4 w-4 mr-2" />
                Bulk Edit ({selectedZoneIds.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/design/acoustic-dashboard')}>
              <Target className="h-4 w-4 mr-2" />
              Acoustic Dashboard
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={(v) => {
                  setSelectedProjectId(v);
                  setSelectedFloorId('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Floor</Label>
                <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!selectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floors.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Avg NC: <strong>{stats.avgNC}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>Alerts: <strong>{stats.alertsEnabled}/{stats.total}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Zones Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Settings</CardTitle>
            <CardDescription>
              Click on a zone to edit its acoustic monitoring configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFloorId ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Select a project and floor to view zones</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">Loading zones...</div>
            ) : zones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>No zones found for this floor</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.length === zones.length}
                        onChange={selectAllZones}
                        className="rounded border-input"
                      />
                    </TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Target NC</TableHead>
                    <TableHead className="text-center">Tolerance</TableHead>
                    <TableHead className="text-center">Alerts</TableHead>
                    <TableHead>Linked Device</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map(zone => (
                    <TableRow 
                      key={zone.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        selectedZoneIds.includes(zone.id) && 'bg-primary/5'
                      )}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedZoneIds.includes(zone.id)}
                          onChange={() => toggleZoneSelection(zone.id)}
                          className="rounded border-input"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{zone.zone_type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">NC-{zone.target_nc}</Badge>
                      </TableCell>
                      <TableCell className="text-center">±{zone.nc_tolerance} dB</TableCell>
                      <TableCell className="text-center">
                        {zone.acoustic_alerts_enabled ? (
                          <Badge variant={zone.acoustic_alert_severity === 'critical' ? 'destructive' : 'default'}>
                            {zone.acoustic_alert_severity}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Disabled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {zone.acoustic_measurement_device_id ? (
                          <span className="text-sm">
                            {acousticDevices.find(d => d.id === zone.acoustic_measurement_device_id)?.name || 'Device'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingZone(zone)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* NC Presets Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NC Level Guidelines (ASHRAE/SBC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(NC_PRESETS).map(([type, preset]) => (
                <div 
                  key={type}
                  className="rounded-lg border p-3 text-sm hover:bg-muted/50 cursor-pointer"
                  onClick={() => editingZone && handleApplyPreset(type)}
                >
                  <div className="font-medium">{type}</div>
                  <div className="text-muted-foreground text-xs mt-1">{preset.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Zone Dialog */}
        <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Acoustic Settings: {editingZone?.name}</DialogTitle>
              <DialogDescription>
                Configure target NC level, tolerance, and alert preferences
              </DialogDescription>
            </DialogHeader>
            
            {editingZone && (
              <div className="space-y-6 py-4">
                {/* Target NC */}
                <div className="space-y-3">
                  <Label>Target NC Level</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[editingZone.target_nc]}
                      onValueChange={([v]) => setEditingZone({ ...editingZone, target_nc: v })}
                      min={20}
                      max={55}
                      step={5}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="w-16 justify-center">
                      NC-{editingZone.target_nc}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended for {editingZone.zone_type}: NC-{NC_PRESETS[editingZone.zone_type]?.nc || 35}
                  </p>
                </div>
                
                {/* Tolerance */}
                <div className="space-y-3">
                  <Label>Tolerance Threshold</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[editingZone.nc_tolerance]}
                      onValueChange={([v]) => setEditingZone({ ...editingZone, nc_tolerance: v })}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">±{editingZone.nc_tolerance} dB</span>
                  </div>
                </div>
                
                {/* Alerts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Acoustic Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications when NC exceeds target
                      </p>
                    </div>
                    <Switch
                      checked={editingZone.acoustic_alerts_enabled}
                      onCheckedChange={(v) => setEditingZone({ ...editingZone, acoustic_alerts_enabled: v })}
                    />
                  </div>
                  
                  {editingZone.acoustic_alerts_enabled && (
                    <div>
                      <Label>Alert Severity</Label>
                      <Select 
                        value={editingZone.acoustic_alert_severity}
                        onValueChange={(v: 'info' | 'warning' | 'critical') => 
                          setEditingZone({ ...editingZone, acoustic_alert_severity: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Linked Device */}
                <div>
                  <Label>Measurement Device</Label>
                  <Select 
                    value={editingZone.acoustic_measurement_device_id || 'none'}
                    onValueChange={(v) => 
                      setEditingZone({ ...editingZone, acoustic_measurement_device_id: v === 'none' ? null : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select NC meter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No device linked</SelectItem>
                      {acousticDevices.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.device_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingZone(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => editingZone && handleSaveZone(editingZone)}
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Acoustic Settings</DialogTitle>
              <DialogDescription>
                Apply settings to {selectedZoneIds.length} selected zones
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Target NC Level</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[bulkSettings.target_nc]}
                    onValueChange={([v]) => setBulkSettings({ ...bulkSettings, target_nc: v })}
                    min={20}
                    max={55}
                    step={5}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="w-16 justify-center">
                    NC-{bulkSettings.target_nc}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Tolerance Threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[bulkSettings.nc_tolerance]}
                    onValueChange={([v]) => setBulkSettings({ ...bulkSettings, nc_tolerance: v })}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">±{bulkSettings.nc_tolerance} dB</span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkUpdate} disabled={bulkUpdate.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Apply to {selectedZoneIds.length} Zones
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
