import { useInvoices } from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function InvoiceStats() {
  const { data: invoices } = useInvoices();

  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter((i) => i.status === 'draft').length || 0,
    pending: invoices?.filter((i) => ['sent', 'partial'].includes(i.status)).length || 0,
    paid: invoices?.filter((i) => i.status === 'paid').length || 0,
    overdue: invoices?.filter((i) => i.status === 'overdue').length || 0,
    totalRevenue: invoices?.reduce((sum, i) => sum + (i.amount_paid || 0), 0) || 0,
    outstanding: invoices?.reduce((sum, i) => sum + (i.balance_due || 0), 0) || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.draft} drafts, {stats.pending} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.outstanding)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pending} invoices awaiting payment
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collected</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.paid} fully paid invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            Invoices past due date
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
