import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Wrench,
  BarChart3,
  QrCode,
  History,
  Tag,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { AcousticRemediationPanel } from './AcousticRemediationPanel';
import { ZoneOctaveBandAnalysis } from './ZoneOctaveBandAnalysis';
import { ZoneQRCodeDialog } from './ZoneQRCodeDialog';
import { RemediationHistoryPanel } from './RemediationHistoryPanel';
import { ZoneLabelGenerator } from './ZoneLabelGenerator';
import { NCComplianceCertificateDialog } from './NCComplianceCertificateDialog';

interface AcousticZonePopoverProps {
  zone: ZoneAcousticData;
  onClose?: () => void;
}

export function AcousticZonePopover({ zone, onClose }: AcousticZonePopoverProps) {
  const navigate = useNavigate();
  const [showRemediation, setShowRemediation] = useState(false);
  const [showOctaveAnalysis, setShowOctaveAnalysis] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLabelGenerator, setShowLabelGenerator] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  
  const statusConfig = {
    exceeds: {
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: 'Exceeds NC Target',
      badgeVariant: 'destructive' as const,
    },
    marginal: {
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      label: 'Marginally Exceeds',
      badgeVariant: 'secondary' as const,
    },
    acceptable: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Within Target',
      badgeVariant: 'default' as const,
    },
    'no-data': {
      icon: Volume2,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      label: 'No Terminal Units',
      badgeVariant: 'outline' as const,
    },
  };
  
  const config = statusConfig[zone.status];
  const StatusIcon = config.icon;

  const handleNavigateToTerminalSizing = () => {
    navigate(`/design/terminal-unit-sizing?zone=${zone.zoneId}`);
    onClose?.();
  };

  return (
    <div className="w-80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-base">{zone.zoneName}</h4>
          <p className="text-sm text-muted-foreground">{zone.spaceType}</p>
        </div>
        <Badge variant={config.badgeVariant} className="flex items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          {zone.estimatedNC !== null ? `NC-${zone.estimatedNC}` : 'N/A'}
        </Badge>
      </div>

      <Separator />

      {/* NC Comparison */}
      <div className={`p-3 rounded-lg ${config.bgColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Target NC</span>
          <span className="font-medium">NC-{zone.targetNC}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Estimated NC</span>
          <span className={`font-medium ${config.color}`}>
            {zone.estimatedNC !== null ? `NC-${zone.estimatedNC}` : '—'}
          </span>
        </div>
        {zone.estimatedNC !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Delta</span>
            <span className={`font-bold ${zone.ncDelta > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {zone.ncDelta > 0 ? '+' : ''}{zone.ncDelta} dB
            </span>
          </div>
        )}
      </div>

      {/* Terminal Units */}
      {zone.terminalUnits.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Terminal Units ({zone.terminalUnits.length})</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {zone.terminalUnits.map((unit) => (
              <div 
                key={unit.id}
                className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                  <span>{unit.unitTag}</span>
                </div>
                <span className="text-muted-foreground">
                  {unit.noiseNC !== null ? `NC-${unit.noiseNC}` : '—'}
                </span>
              </div>
            ))}
          </div>
          {zone.terminalUnits.length > 1 && zone.estimatedNC !== null && (
            <p className="text-xs text-muted-foreground italic">
              Combined NC: {zone.estimatedNC} (logarithmic sum)
            </p>
          )}
        </div>
      )}

      {/* Recommendations */}
      {zone.recommendations.length > 0 && zone.status !== 'acceptable' && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Recommendations
          </h5>
          <ul className="space-y-1">
            {zone.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        {zone.estimatedNC !== null && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowOctaveAnalysis(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Octave Band Analysis
          </Button>
        )}
        {zone.status !== 'acceptable' && zone.status !== 'no-data' && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => setShowRemediation(true)}
          >
            <Wrench className="h-4 w-4 mr-2" />
            View Remediation Options
          </Button>
        )}
        {zone.status === 'acceptable' && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => setShowCertificateDialog(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate NC Certificate
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowQRCode(true)}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Generate QR Code
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowLabelGenerator(true)}
        >
          <Tag className="h-4 w-4 mr-2" />
          Print Zone Label
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowHistory(true)}
        >
          <History className="h-4 w-4 mr-2" />
          View Remediation History
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleNavigateToTerminalSizing}
        >
          Open Terminal Sizing Tool
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* QR Code Dialog */}
      <ZoneQRCodeDialog
        open={showQRCode}
        onOpenChange={setShowQRCode}
        zoneId={zone.zoneId}
        zoneName={zone.zoneName}
        targetNC={zone.targetNC}
        spaceType={zone.spaceType}
      />

      {/* Remediation History Panel */}
      <RemediationHistoryPanel
        zone={zone}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

      {/* Zone Label Generator */}
      <ZoneLabelGenerator
        open={showLabelGenerator}
        onOpenChange={setShowLabelGenerator}
        zones={[zone]}
        projectId=""
        floorName={zone.floorId}
      />

      {/* Octave Band Analysis Dialog */}
      <Dialog open={showOctaveAnalysis} onOpenChange={setShowOctaveAnalysis}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Octave Band Analysis - {zone.zoneName}
            </DialogTitle>
          </DialogHeader>
          <ZoneOctaveBandAnalysis 
            zone={zone}
            onOpenRemediation={() => {
              setShowOctaveAnalysis(false);
              setShowRemediation(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Remediation Panel Modal */}
      {showRemediation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative">
            <AcousticRemediationPanel 
              zone={zone} 
              onClose={() => setShowRemediation(false)} 
            />
          </div>
        </div>
      )}

      {/* NC Compliance Certificate Dialog */}
      <NCComplianceCertificateDialog
        open={showCertificateDialog}
        onOpenChange={setShowCertificateDialog}
        zones={[zone]}
        floorName={zone.floorId}
      />
    </div>
  );
}
