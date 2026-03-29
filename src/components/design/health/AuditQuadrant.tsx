import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GitBranch, ArrowRight, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DependencyStatus {
  name: string;
  status: 'synced' | 'warning' | 'critical';
}

interface AuditQuadrantProps {
  criticalCount: number;
  warningCount: number;
  syncedCount: number;
  topDependencies: DependencyStatus[];
  projectId: string;
}

export function AuditQuadrant({
  criticalCount,
  warningCount,
  syncedCount,
  topDependencies,
  projectId
}: AuditQuadrantProps) {
  const totalCount = criticalCount + warningCount + syncedCount;
  const syncPercent = totalCount > 0 ? (syncedCount / totalCount) * 100 : 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            Cross-Tool Sync
          </CardTitle>
          <span className="text-2xl font-bold">{syncPercent.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badges */}
        <div className="flex gap-2 flex-wrap">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {criticalCount} Critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} Warning
            </Badge>
          )}
          {syncedCount > 0 && (
            <Badge variant="outline" className="gap-1 border-green-500 text-green-700 bg-green-50">
              <CheckCircle2 className="h-3 w-3" />
              {syncedCount} Synced
            </Badge>
          )}
        </div>

        {/* Top dependencies */}
        {topDependencies.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {topDependencies.slice(0, 3).map((dep) => (
              <div key={dep.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{dep.name}</span>
                <span className={
                  dep.status === 'critical' ? 'text-red-500' :
                  dep.status === 'warning' ? 'text-yellow-600' :
                  'text-green-500'
                }>
                  {dep.status === 'critical' ? '⬤' : dep.status === 'warning' ? '◐' : '○'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View full audit link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 group" asChild>
              <Link to={`/design/audit?project=${projectId}`}>
                View Full Audit <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>See dependency flow diagram, stale data alerts, and tool inventory</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
