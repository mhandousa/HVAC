import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Gauge, TrendingUp, Scale, Zap } from 'lucide-react';
import { OptimizationConstraints, PriorityMode } from '@/lib/treatment-package-optimizer';
import { formatCurrencySAR } from '@/lib/acoustic-cost-calculations';

interface BudgetConstraintsStepProps {
  constraints: OptimizationConstraints;
  onConstraintsChange: (constraints: OptimizationConstraints) => void;
}

const BUDGET_PRESETS = [
  { label: 'Economy', value: 25000 },
  { label: 'Standard', value: 50000 },
  { label: 'Premium', value: 100000 },
  { label: 'Custom', value: -1 },
];

export function BudgetConstraintsStep({
  constraints,
  onConstraintsChange,
}: BudgetConstraintsStepProps) {
  const handleBudgetChange = (value: number) => {
    onConstraintsChange({ ...constraints, maxBudgetSAR: value });
  };

  const handlePressureDropChange = (value: number[]) => {
    onConstraintsChange({ ...constraints, maxPressureDropIn: value[0] });
  };

  const handlePriorityModeChange = (mode: PriorityMode) => {
    onConstraintsChange({ ...constraints, priorityMode: mode });
  };

  const handleLifecycleToggle = (enabled: boolean) => {
    onConstraintsChange({ ...constraints, includeLifecycleCosts: enabled });
  };

  const handleAnalysisYearsChange = (years: number) => {
    onConstraintsChange({ ...constraints, analysisYears: years });
  };

  const handleDiscountRateChange = (rate: number) => {
    onConstraintsChange({ ...constraints, discountRate: rate });
  };

  const selectedPreset = BUDGET_PRESETS.find(p => p.value === constraints.maxBudgetSAR);
  const isCustomBudget = !selectedPreset || selectedPreset.value === -1;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Budget & Constraints</h3>
        <p className="text-sm text-muted-foreground">
          Set your budget limits and system constraints to optimize treatment recommendations.
        </p>
      </div>

      {/* Budget Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Maximum Budget
          </CardTitle>
          <CardDescription>
            Set the maximum budget for acoustic treatments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BUDGET_PRESETS.slice(0, 3).map(preset => (
              <Button
                key={preset.label}
                variant={constraints.maxBudgetSAR === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBudgetChange(preset.value)}
              >
                {preset.label} ({formatCurrencySAR(preset.value)})
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <Label className="shrink-0">Custom Amount:</Label>
            <Input
              type="number"
              value={constraints.maxBudgetSAR}
              onChange={(e) => handleBudgetChange(parseInt(e.target.value) || 0)}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">SAR</span>
          </div>

          <div className="pt-2">
            <Slider
              value={[constraints.maxBudgetSAR]}
              min={10000}
              max={200000}
              step={5000}
              onValueChange={(v) => handleBudgetChange(v[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>SAR 10,000</span>
              <span>SAR 200,000</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pressure Drop Constraint */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Maximum Pressure Drop
          </CardTitle>
          <CardDescription>
            Limit the additional pressure drop from silencers and lining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{constraints.maxPressureDropIn.toFixed(2)}</span>
              <span className="text-muted-foreground">inches w.g.</span>
            </div>
            <Slider
              value={[constraints.maxPressureDropIn]}
              min={0.1}
              max={1.0}
              step={0.05}
              onValueChange={handlePressureDropChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1" (Low)</span>
              <span>0.5" (Standard)</span>
              <span>1.0" (High)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Optimization Priority</CardTitle>
          <CardDescription>
            Choose how to prioritize treatments when budget is limited
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={constraints.priorityMode}
            onValueChange={(v) => handlePriorityModeChange(v as PriorityMode)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="cost-effective" id="cost-effective" />
              <div className="flex-1">
                <Label htmlFor="cost-effective" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Cost-Effective
                </Label>
                <p className="text-xs text-muted-foreground">
                  Maximize NC reduction per dollar spent
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="balanced" id="balanced" />
              <div className="flex-1">
                <Label htmlFor="balanced" className="flex items-center gap-2 cursor-pointer">
                  <Scale className="h-4 w-4 text-blue-500" />
                  Balanced
                </Label>
                <p className="text-xs text-muted-foreground">
                  Balance cost, performance, and coverage
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="performance-first" id="performance-first" />
              <div className="flex-1">
                <Label htmlFor="performance-first" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Performance First
                </Label>
                <p className="text-xs text-muted-foreground">
                  Prioritize maximum noise reduction regardless of cost
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Lifecycle Cost Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Lifecycle Cost Analysis
          </CardTitle>
          <CardDescription>
            Include long-term maintenance and energy costs in package comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lifecycle">Enable lifecycle cost analysis</Label>
            <Switch
              id="lifecycle"
              checked={constraints.includeLifecycleCosts}
              onCheckedChange={handleLifecycleToggle}
            />
          </div>
          
          {constraints.includeLifecycleCosts && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Analysis Period (years)</Label>
                <Input
                  type="number"
                  min={10}
                  max={40}
                  value={constraints.analysisYears}
                  onChange={(e) => handleAnalysisYearsChange(parseInt(e.target.value) || 25)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Rate (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  step={0.5}
                  value={constraints.discountRate}
                  onChange={(e) => handleDiscountRateChange(parseFloat(e.target.value) || 5)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
