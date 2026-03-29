import { ServiceContract, useDeleteServiceContract } from '@/hooks/useServiceContracts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { formatHijriDate } from '@/hooks/useHijriDate';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Eye, Pencil, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ServiceContractListProps {
  contracts: ServiceContract[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-700 dark:text-green-300',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  expired: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

export function ServiceContractList({ contracts, isLoading, onView, onEdit }: ServiceContractListProps) {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const deleteContract = useDeleteServiceContract();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const handleDelete = () => {
    if (contractToDelete) {
      deleteContract.mutate(contractToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setContractToDelete(null);
        }
      });
    }
  };

  const confirmDelete = (id: string) => {
    setContractToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('contracts.noContracts', 'No contracts found')}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.contractNumber', 'Contract #')}</TableHead>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.customer', 'Customer')}</TableHead>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.type', 'Type')}</TableHead>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.value', 'Value')}</TableHead>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.endDate', 'End Date')}</TableHead>
                <TableHead className={isRTL ? 'text-right' : ''}>{t('contracts.status', 'Status')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);
                const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

                return (
                  <TableRow 
                    key={contract.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onView(contract.id)}
                  >
                    <TableCell className="font-medium">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {contract.customer?.company_name || contract.customer?.contact_name}
                        </p>
                        {contract.customer?.company_name && (
                          <p className="text-sm text-muted-foreground">
                            {contract.customer.contact_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contract.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.contract_value_sar)}
                    </TableCell>
                    <TableCell>
                      <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                        {isExpiringSoon && contract.status === 'active' && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p>{format(parseISO(contract.end_date), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatHijriDate(parseISO(contract.end_date), language)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(contract.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('common.view', 'View')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(contract.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          {contract.status === 'active' && (
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t('contracts.renew', 'Renew')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => confirmDelete(contract.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteTitle', 'Delete Contract')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.deleteDescription', 'Are you sure you want to delete this contract? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
