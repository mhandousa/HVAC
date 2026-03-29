import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ZatcaQRCode } from './ZatcaQRCode';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  vat_amount: number;
  zatca_submission_status?: string;
  zatca_uuid?: string;
  zatca_qr_code?: string;
  zatca_invoice_hash?: string;
}

interface ZatcaSubmitDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ZatcaSubmitDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: ZatcaSubmitDialogProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'cleared':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('invoicing.zatca.cleared')}
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-info text-info-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {t('invoicing.zatca.submitted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t('invoicing.zatca.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {t('invoicing.zatca.pending')}
          </Badge>
        );
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('zatca-einvoice', {
        body: { invoiceId: invoice.id },
      });

      if (error) throw error;

      toast.success('Invoice submitted to ZATCA successfully');
      onSuccess?.();
    } catch (error) {
      console.error('ZATCA submission error:', error);
      toast.error('Failed to submit invoice to ZATCA');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md', isRTL && 'rtl')}>
        <DialogHeader className={cn(isRTL && 'text-right')}>
          <DialogTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <FileText className="h-5 w-5 text-primary" />
            {t('invoicing.zatca.title')}
          </DialogTitle>
          <DialogDescription>
            {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
            <span className="text-sm text-muted-foreground">{t('invoicing.status')}</span>
            {getStatusBadge(invoice.zatca_submission_status)}
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-2">
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <span className="text-sm text-muted-foreground">{t('invoicing.total')}</span>
              <span className="font-semibold">
                {invoice.total_amount.toLocaleString()} SAR
              </span>
            </div>
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <span className="text-sm text-muted-foreground">{t('invoicing.vat')}</span>
              <span className="font-medium">
                {invoice.vat_amount.toLocaleString()} SAR
              </span>
            </div>
          </div>

          {/* ZATCA UUID */}
          {invoice.zatca_uuid && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">{t('invoicing.zatca.uuid')}</span>
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {invoice.zatca_uuid}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(invoice.zatca_uuid!, 'uuid')}
                  >
                    {copied === 'uuid' ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* QR Code */}
          {invoice.zatca_qr_code && (
            <>
              <Separator />
              <div className="flex justify-center py-4">
                <ZatcaQRCode qrData={invoice.zatca_qr_code} size={150} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className={cn(isRTL && 'flex-row-reverse')}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {(!invoice.zatca_submission_status || invoice.zatca_submission_status === 'pending') && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t('invoicing.zatca.submit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
