import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ZoneQRCode } from './ZoneQRCode';

interface ZoneQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  zoneName: string;
  targetNC: number;
  floorName?: string;
  spaceType?: string;
  projectId?: string;
}

export function ZoneQRCodeDialog({
  open,
  onOpenChange,
  zoneId,
  zoneName,
  targetNC,
  floorName,
  spaceType,
  projectId,
}: ZoneQRCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const measurementUrl = `${baseUrl}/commissioning/acoustic-measurement?zoneId=${zoneId}${projectId ? `&projectId=${projectId}` : ''}&autoStart=true`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(measurementUrl);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleOpenUrl = () => {
    window.open(measurementUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Zone QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <ZoneQRCode
            zoneId={zoneId}
            zoneName={zoneName}
            targetNC={targetNC}
            floorName={floorName}
            spaceType={spaceType}
            projectId={projectId}
            size="lg"
            showActions={true}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Direct Link</label>
            <div className="flex gap-2">
              <Input
                value={measurementUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleOpenUrl}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Technicians can scan this QR code to open the NC measurement workflow directly for this zone.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
