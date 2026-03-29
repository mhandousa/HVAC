import React from 'react';
import { AlertTriangle, CheckCircle2, Scale, Gauge, Droplets, GitBranch, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  CircuitAnalysis, 
  PipeSystemAnalysis, 
  LoopAnalysis,
  getCircuitBalanceColor, 
  getCircuitBalanceStatus,
  getLoopBalanceColor,
  formatCv,
} from '@/hooks/usePipeSystemAnalysis';

interface PipeCircuitBalancingPanelProps {
  analysis: PipeSystemAnalysis;
  onSelectCircuit?: (leafSegmentId: string) => void;
  selectedCircuitId?: string;
}

export function PipeCircuitBalancingPanel({
  analysis,
  onSelectCircuit,
  selectedCircuitId,
}: PipeCircuitBalancingPanelProps) {
  const { circuits, loops, criticalPathHeadLoss, maxCircuitDelta, isBalanced, totalFlow, averageVelocity } = analysis;

  if (circuits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Scale className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No circuits to analyze</p>
        <p className="text-xs">Add pipe segments with branches</p>
      </div>
    );
  }

  const valvesRequired = circuits.filter(c => c.balanceValveRequired);
  const criticalCircuit = circuits.find(c => c.isCriticalPath);

  return (
    <div className="p-4 space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4" />
            System Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Status</span>
            {isBalanced ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Needs Balancing
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Critical Path:</span>
                <span className="font-medium">{criticalPathHeadLoss.toFixed(2)} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Δ:</span>
                <span className={cn("font-medium", getCircuitBalanceColor(maxCircuitDelta))}>
                  {maxCircuitDelta.toFixed(2)} ft
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Flow:</span>
                <span className="font-medium">{totalFlow.toFixed(1)} GPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Velocity:</span>
                <span className="font-medium">{averageVelocity.toFixed(2)} fps</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm pt-1 border-t">
            <span className="text-muted-foreground">Circuits:</span>
            <span>{circuits.length} total, {valvesRequired.length} need balancing</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="circuits" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="circuits" className="text-xs">
            <Droplets className="h-3 w-3 mr-1" />
            Circuits ({circuits.length})
          </TabsTrigger>
          <TabsTrigger value="loops" className="text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            Loops ({loops.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="circuits" className="mt-3">
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-2">
              {circuits.map((circuit) => (
                <CircuitCard
                  key={circuit.circuitId}
                  circuit={circuit}
                  criticalPathHeadLoss={criticalPathHeadLoss}
                  isSelected={selectedCircuitId === circuit.leafSegmentId}
                  onSelect={() => onSelectCircuit?.(circuit.leafSegmentId)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="loops" className="mt-3">
          {loops.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No parallel loops detected</p>
              <p className="text-xs">Add branching pipe segments</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-3">
                {loops.map((loop) => (
                  <LoopCard key={loop.loopId} loop={loop} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Balance Valves Summary */}
      {valvesRequired.length > 0 && (
        <>
          <Separator />
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Balancing Valve Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <TooltipProvider>
                {valvesRequired.map((c) => (
                  <div key={c.circuitId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Install on return line</p>
                          <p className="text-xs text-muted-foreground">
                            ΔP required: {c.deltaFromCritical.toFixed(2)} ft
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <span>{c.circuitName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {c.flow.toFixed(1)} GPM
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        Cv = {formatCv(c.recommendedCv!)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </TooltipProvider>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Formula: Cv = Q / √(ΔP psi) where ΔP ft × 0.433 = ΔP psi
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface CircuitCardProps {
  circuit: CircuitAnalysis;
  criticalPathHeadLoss: number;
  isSelected: boolean;
  onSelect: () => void;
}

function CircuitCard({ circuit, criticalPathHeadLoss, isSelected, onSelect }: CircuitCardProps) {
  const balancePercent = criticalPathHeadLoss > 0 
    ? (circuit.headLoss / criticalPathHeadLoss) * 100 
    : 100;
  
  const status = getCircuitBalanceStatus(circuit.deltaFromCritical);
  const statusColor = getCircuitBalanceColor(circuit.deltaFromCritical);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected ? "bg-accent border-primary" : "hover:bg-muted/50",
        circuit.isCriticalPath && "border-l-2 border-l-primary"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {circuit.isCriticalPath && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Target className="h-4 w-4 text-primary" />
                </TooltipTrigger>
                <TooltipContent>Critical Path</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="font-medium text-sm">{circuit.circuitName}</span>
        </div>
        <Badge variant="secondary" className={cn("text-xs", statusColor)}>
          {status}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress value={balancePercent} className="h-1.5" />
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Flow</span>
            <p className="font-medium">{circuit.flow.toFixed(1)} GPM</p>
          </div>
          <div>
            <span className="text-muted-foreground">Head Loss</span>
            <p className="font-medium">{circuit.headLoss.toFixed(2)} ft</p>
          </div>
          <div>
            <span className="text-muted-foreground">Δ Critical</span>
            <p className={cn("font-medium", statusColor)}>
              {circuit.deltaFromCritical.toFixed(2)} ft
            </p>
          </div>
        </div>

        {circuit.balanceValveRequired && circuit.recommendedCv && (
          <div className="flex items-center gap-2 pt-1 text-xs text-amber-600">
            <Gauge className="h-3 w-3" />
            <span>Balance valve Cv ≈ {formatCv(circuit.recommendedCv)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface LoopCardProps {
  loop: LoopAnalysis;
}

function LoopCard({ loop }: LoopCardProps) {
  const statusColor = getLoopBalanceColor(loop.imbalance);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {loop.loopName}
          </div>
          <Badge variant="secondary" className={cn("text-xs", statusColor)}>
            Δ {loop.imbalance.toFixed(2)} ft
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Circuits</span>
            <p className="font-medium">{loop.circuits.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Max Head</span>
            <p className="font-medium">{loop.maxHeadLoss.toFixed(2)} ft</p>
          </div>
          <div>
            <span className="text-muted-foreground">Min Head</span>
            <p className="font-medium">{loop.minHeadLoss.toFixed(2)} ft</p>
          </div>
        </div>

        {loop.balancingValves.length > 0 && (
          <div className="border-t pt-2 space-y-1">
            <p className="text-xs font-medium flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Balancing Valves Required
            </p>
            {loop.balancingValves.map((valve) => (
              <div key={valve.circuitId} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{valve.circuitName}</span>
                <span className="font-mono">Cv = {formatCv(valve.recommendedCv)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
