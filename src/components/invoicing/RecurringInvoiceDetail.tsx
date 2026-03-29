import { format, isBefore } from 'date-fns';
import {
  useRecurringInvoice,
  useToggleRecurringInvoice,
  RecurringInvoice,
  getFrequencyLabel,
} from '@/hooks/useRecurringInvoices';
import { useInvoices } from '@/hooks/useInvoices';
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
import {
  Edit,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  User,
  FileText,
  Clock,
} from 'lucide-react';

interface RecurringInvoiceDetailProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onEdit: (invoice: RecurringInvoice) => void;
}

export function RecurringInvoiceDetail({
  open,
  onClose,
  invoiceId,
  onEdit,
}: RecurringInvoiceDetailProps) {
  const { data: invoice, isLoading } = useRecurringInvoice(invoiceId || undefined);
  const { data: allInvoices } = useInvoices();
  const toggleInvoice = useToggleRecurringInvoice();

  // Find invoices generated from this recurring template
  // Note: In a full implementation, there would be a recurring_invoice_id FK on invoices table
  const generatedInvoices = allInvoices?.filter((inv) =>
    inv.notes?.includes(invoice?.template_name || '')
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getStatusBadge = (inv: RecurringInvoice) => {
    if (inv.end_date && isBefore(new Date(inv.end_date), new Date())) {
      return <Badge variant="outline" className="text-muted-foreground">Ended</Badge>;
    }
    if (!inv.is_active) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Paused</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Active</Badge>;
  };

  const handleToggle = () => {
    if (invoice) {
      toggleInvoice.mutate({ id: invoice.id, isActive: !invoice.is_active });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5" />
            {invoice?.template_name}
            {invoice && getStatusBadge(invoice)}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : invoice ? (
          <div className="space-y-6 py-6">
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={handleToggle}>
                {invoice.is_active ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>

            {/* Customer Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.customer ? (
                  <div>
                    <p className="font-medium">
                      {invoice.customer.company_name || invoice.customer.contact_name}
                    </p>
                    {invoice.customer.company_name && (
                      <p className="text-sm text-muted-foreground">{invoice.customer.contact_name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer linked</p>
                )}
              </CardContent>
            </Card>

            {/* Schedule Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium">
                      {getFrequencyLabel(invoice.frequency_type, invoice.frequency_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Invoice</p>
                    <p className="font-medium">
                      {invoice.next_invoice_date
                        ? format(new Date(invoice.next_invoice_date), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(invoice.start_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {invoice.end_date
                        ? format(new Date(invoice.end_date), 'MMM d, yyyy')
                        : 'No end date'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {invoice.description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{invoice.description}</p>
              </div>
            )}

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="font-medium mb-3">Line Items</h3>
              <div className="space-y-2">
                {invoice.line_items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p>{item.description}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.line_total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vat_rate}%)</span>
                <span>{formatCurrency(invoice.subtotal * (invoice.vat_rate / 100))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total per Invoice</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Generation History */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Generation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoices Generated</span>
                    <Badge variant="secondary">{invoice.invoices_generated}</Badge>
                  </div>
                  {invoice.last_generated_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Generated</span>
                      <span>{format(new Date(invoice.last_generated_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                {generatedInvoices && generatedInvoices.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Recent Invoices</p>
                    {generatedInvoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>{inv.invoice_number}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(inv.invoice_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Contract Link */}
            {invoice.service_contract && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Linked Service Contract</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{invoice.service_contract.contract_name}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Recurring invoice not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
