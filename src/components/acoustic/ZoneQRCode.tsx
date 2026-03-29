import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface ZoneQRCodeProps {
  zoneId: string;
  zoneName: string;
  targetNC: number;
  floorName?: string;
  spaceType?: string;
  projectId?: string;
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
  className?: string;
}

export function ZoneQRCode({
  zoneId,
  zoneName,
  targetNC,
  floorName,
  spaceType,
  projectId,
  size = 'md',
  showActions = true,
  className = '',
}: ZoneQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate deep link URL for mobile NC measurement
  const baseUrl = window.location.origin;
  const measurementUrl = `${baseUrl}/commissioning/acoustic-measurement?zoneId=${zoneId}${projectId ? `&projectId=${projectId}` : ''}&autoStart=true`;

  const sizeConfig = {
    sm: { qr: 80, padding: 'p-2', text: 'text-xs' },
    md: { qr: 128, padding: 'p-4', text: 'text-sm' },
    lg: { qr: 200, padding: 'p-6', text: 'text-base' },
  };

  const config = sizeConfig[size];

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = config.qr * 2; // 2x for better quality
      canvas.height = config.qr * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Download as PNG
      const link = document.createElement('a');
      link.download = `qr-${zoneName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${zoneName}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
            }
            .zone-name {
              font-size: 18px;
              font-weight: 600;
              margin: 16px 0 8px;
            }
            .zone-details {
              font-size: 14px;
              color: #6b7280;
              margin: 4px 0;
            }
            .target-nc {
              font-size: 16px;
              font-weight: 500;
              color: #059669;
              margin-top: 12px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrRef.current?.innerHTML || ''}
            <div class="zone-name">${zoneName}</div>
            ${floorName ? `<div class="zone-details">${floorName}</div>` : ''}
            ${spaceType ? `<div class="zone-details">${spaceType}</div>` : ''}
            <div class="target-nc">Target: NC-${targetNC}</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        ref={qrRef}
        className={`bg-white rounded-lg ${config.padding} border border-border`}
      >
        <QRCodeSVG
          value={measurementUrl}
          size={config.qr}
          level="M"
          includeMargin={false}
        />
      </div>

      <div className="text-center mt-3">
        <h4 className={`font-semibold ${config.text}`}>{zoneName}</h4>
        {floorName && (
          <p className={`text-muted-foreground ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
            {floorName}
          </p>
        )}
        <p className={`text-green-600 font-medium mt-1 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          Target: NC-{targetNC}
        </p>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}
