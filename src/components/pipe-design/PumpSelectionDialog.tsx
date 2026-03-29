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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Gauge,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePumpCurves, PumpCurve, findBestPump, calculateSystemCurve, findOperatingPoint } from '@/hooks/usePumpCurves';
import { useCreatePumpSelection } from '@/hooks/usePumpSelections';
import { useOrganization } from '@/hooks/useOrganization';
import { PumpCurveChart } from './PumpCurveChart';

interface PumpSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredFlow: number;
  requiredHead: number;
  staticHead?: number;
  pipeSystemId?: string;
  pumpType?: string;
  onSelectPump?: (pump: PumpCurve) => void;
}

export function PumpSelectionDialog({
  open,
  onOpenChange,
  requiredFlow,
  requiredHead,
  staticHead = 0,
  pipeSystemId,
  pumpType = 'chw_secondary',
  onSelectPump,
}: PumpSelectionDialogProps) {
  const { data: pumps = [], isLoading } = usePumpCurves();
  const { data: organization } = useOrganization();
  const createPumpSelection = useCreatePumpSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPump, setSelectedPump] = useState<PumpCurve | null>(null);
  const [showOnlyMatching, setShowOnlyMatching] = useState(true);

  // Find best matching pumps
  const rankedPumps = useMemo(() => {
    if (!requiredFlow || !requiredHead) return [];
    return findBestPump(pumps, requiredFlow, requiredHead);
  }, [pumps, requiredFlow, requiredHead]);

  // Filter pumps based on search and matching criteria
  const filteredPumps = useMemo(() => {
    let result = pumps;

    if (showOnlyMatching && rankedPumps.length > 0) {
      const matchingIds = new Set(rankedPumps.map(r => r.pump.id));
      result = result.filter(p => matchingIds.has(p.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.manufacturer.toLowerCase().includes(query) ||
          p.model.toLowerCase().includes(query)
      );
    }

    return result;
  }, [pumps, searchQuery, showOnlyMatching, rankedPumps]);

  // Get operating point for selected pump
  const selectedPumpAnalysis = useMemo(() => {
    if (!selectedPump || !requiredFlow || !requiredHead) return null;

    const systemCurve = calculateSystemCurve(staticHead, requiredFlow, requiredHead);
    const operatingPoint = findOperatingPoint(selectedPump.curve_data, systemCurve);

    return { systemCurve, operatingPoint };
  }, [selectedPump, requiredFlow, requiredHead, staticHead]);

  const handleSelect = async () => {
    if (!selectedPump || !organization?.id) return;

    const operatingPoint = selectedPumpAnalysis?.operatingPoint;
    
    await createPumpSelection.mutateAsync({
      pipe_system_id: pipeSystemId,
      pump_tag: `P-${selectedPump.model}`,
      pump_type: pumpType,
      pump_curve_id: selectedPump.id,
      manufacturer: selectedPump.manufacturer,
      model_number: selectedPump.model,
      design_flow_gpm: requiredFlow,
      design_head_ft: requiredHead,
      static_head_ft: staticHead,
      operating_flow_gpm: operatingPoint?.flow,
      operating_head_ft: operatingPoint?.head,
      operating_efficiency_percent: operatingPoint?.efficiency,
      operating_point_valid: operatingPoint?.isValid,
      motor_hp: selectedPump.motor_hp,
      motor_rpm: selectedPump.rpm,
      impeller_diameter_in: selectedPump.impeller_diameter_in,
      selected_equipment: selectedPump,
      status: 'selected',
    });

    if (onSelectPump) {
      onSelectPump(selectedPump);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Pump Selection
          </DialogTitle>
          <DialogDescription>
            Select a pump for {requiredFlow.toFixed(1)} GPM @ {requiredHead.toFixed(1)} ft head
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="browse" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Pumps</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!selectedPump}>
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
                    placeholder="Search by manufacturer or model..."
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
                      <span className="text-muted-foreground">Required Flow</span>
                      <p className="font-medium">{requiredFlow.toFixed(1)} GPM</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Required Head</span>
                      <p className="font-medium">{requiredHead.toFixed(1)} ft</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Static Head</span>
                      <p className="font-medium">{staticHead.toFixed(1)} ft</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pump List */}
              <ScrollArea className="h-[350px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Loading pump database...
                  </div>
                ) : filteredPumps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Gauge className="h-8 w-8 mb-2 opacity-50" />
                    <p>No matching pumps found</p>
                    <p className="text-xs">Try adjusting your search or requirements</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPumps.map((pump) => {
                      const ranking = rankedPumps.find((r) => r.pump.id === pump.id);
                      const isSelected = selectedPump?.id === pump.id;

                      return (
                        <Card
                          key={pump.id}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected ? 'border-primary bg-accent' : 'hover:bg-muted/50'
                          )}
                          onClick={() => setSelectedPump(pump)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Gauge className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {pump.manufacturer} {pump.model}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {pump.pump_type} • {pump.motor_hp} HP • {pump.rpm} RPM
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
                                    {ranking.score > 0.7 && (
                                      <Badge variant="default" className="text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Best Match
                                      </Badge>
                                    )}
                                  </>
                                )}
                                {pump.max_flow_gpm && (
                                  <span className="text-xs text-muted-foreground">
                                    {pump.min_flow_gpm || 0}-{pump.max_flow_gpm} GPM
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
            {selectedPump && (
              <div className="space-y-4">
                <PumpCurveChart
                  pumpCurve={selectedPump}
                  systemFlow={requiredFlow}
                  systemHead={requiredHead}
                  staticHead={staticHead}
                />

                {selectedPumpAnalysis?.operatingPoint && (
                  <Card
                    className={cn(
                      'border-l-4',
                      selectedPumpAnalysis.operatingPoint.isValid
                        ? 'border-l-emerald-500'
                        : 'border-l-amber-500'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {selectedPumpAnalysis.operatingPoint.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            {selectedPumpAnalysis.operatingPoint.isValid
                              ? 'Good Selection'
                              : 'Consider Alternatives'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPumpAnalysis.operatingPoint.message}
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
            disabled={!selectedPump || createPumpSelection.isPending}
          >
            {createPumpSelection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Select Pump
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
