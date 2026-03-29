import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { useCustomers } from '@/hooks/useCustomers';
import { useServiceContracts } from '@/hooks/useServiceContracts';
import {
  useCreateRecurringInvoice,
  useUpdateRecurringInvoice,
  RecurringInvoice,
  RecurringInvoiceLineItem,
  calculateNextInvoiceDate,
} from '@/hooks/useRecurringInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface RecurringInvoiceFormProps {
  open: boolean;
  onClose: () => void;
  invoice?: RecurringInvoice | null;
}

const VAT_RATE = 15;

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function RecurringInvoiceForm({ open, onClose, invoice }: RecurringInvoiceFormProps) {
  const { data: customers } = useCustomers();
  const { data: contracts } = useServiceContracts();
  const createInvoice = useCreateRecurringInvoice();
  const updateInvoice = useUpdateRecurringInvoice();

  const [formData, setFormData] = useState<{
    template_name: string;
    customer_id: string;
    service_contract_id: string;
    description: string;
    frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    frequency_value: number;
    start_date: string;
    end_date: string;
  }>({
    template_name: '',
    customer_id: '',
    service_contract_id: '',
    description: '',
    frequency_type: 'monthly',
    frequency_value: 1,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
  });

  const [lineItems, setLineItems] = useState<RecurringInvoiceLineItem[]>([
    { description: '', quantity: 1, unit_price: 0, vat_rate: VAT_RATE, line_total: 0 },
  ]);

  // Calculate next invoice date preview
  const nextInvoiceDatePreview = calculateNextInvoiceDate(
    formData.start_date,
    formData.frequency_type,
    formData.frequency_value
  );

  useEffect(() => {
    if (invoice) {
      setFormData({
        template_name: invoice.template_name,
        customer_id: invoice.customer_id || '',
        service_contract_id: invoice.service_contract_id || '',
        description: invoice.description || '',
        frequency_type: invoice.frequency_type,
        frequency_value: invoice.frequency_value,
        start_date: invoice.start_date,
        end_date: invoice.end_date || '',
      });
      if (invoice.line_items && invoice.line_items.length > 0) {
        setLineItems(invoice.line_items);
      }
    } else {
      setFormData({
        template_name: '',
        customer_id: '',
        service_contract_id: '',
        description: '',
        frequency_type: 'monthly',
        frequency_value: 1,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
      });
      setLineItems([{ description: '', quantity: 1, unit_price: 0, vat_rate: VAT_RATE, line_total: 0 }]);
    }
  }, [invoice, open]);

  const updateLineItem = (index: number, field: keyof RecurringInvoiceLineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;

    // Recalculate line total
    const qty = updated[index].quantity;
    const price = updated[index].unit_price;
    updated[index].line_total = qty * price;

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unit_price: 0, vat_rate: VAT_RATE, line_total: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const vatAmount = subtotal * (VAT_RATE / 100);
  const totalAmount = subtotal + vatAmount;

  const handleSubmit = () => {
    if (!formData.template_name) {
      return;
    }

    const data = {
      ...formData,
      customer_id: formData.customer_id || undefined,
      service_contract_id: formData.service_contract_id || undefined,
      end_date: formData.end_date || undefined,
      subtotal,
      vat_rate: VAT_RATE,
      total_amount: totalAmount,
      line_items: lineItems.filter((item) => item.description),
    };

    if (invoice) {
      updateInvoice.mutate({ id: invoice.id, ...data }, { onSuccess: onClose });
    } else {
      createInvoice.mutate(data, { onSuccess: onClose });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{invoice ? 'Edit Recurring Invoice' : 'Create Recurring Invoice'}</SheetTitle>
          <SheetDescription>
            {invoice
              ? 'Update recurring invoice template'
              : 'Set up automatic invoice generation on a schedule'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                placeholder="e.g., Monthly Maintenance - Customer X"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(v) => setFormData({ ...formData, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name || c.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Service Contract</Label>
                <Select
                  value={formData.service_contract_id}
                  onValueChange={(v) => setFormData({ ...formData, service_contract_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contract_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description for this recurring invoice..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency_type}
                    onValueChange={(v: any) => setFormData({ ...formData, frequency_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.frequency_value}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency_value: parseInt(e.target.value) || 1 })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.frequency_type === 'daily' && 'day(s)'}
                      {formData.frequency_type === 'weekly' && 'week(s)'}
                      {formData.frequency_type === 'monthly' && 'month(s)'}
                      {formData.frequency_type === 'quarterly' && '(×3 months)'}
                      {formData.frequency_type === 'yearly' && 'year(s)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">First invoice will be generated on: </span>
                <span className="font-medium">
                  {format(nextInvoiceDatePreview, 'MMMM d, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Line Items */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    {index === 0 && <Label className="text-xs">Description</Label>}
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Qty</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Price (SAR)</Label>}
                    <Input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Total</Label>}
                    <Input value={formatCurrency(item.line_total)} disabled className="bg-muted" />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({VAT_RATE}%)</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total per Invoice</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                !formData.template_name ||
                createInvoice.isPending ||
                updateInvoice.isPending
              }
            >
              {invoice ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
