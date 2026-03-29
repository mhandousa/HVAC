import React, { useMemo, useState } from 'react';
import { InstallationPhase } from '@/lib/treatment-installation-scheduler';
import { 
  Contractor, 
  PhaseContractorAssignment, 
  CostSummary 
} from '@/types/contractor';
import { formatCurrencySAR } from '@/lib/currency-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  BarChart3,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CostInputDialog } from './CostInputDialog';

interface CostComparisonDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phases: InstallationPhase[];
  contractors: Contractor[];
  assignments: Map<string, PhaseContractorAssignment>;
  onUpdateAssignmentCost: (phaseId: string, costs: { quotedCost?: number; agreedCost?: number; actualCost?: number }) => void;
}

export function CostComparisonDashboard({
  open,
  onOpenChange,
  phases,
  contractors,
  assignments,
  onUpdateAssignmentCost,
}: CostComparisonDashboardProps) {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);

  // Calculate cost summary
  const costSummary = useMemo((): CostSummary => {
    let totalQuoted = 0;
    let totalAgreed = 0;
    let totalActual = 0;

    const byPhase: CostSummary['byPhase'] = [];
    const contractorMap = new Map<string, { 
      name: string; 
      phaseCount: number; 
      totalAgreed: number; 
      totalActual: number;
    }>();

    phases.forEach(phase => {
      const assignment = assignments.get(phase.id);
      const contractor = assignment 
        ? contractors.find(c => c.id === assignment.contractorId)
        : undefined;

      const quoted = assignment?.quotedCost || 0;
      const agreed = assignment?.agreedCost || 0;
      const actual = assignment?.actualCost;

      totalQuoted += quoted;
      totalAgreed += agreed;
      if (actual !== undefined) totalActual += actual;

      byPhase.push({
        phaseId: phase.id,
        phaseName: phase.name,
        contractorName: contractor?.name,
        quotedCost: quoted,
        agreedCost: agreed,
        actualCost: actual,
        variance: actual !== undefined ? actual - agreed : undefined,
      });

      if (contractor) {
        const existing = contractorMap.get(contractor.id);
        if (existing) {
          existing.phaseCount++;
          existing.totalAgreed += agreed;
          existing.totalActual += actual || 0;
        } else {
          contractorMap.set(contractor.id, {
            name: contractor.name,
            phaseCount: 1,
            totalAgreed: agreed,
            totalActual: actual || 0,
          });
        }
      }
    });

    const byContractor: CostSummary['byContractor'] = Array.from(contractorMap.entries()).map(
      ([contractorId, data]) => ({
        contractorId,
        contractorName: data.name,
        phaseCount: data.phaseCount,
        totalAgreed: data.totalAgreed,
        totalActual: data.totalActual,
        variance: data.totalActual - data.totalAgreed,
      })
    );

    return {
      totalQuoted,
      totalAgreed,
      totalActual,
      variance: totalActual - totalAgreed,
      variancePercent: totalAgreed ? ((totalActual - totalAgreed) / totalAgreed) * 100 : 0,
      byPhase,
      byContractor,
    };
  }, [phases, contractors, assignments]);

  const getVarianceColor = (variance: number | undefined) => {
    if (variance === undefined) return 'text-muted-foreground';
    if (variance < 0) return 'text-emerald-600';
    if (variance > 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getVarianceIcon = (variance: number | undefined) => {
    if (variance === undefined) return <Minus className="h-3 w-3" />;
    if (variance < 0) return <TrendingDown className="h-3 w-3" />;
    if (variance > 0) return <TrendingUp className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const editingAssignment = editingPhaseId ? assignments.get(editingPhaseId) : null;
  const editingPhase = editingPhaseId ? phases.find(p => p.id === editingPhaseId) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Tracking & Cost Comparison
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Quoted Total</div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrencySAR(costSummary.totalQuoted)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Agreed Total</div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrencySAR(costSummary.totalAgreed)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Actual Total</div>
                  <div className="text-lg font-bold mt-1">
                    {costSummary.totalActual > 0 ? formatCurrencySAR(costSummary.totalActual) : '-'}
                  </div>
                </CardContent>
              </Card>
              <Card className={cn(
                costSummary.variance < 0 ? 'border-emerald-500/50' : 
                costSummary.variance > 0 ? 'border-destructive/50' : ''
              )}>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Variance</div>
                  <div className={cn(
                    'text-lg font-bold mt-1 flex items-center gap-1',
                    getVarianceColor(costSummary.variance)
                  )}>
                    {getVarianceIcon(costSummary.variance)}
                    {costSummary.totalActual > 0 
                      ? `${costSummary.variancePercent.toFixed(1)}%`
                      : '-'
                    }
                  </div>
                  {costSummary.totalActual > 0 && (
                    <div className={cn('text-xs', getVarianceColor(costSummary.variance))}>
                      {costSummary.variance < 0 ? 'Under' : costSummary.variance > 0 ? 'Over' : 'On'} Budget
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Phase vs Contractor view */}
            <Tabs defaultValue="phase" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-fit">
                <TabsTrigger value="phase" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  By Phase
                </TabsTrigger>
                <TabsTrigger value="contractor" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  By Contractor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phase" className="flex-1 overflow-hidden mt-3">
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1fr,auto] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <div>Phase</div>
                      <div>Contractor</div>
                      <div className="text-right">Quoted</div>
                      <div className="text-right">Agreed</div>
                      <div className="text-right">Actual</div>
                      <div className="text-right">Variance</div>
                      <div className="w-8"></div>
                    </div>
                    {/* Rows */}
                    {costSummary.byPhase.map((row) => (
                      <div 
                        key={row.phaseId}
                        className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1fr,auto] gap-2 px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm items-center"
                      >
                        <div className="font-medium truncate">{row.phaseName}</div>
                        <div className="text-muted-foreground truncate">
                          {row.contractorName || 'Not Assigned'}
                        </div>
                        <div className="text-right tabular-nums">
                          {formatCurrencySAR(row.quotedCost)}
                        </div>
                        <div className="text-right tabular-nums">
                          {row.agreedCost > 0 ? formatCurrencySAR(row.agreedCost) : '-'}
                        </div>
                        <div className="text-right tabular-nums">
                          {row.actualCost !== undefined ? formatCurrencySAR(row.actualCost) : '-'}
                        </div>
                        <div className={cn(
                          'text-right tabular-nums flex items-center justify-end gap-1',
                          getVarianceColor(row.variance)
                        )}>
                          {row.variance !== undefined ? (
                            <>
                              {getVarianceIcon(row.variance)}
                              {formatCurrencySAR(Math.abs(row.variance))}
                            </>
                          ) : '-'}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingPhaseId(row.phaseId)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="contractor" className="flex-1 overflow-hidden mt-3">
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <div>Contractor</div>
                      <div className="text-center">Phases</div>
                      <div className="text-right">Agreed Total</div>
                      <div className="text-right">Actual Total</div>
                      <div className="text-right">Variance</div>
                    </div>
                    {/* Rows */}
                    {costSummary.byContractor.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No contractors assigned yet
                      </div>
                    ) : (
                      costSummary.byContractor.map((row) => (
                        <div 
                          key={row.contractorId}
                          className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-2 px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm items-center"
                        >
                          <div className="font-medium">{row.contractorName}</div>
                          <div className="text-center">
                            <Badge variant="secondary">{row.phaseCount}</Badge>
                          </div>
                          <div className="text-right tabular-nums">
                            {formatCurrencySAR(row.totalAgreed)}
                          </div>
                          <div className="text-right tabular-nums">
                            {row.totalActual > 0 ? formatCurrencySAR(row.totalActual) : '-'}
                          </div>
                          <div className={cn(
                            'text-right tabular-nums flex items-center justify-end gap-1',
                            getVarianceColor(row.totalActual > 0 ? row.variance : undefined)
                          )}>
                            {row.totalActual > 0 ? (
                              <>
                                {getVarianceIcon(row.variance)}
                                {formatCurrencySAR(Math.abs(row.variance))}
                              </>
                            ) : '-'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Visual Budget Bar */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Budget Progress</span>
                <span className={cn(
                  'font-medium',
                  getVarianceColor(costSummary.variance)
                )}>
                  {costSummary.totalActual > 0 
                    ? `${costSummary.variancePercent > 0 ? '+' : ''}${costSummary.variancePercent.toFixed(1)}%`
                    : 'No actual costs recorded'
                  }
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                {/* Agreed budget marker */}
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/30"
                  style={{ width: '100%' }}
                />
                {/* Actual spend */}
                {costSummary.totalActual > 0 && costSummary.totalAgreed > 0 && (
                  <div 
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all',
                      costSummary.variance <= 0 ? 'bg-emerald-500' : 'bg-destructive'
                    )}
                    style={{ 
                      width: `${Math.min(100, (costSummary.totalActual / costSummary.totalAgreed) * 100)}%` 
                    }}
                  />
                )}
                {/* Target line */}
                <div className="absolute inset-y-0 right-0 w-0.5 bg-foreground/50" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>SAR 0</span>
                <span>Budget: {formatCurrencySAR(costSummary.totalAgreed)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cost Input Dialog */}
      {editingPhaseId && editingPhase && (
        <CostInputDialog
          open={!!editingPhaseId}
          onOpenChange={(open) => !open && setEditingPhaseId(null)}
          phaseName={editingPhase.name}
          currentCosts={{
            quotedCost: editingAssignment?.quotedCost || 0,
            agreedCost: editingAssignment?.agreedCost || 0,
            actualCost: editingAssignment?.actualCost,
          }}
          onSave={(costs) => {
            onUpdateAssignmentCost(editingPhaseId, costs);
            setEditingPhaseId(null);
          }}
        />
      )}
    </>
  );
}
