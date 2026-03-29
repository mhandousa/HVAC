import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle2, Activity, Wrench } from 'lucide-react';
import type { ProjectAuditSummary, ToolDataStatus } from '@/hooks/useProjectCrossToolAudit';

interface DesignAuditSummaryCardsProps {
  summary: ProjectAuditSummary;
  toolsWithData: ToolDataStatus[];
  onFilterChange?: (filter: 'all' | 'critical' | 'warning' | 'synced') => void;
  activeFilter?: 'all' | 'critical' | 'warning' | 'synced';
}

export function DesignAuditSummaryCards({
  summary,
  toolsWithData,
  onFilterChange,
  activeFilter = 'all',
}: DesignAuditSummaryCardsProps) {
  const toolsActive = toolsWithData.filter(t => t.hasData).length;
  const totalTools = toolsWithData.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Health Score */}
      <Card className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        activeFilter === 'all' && 'ring-2 ring-primary'
      )} onClick={() => onFilterChange?.('all')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              summary.overallHealth === 'healthy' && 'bg-success/10',
              summary.overallHealth === 'warning' && 'bg-warning/10',
              summary.overallHealth === 'critical' && 'bg-destructive/10'
            )}>
              <Activity className={cn(
                'w-6 h-6',
                summary.overallHealth === 'healthy' && 'text-success',
                summary.overallHealth === 'warning' && 'text-warning',
                summary.overallHealth === 'critical' && 'text-destructive'
              )} />
            </div>
            <div>
              <p className={cn(
                'text-2xl font-bold',
                summary.overallHealth === 'healthy' && 'text-success',
                summary.overallHealth === 'warning' && 'text-warning',
                summary.overallHealth === 'critical' && 'text-destructive'
              )}>
                {summary.healthScore}%
              </p>
              <p className="text-xs text-muted-foreground">Health Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        activeFilter === 'critical' && 'ring-2 ring-destructive'
      )} onClick={() => onFilterChange?.('critical')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{summary.criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Alerts */}
      <Card className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        activeFilter === 'warning' && 'ring-2 ring-warning'
      )} onClick={() => onFilterChange?.('warning')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{summary.warningCount}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synced */}
      <Card className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        activeFilter === 'synced' && 'ring-2 ring-success'
      )} onClick={() => onFilterChange?.('synced')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{summary.syncedCount}</p>
              <p className="text-xs text-muted-foreground">Synced</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Active */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{toolsActive}/{totalTools}</p>
              <p className="text-xs text-muted-foreground">Tools Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
