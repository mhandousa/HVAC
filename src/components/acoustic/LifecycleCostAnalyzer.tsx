import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  X, 
  Trophy, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Download,
  Info,
  Wrench,
  RefreshCw,
  Search,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculateLifecycleCost,
  compareLifecycleCosts,
  LifecycleCostResult,
  LifecycleComparisonResult,
  MaintenanceScenario,
  formatCurrencySAR,
  getTreatmentsWithLifecycleInfo,
} from '@/lib/acoustic-lifecycle-costs';
import { TreatmentCostItem, TREATMENT_CATALOG, TreatmentCategory } from '@/lib/acoustic-cost-calculations';
import { LifecycleCostChart } from './LifecycleCostChart';
import { PerformanceDegradationChart } from './PerformanceDegradationChart';
import { MaintenanceScheduleTimeline } from './MaintenanceScheduleTimeline';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TreatmentSelection {
  id: string;
  treatment: TreatmentCostItem;
  quantity: number;
}

const CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  silencer: 'Silencers',
  lining: 'Duct Lining',
  isolator: 'Vibration Isolators',
  panel: 'Acoustic Panels',
};

const SCENARIO_LABELS: Record<MaintenanceScenario, { label: string; description: string }> = {
  minimal: { label: 'Minimal', description: 'Reduced maintenance, faster degradation, shorter lifespan' },
  standard: { label: 'Standard', description: 'Manufacturer-recommended maintenance schedule' },
  enhanced: { label: 'Enhanced', description: 'Premium maintenance, slower degradation, extended lifespan' },
};

export function LifecycleCostAnalyzer() {
  // Analysis settings
  const [analysisYears, setAnalysisYears] = useState(25);
  const [discountRate, setDiscountRate] = useState(8);
  const [inflationRate, setInflationRate] = useState(3);
  const [scenario, setScenario] = useState<MaintenanceScenario>('standard');
  const [showNPV, setShowNPV] = useState(false);
  
  // Treatment selections
  const [selections, setSelections] = useState<TreatmentSelection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory>('silencer');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Get treatments with lifecycle info
  const treatmentsWithLifecycle = useMemo(() => getTreatmentsWithLifecycleInfo(), []);
  
  // Filter treatments by category
  const treatmentsInCategory = useMemo(() => 
    treatmentsWithLifecycle.filter(t => t.category === selectedCategory),
    [treatmentsWithLifecycle, selectedCategory]
  );

  // Calculate lifecycle costs for all selections
  const lifecycleResults = useMemo((): LifecycleCostResult[] => {
    return selections.map(sel => 
      calculateLifecycleCost(
        sel.treatment, 
        sel.quantity, 
        analysisYears, 
        discountRate / 100, 
        inflationRate / 100,
        scenario
      )
    );
  }, [selections, analysisYears, discountRate, inflationRate, scenario]);

  // Compare results
  const comparison = useMemo((): LifecycleComparisonResult | null => {
    if (selections.length < 2) return null;
    return compareLifecycleCosts(
      selections.map(s => ({ treatment: s.treatment, quantity: s.quantity })),
      analysisYears,
      discountRate / 100,
      inflationRate / 100,
      scenario
    );
  }, [selections, analysisYears, discountRate, inflationRate, scenario]);

  // Add treatment
  const addTreatment = useCallback(() => {
    const treatment = TREATMENT_CATALOG.find(t => t.id === selectedTreatmentId);
    if (!treatment) return;
    
    // Check if already added
    if (selections.some(s => s.treatment.id === treatment.id)) return;
    
    // Limit to 4 treatments
    if (selections.length >= 4) return;
    
    setSelections(prev => [...prev, {
      id: `${treatment.id}-${Date.now()}`,
      treatment,
      quantity,
    }]);
    
    setSelectedTreatmentId('');
    setQuantity(1);
  }, [selectedTreatmentId, quantity, selections]);

  // Remove treatment
  const removeTreatment = useCallback((id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id: string, newQty: number) => {
    setSelections(prev => prev.map(s => 
      s.id === id ? { ...s, quantity: Math.max(1, newQty) } : s
    ));
  }, []);

  // Export analysis
  const handleExport = useCallback(() => {
    const report = {
      analysisSettings: {
        years: analysisYears,
        discountRate: `${discountRate}%`,
        inflationRate: `${inflationRate}%`,
        maintenanceScenario: scenario,
      },
      treatments: lifecycleResults.map(r => ({
        name: r.treatmentName,
        quantity: r.quantity,
        initialCost: r.totalInitialCost,
        maintenanceCost: r.totalMaintenanceCost,
        inspectionCost: r.totalInspectionCost,
        replacementCost: r.totalReplacementCost,
        totalLifecycleCost: r.totalLifecycleCost,
        npv: r.npvLifecycleCost,
        annualEquivalent: r.annualEquivalentCost,
        avgPerformance: `${r.avgPerformance.toFixed(1)}%`,
      })),
      comparison: comparison ? {
        lowestTotalCost: comparison.lowestTotalCost,
        lowestNPV: comparison.lowestNPV,
        maxSavings: comparison.maxCostDifference,
      } : null,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecycle-analysis-${analysisYears}yr.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lifecycleResults, comparison, analysisYears, discountRate, inflationRate, scenario]);

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Analysis Settings
          </CardTitle>
          <CardDescription>
            Configure the lifecycle analysis parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analysis Period */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Analysis Period</Label>
              <span className="font-semibold">{analysisYears} years</span>
            </div>
            <Slider
              value={[analysisYears]}
              onValueChange={([val]) => setAnalysisYears(val)}
              min={10}
              max={40}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 years</span>
              <span>25 years</span>
              <span>40 years</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Discount Rate */}
            <div className="space-y-2">
              <Label htmlFor="discount-rate" className="flex items-center gap-1">
                Discount Rate
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Used to calculate Net Present Value (NPV). Higher rates favor lower initial costs.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="discount-rate"
                  type="number"
                  value={discountRate}
                  onChange={e => setDiscountRate(Number(e.target.value))}
                  min={0}
                  max={20}
                  step={0.5}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-2">
              <Label htmlFor="inflation-rate" className="flex items-center gap-1">
                Inflation Rate
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Annual increase in maintenance and replacement costs over time.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="inflation-rate"
                  type="number"
                  value={inflationRate}
                  onChange={e => setInflationRate(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* Maintenance Scenario */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Maintenance Scenario
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Affects maintenance frequency, costs, degradation rate, and expected lifespan.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={scenario} onValueChange={(v) => setScenario(v as MaintenanceScenario)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIO_LABELS).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Treatments to Compare
          </CardTitle>
          <CardDescription>
            Select up to 4 acoustic treatments for lifecycle comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add treatment form */}
          <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => {
                setSelectedCategory(v as TreatmentCategory);
                setSelectedTreatmentId('');
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 min-w-48">
              <Label>Treatment</Label>
              <Select value={selectedTreatmentId} onValueChange={setSelectedTreatmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment..." />
                </SelectTrigger>
                <SelectContent>
                  {treatmentsInCategory.map(t => (
                    <SelectItem 
                      key={t.id} 
                      value={t.id}
                      disabled={selections.some(s => s.treatment.id === t.id)}
                    >
                      <div className="flex justify-between items-center w-full gap-4">
                        <span>{t.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {t.lifecycle.expectedLifespanYears}yr lifespan
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-24">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                min={1}
              />
            </div>

            <Button 
              onClick={addTreatment} 
              disabled={!selectedTreatmentId || selections.length >= 4}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Selected treatments */}
          {selections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {selections.map((sel, index) => {
                const lifecycle = treatmentsWithLifecycle.find(t => t.id === sel.treatment.id)?.lifecycle;
                const isWinner = comparison?.lowestNPV === sel.treatment.id;
                
                return (
                  <div 
                    key={sel.id}
                    className={cn(
                      'relative p-4 rounded-lg border bg-card',
                      isWinner && 'ring-2 ring-primary'
                    )}
                  >
                    {isWinner && (
                      <Badge className="absolute -top-2 -right-2 bg-primary">
                        <Trophy className="h-3 w-3 mr-1" />
                        Best NPV
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeTreatment(sel.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[sel.treatment.category]}
                      </Badge>
                      <h4 className="font-medium text-sm pr-6">{sel.treatment.name}</h4>
                      
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Qty:</Label>
                        <Input
                          type="number"
                          value={sel.quantity}
                          onChange={e => updateQuantity(sel.id, Number(e.target.value))}
                          min={1}
                          className="h-7 w-16 text-sm"
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t">
                        <div className="flex justify-between">
                          <span>Lifespan:</span>
                          <span>{lifecycle?.expectedLifespanYears || '—'} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Warranty:</span>
                          <span>{lifecycle?.warrantyYears || '—'} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Degradation:</span>
                          <span>{lifecycle?.performanceDegradationPerYear || '—'}%/yr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No treatments selected</p>
              <p className="text-sm">Add treatments above to begin lifecycle analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {lifecycleResults.length > 0 && (
        <>
          {/* Summary Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Cost Breakdown Comparison
                  </CardTitle>
                  <CardDescription>
                    {analysisYears}-year lifecycle costs at {discountRate}% discount rate
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-npv"
                      checked={showNPV}
                      onCheckedChange={setShowNPV}
                    />
                    <Label htmlFor="show-npv" className="text-sm">Show NPV</Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treatment</TableHead>
                    <TableHead className="text-right">Initial Cost</TableHead>
                    <TableHead className="text-right">Maintenance</TableHead>
                    <TableHead className="text-right">Inspections</TableHead>
                    <TableHead className="text-right">Replacements</TableHead>
                    <TableHead className="text-right font-semibold">
                      {showNPV ? 'NPV' : 'Total Lifecycle'}
                    </TableHead>
                    <TableHead className="text-right">Annual Equiv.</TableHead>
                    <TableHead className="text-center">Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lifecycleResults
                    .sort((a, b) => (showNPV ? a.npvLifecycleCost : a.totalLifecycleCost) - (showNPV ? b.npvLifecycleCost : b.totalLifecycleCost))
                    .map((result, index) => {
                      const isLowest = index === 0;
                      return (
                        <TableRow key={result.treatmentId} className={isLowest ? 'bg-primary/5' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isLowest && <Star className="h-4 w-4 text-primary fill-primary" />}
                              <div>
                                <div className="font-medium">{result.treatmentName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Qty: {result.quantity}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrencySAR(result.totalInitialCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrencySAR(result.totalMaintenanceCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrencySAR(result.totalInspectionCost)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {result.replacementYears.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {result.replacementYears.length}×
                                </Badge>
                              )}
                              {formatCurrencySAR(result.totalReplacementCost)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrencySAR(showNPV ? result.npvLifecycleCost : result.totalLifecycleCost)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrencySAR(result.annualEquivalentCost)}/yr
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={isLowest ? 'default' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {comparison && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="font-medium mb-1">Analysis Summary</div>
                  <div className="text-muted-foreground">
                    Choosing <span className="text-foreground font-medium">{comparison.lowestNPV}</span> saves{' '}
                    <span className="text-primary font-medium">{formatCurrencySAR(comparison.maxNPVDifference)}</span>{' '}
                    in NPV over {analysisYears} years compared to the highest-cost option.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <Tabs defaultValue="cumulative" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cumulative" className="gap-1">
                <TrendingDown className="h-4 w-4" />
                Cumulative Cost
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-1">
                <TrendingDown className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1">
                <Calendar className="h-4 w-4" />
                Maintenance Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cumulative">
              <LifecycleCostChart results={lifecycleResults} showNPV={showNPV} />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceDegradationChart results={lifecycleResults} />
            </TabsContent>

            <TabsContent value="schedule">
              <MaintenanceScheduleTimeline results={lifecycleResults} maxYearsToShow={analysisYears} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
