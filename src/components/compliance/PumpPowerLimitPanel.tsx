import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Droplets, CheckCircle2, XCircle } from 'lucide-react';
import { PUMP_POWER_LIMITS } from '@/lib/ashrae-90-1-data';

export function PumpPowerLimitPanel() {
  const [systemType, setSystemType] = useState<'chw' | 'hw' | 'cw'>('chw');
  const [isVariableFlow, setIsVariableFlow] = useState(true);
  const [flowGpm, setFlowGpm] = useState<string>('');
  const [pumpPowerKw, setPumpPowerKw] = useState<string>('');

  const flowType = isVariableFlow ? 'variable' : 'constant';
  const pumpLimit = PUMP_POWER_LIMITS.find(
    p => p.systemType === systemType && p.flowType === flowType
  );

  const calculateCompliance = () => {
    if (!pumpLimit || !flowGpm || !pumpPowerKw) return null;

    const flow = parseFloat(flowGpm);
    const power = parseFloat(pumpPowerKw);
    
    if (flow <= 0 || power <= 0) return null;

    const actualWPerGpm = (power * 1000) / flow;
    const maxWPerGpm = pumpLimit.maxWPerGpm;
    const isCompliant = actualWPerGpm <= maxWPerGpm;

    return {
      actualWPerGpm,
      maxWPerGpm,
      isCompliant,
      maxPowerKw: (maxWPerGpm * flow) / 1000,
    };
  };

  const result = calculateCompliance();

  const getSystemLabel = (type: string) => {
    switch (type) {
      case 'chw': return 'Chilled Water';
      case 'hw': return 'Hot Water';
      case 'cw': return 'Condenser Water';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Pump Power Limit Calculator
        </CardTitle>
        <CardDescription>
          ASHRAE 90.1-2022 Section 6.5.4.2 - Hydronic System Pump Power
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>System Type</Label>
            <Select value={systemType} onValueChange={(v: 'chw' | 'hw' | 'cw') => setSystemType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chw">Chilled Water (CHW)</SelectItem>
                <SelectItem value="hw">Hot Water (HW)</SelectItem>
                <SelectItem value="cw">Condenser Water (CW)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Variable Flow</span>
              <Switch
                checked={isVariableFlow}
                onCheckedChange={setIsVariableFlow}
              />
            </Label>
            <p className="text-xs text-muted-foreground">
              {isVariableFlow 
                ? 'Variable speed pumping with VFDs' 
                : 'Constant speed pumping'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flowGpm">Design Flow (GPM)</Label>
            <Input
              id="flowGpm"
              type="number"
              value={flowGpm}
              onChange={(e) => setFlowGpm(e.target.value)}
              placeholder="e.g., 500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pumpPowerKw">Total Pump Power (kW)</Label>
            <Input
              id="pumpPowerKw"
              type="number"
              step="0.1"
              value={pumpPowerKw}
              onChange={(e) => setPumpPowerKw(e.target.value)}
              placeholder="e.g., 7.5"
            />
          </div>
        </div>

        {pumpLimit && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{getSystemLabel(systemType)} - {flowType.charAt(0).toUpperCase() + flowType.slice(1)} Flow</span>
              <Badge variant="outline">Max: {pumpLimit.maxWPerGpm} W/GPM</Badge>
            </div>
            
            {result && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Actual Power Intensity</span>
                  <span className={result.isCompliant ? 'text-emerald-600' : 'text-destructive'}>
                    {result.actualWPerGpm.toFixed(1)} W/GPM
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum Allowable at {flowGpm} GPM</span>
                  <span>{result.maxPowerKw.toFixed(1)} kW</span>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.isCompliant ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'
          }`}>
            {result.isCompliant ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Compliant - {result.actualWPerGpm.toFixed(1)} W/GPM ≤ {result.maxWPerGpm} W/GPM limit
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">
                  Non-Compliant - Exceeds limit by {(result.actualWPerGpm - result.maxWPerGpm).toFixed(1)} W/GPM
                </span>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Notes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Variable flow required for CHW/HW systems &gt; 300,000 Btu/h</li>
            <li>Pump power includes all pumps in the loop (primary + secondary if applicable)</li>
            <li>VFD-driven pumps should be considered variable flow</li>
            <li>Systems with &lt; 10 hp pump motor are exempt</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
