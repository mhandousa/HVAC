import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice } from '@/hooks/useInvoices';
import { useInvoicePDF } from '@/hooks/useInvoicePDF';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Paperclip, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SendInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export function SendInvoiceDialog({ open, onClose, invoice }: SendInvoiceDialogProps) {
  const { language } = useLanguage();
  const { getPDFBase64 } = useInvoicePDF();
  const queryClient = useQueryClient();
  
  const defaultSubject = `Invoice #${invoice.invoice_number}`;
  const defaultMessage = `Dear ${invoice.customer?.contact_name || 'Customer'},

Please find attached your invoice #${invoice.invoice_number} for SAR ${invoice.total_amount.toFixed(2)}.

Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you for your business!`;

  const [recipientEmail, setRecipientEmail] = useState(
    invoice.customer?.contact_email || ''
  );
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!recipientEmail) {
        throw new Error('Recipient email is required');
      }
      
      // Generate PDF as base64
      const pdfBase64 = getPDFBase64(invoice);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail,
          recipientName: invoice.customer?.contact_name || 'Customer',
          subject,
          message,
          pdfBase64,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(language === 'ar' ? 'تم إرسال الفاتورة بنجاح' : 'Invoice sent successfully');
      onClose();
    },
    onError: (error: Error) => {
      console.error('Failed to send invoice:', error);
      toast.error(`Failed to send invoice: ${error.message}`);
    },
  });

  const handleSend = () => {
    sendEmailMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {language === 'ar' ? 'إرسال الفاتورة بالبريد الإلكتروني' : 'Email Invoice'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? `إرسال الفاتورة #${invoice.invoice_number} إلى العميل`
              : `Send invoice #${invoice.invoice_number} to the customer`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!invoice.customer?.contact_email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {language === 'ar'
                  ? 'لا يوجد بريد إلكتروني للعميل. يرجى إدخال عنوان البريد الإلكتروني.'
                  : 'No customer email on file. Please enter an email address.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="recipient">
              {language === 'ar' ? 'إرسال إلى' : 'Send to'}
            </Label>
            <Input
              id="recipient"
              type="email"
              placeholder="customer@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">
              {language === 'ar' ? 'الموضوع' : 'Subject'}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">
              {language === 'ar' ? 'الرسالة' : 'Message'}
            </Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Invoice-{invoice.invoice_number}.pdf
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!recipientEmail || sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إرسال' : 'Send Email'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
