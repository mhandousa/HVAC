import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Snowflake, Settings2, AlertCircle, ExternalLink } from 'lucide-react';
import { calculateChillerSizing, type ChillerSizingResult } from '@/lib/chilled-water-plant-calculations';
import type { ChillerConfig } from '@/hooks/useChilledWaterPlants';

interface ChillerConfigPanelProps {
  plantId?: string | null;
  designLoadTons: number;
  diversityFactor: number;
  futureExpansionPercent: number;
  chillerType: 'water-cooled' | 'air-cooled';
  redundancyMode: 'n' | 'n+1' | '2n';
  manualChillerCount: number | null;
  onChillerTypeChange: (value: 'water-cooled' | 'air-cooled') => void;
  onRedundancyModeChange: (value: 'n' | 'n+1' | '2n') => void;
  onManualChillerCountChange: (value: number | null) => void;
  onChillerConfigChange: (config: ChillerConfig) => void;
}

export function ChillerConfigPanel({
  plantId,
  designLoadTons,
  diversityFactor,
  futureExpansionPercent,
  chillerType,
  redundancyMode,
  manualChillerCount,
  onChillerTypeChange,
  onRedundancyModeChange,
  onManualChillerCountChange,
  onChillerConfigChange,
}: ChillerConfigPanelProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  
  // Calculate chiller sizing
  const chillerResult = useMemo(() => {
    if (designLoadTons <= 0) return null;
    
    const result = calculateChillerSizing({
      designLoadTons,
      diversityFactor,
      futureExpansionPercent,
      redundancyMode,
      preferredChillerCount: manualChillerCount || undefined,
      chillerType,
    });
    
    // Update parent with config
    const config: ChillerConfig = {
      chillerType,
      numberOfChillers: result.numberOfChillers,
      capacityPerChillerTons: result.capacityPerChillerTons,
      totalInstalledCapacityTons: result.installedCapacityTons,
      redundancyMode,
      partLoadAtDesign: result.partLoadAtDesign,
    };
    onChillerConfigChange(config);
    
    return result;
  }, [designLoadTons, diversityFactor, futureExpansionPercent, redundancyMode, manualChillerCount, chillerType]);
  
  const useManualCount = manualChillerCount !== null;
  
  return (
    <div className="space-y-6">
      {/* Chiller Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Snowflake className="h-5 w-5" />
            Chiller Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Chiller Type</Label>
              <Select
                value={chillerType}
                onValueChange={(value: 'water-cooled' | 'air-cooled') => onChillerTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water-cooled">Water-Cooled Chiller</SelectItem>
                  <SelectItem value="air-cooled">Air-Cooled Chiller</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {chillerType === 'water-cooled' 
                  ? 'Requires cooling tower, higher efficiency, typical for large plants'
                  : 'No cooling tower needed, simpler installation, lower efficiency'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Redundancy Mode</Label>
              <Select
                value={redundancyMode}
                onValueChange={(value: 'n' | 'n+1' | '2n') => onRedundancyModeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="n">N (No Redundancy)</SelectItem>
                  <SelectItem value="n+1">N+1 (One Standby)</SelectItem>
                  <SelectItem value="2n">2N (Full Redundancy)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {redundancyMode === 'n' && 'No backup chiller - lowest cost'}
                {redundancyMode === 'n+1' && 'One standby chiller for maintenance/failure'}
                {redundancyMode === '2n' && 'Full redundancy - mission critical facilities'}
              </p>
            </div>
          </div>
          
          {/* Manual Override */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Manual Chiller Count Override</Label>
              <p className="text-xs text-muted-foreground">
                Override the auto-calculated number of chillers
              </p>
            </div>
            <Switch
              checked={useManualCount}
              onCheckedChange={(checked) => {
                if (!checked) {
                  onManualChillerCountChange(null);
                } else {
                  onManualChillerCountChange(chillerResult?.numberOfChillers || 2);
                }
              }}
            />
          </div>
          
          {useManualCount && (
            <div className="space-y-2">
              <Label>Number of Chillers</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={manualChillerCount || 2}
                onChange={(e) => onManualChillerCountChange(Number(e.target.value))}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Sizing Results */}
      {chillerResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Chiller Sizing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Required Capacity</p>
                <p className="text-2xl font-bold">{chillerResult.totalRequiredCapacityTons}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Number of Chillers</p>
                <p className="text-2xl font-bold text-primary">{chillerResult.numberOfChillers}</p>
                <p className="text-xs text-muted-foreground">units</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Each Chiller</p>
                <p className="text-2xl font-bold">{chillerResult.capacityPerChillerTons}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Installed Capacity</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{chillerResult.installedCapacityTons}</p>
                <p className="text-xs text-muted-foreground">tons total</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Redundancy</span>
                <Badge variant={chillerResult.redundancyPercent > 0 ? 'default' : 'secondary'}>
                  +{chillerResult.redundancyPercent}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Part Load at Design</span>
                <Badge variant={chillerResult.partLoadAtDesign < 90 ? 'default' : 'secondary'}>
                  {chillerResult.partLoadAtDesign}%
                </Badge>
              </div>
            </div>
            
            {chillerResult.partLoadAtDesign > 95 && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">High Part Load</p>
                  <p>Chillers will operate near full capacity at design conditions. Consider adding another chiller or increasing capacity for better efficiency and reliability.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Chiller Schedule Preview */}
      {chillerResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chiller Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tag</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Capacity (Tons)</th>
                    <th className="text-right p-2">Capacity (kW)</th>
                    <th className="text-center p-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: chillerResult.numberOfChillers }, (_, i) => {
                    const isStandby = redundancyMode === 'n+1' && i === chillerResult.numberOfChillers - 1;
                    const is2nStandby = redundancyMode === '2n' && i >= chillerResult.numberOfChillers / 2;
                    
                    return (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-mono">CH-{String(i + 1).padStart(2, '0')}</td>
                        <td className="p-2 capitalize">{chillerType.replace('-', ' ')}</td>
                        <td className="p-2 text-right">{chillerResult.capacityPerChillerTons}</td>
                        <td className="p-2 text-right">{Math.round(chillerResult.capacityPerChillerTons * 3.517)}</td>
                        <td className="p-2 text-center">
                          {isStandby || is2nStandby ? (
                            <Badge variant="outline">Standby</Badge>
                          ) : (
                            <Badge>Duty</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Open Detailed Selection Tool */}
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const url = `/design/chiller-selection?project=${projectId || ''}${plantId ? `&plant=${plantId}` : ''}`;
                  navigate(url);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Detailed Selection Tool
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Select specific chiller models with IPLV/part-load analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
