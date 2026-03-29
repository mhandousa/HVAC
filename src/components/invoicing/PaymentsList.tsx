import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { usePayments, useDeletePayment, Payment, getPaymentMethodLabel } from '@/hooks/usePayments';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PaymentsListProps {
  invoiceId: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-300',
  failed: 'bg-destructive/20 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
  partially_refunded: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
};

export function PaymentsList({ invoiceId }: PaymentsListProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { data: payments, isLoading } = usePayments(invoiceId);
  const deletePayment = useDeletePayment();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {isArabic ? 'لا توجد دفعات مسجلة' : 'No payments recorded'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
              <Badge className={statusColors[payment.status]} variant="secondary">
                {payment.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{getPaymentMethodLabel(payment.payment_method, isArabic)}</span>
              <span>•</span>
              <span>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</span>
            </div>
            {payment.transaction_reference && (
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'المرجع:' : 'Ref:'} {payment.transaction_reference}
              </p>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isArabic ? 'حذف الدفعة' : 'Delete Payment'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isArabic
                    ? 'هل أنت متأكد من حذف هذه الدفعة؟ سيتم تحديث رصيد الفاتورة.'
                    : 'Are you sure you want to delete this payment? The invoice balance will be updated.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePayment.mutate(payment.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isArabic ? 'حذف' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
