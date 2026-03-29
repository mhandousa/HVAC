import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, QrCode } from 'lucide-react';
import { ZoneQRCode } from './ZoneQRCode';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

interface FloorQRCodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: ZoneAcousticData[];
  floorName: string;
  projectId?: string;
}

export function FloorQRCodeSheet({
  open,
  onOpenChange,
  zones,
  floorName,
  projectId,
}: FloorQRCodeSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - ${floorName}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 {
              font-size: 24px;
              margin: 0 0 8px;
            }
            .header p {
              color: #6b7280;
              margin: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
            }
            .zone-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              page-break-inside: avoid;
            }
            .zone-card svg {
              width: 100px;
              height: 100px;
            }
            .zone-name {
              font-size: 14px;
              font-weight: 600;
              margin: 12px 0 4px;
            }
            .zone-floor {
              font-size: 12px;
              color: #6b7280;
              margin: 0 0 4px;
            }
            .zone-target {
              font-size: 12px;
              color: #059669;
              font-weight: 500;
            }
            @media print {
              body { padding: 10px; }
              .grid { gap: 16px; }
              .zone-card { padding: 12px; }
              .zone-card svg { width: 80px; height: 80px; }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${floorName} - Zone QR Codes</h1>
            <p>Scan to open NC measurement workflow • Generated ${new Date().toLocaleDateString()}</p>
          </div>
          ${printRef.current.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {floorName} QR Code Sheet
            </DialogTitle>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print All
            </Button>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Print this sheet and post QR codes at each zone location. Technicians can scan to open the NC measurement workflow directly.
        </p>

        <div ref={printRef} className="grid grid-cols-3 gap-4 mt-4">
          {zones.map((zone) => (
            <div
              key={zone.zoneId}
              className="border rounded-lg p-3 text-center bg-card"
            >
              <ZoneQRCode
                zoneId={zone.zoneId}
                zoneName={zone.zoneName}
                targetNC={zone.targetNC}
                floorName={floorName}
                spaceType={zone.spaceType}
                projectId={projectId}
                size="sm"
                showActions={false}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {zones.length} zones on this floor
          </span>
          <Button variant="outline" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Download as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
