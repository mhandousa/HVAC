import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Calculator,
  Clock,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculateROI,
  ROIInputs,
  ROIResults,
  SpaceType,
  PRODUCTIVITY_IMPACT,
  mapZoneTypeToSpaceType,
  formatSAR,
} from '@/lib/acoustic-roi-calculations';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

interface AcousticROICalculatorProps {
  zones?: ZoneAcousticData[];
  selectedZoneId?: string;
  treatmentCost?: number;
  onZoneChange?: (zoneId: string) => void;
}

const SPACE_TYPE_OPTIONS: { value: SpaceType; label: string }[] = [
  { value: 'open-office', label: 'Open Office' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'conference-room', label: 'Conference Room' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'residential', label: 'Residential' },
];

export function AcousticROICalculator({
  zones = [],
  selectedZoneId,
  treatmentCost = 5000,
  onZoneChange,
}: AcousticROICalculatorProps) {
  // Form state
  const [zoneId, setZoneId] = useState(selectedZoneId || '');
  const [currentNC, setCurrentNC] = useState(45);
  const [targetNC, setTargetNC] = useState(35);
  const [spaceType, setSpaceType] = useState<SpaceType>('open-office');
  const [areaM2, setAreaM2] = useState(100);
  const [occupants, setOccupants] = useState(20);
  const [avgSalary, setAvgSalary] = useState(180000);
  const [rentPerM2, setRentPerM2] = useState(1500);
  const [treatment, setTreatment] = useState(treatmentCost);
  const [discountRate, setDiscountRate] = useState(8);
  const [analysisYears, setAnalysisYears] = useState(10);

  // Update from selected zone
  const handleZoneChange = (newZoneId: string) => {
    setZoneId(newZoneId);
    const zone = zones.find(z => z.zoneId === newZoneId);
    if (zone) {
      setCurrentNC(zone.estimatedNC || 45);
      setTargetNC(zone.targetNC);
      setSpaceType(mapZoneTypeToSpaceType(zone.spaceType));
    }
    onZoneChange?.(newZoneId);
  };

  // Calculate ROI
  const results = useMemo<ROIResults | null>(() => {
    if (currentNC <= targetNC || treatment <= 0) return null;
    
    const inputs: ROIInputs = {
      zoneId,
      currentNC,
      targetNC,
      spaceType,
      areaM2,
      occupants,
      avgAnnualSalary: avgSalary,
      rentPerM2PerYear: rentPerM2,
      treatmentCostSAR: treatment,
      discountRate: discountRate / 100,
      analysisYears,
    };
    
    return calculateROI(inputs);
  }, [zoneId, currentNC, targetNC, spaceType, areaM2, occupants, avgSalary, rentPerM2, treatment, discountRate, analysisYears]);

  const selectedZone = zones.find(z => z.zoneId === zoneId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Acoustic Treatment ROI Calculator</h2>
          <p className="text-sm text-muted-foreground">
            Estimate payback from productivity gains and tenant satisfaction
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Input Parameters</CardTitle>
            <CardDescription>Configure zone and financial assumptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone Selection */}
            {zones.length > 0 && (
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select value={zoneId} onValueChange={handleZoneChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.filter(z => z.status === 'exceeds' || z.status === 'marginal').map(z => (
                      <SelectItem key={z.zoneId} value={z.zoneId}>
                        {z.zoneName} (+{z.ncDelta} dB)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* NC Levels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Current NC</Label>
                <Input
                  type="number"
                  value={currentNC}
                  onChange={e => setCurrentNC(Number(e.target.value))}
                  min={20}
                  max={70}
                />
              </div>
              <div className="space-y-2">
                <Label>Target NC</Label>
                <Input
                  type="number"
                  value={targetNC}
                  onChange={e => setTargetNC(Number(e.target.value))}
                  min={15}
                  max={60}
                />
              </div>
            </div>

            {/* Space Type */}
            <div className="space-y-2">
              <Label>Space Type</Label>
              <Select value={spaceType} onValueChange={(v) => setSpaceType(v as SpaceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area & Occupants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Area (m²)</Label>
                <Input
                  type="number"
                  value={areaM2}
                  onChange={e => setAreaM2(Number(e.target.value))}
                  min={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Occupants</Label>
                <Input
                  type="number"
                  value={occupants}
                  onChange={e => setOccupants(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            {/* Financial */}
            <div className="space-y-2">
              <Label>Avg Annual Salary (SAR)</Label>
              <Input
                type="number"
                value={avgSalary}
                onChange={e => setAvgSalary(Number(e.target.value))}
                min={50000}
                step={10000}
              />
            </div>

            <div className="space-y-2">
              <Label>Rent (SAR/m²/year)</Label>
              <Input
                type="number"
                value={rentPerM2}
                onChange={e => setRentPerM2(Number(e.target.value))}
                min={500}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment Cost (SAR)</Label>
              <Input
                type="number"
                value={treatment}
                onChange={e => setTreatment(Number(e.target.value))}
                min={1000}
                step={500}
              />
            </div>

            {/* Analysis Period */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Analysis Period</Label>
                <span className="text-sm text-muted-foreground">{analysisYears} years</span>
              </div>
              <Slider
                value={[analysisYears]}
                onValueChange={([v]) => setAnalysisYears(v)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Discount Rate</Label>
                <span className="text-sm text-muted-foreground">{discountRate}%</span>
              </div>
              <Slider
                value={[discountRate]}
                onValueChange={([v]) => setDiscountRate(v)}
                min={0}
                max={20}
                step={0.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ROI Analysis Results
            </CardTitle>
            {selectedZone && (
              <CardDescription>
                {selectedZone.zoneName} • NC-{currentNC} → NC-{targetNC}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Adjust parameters to calculate ROI</p>
                <p className="text-sm">Current NC must be higher than Target NC</p>
              </div>
            ) : (
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="productivity">Productivity</TabsTrigger>
                  <TabsTrigger value="tenant">Tenant Value</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-muted-foreground">Payback</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {results.simplePaybackMonths < 12 
                          ? `${results.simplePaybackMonths} mo`
                          : `${(results.simplePaybackMonths / 12).toFixed(1)} yr`
                        }
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-muted-foreground">NPV</span>
                      </div>
                      <p className={cn(
                        "text-lg font-bold",
                        results.npv >= 0 ? "text-blue-600" : "text-destructive"
                      )}>
                        {formatSAR(results.npv)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">IRR</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">{results.irr}%</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-muted-foreground">B/C Ratio</span>
                      </div>
                      <p className="text-lg font-bold text-amber-600">{results.benefitCostRatio}x</p>
                    </div>
                  </div>

                  {/* Annual Benefits Breakdown */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Annual Benefits Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Productivity Gains</span>
                          <Badge variant="secondary" className="text-xs">{results.productivityShare}%</Badge>
                        </div>
                        <span className="font-medium">{formatSAR(results.annualProductivityGainSAR)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Tenant Value</span>
                          <Badge variant="secondary" className="text-xs">{results.tenantValueShare}%</Badge>
                        </div>
                        <span className="font-medium">{formatSAR(results.annualTenantValueSAR)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">Energy Savings</span>
                          <Badge variant="secondary" className="text-xs">{results.energyShare}%</Badge>
                        </div>
                        <span className="font-medium">{formatSAR(results.annualEnergySavingsSAR)}</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center font-medium">
                        <span>Total Annual Benefit</span>
                        <span className="text-lg text-green-600">{formatSAR(results.totalAnnualBenefitSAR)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={cn(
                    "p-4 rounded-lg flex items-start gap-3",
                    results.npv > 0 ? "bg-green-500/10" : "bg-amber-500/10"
                  )}>
                    {results.npv > 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        results.npv > 0 ? "text-green-700" : "text-amber-700"
                      )}>
                        {results.npv > 0 
                          ? "Strong Investment Case" 
                          : "Consider Alternative Options"
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {results.npv > 0 
                          ? `Treatment investment pays back in ${results.simplePaybackMonths < 12 ? `${results.simplePaybackMonths} months` : `${(results.simplePaybackMonths / 12).toFixed(1)} years`} with ${results.irr}% IRR.`
                          : `Current assumptions show marginal returns. Consider lower-cost treatment options or verify assumptions.`
                        }
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Productivity Tab */}
                <TabsContent value="productivity" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Current State</h4>
                      <p className="text-3xl font-bold text-destructive mb-1">
                        {results.currentProductivityLoss.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Productivity loss at NC-{currentNC}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">After Treatment</h4>
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {results.postTreatmentProductivityLoss.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Productivity loss at NC-{targetNC}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-blue-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Productivity Improvement</h4>
                        <p className="text-sm text-muted-foreground">
                          {occupants} occupants × {formatSAR(avgSalary)} avg salary
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          +{results.productivityImprovementPercent.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatSAR(results.annualProductivityGainSAR)}/year
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Research Basis</p>
                        <p>
                          Studies show that excessive background noise reduces concentration, 
                          increases stress, and decreases productivity by 5-15% in office environments.
                          Each NC point above NC-30 contributes approximately 1% productivity loss.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tenant Tab */}
                <TabsContent value="tenant" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Satisfaction Before</h4>
                      <p className="text-3xl font-bold text-amber-500 mb-1">
                        {results.currentSatisfactionScore}
                      </p>
                      <p className="text-sm text-muted-foreground">Score out of 100</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Satisfaction After</h4>
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {results.postSatisfactionScore}
                      </p>
                      <p className="text-sm text-muted-foreground">Score out of 100</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border flex justify-between items-center">
                      <div>
                        <p className="font-medium">Rent Premium Potential</p>
                        <p className="text-sm text-muted-foreground">Higher NC compliance = premium rent</p>
                      </div>
                      <span className={cn(
                        "font-bold",
                        results.rentPremiumPotentialSAR >= 0 ? "text-green-600" : "text-destructive"
                      )}>
                        {formatSAR(results.rentPremiumPotentialSAR)}/yr
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border flex justify-between items-center">
                      <div>
                        <p className="font-medium">Reduced Turnover Savings</p>
                        <p className="text-sm text-muted-foreground">Better retention = less vacancy</p>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatSAR(results.reducedTurnoverSavingsSAR)}/yr
                      </span>
                    </div>
                  </div>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.yearlyBenefits}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="year" 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatSAR(value), '']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <Area 
                          type="monotone" 
                          dataKey="netValue" 
                          name="Net Value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cumulative" 
                          name="Cumulative Benefits"
                          stroke="hsl(142 76% 36%)"
                          fill="hsl(142 76% 36%)"
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Breakeven occurs when Net Value crosses zero
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
