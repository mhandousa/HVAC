import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, MinusCircle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

interface ZoneSelectionStepProps {
  allZones: ZoneAcousticData[];
  selectedZoneIds: string[];
  selectionSummary: {
    zonesSelected: number;
    critical: number;
    high: number;
    medium: number;
    avgNCReduction: number;
  };
  onToggleZone: (zoneId: string) => void;
  onSelectAllExceeding: () => void;
  onSelectAllMarginal: () => void;
  onClearSelection: () => void;
}

export function ZoneSelectionStep({
  allZones,
  selectedZoneIds,
  selectionSummary,
  onToggleZone,
  onSelectAllExceeding,
  onSelectAllMarginal,
  onClearSelection,
}: ZoneSelectionStepProps) {
  const treatableZones = allZones.filter(z => z.status === 'exceeds' || z.status === 'marginal');
  const exceedingCount = allZones.filter(z => z.status === 'exceeds').length;
  const marginalCount = allZones.filter(z => z.status === 'marginal').length;

  const getStatusIcon = (status: ZoneAcousticData['status']) => {
    switch (status) {
      case 'exceeds':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marginal':
        return <MinusCircle className="h-4 w-4 text-amber-500" />;
      case 'acceptable':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Volume2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Zones for Treatment</h3>
        <p className="text-sm text-muted-foreground">
          Choose which zones should receive acoustic treatment. Zones are sorted by severity.
        </p>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAllExceeding}
          disabled={exceedingCount === 0}
        >
          <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
          Select All Exceeding ({exceedingCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAllMarginal}
          disabled={marginalCount === 0}
        >
          <MinusCircle className="h-4 w-4 mr-2 text-amber-500" />
          Select All Marginal ({marginalCount})
        </Button>
        {selectedZoneIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Zone List */}
      <ScrollArea className="h-[320px] border rounded-lg">
        <div className="p-2 space-y-1">
          {treatableZones.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All zones meet NC requirements</p>
              <p className="text-sm">No treatment is needed for this project.</p>
            </div>
          ) : (
            treatableZones
              .sort((a, b) => b.ncDelta - a.ncDelta)
              .map(zone => {
                const isSelected = selectedZoneIds.includes(zone.zoneId);
                return (
                  <div
                    key={zone.zoneId}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                    )}
                    onClick={() => onToggleZone(zone.zoneId)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleZone(zone.zoneId)}
                    />
                    {getStatusIcon(zone.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{zone.zoneName}</p>
                      <p className="text-xs text-muted-foreground">
                        {zone.spaceType} • Target: NC-{zone.targetNC}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={zone.status === 'exceeds' ? 'destructive' : 'secondary'}>
                        +{zone.ncDelta} dB
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        NC-{zone.estimatedNC || '?'} → NC-{zone.targetNC}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </ScrollArea>

      {/* Selection Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Selection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{selectionSummary.zonesSelected}</p>
              <p className="text-xs text-muted-foreground">Zones Selected</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{selectionSummary.critical}</p>
              <p className="text-xs text-muted-foreground">Critical (&gt;10 dB)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{selectionSummary.high}</p>
              <p className="text-xs text-muted-foreground">High (5-10 dB)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{selectionSummary.medium}</p>
              <p className="text-xs text-muted-foreground">Medium (&lt;5 dB)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{selectionSummary.avgNCReduction}</p>
              <p className="text-xs text-muted-foreground">Avg NC Δ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
