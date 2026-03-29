import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useServiceContracts, useDeleteServiceContract, ServiceContract } from '@/hooks/useServiceContracts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Clock, 
  Calendar,
  Shield,
  Wrench
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ContractListProps {
  customerId?: string;
  onEdit: (contract: ServiceContract) => void;
  onRenew: (contract: ServiceContract) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-700 dark:text-green-300',
  expired: 'bg-destructive/20 text-destructive',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  cancelled: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  standard: 'bg-muted text-muted-foreground',
  high: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  critical: 'bg-destructive/20 text-destructive',
};

export function ContractList({ customerId, onEdit, onRenew }: ContractListProps) {
  const { data: contracts, isLoading } = useServiceContracts(customerId);
  const deleteContract = useDeleteServiceContract();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!contracts?.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h3 className="mt-4 font-medium">No Service Contracts</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a service contract to manage maintenance agreements
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const daysRemaining = getDaysRemaining(contract.end_date);
        const isExpiring = daysRemaining <= 30 && daysRemaining > 0;
        const isExpired = daysRemaining < 0;

        return (
          <Card key={contract.id} className={isExpiring ? 'border-yellow-500/50' : isExpired ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {contract.contract_name}
                    <Badge className={statusColors[contract.status] || statusColors.active}>
                      {contract.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contract.contract_number}
                    {!customerId && contract.customer && (
                      <> • {contract.customer.company_name || contract.customer.contact_name}</>
                    )}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contract)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenew(contract)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renew
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(contract.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Period</p>
                    <p>{format(new Date(contract.start_date), 'MMM d, yyyy')} - {format(new Date(contract.end_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">SLA Response</p>
                    <p>{contract.response_time_hours}h response / {contract.resolution_time_hours}h resolution</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">PM Visits</p>
                    <p>{contract.pm_visits_completed} / {contract.pm_visits_per_year} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-medium">{formatCurrency(contract.contract_value_sar)}</p>
                  </div>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2 mt-4">
                <Badge className={priorityColors[contract.sla_priority]}>
                  {contract.sla_priority} priority
                </Badge>
                <Badge variant="outline">{contract.coverage_type}</Badge>
                {contract.after_hours_support && (
                  <Badge variant="outline">After Hours</Badge>
                )}
                {contract.weekend_support && (
                  <Badge variant="outline">Weekend</Badge>
                )}
                {isExpiring && (
                  <Badge className="bg-yellow-500/20 text-yellow-700">
                    Expires in {daysRemaining} days
                  </Badge>
                )}
                {isExpired && (
                  <Badge className="bg-destructive/20 text-destructive">
                    Expired {Math.abs(daysRemaining)} days ago
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service contract? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteContract.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
