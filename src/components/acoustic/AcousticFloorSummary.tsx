import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Volume2,
  TrendingUp,
  TrendingDown,
  VolumeX,
  Wrench,
  QrCode,
  BarChart2,
  Tag,
  FileText,
  History,
} from 'lucide-react';
import { FloorAcousticSummary, ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { calculateFloorRemediationSummary } from '@/lib/acoustic-remediation';
import { FloorRemediationDashboard } from './FloorRemediationDashboard';
import { FloorQRCodeSheet } from './FloorQRCodeSheet';
import { ZoneLabelGenerator } from './ZoneLabelGenerator';
import { NCComplianceCertificateDialog } from './NCComplianceCertificateDialog';
import { CertificateHistoryDialog } from './CertificateHistoryDialog';

interface AcousticFloorSummaryProps {
  summary: FloorAcousticSummary;
  zones: ZoneAcousticData[];
  floorName?: string;
  projectId?: string;
  projectName?: string;
  buildingName?: string;
}

export function AcousticFloorSummary({ summary, zones, floorName, projectId, projectName, buildingName }: AcousticFloorSummaryProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showQRSheet, setShowQRSheet] = useState(false);
  const [showLabelGenerator, setShowLabelGenerator] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [showCertificateHistory, setShowCertificateHistory] = useState(false);
  
  const remediationSummary = calculateFloorRemediationSummary(zones);
  const {
    totalZones,
    zonesExceeding,
    zonesMarginal,
    zonesAcceptable,
    zonesNoData,
    worstNC,
    avgNC,
  } = summary;
  
  const compliancePercent = totalZones > 0 
    ? Math.round((zonesAcceptable / totalZones) * 100)
    : 0;
  
  const statusCards = [
    {
      label: 'Exceeds',
      count: zonesExceeding,
      percent: totalZones > 0 ? Math.round((zonesExceeding / totalZones) * 100) : 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
    },
    {
      label: 'Marginal',
      count: zonesMarginal,
      percent: totalZones > 0 ? Math.round((zonesMarginal / totalZones) * 100) : 0,
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Acceptable',
      count: zonesAcceptable,
      percent: totalZones > 0 ? Math.round((zonesAcceptable / totalZones) * 100) : 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'No Data',
      count: zonesNoData,
      percent: totalZones > 0 ? Math.round((zonesNoData / totalZones) * 100) : 0,
      icon: HelpCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-muted',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            {floorName ? `${floorName} Acoustic Summary` : 'Floor Acoustic Summary'}
          </CardTitle>
          <Badge variant={compliancePercent >= 80 ? 'default' : compliancePercent >= 50 ? 'secondary' : 'destructive'}>
            {compliancePercent}% Compliant
          </Badge>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDashboard(true)}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Remediation Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowQRSheet(true)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Print QR Codes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowLabelGenerator(true)}
          >
            <Tag className="h-4 w-4 mr-2" />
            Generate Zone Labels
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCertificateDialog(true)}
            disabled={zonesAcceptable === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            NC Certificate
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCertificateHistory(true)}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Cards Grid */}
        <div className="grid grid-cols-4 gap-3">
          {statusCards.map((status) => (
            <div 
              key={status.label}
              className={`p-3 rounded-lg border ${status.bgColor} ${status.borderColor} text-center`}
            >
              <status.icon className={`h-5 w-5 mx-auto mb-1 ${status.color}`} />
              <div className={`text-2xl font-bold ${status.color}`}>
                {status.count}
              </div>
              <div className="text-xs text-muted-foreground">{status.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{status.percent}%</div>
            </div>
          ))}
        </div>

        {/* NC Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Worst NC</span>
            </div>
            <span className="font-semibold">
              {worstNC > 0 ? `NC-${worstNC}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Average NC</span>
            </div>
            <span className="font-semibold">
              {avgNC > 0 ? `NC-${avgNC}` : '—'}
            </span>
          </div>
        </div>

        {/* Compliance Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">NC Compliance Progress</span>
            <span className="font-medium">{zonesAcceptable} of {totalZones} zones</span>
          </div>
          <Progress value={compliancePercent} className="h-2" />
        </div>

        {/* Remediation Summary */}
        {remediationSummary.zonesRequiringTreatment > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Floor Remediation Summary
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Zones Need Treatment</span>
                  <div className="font-medium">{remediationSummary.zonesRequiringTreatment} of {totalZones}</div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Silencers Needed</span>
                  <div className="font-medium">{remediationSummary.totalSilencersNeeded}</div>
                </div>
              </div>

              {remediationSummary.silencerBreakdown.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Recommended Equipment:</span>
                  <div className="space-y-1">
                    {remediationSummary.silencerBreakdown.map(({ model, count }) => (
                      <div key={model} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
                        <span className="flex items-center gap-1">
                          <VolumeX className="h-3 w-3" />
                          {model}
                        </span>
                        <span className="font-medium">×{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {remediationSummary.ductModifications.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Duct Modifications:</span>
                  <div className="space-y-1">
                    {remediationSummary.ductModifications.map(({ name, count }) => (
                      <div key={name} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {name}
                        </span>
                        <span className="font-medium">×{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Est. Pressure Impact:</span>
                  <span className="font-medium text-amber-600">+{remediationSummary.totalPressureImpact}" w.g.</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">Cost:</span>
                  <span className="font-medium text-amber-500">{remediationSummary.estimatedTotalCost}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {/* Floor Remediation Dashboard Dialog */}
      <FloorRemediationDashboard 
        open={showDashboard}
        onOpenChange={setShowDashboard}
        zones={zones}
        floorName={floorName || 'Floor'}
        projectId={projectId}
      />

      {/* QR Code Print Sheet Dialog */}
      <FloorQRCodeSheet 
        open={showQRSheet}
        onOpenChange={setShowQRSheet}
        zones={zones}
        floorName={floorName || 'Floor'}
        projectId={projectId}
      />

      {/* Zone Label Generator Dialog */}
      <ZoneLabelGenerator
        open={showLabelGenerator}
        onOpenChange={setShowLabelGenerator}
        zones={zones}
        projectId={projectId || ''}
        floorName={floorName}
      />

      {/* NC Compliance Certificate Dialog */}
      <NCComplianceCertificateDialog
        open={showCertificateDialog}
        onOpenChange={setShowCertificateDialog}
        zones={zones}
        projectName={projectName}
        buildingName={buildingName}
        floorName={floorName}
      />

      {/* Certificate History Dialog */}
      <CertificateHistoryDialog
        open={showCertificateHistory}
        onOpenChange={setShowCertificateHistory}
      />
    </Card>
  );
}
