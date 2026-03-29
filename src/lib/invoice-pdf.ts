import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  
  // Organization (seller)
  organizationName: string;
  organizationAddress?: string;
  organizationVat?: string;
  organizationPhone?: string;
  organizationEmail?: string;
  
  // Customer (buyer)
  customerName: string;
  customerCompany?: string;
  customerAddress?: string;
  customerVat?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Line items
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discountPercent?: number;
    lineTotal: number;
  }[];
  
  // Totals
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  
  // Additional
  notes?: string;
  terms?: string;
  currency: string;
  
  // ZATCA (optional)
  zatcaQrCode?: string;
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const mutedColor: [number, number, number] = [107, 114, 128]; // Gray-500
  
  // Header with organization name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(data.organizationName, 20, 25);
  
  // Invoice title
  doc.setFontSize(12);
  doc.setTextColor(...mutedColor);
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text(`#${data.invoiceNumber}`, pageWidth - 20, 28, { align: 'right' });
  
  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    draft: [156, 163, 175],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    partial: [234, 179, 8],
    overdue: [239, 68, 68],
    cancelled: [156, 163, 175],
  };
  
  const statusColor = statusColors[data.status] || statusColors.draft;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 50, 32, 30, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(data.status.toUpperCase(), pageWidth - 35, 37.5, { align: 'center' });
  
  // Organization details (left side)
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  let yPos = 35;
  
  if (data.organizationAddress) {
    doc.text(data.organizationAddress, 20, yPos);
    yPos += 5;
  }
  if (data.organizationPhone) {
    doc.text(`Tel: ${data.organizationPhone}`, 20, yPos);
    yPos += 5;
  }
  if (data.organizationEmail) {
    doc.text(data.organizationEmail, 20, yPos);
    yPos += 5;
  }
  if (data.organizationVat) {
    doc.text(`VAT: ${data.organizationVat}`, 20, yPos);
    yPos += 5;
  }
  
  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 55, pageWidth - 20, 55);
  
  // Bill To section
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('BILL TO', 20, 65);
  
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.text(data.customerCompany || data.customerName, 20, 72);
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  yPos = 78;
  
  if (data.customerCompany && data.customerName) {
    doc.text(data.customerName, 20, yPos);
    yPos += 5;
  }
  if (data.customerAddress) {
    doc.text(data.customerAddress, 20, yPos);
    yPos += 5;
  }
  if (data.customerPhone) {
    doc.text(`Tel: ${data.customerPhone}`, 20, yPos);
    yPos += 5;
  }
  if (data.customerEmail) {
    doc.text(data.customerEmail, 20, yPos);
    yPos += 5;
  }
  if (data.customerVat) {
    doc.text(`VAT: ${data.customerVat}`, 20, yPos);
  }
  
  // Invoice details (right side)
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('INVOICE DATE', pageWidth - 60, 65);
  doc.text('DUE DATE', pageWidth - 60, 80);
  
  doc.setTextColor(...textColor);
  doc.text(format(new Date(data.invoiceDate), 'MMM dd, yyyy'), pageWidth - 60, 71);
  doc.text(format(new Date(data.dueDate), 'MMM dd, yyyy'), pageWidth - 60, 86);
  
  // Line items table
  const tableBody = data.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    `${data.currency} ${item.unitPrice.toFixed(2)}`,
    `${item.vatRate}%`,
    `${data.currency} ${item.lineTotal.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: 105,
    head: [['Description', 'Qty', 'Unit Price', 'VAT', 'Total']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals section (right aligned)
  const totalsX = pageWidth - 80;
  const valuesX = pageWidth - 20;
  let totalsY = finalY;
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setTextColor(...textColor);
  doc.text(`${data.currency} ${data.subtotal.toFixed(2)}`, valuesX, totalsY, { align: 'right' });
  totalsY += 7;
  
  if (data.discountAmount > 0) {
    doc.setTextColor(...mutedColor);
    doc.text('Discount:', totalsX, totalsY);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`-${data.currency} ${data.discountAmount.toFixed(2)}`, valuesX, totalsY, { align: 'right' });
    totalsY += 7;
  }
  
  doc.setTextColor(...mutedColor);
  doc.text(`VAT (${data.vatRate}%):`, totalsX, totalsY);
  doc.setTextColor(...textColor);
  doc.text(`${data.currency} ${data.vatAmount.toFixed(2)}`, valuesX, totalsY, { align: 'right' });
  totalsY += 10;
  
  // Total line
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX - 5, totalsY - 3, pageWidth - 20, totalsY - 3);
  
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Total:', totalsX, totalsY + 4);
  doc.setFont(undefined, 'bold');
  doc.text(`${data.currency} ${data.totalAmount.toFixed(2)}`, valuesX, totalsY + 4, { align: 'right' });
  doc.setFont(undefined, 'normal');
  totalsY += 12;
  
  // Payment info
  if (data.amountPaid > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.text('Amount Paid:', totalsX, totalsY);
    doc.setTextColor(34, 197, 94);
    doc.text(`${data.currency} ${data.amountPaid.toFixed(2)}`, valuesX, totalsY, { align: 'right' });
    totalsY += 7;
    
    doc.setTextColor(...mutedColor);
    doc.text('Balance Due:', totalsX, totalsY);
    doc.setFontSize(11);
    doc.setTextColor(data.balanceDue > 0 ? 239 : 34, data.balanceDue > 0 ? 68 : 197, data.balanceDue > 0 ? 68 : 94);
    doc.text(`${data.currency} ${data.balanceDue.toFixed(2)}`, valuesX, totalsY, { align: 'right' });
  }
  
  // Notes section
  let notesY = Math.max(totalsY + 20, finalY + 60);
  
  if (data.notes) {
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text('Notes', 20, notesY);
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, notesY + 6);
    notesY += 6 + (splitNotes.length * 5);
  }
  
  if (data.terms) {
    notesY += 10;
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text('Terms & Conditions', 20, notesY);
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    
    const splitTerms = doc.splitTextToSize(data.terms, pageWidth - 40);
    doc.text(splitTerms, 20, notesY + 6);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(
    'Thank you for your business!',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  doc.text(
    `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  
  return doc;
}

export function downloadInvoicePDF(data: InvoicePDFData): void {
  const doc = generateInvoicePDF(data);
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
}

export function getInvoicePDFBlob(data: InvoicePDFData): Blob {
  const doc = generateInvoicePDF(data);
  return doc.output('blob');
}

export function getInvoicePDFBase64(data: InvoicePDFData): string {
  const doc = generateInvoicePDF(data);
  return doc.output('datauristring').split(',')[1];
}
