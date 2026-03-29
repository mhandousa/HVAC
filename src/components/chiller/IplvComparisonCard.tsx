import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { ASHRAE_90_1_MINIMUMS, type ChillerType } from '@/lib/chiller-selection-calculations';

interface IplvComparisonCardProps {
  chillerType: ChillerType;
  selectedIplv: number;
  selectedEer: number;
  selectedCop: number;
  targetIplv?: number;
  annualEnergySavingsKwh?: number;
  annualCostSavingsSar?: number;
}

export function IplvComparisonCard({
  chillerType,
  selectedIplv,
  selectedEer,
  selectedCop,
  targetIplv,
  annualEnergySavingsKwh,
  annualCostSavingsSar,
}: IplvComparisonCardProps) {
  const baseline = ASHRAE_90_1_MINIMUMS[chillerType];
  const percentBetter = ((selectedIplv / baseline.iplv - 1) * 100);
  const meetsBaseline = selectedIplv >= baseline.iplv;
  const meetsTarget = targetIplv ? selectedIplv >= targetIplv : true;
  
  // Calculate progress (baseline is 0%, double baseline is 100%)
  const progressValue = Math.min(100, ((selectedIplv - baseline.iplv * 0.8) / (baseline.iplv * 0.4)) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Efficiency Comparison
            </CardTitle>
            <CardDescription>IPLV vs ASHRAE 90.1-2019</CardDescription>
          </div>
          {meetsBaseline ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Below Code
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main IPLV comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Selected IPLV</span>
            <span className="text-2xl font-bold text-primary">{selectedIplv.toFixed(2)}</span>
          </div>
          <Progress value={progressValue} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>ASHRAE Min: {baseline.iplv}</span>
            <span className={percentBetter >= 0 ? 'text-green-600' : 'text-destructive'}>
              {percentBetter >= 0 ? '+' : ''}{percentBetter.toFixed(1)}% vs baseline
            </span>
          </div>
        </div>
        
        {/* Target IPLV if specified */}
        {targetIplv && (
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target IPLV</span>
              <span className="font-medium">{targetIplv.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {meetsTarget ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Meets target</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-500">
                    {((targetIplv - selectedIplv) / targetIplv * 100).toFixed(1)}% below target
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* EER and COP metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/50 p-3 text-center">
            <div className="text-xs text-muted-foreground">Full Load EER</div>
            <div className="text-xl font-bold">{selectedEer.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Min: {baseline.eer.toFixed(2)}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-center">
            <div className="text-xs text-muted-foreground">Full Load COP</div>
            <div className="text-xl font-bold">{selectedCop.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Min: {baseline.cop.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Annual savings estimate */}
        {(annualEnergySavingsKwh || annualCostSavingsSar) && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Estimated Annual Savings</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              {annualEnergySavingsKwh && (
                <div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {annualEnergySavingsKwh.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">kWh/year</div>
                </div>
              )}
              {annualCostSavingsSar && (
                <div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {annualCostSavingsSar.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">SAR/year</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
