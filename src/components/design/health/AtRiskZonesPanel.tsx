import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ZoneData {
  zoneId: string;
  zoneName: string;
  buildingName?: string;
  floorName?: string;
  completenessScore: number;
  hasLoadCalc: boolean;
  hasEquipment: boolean;
  hasDistribution: boolean;
  hasVentilation: boolean;
  hasERV: boolean;
}

interface AtRiskZonesPanelProps {
  zones: ZoneData[];
  projectId: string;
  threshold?: number;
  maxDisplay?: number;
  className?: string;
}

export function AtRiskZonesPanel({
  zones,
  projectId,
  threshold = 50,
  maxDisplay = 5,
  className,
}: AtRiskZonesPanelProps) {
  const atRiskZones = useMemo(() => {
    return zones
      .filter((z) => z.completenessScore < threshold)
      .sort((a, b) => a.completenessScore - b.completenessScore)
      .slice(0, maxDisplay);
  }, [zones, threshold, maxDisplay]);
  
  const getMissingSteps = (zone: ZoneData): string[] => {
    const missing: string[] = [];
    if (!zone.hasLoadCalc) missing.push('Load Calc');
    if (!zone.hasEquipment) missing.push('Equipment');
    if (!zone.hasDistribution) missing.push('Distribution');
    if (!zone.hasVentilation) missing.push('Ventilation');
    if (!zone.hasERV) missing.push('ERV');
    return missing;
  };
  
  const getScoreColor = (score: number) => {
    if (score < 25) return 'text-destructive';
    if (score < 50) return 'text-warning';
    return 'text-foreground';
  };
  
  if (atRiskZones.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Zone Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-primary">All zones healthy!</p>
            <p className="text-xs text-muted-foreground">
              No zones below {threshold}% completeness
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            At Risk Zones
          </CardTitle>
          <Badge variant="outline" className="text-warning border-warning">
            {atRiskZones.length} zone{atRiskZones.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {atRiskZones.map((zone) => {
              const missingSteps = getMissingSteps(zone);
              
              return (
                <div
                  key={zone.zoneId}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{zone.zoneName}</p>
                        {(zone.buildingName || zone.floorName) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[zone.buildingName, zone.floorName].filter(Boolean).join(' › ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(zone.completenessScore)}`}>
                      {Math.round(zone.completenessScore)}%
                    </span>
                  </div>
                  
                  <Progress value={zone.completenessScore} className="h-1.5 mb-2" />
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {missingSteps.slice(0, 3).map((step) => (
                        <Badge
                          key={step}
                          variant="outline"
                          className="text-[10px] h-5 text-muted-foreground"
                        >
                          {step}
                        </Badge>
                      ))}
                      {missingSteps.length > 3 && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          +{missingSteps.length - 3}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      asChild
                    >
                      <Link to={`/design/load-calculation?project=${projectId}&zone=${zone.zoneId}`}>
                        Fix
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {zones.filter((z) => z.completenessScore < threshold).length > maxDisplay && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`/design/completeness?project=${projectId}`}>
                View All At Risk Zones ({zones.filter((z) => z.completenessScore < threshold).length})
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
