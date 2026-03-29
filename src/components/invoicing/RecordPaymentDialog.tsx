import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CreditCard } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCreatePayment, useNextPaymentNumber, PaymentMethod, getPaymentMethodLabel } from '@/hooks/usePayments';
import { Invoice } from '@/hooks/useInvoices';
import { useLanguage } from '@/contexts/LanguageContext';

const paymentMethods: PaymentMethod[] = [
  'mada',
  'sadad',
  'bank_transfer',
  'cash',
  'credit_card',
  'stc_pay',
  'apple_pay',
];

const formSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.date(),
  payment_method: z.enum(['mada', 'sadad', 'bank_transfer', 'cash', 'credit_card', 'stc_pay', 'apple_pay']),
  transaction_reference: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  card_last_four: z.string().max(4).optional(),
  sadad_bill_number: z.string().optional(),
  sadad_payment_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export function RecordPaymentDialog({ open, onClose, invoice }: RecordPaymentDialogProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const createPayment = useCreatePayment();
  const { data: nextPaymentNumber } = useNextPaymentNumber();
  
  const balanceDue = invoice.balance_due ?? (invoice.total_amount - (invoice.amount_paid ?? 0));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: balanceDue,
      payment_date: new Date(),
      payment_method: 'mada',
      transaction_reference: '',
      bank_name: '',
      bank_account_number: '',
      card_last_four: '',
      sadad_bill_number: '',
      sadad_payment_number: '',
      notes: '',
    },
  });

  const watchPaymentMethod = form.watch('payment_method');

  useEffect(() => {
    if (open) {
      form.reset({
        amount: balanceDue,
        payment_date: new Date(),
        payment_method: 'mada',
        transaction_reference: '',
        bank_name: '',
        bank_account_number: '',
        card_last_four: '',
        sadad_bill_number: '',
        sadad_payment_number: '',
        notes: '',
      });
    }
  }, [open, balanceDue, form]);

  const onSubmit = (data: FormData) => {
    if (!nextPaymentNumber) return;

    createPayment.mutate(
      {
        invoice_id: invoice.id,
        customer_id: invoice.customer?.id,
        payment_number: nextPaymentNumber,
        payment_date: format(data.payment_date, 'yyyy-MM-dd'),
        amount: data.amount,
        currency: 'SAR',
        payment_method: data.payment_method,
        transaction_reference: data.transaction_reference || undefined,
        bank_name: data.bank_name || undefined,
        bank_account_number: data.bank_account_number || undefined,
        card_last_four: data.card_last_four || undefined,
        sadad_bill_number: data.sadad_bill_number || undefined,
        sadad_payment_number: data.sadad_payment_number || undefined,
        notes: data.notes || undefined,
        status: 'completed',
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {isArabic ? 'تسجيل دفعة' : 'Record Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 rounded-lg bg-muted">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{isArabic ? 'رقم الفاتورة' : 'Invoice'}</span>
            <span className="font-medium">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">{isArabic ? 'الرصيد المستحق' : 'Balance Due'}</span>
            <span className="font-semibold text-destructive">{formatCurrency(balanceDue)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'المبلغ (ر.س)' : 'Amount (SAR)'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{isArabic ? 'تاريخ الدفع' : 'Payment Date'}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{isArabic ? 'اختر تاريخ' : 'Pick a date'}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'طريقة الدفع' : 'Payment Method'}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method, isArabic)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank Transfer Fields */}
            {watchPaymentMethod === 'bank_transfer' && (
              <>
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'اسم البنك' : 'Bank Name'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={isArabic ? 'مثال: الراجحي' : 'e.g., Al Rajhi'} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'رقم الحساب' : 'Account Number'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* SADAD Fields */}
            {watchPaymentMethod === 'sadad' && (
              <>
                <FormField
                  control={form.control}
                  name="sadad_bill_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'رقم الفاتورة في سداد' : 'SADAD Bill Number'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sadad_payment_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isArabic ? 'رقم الدفع في سداد' : 'SADAD Payment Number'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Card Fields */}
            {['mada', 'credit_card'].includes(watchPaymentMethod) && (
              <FormField
                control={form.control}
                name="card_last_four"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? 'آخر 4 أرقام' : 'Last 4 Digits'}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={4} placeholder="1234" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="transaction_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'رقم المرجع' : 'Reference Number'}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? 'ملاحظات' : 'Notes'}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={createPayment.isPending}>
                {createPayment.isPending 
                  ? (isArabic ? 'جاري التسجيل...' : 'Recording...') 
                  : (isArabic ? 'تسجيل الدفعة' : 'Record Payment')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
