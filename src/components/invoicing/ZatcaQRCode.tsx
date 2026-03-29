import { QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface ZatcaQRCodeProps {
  qrData: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function ZatcaQRCode({ 
  qrData, 
  size = 128, 
  className,
  showLabel = true
}: ZatcaQRCodeProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // If we have a base64 QR image, render it directly
  if (qrData.startsWith('data:image')) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <img 
          src={qrData} 
          alt="ZATCA QR Code" 
          width={size} 
          height={size}
          className="rounded-lg border border-border"
        />
        {showLabel && (
          <span className={cn('text-xs text-muted-foreground', isRTL && 'text-right')}>
            {t('invoicing.zatca.qrCode')}
          </span>
        )}
      </div>
    );
  }

  // If we have TLV encoded data, show placeholder with QR icon
  // In production, you'd use a QR library to generate the actual QR code
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div 
        className="flex items-center justify-center bg-muted rounded-lg border border-border"
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-mono break-all max-w-[100px]">
            {qrData.substring(0, 32)}...
          </p>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-xs text-muted-foreground', isRTL && 'text-right')}>
          {t('invoicing.zatca.qrCode')}
        </span>
      )}
    </div>
  );
}

// TLV (Tag-Length-Value) encoder for ZATCA QR code
export function generateZatcaTLV(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: string;
  vatAmount: string;
}): string {
  const encode = (tag: number, value: string): Uint8Array => {
    const valueBytes = new TextEncoder().encode(value);
    const result = new Uint8Array(2 + valueBytes.length);
    result[0] = tag;
    result[1] = valueBytes.length;
    result.set(valueBytes, 2);
    return result;
  };

  const parts = [
    encode(1, data.sellerName),
    encode(2, data.vatNumber),
    encode(3, data.timestamp),
    encode(4, data.totalWithVat),
    encode(5, data.vatAmount),
  ];

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}
