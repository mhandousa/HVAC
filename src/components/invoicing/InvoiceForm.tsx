import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useCustomers } from '@/hooks/useCustomers';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useCreateInvoice, useUpdateInvoice, useNextInvoiceNumber, Invoice, InvoiceLineItem } from '@/hooks/useInvoices';
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
import { Plus, Trash2 } from 'lucide-react';

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  workOrderId?: string;
}

const VAT_RATE = 15;

export function InvoiceForm({ open, onClose, invoice, workOrderId }: InvoiceFormProps) {
  const { data: customers } = useCustomers();
  const { data: workOrders } = useWorkOrders();
  const { data: nextNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [formData, setFormData] = useState({
    customer_id: '',
    work_order_id: '',
    invoice_number: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    notes: '',
    terms: 'Payment due within 30 days.',
    payment_method: 'bank_transfer',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unit_price: 0, vat_rate: VAT_RATE, line_total: 0 },
  ]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        customer_id: invoice.customer_id || '',
        work_order_id: invoice.work_order_id || '',
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        payment_method: invoice.payment_method || 'bank_transfer',
      });
      if (invoice.line_items && invoice.line_items.length > 0) {
        setLineItems(invoice.line_items);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        invoice_number: nextNumber || 'INV-0001',
        work_order_id: workOrderId || '',
      }));
      setLineItems([{ description: '', quantity: 1, unit_price: 0, vat_rate: VAT_RATE, line_total: 0 }]);
    }
  }, [invoice, nextNumber, workOrderId]);

  // Import work order details - use customer from work order if available
  useEffect(() => {
    if (formData.work_order_id && workOrders) {
      const wo = workOrders.find((w) => w.id === formData.work_order_id);
      if (wo) {
        // Add work order as line item if empty
        if (lineItems.length === 1 && !lineItems[0].description) {
          setLineItems([
            {
              description: `Service: ${wo.title}`,
              quantity: 1,
              unit_price: 0,
              vat_rate: VAT_RATE,
              line_total: 0,
            },
          ]);
        }
      }
    }
  }, [formData.work_order_id, workOrders]);

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;

    // Recalculate line total
    const qty = updated[index].quantity;
    const price = updated[index].unit_price;
    const discount = updated[index].discount_percent || 0;
    const discountedPrice = price * (1 - discount / 100);
    updated[index].line_total = qty * discountedPrice;

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
    const data = {
      ...formData,
      customer_id: formData.customer_id || undefined,
      work_order_id: formData.work_order_id || undefined,
      subtotal,
      vat_rate: VAT_RATE,
      vat_amount: vatAmount,
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
          <SheetTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</SheetTitle>
          <SheetDescription>
            {invoice ? 'Update invoice details' : 'Create a new invoice for your customer'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Work Order</Label>
              <Select
                value={formData.work_order_id}
                onValueChange={(v) => setFormData({ ...formData, work_order_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to work order" />
                </SelectTrigger>
                <SelectContent>
                  {workOrders?.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

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
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes for the customer..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={createInvoice.isPending || updateInvoice.isPending}
            >
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
