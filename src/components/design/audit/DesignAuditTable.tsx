import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';
import type { CrossToolDependency } from '@/hooks/useCrossToolValidation';

interface DesignAuditTableProps {
  allDependencies: CrossToolDependency[];
  criticalAlerts: CrossToolDependency[];
  warningAlerts: CrossToolDependency[];
  syncedDependencies: CrossToolDependency[];
  filter?: 'all' | 'critical' | 'warning' | 'synced';
}

export function DesignAuditTable({
  allDependencies,
  criticalAlerts,
  warningAlerts,
  syncedDependencies,
  filter = 'all',
}: DesignAuditTableProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(filter);

  const getFilteredDependencies = () => {
    switch (activeTab) {
      case 'critical': return criticalAlerts;
      case 'warning': return warningAlerts;
      case 'synced': return syncedDependencies;
      default: return allDependencies;
    }
  };

  const getSeverityIcon = (dep: CrossToolDependency) => {
    if (dep.status === 'synced') {
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    }
    switch (dep.severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-info" />;
    }
  };

  const getSeverityBadge = (dep: CrossToolDependency) => {
    if (dep.status === 'synced') {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Synced</Badge>;
    }
    switch (dep.severity) {
      case 'critical':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Warning</Badge>;
      default:
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Info</Badge>;
    }
  };

  const filteredDeps = getFilteredDependencies();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Dependency Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-1">
              All
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{allDependencies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="critical" className="gap-1">
              Critical
              <Badge variant="secondary" className={cn("ml-1 h-5 px-1.5", criticalAlerts.length > 0 && "bg-destructive/20 text-destructive")}>
                {criticalAlerts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="warning" className="gap-1">
              Warning
              <Badge variant="secondary" className={cn("ml-1 h-5 px-1.5", warningAlerts.length > 0 && "bg-warning/20 text-warning")}>
                {warningAlerts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="synced" className="gap-1">
              Synced
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-success/20 text-success">
                {syncedDependencies.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredDeps.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success/50" />
                <p>No {activeTab === 'all' ? 'dependencies' : `${activeTab} alerts`} found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Status</TableHead>
                      <TableHead>Upstream Tool</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Downstream Tool</TableHead>
                      <TableHead>Stale Duration</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeps.map((dep) => (
                      <TableRow key={dep.id}>
                        <TableCell>
                          {getSeverityIcon(dep)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{dep.upstream.toolName}</p>
                            <p className="text-xs text-muted-foreground">{dep.upstream.itemCount} items</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{dep.downstream.toolName}</p>
                            <p className="text-xs text-muted-foreground">{dep.downstream.itemCount} items</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dep.status === 'synced' ? (
                            <span className="text-success text-sm">In sync</span>
                          ) : (
                            <span className="text-sm">{dep.staleDurationText}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(dep)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(dep.upstream.path)}
                              title="View upstream tool"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            {dep.status === 'stale' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Navigate to downstream tool which will show the refresh option
                                  const downstreamPath = dep.upstream.path.replace(
                                    dep.upstream.toolType.replace('-', '/'),
                                    dep.downstream.toolType.replace('-', '/')
                                  );
                                  navigate(downstreamPath);
                                }}
                                title="Refresh downstream data"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
