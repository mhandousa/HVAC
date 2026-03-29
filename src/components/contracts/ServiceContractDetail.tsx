import { format, parseISO, differenceInDays } from 'date-fns';
import { useServiceContract, useRenewContract } from '@/hooks/useServiceContracts';
import { formatHijriDate } from '@/hooks/useHijriDate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Pencil, 
  RefreshCw, 
  Download, 
  Calendar, 
  Building2, 
  DollarSign, 
  Clock, 
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { RenewContractDialog } from './RenewContractDialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ServiceContractDetailProps {
  open: boolean;
  onClose: () => void;
  contractId: string | null;
  onEdit: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-700 dark:text-green-300',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  expired: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

export function ServiceContractDetail({ open, onClose, contractId, onEdit }: ServiceContractDetailProps) {
  const { data: contract, isLoading } = useServiceContract(contractId || undefined);
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getContractProgress = () => {
    if (!contract) return 0;
    const start = parseISO(contract.start_date);
    const end = parseISO(contract.end_date);
    const now = new Date();
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(now, start);
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const getDaysRemaining = () => {
    if (!contract) return 0;
    return differenceInDays(parseISO(contract.end_date), new Date());
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
              {contract?.contract_number}
              {contract && (
                <Badge className={statusColors[contract.status]}>
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : contract ? (
            <div className="space-y-6 py-6">
              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit', 'Edit')}
                </Button>
                {contract.status === 'active' && (
                  <Button size="sm" onClick={() => setRenewDialogOpen(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('contracts.renew', 'Renew Contract')}
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('contracts.downloadPdf', 'Download PDF')}
                </Button>
              </div>

              {/* Contract Name */}
              <div>
                <h3 className="text-lg font-semibold">{contract.contract_name}</h3>
                <p className="text-sm text-muted-foreground">{contract.coverage_description}</p>
              </div>

              {/* Contract Progress */}
              {contract.status === 'active' && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                      <Clock className="h-4 w-4" />
                      {t('contracts.progress', 'Contract Progress')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={getContractProgress()} className="h-2" />
                    <div className={cn('flex justify-between mt-2 text-sm', isRTL && 'flex-row-reverse')}>
                      <span className="text-muted-foreground">
                        {format(parseISO(contract.start_date), 'MMM d, yyyy')}
                      </span>
                      <span className={cn(
                        'font-medium',
                        getDaysRemaining() <= 30 ? 'text-yellow-600' : 'text-muted-foreground'
                      )}>
                        {getDaysRemaining() > 0 
                          ? `${getDaysRemaining()} ${t('contracts.daysRemaining', 'days remaining')}`
                          : t('contracts.expired', 'Expired')
                        }
                      </span>
                      <span className="text-muted-foreground">
                        {format(parseISO(contract.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <Building2 className="h-4 w-4" />
                    {t('contracts.customer', 'Customer')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contract.customer ? (
                    <div>
                      <p className="font-medium">
                        {contract.customer.company_name || contract.customer.contact_name}
                      </p>
                      {contract.customer.company_name && (
                        <p className="text-sm text-muted-foreground">{contract.customer.contact_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{contract.customer.contact_phone}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('contracts.noCustomer', 'No customer linked')}</p>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <Calendar className="h-4 w-4" />
                    {t('contracts.dates', 'Contract Dates')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contracts.startDate', 'Start Date')}</p>
                      <p className="font-medium">{format(parseISO(contract.start_date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatHijriDate(parseISO(contract.start_date), language)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contracts.endDate', 'End Date')}</p>
                      <p className="font-medium">{format(parseISO(contract.end_date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatHijriDate(parseISO(contract.end_date), language)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <DollarSign className="h-4 w-4" />
                    {t('contracts.financial', 'Financial Details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contracts.contractValue', 'Contract Value')}</span>
                    <span className="font-semibold text-lg">{formatCurrency(contract.contract_value_sar)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('contracts.billingFrequency', 'Billing Frequency')}</span>
                    <span>{contract.billing_frequency || 'Annually'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('contracts.paymentTerms', 'Payment Terms')}</span>
                    <span>{contract.payment_terms || 'Net 30'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* SLA & Coverage */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className={cn('text-sm flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <Shield className="h-4 w-4" />
                    {t('contracts.sla', 'SLA & Coverage')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('contracts.contractType', 'Contract Type')}</p>
                      <p className="font-medium">{contract.contract_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('contracts.coverageType', 'Coverage Type')}</p>
                      <p className="font-medium">{contract.coverage_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('contracts.responseTime', 'Response Time')}</p>
                      <p className="font-medium">{contract.response_time_hours ? `${contract.response_time_hours}h` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('contracts.resolutionTime', 'Resolution Time')}</p>
                      <p className="font-medium">{contract.resolution_time_hours ? `${contract.resolution_time_hours}h` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('contracts.pmVisits', 'PM Visits/Year')}</p>
                      <p className="font-medium">{contract.pm_visits_per_year || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('contracts.pmCompleted', 'PM Completed')}</p>
                      <p className="font-medium">{contract.pm_visits_completed || 0}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className={cn('flex gap-4 flex-wrap', isRTL && 'flex-row-reverse')}>
                    {contract.after_hours_support && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('contracts.afterHours', 'After Hours')}
                      </Badge>
                    )}
                    {contract.weekend_support && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('contracts.weekendSupport', 'Weekend Support')}
                      </Badge>
                    )}
                    {contract.auto_renew && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {t('contracts.autoRenew', 'Auto Renew')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {contract.notes && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">{t('contracts.notes', 'Notes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{contract.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Special Terms */}
              {contract.special_terms && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">{t('contracts.specialTerms', 'Special Terms')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{contract.special_terms}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t('contracts.notFound', 'Contract not found')}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {contract && (
        <RenewContractDialog
          open={renewDialogOpen}
          onClose={() => setRenewDialogOpen(false)}
          contract={contract}
        />
      )}
    </>
  );
}
