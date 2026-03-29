import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addYears } from 'date-fns';
import { 
  useServiceContract, 
  useCreateServiceContract, 
  useUpdateServiceContract,
  useNextContractNumber 
} from '@/hooks/useServiceContracts';
import { useCustomers } from '@/hooks/useCustomers';
import { useProjectCustomers } from '@/hooks/useProjectCustomers';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const contractSchema = z.object({
  contract_name: z.string().min(1, 'Contract name is required'),
  contract_number: z.string().min(1, 'Contract number is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  contract_type: z.string().min(1, 'Contract type is required'),
  coverage_type: z.string().min(1, 'Coverage type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  contract_value_sar: z.coerce.number().min(0, 'Value must be positive'),
  billing_frequency: z.string().optional(),
  payment_terms: z.string().optional(),
  response_time_hours: z.coerce.number().optional(),
  resolution_time_hours: z.coerce.number().optional(),
  pm_visits_per_year: z.coerce.number().optional(),
  coverage_description: z.string().optional(),
  after_hours_support: z.boolean().optional(),
  weekend_support: z.boolean().optional(),
  auto_renew: z.boolean().optional(),
  notes: z.string().optional(),
  special_terms: z.string().optional(),
  status: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ServiceContractFormProps {
  open: boolean;
  onClose: () => void;
  contractId: string | null;
  projectId?: string; // Optional: when provided, filters customers to project-linked only
}

export function ServiceContractForm({ open, onClose, contractId, projectId }: ServiceContractFormProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { data: contract, isLoading: loadingContract } = useServiceContract(contractId || undefined);
  const { data: allCustomers = [] } = useCustomers();
  const { data: projectCustomers = [] } = useProjectCustomers(projectId);
  const { data: nextNumber } = useNextContractNumber();
  const createContract = useCreateServiceContract();
  const updateContract = useUpdateServiceContract();

  // Filter customers: when projectId is provided, only show customers linked to that project
  const customers = useMemo(() => {
    if (!projectId) return allCustomers;
    const linkedCustomerIds = new Set(projectCustomers.map(pc => pc.customer_id));
    return allCustomers.filter(c => linkedCustomerIds.has(c.id));
  }, [allCustomers, projectCustomers, projectId]);

  const isEditing = !!contractId;

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_name: '',
      contract_number: '',
      customer_id: '',
      contract_type: 'annual',
      coverage_type: 'full',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
      contract_value_sar: 0,
      billing_frequency: 'annually',
      payment_terms: 'net_30',
      response_time_hours: 4,
      resolution_time_hours: 24,
      pm_visits_per_year: 4,
      coverage_description: '',
      after_hours_support: false,
      weekend_support: false,
      auto_renew: true,
      notes: '',
      special_terms: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (contract && isEditing) {
      form.reset({
        contract_name: contract.contract_name,
        contract_number: contract.contract_number,
        customer_id: contract.customer_id,
        contract_type: contract.contract_type,
        coverage_type: contract.coverage_type,
        start_date: contract.start_date,
        end_date: contract.end_date,
        contract_value_sar: contract.contract_value_sar,
        billing_frequency: contract.billing_frequency || 'annually',
        payment_terms: contract.payment_terms || 'net_30',
        response_time_hours: contract.response_time_hours || undefined,
        resolution_time_hours: contract.resolution_time_hours || undefined,
        pm_visits_per_year: contract.pm_visits_per_year || undefined,
        coverage_description: contract.coverage_description || '',
        after_hours_support: contract.after_hours_support || false,
        weekend_support: contract.weekend_support || false,
        auto_renew: contract.auto_renew || false,
        notes: contract.notes || '',
        special_terms: contract.special_terms || '',
        status: contract.status,
      });
    } else if (!isEditing && nextNumber) {
      form.setValue('contract_number', nextNumber);
    }
  }, [contract, isEditing, nextNumber, form]);

  const onSubmit = (data: ContractFormData) => {
    if (isEditing && contractId) {
      updateContract.mutate(
        { id: contractId, ...data },
        { onSuccess: () => onClose() }
      );
    } else {
      // Ensure required fields for creation
      const createData = {
        ...data,
        customer_id: data.customer_id!,
        contract_number: data.contract_number!,
        contract_name: data.contract_name!,
        start_date: data.start_date!,
        end_date: data.end_date!,
        contract_value_sar: data.contract_value_sar ?? 0,
      };
      createContract.mutate(createData, { onSuccess: () => onClose() });
    }
  };

  const isSubmitting = createContract.isPending || updateContract.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? t('contracts.editContract', 'Edit Contract') 
              : t('contracts.newContract', 'New Service Contract')
            }
          </DialogTitle>
        </DialogHeader>

        {loadingContract && isEditing ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t('contracts.basicInfo', 'Basic Information')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contract_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.contractNumber', 'Contract Number')}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.status', 'Status')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">{t('contracts.statusActive', 'Active')}</SelectItem>
                              <SelectItem value="pending">{t('contracts.statusPending', 'Pending')}</SelectItem>
                              <SelectItem value="expired">{t('contracts.statusExpired', 'Expired')}</SelectItem>
                              <SelectItem value="cancelled">{t('contracts.statusCancelled', 'Cancelled')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contract_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.contractName', 'Contract Name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Annual Maintenance Agreement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.customer', 'Customer')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('contracts.selectCustomer', 'Select customer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.company_name || customer.contact_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {projectId && customers.length === 0 && (
                          <Alert variant="default" className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              {t('contracts.noProjectCustomers', 'No customers are linked to this project. Link customers first from the project page.')}
                            </AlertDescription>
                          </Alert>
                        )}
                        {projectId && customers.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('contracts.projectCustomersOnly', 'Showing only customers linked to this project')}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contract_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.contractType', 'Contract Type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="annual">{t('contracts.typeAnnual', 'Annual')}</SelectItem>
                              <SelectItem value="semi_annual">{t('contracts.typeSemiAnnual', 'Semi-Annual')}</SelectItem>
                              <SelectItem value="quarterly">{t('contracts.typeQuarterly', 'Quarterly')}</SelectItem>
                              <SelectItem value="monthly">{t('contracts.typeMonthly', 'Monthly')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coverage_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.coverageType', 'Coverage Type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full">{t('contracts.coverageFull', 'Full Coverage')}</SelectItem>
                              <SelectItem value="parts_only">{t('contracts.coverageParts', 'Parts Only')}</SelectItem>
                              <SelectItem value="labor_only">{t('contracts.coverageLabor', 'Labor Only')}</SelectItem>
                              <SelectItem value="pm_only">{t('contracts.coveragePM', 'PM Only')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t('contracts.dates', 'Contract Dates')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.startDate', 'Start Date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.endDate', 'End Date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t('contracts.financial', 'Financial')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="contract_value_sar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.value', 'Value (SAR)')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billing_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.billingFrequency', 'Billing Frequency')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="annually">{t('contracts.billingAnnual', 'Annually')}</SelectItem>
                              <SelectItem value="semi_annually">{t('contracts.billingSemiAnnual', 'Semi-Annually')}</SelectItem>
                              <SelectItem value="quarterly">{t('contracts.billingQuarterly', 'Quarterly')}</SelectItem>
                              <SelectItem value="monthly">{t('contracts.billingMonthly', 'Monthly')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="payment_terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.paymentTerms', 'Payment Terms')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="net_15">Net 15</SelectItem>
                              <SelectItem value="net_30">Net 30</SelectItem>
                              <SelectItem value="net_45">Net 45</SelectItem>
                              <SelectItem value="net_60">Net 60</SelectItem>
                              <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* SLA */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t('contracts.sla', 'SLA Settings')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="response_time_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.responseTime', 'Response Time (hrs)')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="resolution_time_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.resolutionTime', 'Resolution Time (hrs)')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pm_visits_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contracts.pmVisits', 'PM Visits/Year')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className={cn('flex gap-6', isRTL && 'flex-row-reverse')}>
                    <FormField
                      control={form.control}
                      name="after_hours_support"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0">{t('contracts.afterHours', 'After Hours Support')}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekend_support"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0">{t('contracts.weekendSupport', 'Weekend Support')}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="auto_renew"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0">{t('contracts.autoRenew', 'Auto Renew')}</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description & Notes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="coverage_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.coverageDescription', 'Coverage Description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what's covered under this contract..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.notes', 'Notes')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing 
                      ? t('common.saveChanges', 'Save Changes')
                      : t('contracts.createContract', 'Create Contract')
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
