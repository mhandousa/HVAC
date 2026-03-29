import { useState } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import {
  useRecurringInvoices,
  useDeleteRecurringInvoice,
  useToggleRecurringInvoice,
  RecurringInvoice,
  getFrequencyLabel,
} from '@/hooks/useRecurringInvoices';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Zap,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface RecurringInvoiceListProps {
  onEdit: (invoice: RecurringInvoice) => void;
  onView: (invoice: RecurringInvoice) => void;
}

export function RecurringInvoiceList({ onEdit, onView }: RecurringInvoiceListProps) {
  const { data: invoices, isLoading } = useRecurringInvoices();
  const deleteInvoice = useDeleteRecurringInvoice();
  const toggleInvoice = useToggleRecurringInvoice();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAllDue = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recurring-invoices');
      
      if (error) throw error;
      
      if (data.generated > 0) {
        toast.success(`Generated ${data.generated} invoice(s)`, {
          description: `Invoice numbers: ${data.invoiceNumbers?.join(', ') || 'N/A'}`,
        });
        queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      } else {
        toast.info('No invoices due for generation');
      }
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Some errors occurred:', data.errors);
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast.error('Failed to generate invoices');
    } finally {
      setIsGenerating(false);
    }
  };

  const dueCount = invoices?.filter((inv) => {
    if (!inv.is_active || !inv.next_invoice_date) return false;
    if (inv.end_date && isBefore(new Date(inv.end_date), new Date())) return false;
    return isBefore(new Date(inv.next_invoice_date), new Date()) || 
           format(new Date(inv.next_invoice_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  }).length || 0;

  const filteredInvoices = invoices?.filter((inv) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      inv.template_name.toLowerCase().includes(searchLower) ||
      inv.customer?.company_name?.toLowerCase().includes(searchLower) ||
      inv.customer?.contact_name?.toLowerCase().includes(searchLower);

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && inv.is_active;
    if (statusFilter === 'paused') return matchesSearch && !inv.is_active;
    if (statusFilter === 'ended') {
      return matchesSearch && inv.end_date && isBefore(new Date(inv.end_date), new Date());
    }
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getStatusBadge = (invoice: RecurringInvoice) => {
    if (invoice.end_date && isBefore(new Date(invoice.end_date), new Date())) {
      return <Badge variant="outline" className="text-muted-foreground">Ended</Badge>;
    }
    if (!invoice.is_active) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Paused</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Active</Badge>;
  };

  const isUpcomingSoon = (date: string | null) => {
    if (!date) return false;
    const nextDate = new Date(date);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isBefore(nextDate, sevenDaysFromNow) && isBefore(new Date(), nextDate);
  };

  const handleToggle = (invoice: RecurringInvoice) => {
    toggleInvoice.mutate({ id: invoice.id, isActive: !invoice.is_active });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recurring invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerateAllDue}
          disabled={isGenerating || dueCount === 0}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Generate Due ({dueCount})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Generated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No recurring invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onView(invoice)}
                >
                  <TableCell className="font-medium">{invoice.template_name}</TableCell>
                  <TableCell>
                    {invoice.customer?.company_name || invoice.customer?.contact_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getFrequencyLabel(invoice.frequency_type, invoice.frequency_value)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.next_invoice_date ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{format(new Date(invoice.next_invoice_date), 'MMM d, yyyy')}</span>
                        {isUpcomingSoon(invoice.next_invoice_date) && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                            Soon
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{invoice.invoices_generated}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(invoice)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggle(invoice)}>
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
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(invoice.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring invoice? This will not delete any
              invoices that have already been generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteInvoice.mutate(deleteId);
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
