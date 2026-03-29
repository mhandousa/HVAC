import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWorkloadBalancing } from '@/hooks/useWorkloadBalancing';
import { useTechnicianWorkload } from '@/hooks/useTechnicianWorkload';
import { BalanceScoreGauge } from './BalanceScoreGauge';
import { ReassignmentSuggestionCard } from './ReassignmentSuggestionCard';
import { WorkloadComparisonChart } from './WorkloadComparisonChart';
import { ReassignmentConfirmDialog } from './ReassignmentConfirmDialog';
import { Scale, Shuffle, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkloadBalancingPanel() {
  const { balancingResult } = useWorkloadBalancing();
  const { technicianMetrics } = useTechnicianWorkload();
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { suggestions, currentImbalance, projectedImbalance } = balancingResult;

  const handleSelectSuggestion = (id: string, selected: boolean) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
    }
  };

  const handleApplySelected = () => {
    if (selectedSuggestions.size > 0) {
      setConfirmDialogOpen(true);
    }
  };

  const handleSuggestionApplied = () => {
    // Refresh after individual apply
    setSelectedSuggestions(new Set());
  };

  const handleBatchSuccess = () => {
    setSelectedSuggestions(new Set());
  };

  const selectedSuggestionsArray = useMemo(() => {
    return suggestions.filter(s => selectedSuggestions.has(s.id));
  }, [suggestions, selectedSuggestions]);

  // Calculate technician utilization data for display
  const utilizationData = useMemo(() => {
    const CAPACITY = 8;
    return technicianMetrics
      .filter(t => t.totalAssigned > 0)
      .map(t => {
        const activeCount = t.activeAssignments + t.inProgressAssignments;
        const utilization = (activeCount / CAPACITY) * 100;
        return {
          id: t.id,
          name: t.name,
          utilization: Math.round(utilization),
          status: utilization > 100 ? 'overloaded' : utilization < 50 ? 'underutilized' : 'optimal',
        };
      })
      .sort((a, b) => b.utilization - a.utilization);
  }, [technicianMetrics]);

  const getUtilizationColor = (util: number) => {
    if (util > 100) return 'bg-destructive';
    if (util > 85) return 'bg-orange-500';
    if (util >= 50) return 'bg-green-500';
    return 'bg-muted-foreground';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overloaded':
        return <Badge variant="destructive" className="text-xs">Overloaded</Badge>;
      case 'underutilized':
        return <Badge variant="secondary" className="text-xs">Available</Badge>;
      default:
        return <Badge variant="outline" className="text-xs text-green-600 border-green-600">Optimal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Balance Score and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <BalanceScoreGauge
            score={currentImbalance.balanceScore}
            overloadedCount={currentImbalance.overloadedTechnicians.length}
            underutilizedCount={currentImbalance.underutilizedTechnicians.length}
            compact
          />
        </div>
        
        {suggestions.length > 0 && selectedSuggestions.size > 0 && (
          <Button onClick={handleApplySelected} className="gap-2">
            <Shuffle className="w-4 h-4" />
            Apply Selected ({selectedSuggestions.size})
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workload Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {utilizationData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No technicians with active assignments
              </p>
            ) : (
              utilizationData.map((tech) => (
                <div key={tech.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">{tech.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm",
                        tech.utilization > 100 && "text-destructive font-medium"
                      )}>
                        {tech.utilization}%
                      </span>
                      {getStatusBadge(tech.status)}
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(tech.utilization, 150)} 
                    max={150}
                    className={cn("h-2", `[&>div]:${getUtilizationColor(tech.utilization)}`)}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Balance Score Gauge */}
        <Card>
          <CardContent className="pt-6">
            <BalanceScoreGauge
              score={currentImbalance.balanceScore}
              overloadedCount={currentImbalance.overloadedTechnicians.length}
              underutilizedCount={currentImbalance.underutilizedTechnicians.length}
            />
          </CardContent>
        </Card>
      </div>

      {/* Suggestions Section */}
      {suggestions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Suggested Reassignments ({suggestions.length})
            </h3>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedSuggestions.size === suggestions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <ReassignmentSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                selected={selectedSuggestions.has(suggestion.id)}
                onSelectChange={(selected) => handleSelectSuggestion(suggestion.id, selected)}
                onApplied={handleSuggestionApplied}
              />
            ))}
          </div>

          {/* Comparison Chart */}
          <WorkloadComparisonChart
            technicians={technicianMetrics}
            suggestions={selectedSuggestionsArray.length > 0 ? selectedSuggestionsArray : suggestions}
            currentBalanceScore={currentImbalance.balanceScore}
            projectedBalanceScore={projectedImbalance.balanceScore}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Workload is Balanced</h3>
            <p className="text-muted-foreground">
              No reassignment suggestions at this time. All technicians have manageable workloads.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ReassignmentConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        suggestions={selectedSuggestionsArray}
        onSuccess={handleBatchSuccess}
      />
    </div>
  );
}
