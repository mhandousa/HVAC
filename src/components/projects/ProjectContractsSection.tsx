import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  useProjectServiceContracts, 
  useServiceContracts,
  useLinkContractToProject,
  ServiceContract 
} from '@/hooks/useServiceContracts';
import { useProjectCustomers } from '@/hooks/useProjectCustomers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Plus,
  Calendar,
  DollarSign,
  Users,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ProjectContractsSectionProps {
  projectId: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  expiring: 'bg-warning/10 text-warning border-warning/20',
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-info/10 text-info border-info/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

function getContractStatus(contract: ServiceContract): { status: string; label: string; icon: React.ReactNode } {
  const today = new Date();
  const endDate = parseISO(contract.end_date);
  const daysUntilExpiry = differenceInDays(endDate, today);

  if (contract.status === 'cancelled') {
    return { status: 'cancelled', label: 'Cancelled', icon: <X className="w-3 h-3" /> };
  }
  
  if (daysUntilExpiry < 0) {
    return { status: 'expired', label: 'Expired', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  
  if (daysUntilExpiry <= 30) {
    return { status: 'expiring', label: `Expires in ${daysUntilExpiry}d`, icon: <Clock className="w-3 h-3" /> };
  }
  
  if (contract.status === 'active') {
    return { status: 'active', label: 'Active', icon: <CheckCircle className="w-3 h-3" /> };
  }
  
  return { status: contract.status, label: contract.status, icon: null };
}

export function ProjectContractsSection({ projectId }: ProjectContractsSectionProps) {
  const { data: projectContracts = [], isLoading } = useProjectServiceContracts(projectId);
  const { data: allContracts = [] } = useServiceContracts();
  const { data: projectCustomers = [] } = useProjectCustomers(projectId);
  const linkContract = useLinkContractToProject();
  
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  // Get customer IDs linked to this project
  const linkedCustomerIds = new Set(projectCustomers.map(pc => pc.customer_id));
  
  // Get contracts not already linked to this project
  const linkedContractIds = new Set(projectContracts.map(c => c.id));
  
  // Filter available contracts: 
  // 1. Not already linked to any project
  // 2. Customer must be linked to this project (enforced by database trigger)
  const availableContracts = allContracts.filter(c => 
    !linkedContractIds.has(c.id) && 
    !c.project_id &&
    linkedCustomerIds.has(c.customer_id)
  );

  // Contracts that could be linked but customer is not linked to project
  const contractsNeedingCustomerLink = allContracts.filter(c =>
    !linkedContractIds.has(c.id) &&
    !c.project_id &&
    !linkedCustomerIds.has(c.customer_id)
  );

  const handleLinkContract = async () => {
    if (!selectedContractId) return;
    await linkContract.mutateAsync({ contractId: selectedContractId, projectId });
    setSelectedContractId('');
  };

  const handleUnlinkContract = async (contractId: string) => {
    await linkContract.mutateAsync({ contractId, projectId: null });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Service Contracts
          {projectContracts.length > 0 && (
            <Badge variant="secondary">{projectContracts.length}</Badge>
          )}
        </h2>
      </div>

      {/* Link Contract */}
      {availableContracts.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedContractId} onValueChange={setSelectedContractId}>
            <SelectTrigger className="flex-1 max-w-sm">
              <SelectValue placeholder="Select a contract to link..." />
            </SelectTrigger>
            <SelectContent>
              {availableContracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.contract_number} - {contract.contract_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleLinkContract}
            disabled={!selectedContractId || linkContract.isPending}
          >
            <Plus className="w-4 h-4 mr-1" />
            Link Contract
          </Button>
        </div>
      )}

      {/* Contracts List */}
      {projectContracts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projectContracts.map((contract) => {
            const statusInfo = getContractStatus(contract);
            
            return (
              <Card key={contract.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {contract.contract_name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {contract.contract_number}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs gap-1', statusColors[statusInfo.status])}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleUnlinkContract(contract.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {contract.customer?.company_name || contract.customer?.contact_name || 'No customer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{contract.contract_value_sar.toLocaleString()} SAR</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(parseISO(contract.start_date), 'MMM d, yyyy')} - {format(parseISO(contract.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {contract.contract_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {contract.pm_visits_completed}/{contract.pm_visits_per_year} PM Visits
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No service contracts linked</p>
            <p className="text-xs text-muted-foreground/70">
            {availableContracts.length > 0 
              ? 'Link existing contracts using the dropdown above'
              : contractsNeedingCustomerLink.length > 0
                ? 'Link customers to this project first, then their contracts will be available'
                : 'Create contracts from the Service Contracts page'}
          </p>
          {contractsNeedingCustomerLink.length > 0 && (
            <Alert className="mt-4 text-left">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {contractsNeedingCustomerLink.length} contract(s) available but their customers are not linked to this project.
                Link the customer first to enable contract linking.
              </AlertDescription>
            </Alert>
          )}
          {availableContracts.length === 0 && contractsNeedingCustomerLink.length === 0 && (
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/service/contracts">
                Go to Service Contracts
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )}
    </div>
  );
}