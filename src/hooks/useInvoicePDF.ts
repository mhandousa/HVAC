import { useCallback } from 'react';
import { toast } from 'sonner';
import { Invoice } from './useInvoices';
import { useOrganization } from './useOrganization';
import { 
  InvoicePDFData, 
  downloadInvoicePDF, 
  getInvoicePDFBlob,
  getInvoicePDFBase64 
} from '@/lib/invoice-pdf';

function mapInvoiceToPDFData(
  invoice: Invoice, 
  organizationName: string
): InvoicePDFData {
  return {
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    
    // Organization
    organizationName,
    
    // Customer
    customerName: invoice.customer?.contact_name || 'Customer',
    customerCompany: invoice.customer?.company_name || undefined,
    customerEmail: invoice.customer?.contact_email || undefined,
    customerPhone: invoice.customer?.contact_phone || undefined,
    
    // Line items
    lineItems: (invoice.line_items || []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      vatRate: item.vat_rate || 15,
      discountPercent: item.discount_percent,
      lineTotal: item.line_total,
    })),
    
    // Totals
    subtotal: invoice.subtotal,
    discountAmount: invoice.discount_amount,
    vatRate: invoice.vat_rate,
    vatAmount: invoice.vat_amount,
    totalAmount: invoice.total_amount,
    amountPaid: invoice.amount_paid,
    balanceDue: invoice.balance_due,
    
    // Additional
    notes: invoice.notes || undefined,
    terms: invoice.terms || undefined,
    currency: invoice.currency || 'SAR',
  };
}

export function useInvoicePDF() {
  const { data: organization } = useOrganization();
  
  const downloadPDF = useCallback((invoice: Invoice) => {
    try {
      const pdfData = mapInvoiceToPDFData(
        invoice, 
        organization?.name || 'Organization'
      );
      downloadInvoicePDF(pdfData);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  }, [organization?.name]);
  
  const getPDFBlob = useCallback(async (invoice: Invoice): Promise<Blob> => {
    const pdfData = mapInvoiceToPDFData(
      invoice, 
      organization?.name || 'Organization'
    );
    return getInvoicePDFBlob(pdfData);
  }, [organization?.name]);
  
  const getPDFBase64 = useCallback((invoice: Invoice): string => {
    const pdfData = mapInvoiceToPDFData(
      invoice, 
      organization?.name || 'Organization'
    );
    return getInvoicePDFBase64(pdfData);
  }, [organization?.name]);
  
  return { 
    downloadPDF, 
    getPDFBlob,
    getPDFBase64,
  };
}
