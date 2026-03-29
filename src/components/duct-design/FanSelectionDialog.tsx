import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Wind,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFanCurves, FanCurve, findBestFan, calculateSystemCurve, findOperatingPoint } from '@/hooks/useFanCurves';
import { useCreateFanSelection } from '@/hooks/useFanSelections';
import { useOrganization } from '@/hooks/useOrganization';
import { FanCurveChart } from './FanCurveChart';

interface FanSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCfm: number;
  requiredStaticPressure: number;
  staticPressure?: number;
  ductSystemId?: string;
  ahuConfigurationId?: string;
  fanType?: string;
  onSelectFan?: (fan: FanCurve) => void;
}

export function FanSelectionDialog({
  open,
  onOpenChange,
  requiredCfm,
  requiredStaticPressure,
  staticPressure = 0,
  ductSystemId,
  ahuConfigurationId,
  fanType = 'supply',
  onSelectFan,
}: FanSelectionDialogProps) {
  const { data: fans = [], isLoading } = useFanCurves();
  const { data: organization } = useOrganization();
  const createFanSelection = useCreateFanSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFan, setSelectedFan] = useState<FanCurve | null>(null);
  const [showOnlyMatching, setShowOnlyMatching] = useState(true);

  // Find best matching fans
  const rankedFans = useMemo(() => {
    if (!requiredCfm || !requiredStaticPressure) return [];
    return findBestFan(fans, requiredCfm, requiredStaticPressure);
  }, [fans, requiredCfm, requiredStaticPressure]);

  // Filter fans based on search and matching criteria
  const filteredFans = useMemo(() => {
    let result = fans;

    if (showOnlyMatching && rankedFans.length > 0) {
      const matchingIds = new Set(rankedFans.map((r) => r.fan.id));
      result = result.filter((f) => matchingIds.has(f.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.manufacturer.toLowerCase().includes(query) ||
          f.model.toLowerCase().includes(query) ||
          f.fan_type.toLowerCase().includes(query)
      );
    }

    return result;
  }, [fans, searchQuery, showOnlyMatching, rankedFans]);

  // Get operating point for selected fan
  const selectedFanAnalysis = useMemo(() => {
    if (!selectedFan || !requiredCfm || !requiredStaticPressure) return null;

    const systemCurve = calculateSystemCurve(requiredCfm, requiredStaticPressure, staticPressure);
    const operatingPoint = findOperatingPoint(selectedFan.curve_data, systemCurve);

    return { systemCurve, operatingPoint };
  }, [selectedFan, requiredCfm, requiredStaticPressure, staticPressure]);

  const handleSelect = async () => {
    if (!selectedFan || !organization?.id) return;

    const operatingPoint = selectedFanAnalysis?.operatingPoint;
    
    // Save to database
    await createFanSelection.mutateAsync({
      duct_system_id: ductSystemId,
      ahu_configuration_id: ahuConfigurationId,
      fan_tag: `FAN-${selectedFan.model}`,
      fan_type: fanType,
      fan_curve_id: selectedFan.id,
      manufacturer: selectedFan.manufacturer,
      model_number: selectedFan.model,
      design_cfm: requiredCfm,
      design_static_pressure_in: requiredStaticPressure,
      static_pressure_component_in: staticPressure,
      operating_cfm: operatingPoint?.cfm,
      operating_static_pressure_in: operatingPoint?.staticPressure,
      operating_bhp: operatingPoint?.bhp,
      operating_efficiency_percent: operatingPoint?.efficiency,
      operating_point_valid: operatingPoint?.isValid,
      motor_hp: selectedFan.motor_hp,
      motor_rpm: selectedFan.rpm,
      wheel_diameter_in: selectedFan.wheel_diameter_in,
      selected_equipment: selectedFan,
      status: 'selected',
    });

    if (onSelectFan) {
      onSelectFan(selectedFan);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Fan Selection
          </DialogTitle>
          <DialogDescription>
            Select a fan for {requiredCfm.toFixed(0)} CFM @ {requiredStaticPressure.toFixed(2)} in. w.g.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="browse" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Fans</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!selectedFan}>
              Curve Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by manufacturer, model, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={showOnlyMatching ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOnlyMatching(!showOnlyMatching)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Matching Only
                </Button>
              </div>

              {/* Requirements Summary */}
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Required Airflow</span>
                      <p className="font-medium">{requiredCfm.toFixed(0)} CFM</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Required Static Pressure</span>
                      <p className="font-medium">{requiredStaticPressure.toFixed(2)} in. w.g.</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Static Pressure Component</span>
                      <p className="font-medium">{staticPressure.toFixed(2)} in. w.g.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fan List */}
              <ScrollArea className="h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Loading fan database...
                  </div>
                ) : filteredFans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Wind className="h-8 w-8 mb-2 opacity-50" />
                    <p>No matching fans found</p>
                    <p className="text-xs">Try adjusting your search or requirements</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFans.map((fan) => {
                      const ranking = rankedFans.find((r) => r.fan.id === fan.id);
                      const isSelected = selectedFan?.id === fan.id;

                      return (
                        <Card
                          key={fan.id}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected ? 'border-primary bg-accent' : 'hover:bg-muted/50'
                          )}
                          onClick={() => setSelectedFan(fan)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Wind className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {fan.manufacturer} {fan.model}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {fan.fan_type} • {fan.motor_hp} HP • {fan.rpm} RPM
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {ranking && (
                                  <>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        'text-xs',
                                        ranking.operatingPoint.isValid
                                          ? 'text-emerald-600'
                                          : 'text-amber-600'
                                      )}
                                    >
                                      {ranking.operatingPoint.efficiency.toFixed(0)}% eff
                                    </Badge>
                                    {ranking.score > 70 && (
                                      <Badge variant="default" className="text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Best Match
                                      </Badge>
                                    )}
                                  </>
                                )}
                                {fan.max_cfm && (
                                  <span className="text-xs text-muted-foreground">
                                    {fan.min_cfm || 0}-{fan.max_cfm} CFM
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            {selectedFan && (
              <div className="space-y-4">
                <FanCurveChart
                  fanCurve={selectedFan}
                  systemCfm={requiredCfm}
                  systemStaticPressure={requiredStaticPressure}
                  staticPressure={staticPressure}
                />

                {selectedFanAnalysis?.operatingPoint && (
                  <Card
                    className={cn(
                      'border-l-4',
                      selectedFanAnalysis.operatingPoint.isValid
                        ? 'border-l-emerald-500'
                        : 'border-l-amber-500'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {selectedFanAnalysis.operatingPoint.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            {selectedFanAnalysis.operatingPoint.isValid
                              ? 'Good Selection'
                              : 'Consider Alternatives'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFanAnalysis.operatingPoint.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedFan || createFanSelection.isPending}
          >
            {createFanSelection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Select Fan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
