import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Wrench,
  CheckCircle2,
  Box,
  FileText,
  Users,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import {
  useDataAudit,
  useFixEquipmentProjectMismatch,
  useFixAllEquipmentMismatches,
  useLinkContractCustomerToProject,
  useFixAllContractCustomerLinks,
  EquipmentMismatch,
  ContractCustomerIssue,
} from '@/hooks/useDataAudit';

export default function DataAudit() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: audit, isLoading, refetch, isRefetching } = useDataAudit();
  
  const fixEquipmentMismatch = useFixEquipmentProjectMismatch();
  const fixAllEquipmentMismatches = useFixAllEquipmentMismatches();
  const linkCustomerToProject = useLinkContractCustomerToProject();
  const fixAllCustomerLinks = useFixAllContractCustomerLinks();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleFixEquipment = (mismatch: EquipmentMismatch) => {
    if (mismatch.derived_project_id) {
      fixEquipmentMismatch.mutate({
        equipmentId: mismatch.id,
        correctProjectId: mismatch.derived_project_id,
      });
    }
  };

  const handleFixAllEquipment = () => {
    if (audit?.equipmentMismatches) {
      fixAllEquipmentMismatches.mutate(audit.equipmentMismatches);
    }
  };

  const handleLinkCustomer = (issue: ContractCustomerIssue) => {
    linkCustomerToProject.mutate({
      projectId: issue.project_id,
      customerId: issue.customer_id,
    });
  };

  const handleFixAllCustomerLinks = () => {
    if (audit?.contractCustomerIssues) {
      fixAllCustomerLinks.mutate(audit.contractCustomerIssues);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10';
    if (score >= 70) return 'bg-yellow-500/10';
    return 'bg-destructive/10';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Audit</h1>
            <p className="text-muted-foreground">
              Identify and fix data inconsistencies across projects, equipment, and contracts
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={getHealthScoreBg(audit?.summary.healthScore || 100)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getHealthScoreColor(audit?.summary.healthScore || 100)}`}>
                  {audit?.summary.healthScore || 100}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Critical Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  {audit?.summary.criticalCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {audit?.summary.warningCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {audit?.summary.infoCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success State */}
        {!isLoading && audit?.summary.totalIssues === 0 && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">All Clear</AlertTitle>
            <AlertDescription>
              No data inconsistencies found. Your data integrity is in excellent shape.
            </AlertDescription>
          </Alert>
        )}

        {/* Issue Tabs */}
        {!isLoading && audit && audit.summary.totalIssues > 0 && (
          <Tabs defaultValue="equipment" className="space-y-4">
            <TabsList>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Equipment
                {(audit.equipmentMismatches.length + audit.orphanedEquipment.length) > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {audit.equipmentMismatches.length + audit.orphanedEquipment.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contracts
                {audit.contractEquipmentIssues.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {audit.contractEquipmentIssues.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Links
                {audit.contractCustomerIssues.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {audit.contractCustomerIssues.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Equipment Issues Tab */}
            <TabsContent value="equipment" className="space-y-4">
              {/* Equipment Project Mismatches */}
              {audit.equipmentMismatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          Equipment Project Mismatches
                        </CardTitle>
                        <CardDescription>
                          Equipment with project assignments that don't match their zone hierarchy
                        </CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleFixAllEquipment}
                        disabled={fixAllEquipmentMismatches.isPending}
                      >
                        {fixAllEquipmentMismatches.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4 mr-2" />
                        )}
                        Fix All ({audit.equipmentMismatches.length})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Current Project</TableHead>
                          <TableHead></TableHead>
                          <TableHead>Should Be</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audit.equipmentMismatches.map((mismatch) => (
                          <TableRow key={mismatch.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{mismatch.tag}</div>
                                <div className="text-sm text-muted-foreground">{mismatch.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-destructive border-destructive">
                                {mismatch.current_project_name || 'None'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {mismatch.derived_project_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {mismatch.zone_name}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleFixEquipment(mismatch)}
                                disabled={fixEquipmentMismatch.isPending}
                              >
                                Fix
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Orphaned Equipment */}
              {audit.orphanedEquipment.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Unassigned Equipment
                    </CardTitle>
                    <CardDescription>
                      Equipment without zone or project assignment. Assign to a zone for automatic project sync.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audit.orphanedEquipment.map((eq) => (
                          <TableRow key={eq.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{eq.tag}</div>
                                <div className="text-sm text-muted-foreground">{eq.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{eq.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate('/equipment')}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {audit.equipmentMismatches.length === 0 && audit.orphanedEquipment.length === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Equipment Issues</AlertTitle>
                  <AlertDescription>
                    All equipment records have consistent project assignments.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Contract Issues Tab */}
            <TabsContent value="contracts" className="space-y-4">
              {audit.contractEquipmentIssues.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Contract-Equipment Project Mismatches
                    </CardTitle>
                    <CardDescription>
                      Contracts with equipment from different projects. Review and reassign equipment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Contract Project</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Equipment Project</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audit.contractEquipmentIssues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {issue.contract_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {issue.contract_project_name}
                              </Badge>
                            </TableCell>
                            <TableCell>{issue.equipment_tag}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-destructive border-destructive">
                                {issue.equipment_project_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate('/service/contracts')}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Contract Issues</AlertTitle>
                  <AlertDescription>
                    All contracts have equipment from matching projects.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Customer Links Tab */}
            <TabsContent value="customers" className="space-y-4">
              {audit.contractCustomerIssues.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          Missing Customer-Project Links
                        </CardTitle>
                        <CardDescription>
                          Contracts where the customer is not linked to the contract's project
                        </CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleFixAllCustomerLinks}
                        disabled={fixAllCustomerLinks.isPending}
                      >
                        {fixAllCustomerLinks.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4 mr-2" />
                        )}
                        Link All ({audit.contractCustomerIssues.length})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audit.contractCustomerIssues.map((issue) => (
                          <TableRow key={issue.contract_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{issue.contract_number}</div>
                                <div className="text-sm text-muted-foreground">{issue.contract_name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{issue.project_name}</Badge>
                            </TableCell>
                            <TableCell>{issue.customer_name}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleLinkCustomer(issue)}
                                disabled={linkCustomerToProject.isPending}
                              >
                                Link
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Customer Link Issues</AlertTitle>
                  <AlertDescription>
                    All contract customers are properly linked to their projects.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
