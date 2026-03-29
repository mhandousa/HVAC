import { useState } from 'react';
import { format } from 'date-fns';
import { useInvoice, Invoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { useInvoicePDF } from '@/hooks/useInvoicePDF';
import { formatHijriDate } from '@/hooks/useHijriDate';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Send, Download, CreditCard, CheckCircle, Calendar, Plus, Banknote, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { PaymentsList } from './PaymentsList';
import { SendInvoiceDialog } from './SendInvoiceDialog';

interface InvoiceDetailProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onEdit: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  paid: 'bg-green-500/20 text-green-700 dark:text-green-300',
  partial: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  overdue: 'bg-destructive/20 text-destructive',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

export function InvoiceDetail({ open, onClose, invoiceId, onEdit }: InvoiceDetailProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId || undefined);
  const updateInvoice = useUpdateInvoice();
  const { downloadPDF } = useInvoicePDF();
  const { language } = useLanguage();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const handleSend = () => {
    if (invoice) {
      updateInvoice.mutate({ id: invoice.id, status: 'sent' });
      toast.success('Invoice marked as sent');
    }
  };

  const handleMarkPaid = () => {
    if (invoice) {
      updateInvoice.mutate({ 
        id: invoice.id, 
        status: 'paid',
        amount_paid: invoice.total_amount,
      });
      toast.success('Invoice marked as paid');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Invoice {invoice?.invoice_number}
            {invoice && (
              <Badge className={statusColors[invoice.status]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
        ) : invoice ? (
          <div className="space-y-6 py-6">
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              {invoice.status === 'draft' && (
                <Button size="sm" onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
              )}
              {['sent', 'partial', 'overdue'].includes(invoice.status) && (
                <>
                  <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleMarkPaid}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                </>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => invoice && downloadPDF(invoice)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit
              </Button>
            </div>

            {/* Customer Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Bill To</CardTitle>
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
                    {invoice.customer.contact_email && (
                      <p className="text-sm text-muted-foreground">{invoice.customer.contact_email}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{invoice.customer.contact_phone}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer linked</p>
                )}
              </CardContent>
            </Card>

            {/* Dates - Gregorian & Hijri */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === 'ar' ? 'التواريخ' : 'Dates'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'تاريخ الفاتورة' : 'Invoice Date'}
                    </p>
                    <p className="font-medium">{format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatHijriDate(new Date(invoice.invoice_date), language)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </p>
                    <p className="font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatHijriDate(new Date(invoice.due_date), language)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="font-medium mb-3">Items</h3>
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
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vat_rate}%)</span>
                <span>{formatCurrency(invoice.vat_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600">{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Balance Due</span>
                    <span className={invoice.balance_due > 0 ? 'text-destructive' : 'text-green-600'}>
                      {formatCurrency(invoice.balance_due)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Payments Section */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    {language === 'ar' ? 'المدفوعات' : 'Payments'}
                  </span>
                  {['sent', 'partial', 'overdue'].includes(invoice.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setPaymentDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentsList invoiceId={invoice.id} />
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms && (
              <div>
                <h3 className="font-medium mb-2">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground">{invoice.terms}</p>
              </div>
            )}

            {/* ZATCA Status */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  ZATCA E-Invoice Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">
                  {invoice.zatca_submission_status === 'pending' ? 'Not Submitted' : invoice.zatca_submission_status}
                </Badge>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Invoice not found</div>
        )}
      </SheetContent>

      {/* Payment Recording Dialog */}
      {invoice && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          invoice={invoice}
        />
      )}

      {/* Send Invoice Dialog */}
      {invoice && (
        <SendInvoiceDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          invoice={invoice}
        />
      )}
    </Sheet>
  );
}
