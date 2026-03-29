import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Customer } from '@/hooks/useCustomers';
import { useServiceContracts, ServiceContract } from '@/hooks/useServiceContracts';
import { useCustomerProjects, useAddProjectCustomer, useRemoveProjectCustomer } from '@/hooks/useProjectCustomers';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ContractList } from '@/components/contracts/ContractList';
import { ContractForm } from '@/components/contracts/ContractForm';
import { RenewContractDialog } from '@/components/contracts/RenewContractDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Plus,
  FileText,
  Wrench,
  DollarSign,
  FolderKanban,
  X,
  ExternalLink
} from 'lucide-react';

interface CustomerDetailProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: () => void;
}

export function CustomerDetail({ open, onClose, customer, onEdit }: CustomerDetailProps) {
  const navigate = useNavigate();
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);
  const [renewingContract, setRenewingContract] = useState<ServiceContract | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { data: contracts } = useServiceContracts(customer?.id);
  const { data: customerProjects } = useCustomerProjects(customer?.id);
  const { data: allProjects } = useProjects();
  const addProjectCustomer = useAddProjectCustomer();
  const removeProjectCustomer = useRemoveProjectCustomer();

  // Filter out already linked projects
  const linkedProjectIds = new Set(customerProjects?.map(cp => cp.project_id) || []);
  const availableProjects = (allProjects || []).filter(p => !linkedProjectIds.has(p.id));

  const handleLinkProject = async () => {
    if (!customer || !selectedProjectId) return;
    await addProjectCustomer.mutateAsync({ projectId: selectedProjectId, customerId: customer.id });
    setSelectedProjectId('');
  };

  const handleUnlinkProject = async (projectId: string) => {
    if (!customer) return;
    await removeProjectCustomer.mutateAsync({ projectId, customerId: customer.id });
  };
  if (!customer) return null;

  const activeContracts = contracts?.filter((c) => c.status === 'active') || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditContract = (contract: ServiceContract) => {
    setEditingContract(contract);
    setContractFormOpen(true);
  };

  const handleRenewContract = (contract: ServiceContract) => {
    setRenewingContract(contract);
  };

  const handleCloseContractForm = () => {
    setContractFormOpen(false);
    setEditingContract(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {customer.company_name || customer.contact_name}
              <Badge variant="outline">{customer.customer_type}</Badge>
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="info" className="mt-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="projects" className="gap-1">
                Projects
                {customerProjects && customerProjects.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {customerProjects.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1">
                Contracts
                {activeContracts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeContracts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              {/* Contact Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.contact_phone}</span>
                  </div>
                  {customer.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.contact_email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{customer.address}</p>
                      {customer.city && <p className="text-muted-foreground">{customer.city}</p>}
                    </div>
                  </div>
                  {customer.company_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-sm">Contact Person</p>
                        <p>{customer.contact_name}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Work Orders</p>
                        <p className="text-xl font-semibold">{customer.total_work_orders || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-xl font-semibold">{formatCurrency(customer.total_revenue_sar || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              {(customer.vat_number || customer.trade_license) && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {customer.vat_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT Number</span>
                        <span>{customer.vat_number}</span>
                      </div>
                    )}
                    {customer.trade_license && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trade License</span>
                        <span>{customer.trade_license}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button variant="outline" onClick={onEdit} className="w-full">
                Edit Customer
              </Button>
            </TabsContent>

            <TabsContent value="projects" className="mt-4 space-y-4">
              {/* Add Project */}
              <div className="flex gap-2">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a project to link..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="icon" 
                  onClick={handleLinkProject}
                  disabled={!selectedProjectId || addProjectCustomer.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Projects List */}
              {customerProjects && customerProjects.length > 0 ? (
                <div className="space-y-2">
                  {customerProjects.map((cp) => (
                    <Card key={cp.id} className="group">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{cp.project?.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {cp.project?.location && <span>{cp.project.location}</span>}
                              <Badge variant="outline" className="text-xs">
                                {cp.project?.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              onClose();
                              navigate(`/projects/${cp.project_id}`);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleUnlinkProject(cp.project_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium">No Projects Linked</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Link this customer to projects above
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contracts" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Service Contracts</h3>
                <Button size="sm" onClick={() => setContractFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contract
                </Button>
              </div>
              <ContractList
                customerId={customer.id}
                onEdit={handleEditContract}
                onRenew={handleRenewContract}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-4 font-medium">Service History</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Work order history will appear here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Contract Form */}
      <ContractForm
        open={contractFormOpen}
        onClose={handleCloseContractForm}
        contract={editingContract}
        customerId={customer.id}
      />

      {/* Renew Dialog */}
      <RenewContractDialog
        open={!!renewingContract}
        onClose={() => setRenewingContract(null)}
        contract={renewingContract}
      />
    </>
  );
}
