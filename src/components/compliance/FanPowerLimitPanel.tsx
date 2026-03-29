import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Fan, CheckCircle2, XCircle } from 'lucide-react';
import { FAN_POWER_LIMITS } from '@/lib/ashrae-90-1-data';

export function FanPowerLimitPanel() {
  const [systemType, setSystemType] = useState<'vav' | 'cav' | 'doas'>('vav');
  const [totalCfm, setTotalCfm] = useState<string>('');
  const [fanBhp, setFanBhp] = useState<string>('');
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);

  const fanLimit = FAN_POWER_LIMITS.find(f => f.systemType === systemType);

  const calculateAllowablePower = () => {
    if (!fanLimit || !totalCfm) return null;

    const baseBhp = fanLimit.maxBhpPer1000Cfm;
    const creditsBhp = selectedCredits.reduce((total, creditName) => {
      const credit = fanLimit.pressureDropCredits?.find(c => c.component === creditName);
      return total + (credit?.creditBhpPer1000Cfm || 0);
    }, 0);

    const allowableBhpPer1000 = baseBhp + creditsBhp;
    const allowableTotalBhp = (allowableBhpPer1000 * parseFloat(totalCfm)) / 1000;

    return {
      baseBhpPer1000: baseBhp,
      creditsBhpPer1000: creditsBhp,
      allowableBhpPer1000,
      allowableTotalBhp,
    };
  };

  const result = calculateAllowablePower();
  const actualBhp = parseFloat(fanBhp) || 0;
  const isCompliant = result ? actualBhp <= result.allowableTotalBhp : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Fan className="h-5 w-5" />
          Fan Power Limit Calculator
        </CardTitle>
        <CardDescription>
          ASHRAE 90.1-2022 Section 6.5.3.1 - Fan Power Limitation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>System Type</Label>
            <Select value={systemType} onValueChange={(v: 'vav' | 'cav' | 'doas') => setSystemType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vav">VAV System</SelectItem>
                <SelectItem value="cav">CAV System</SelectItem>
                <SelectItem value="doas">DOAS System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCfm">Total Supply CFM</Label>
            <Input
              id="totalCfm"
              type="number"
              value={totalCfm}
              onChange={(e) => setTotalCfm(e.target.value)}
              placeholder="e.g., 10000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fanBhp">Actual Fan BHP</Label>
            <Input
              id="fanBhp"
              type="number"
              step="0.1"
              value={fanBhp}
              onChange={(e) => setFanBhp(e.target.value)}
              placeholder="e.g., 12.5"
            />
          </div>
        </div>

        {fanLimit?.pressureDropCredits && fanLimit.pressureDropCredits.length > 0 && (
          <div className="space-y-2">
            <Label>Pressure Drop Credits (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {fanLimit.pressureDropCredits.map((credit) => (
                <div key={credit.component} className="flex items-center space-x-2">
                  <Checkbox
                    id={credit.component}
                    checked={selectedCredits.includes(credit.component)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCredits([...selectedCredits, credit.component]);
                      } else {
                        setSelectedCredits(selectedCredits.filter(c => c !== credit.component));
                      }
                    }}
                  />
                  <label htmlFor={credit.component} className="text-sm cursor-pointer">
                    {credit.component} (+{credit.creditBhpPer1000Cfm} bhp/1000 CFM)
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && totalCfm && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Allowance ({systemType.toUpperCase()})</span>
              <span>{result.baseBhpPer1000.toFixed(2)} bhp/1000 CFM</span>
            </div>
            {result.creditsBhpPer1000 > 0 && (
              <div className="flex justify-between text-sm">
                <span>Credits Applied</span>
                <span>+{result.creditsBhpPer1000.toFixed(2)} bhp/1000 CFM</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total Allowable</span>
              <span>{result.allowableBhpPer1000.toFixed(2)} bhp/1000 CFM</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Max Fan Power</span>
              <span>{result.allowableTotalBhp.toFixed(1)} BHP</span>
            </div>
          </div>
        )}

        {isCompliant !== null && fanBhp && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isCompliant ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'
          }`}>
            {isCompliant ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Compliant - Actual power ({actualBhp.toFixed(1)} BHP) is within limit
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">
                  Non-Compliant - Exceeds limit by {(actualBhp - (result?.allowableTotalBhp || 0)).toFixed(1)} BHP
                </span>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Notes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Fan power is the sum of supply, return, exhaust, and relief fan nameplate hp</li>
            <li>Systems under 5,000 CFM with motors ≤5 hp are exempt</li>
            <li>Hospital/lab exhaust systems may have additional credits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
