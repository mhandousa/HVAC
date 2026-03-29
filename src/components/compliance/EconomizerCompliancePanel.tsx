import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wind, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ECONOMIZER_REQUIREMENTS, type ClimateZone } from '@/lib/ashrae-90-1-data';

interface EconomizerCompliancePanelProps {
  climateZone?: ClimateZone;
}

export function EconomizerCompliancePanel({ climateZone }: EconomizerCompliancePanelProps) {
  if (!climateZone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Economizer Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a city to view economizer requirements</p>
        </CardContent>
      </Card>
    );
  }

  const econReq = ECONOMIZER_REQUIREMENTS.find(e => e.climateZone === climateZone.ashraeZone);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wind className="h-5 w-5" />
          Economizer Requirements
        </CardTitle>
        <CardDescription>
          ASHRAE 90.1-2022 Section 6.5.1 - Air Economizers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="font-medium">Climate Zone {climateZone.ashraeZone}</span>
          {econReq?.required ? (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Economizer Required
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Economizer Not Required
            </Badge>
          )}
        </div>

        {econReq && (
          <div className="space-y-2 text-sm">
            {econReq.required ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Capacity Threshold</span>
                  <span className="font-medium">{(econReq.minCapacityBtuh / 1000).toFixed(0)} kBtu/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Control Type</span>
                  <span className="font-medium capitalize">{econReq.controlType.replace('_', ' ')}</span>
                </div>
                {econReq.dryBulbSwitchpointF && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">High-Limit Shutoff</span>
                    <span className="font-medium">{econReq.dryBulbSwitchpointF}°F</span>
                  </div>
                )}
              </>
            ) : null}

            <p className="text-xs text-muted-foreground pt-2 border-t">
              {econReq.notes}
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Economizer Sizing Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Outdoor air dampers should be sized for full economizer flow</li>
            <li>• Relief air dampers required for positive building pressure</li>
            <li>• Consider enthalpy control for humid climates</li>
            <li>• Damper actuators should be direct-coupled spring return</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
