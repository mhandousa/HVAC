import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, RefreshCw } from 'lucide-react';
import { InvoiceList } from '@/components/invoicing/InvoiceList';
import { InvoiceForm } from '@/components/invoicing/InvoiceForm';
import { InvoiceStats } from '@/components/invoicing/InvoiceStats';
import { InvoiceDetail } from '@/components/invoicing/InvoiceDetail';
import { RecurringInvoiceList } from '@/components/invoicing/RecurringInvoiceList';
import { RecurringInvoiceForm } from '@/components/invoicing/RecurringInvoiceForm';
import { RecurringInvoiceDetail } from '@/components/invoicing/RecurringInvoiceDetail';
import { Invoice } from '@/hooks/useInvoices';
import { RecurringInvoice } from '@/hooks/useRecurringInvoices';

export default function Invoicing() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  // Recurring invoice state
  const [recurringFormOpen, setRecurringFormOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringInvoice | null>(null);
  const [viewRecurringId, setViewRecurringId] = useState<string | null>(null);

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setViewInvoiceId(invoice.id);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedInvoice(null);
  };

  const handleCloseDetail = () => {
    setViewInvoiceId(null);
  };

  const handleEditFromDetail = () => {
    if (viewInvoiceId) {
      setViewInvoiceId(null);
    }
  };

  // Recurring invoice handlers
  const handleEditRecurring = (invoice: RecurringInvoice) => {
    setSelectedRecurring(invoice);
    setRecurringFormOpen(true);
  };

  const handleViewRecurring = (invoice: RecurringInvoice) => {
    setViewRecurringId(invoice.id);
  };

  const handleCloseRecurringForm = () => {
    setRecurringFormOpen(false);
    setSelectedRecurring(null);
  };

  const handleCloseRecurringDetail = () => {
    setViewRecurringId(null);
  };

  const handleEditFromRecurringDetail = (invoice: RecurringInvoice) => {
    setViewRecurringId(null);
    setSelectedRecurring(invoice);
    setRecurringFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoicing</h1>
            <p className="text-muted-foreground">
              Create and manage invoices for your customers
            </p>
          </div>
          {activeTab === 'invoices' ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          ) : (
            <Button onClick={() => setRecurringFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Recurring Invoice
            </Button>
          )}
        </div>

        {/* Stats */}
        <InvoiceStats />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="recurring" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            <InvoiceList onEdit={handleEdit} onView={handleView} />
          </TabsContent>

          <TabsContent value="recurring" className="mt-6">
            <RecurringInvoiceList onEdit={handleEditRecurring} onView={handleViewRecurring} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invoice Form Sheet */}
      <InvoiceForm
        open={formOpen}
        onClose={handleCloseForm}
        invoice={selectedInvoice}
      />

      {/* Invoice Detail Sheet */}
      <InvoiceDetail
        open={!!viewInvoiceId}
        onClose={handleCloseDetail}
        invoiceId={viewInvoiceId}
        onEdit={handleEditFromDetail}
      />

      {/* Recurring Invoice Form Sheet */}
      <RecurringInvoiceForm
        open={recurringFormOpen}
        onClose={handleCloseRecurringForm}
        invoice={selectedRecurring}
      />

      {/* Recurring Invoice Detail Sheet */}
      <RecurringInvoiceDetail
        open={!!viewRecurringId}
        onClose={handleCloseRecurringDetail}
        invoiceId={viewRecurringId}
        onEdit={handleEditFromRecurringDetail}
      />
    </DashboardLayout>
  );
}
