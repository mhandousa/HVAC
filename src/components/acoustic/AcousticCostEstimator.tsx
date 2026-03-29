import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calculator,
  Plus,
  Trash2,
  DollarSign,
  Volume2,
  Activity,
  Layers,
  FileDown,
  Sparkles,
} from 'lucide-react';
import {
  TreatmentCategory,
  TreatmentLineItem,
  CostBreakdown,
  TREATMENT_CATALOG,
  getTreatmentsByCategory,
  getTreatmentById,
  calculateTreatmentCost,
  formatCurrencySAR,
  estimateZoneRemediation,
  ZoneRemediationEstimate,
} from '@/lib/acoustic-cost-calculations';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

interface AcousticCostEstimatorProps {
  zones?: ZoneAcousticData[];
  onExport?: (breakdown: CostBreakdown) => void;
}

interface LineItemWithId extends TreatmentLineItem {
  lineId: string;
}

const CATEGORY_INFO: Record<TreatmentCategory, { label: string; icon: React.ElementType; description: string }> = {
  silencer: { label: 'Silencers', icon: Volume2, description: 'Inline duct silencers and attenuators' },
  lining: { label: 'Duct Lining', icon: Layers, description: 'Internal and external duct insulation' },
  isolator: { label: 'Vibration Isolators', icon: Activity, description: 'Spring mounts and isolation bases' },
  panel: { label: 'Acoustic Panels', icon: Layers, description: 'Wall panels and ceiling treatments' },
};

export function AcousticCostEstimator({ zones = [], onExport }: AcousticCostEstimatorProps) {
  const [lineItems, setLineItems] = useState<LineItemWithId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory>('silencer');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [contingencyPercent, setContingencyPercent] = useState<number>(15);
  const [autoEstimates, setAutoEstimates] = useState<ZoneRemediationEstimate[]>([]);

  // Calculate cost breakdown
  const costBreakdown = useMemo<CostBreakdown | null>(() => {
    if (lineItems.length === 0) return null;
    try {
      return calculateTreatmentCost(
        lineItems.map(li => ({ itemId: li.itemId, quantity: li.quantity, size: li.size })),
        contingencyPercent
      );
    } catch {
      return null;
    }
  }, [lineItems, contingencyPercent]);

  // Category items
  const categoryItems = useMemo(() => getTreatmentsByCategory(selectedCategory), [selectedCategory]);

  // Add line item
  const addLineItem = () => {
    if (!selectedItemId) return;
    
    const newItem: LineItemWithId = {
      lineId: Date.now().toString(),
      itemId: selectedItemId,
      quantity,
    };
    
    setLineItems([...lineItems, newItem]);
    setSelectedItemId('');
    setQuantity(1);
  };

  // Remove line item
  const removeLineItem = (lineId: string) => {
    setLineItems(lineItems.filter(li => li.lineId !== lineId));
  };

  // Update quantity
  const updateQuantity = (lineId: string, newQuantity: number) => {
    setLineItems(lineItems.map(li => 
      li.lineId === lineId ? { ...li, quantity: Math.max(1, newQuantity) } : li
    ));
  };

  // Auto-estimate from zones
  const runAutoEstimate = () => {
    const estimates = zones
      .filter(z => z.status === 'exceeds' || z.status === 'marginal')
      .map(z => estimateZoneRemediation(z.zoneId, z.zoneName, z.ncDelta, 12, false));
    
    setAutoEstimates(estimates);
    
    // Add estimated items to line items
    const newItems: LineItemWithId[] = [];
    estimates.forEach(est => {
      est.recommendedTreatments.forEach(treatment => {
        newItems.push({
          lineId: `auto-${Date.now()}-${Math.random()}`,
          ...treatment,
        });
      });
    });
    
    setLineItems([...lineItems, ...newItems]);
  };

  // Export to PDF (simplified)
  const handleExport = () => {
    if (costBreakdown && onExport) {
      onExport(costBreakdown);
    }
  };

  const CategoryIcon = CATEGORY_INFO[selectedCategory].icon;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Selection</TabsTrigger>
          <TabsTrigger value="auto" disabled={zones.length === 0}>
            Auto-Estimate {zones.length > 0 && `(${zones.filter(z => z.ncDelta > 0).length} zones)`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-4">
          {/* Category Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Treatment Items</CardTitle>
              <CardDescription>Select treatments and quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(CATEGORY_INFO) as TreatmentCategory[]).map(cat => {
                  const info = CATEGORY_INFO[cat];
                  const Icon = info.icon;
                  return (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedItemId('');
                      }}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {info.label}
                    </Button>
                  );
                })}
              </div>

              {/* Item Selection */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Treatment Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {formatCurrencySAR(item.materialCostSAR + item.laborCostSAR)}/{item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                    <Button onClick={addLineItem} disabled={!selectedItemId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Auto-Estimate from Zone Analysis
              </CardTitle>
              <CardDescription>
                Automatically recommend treatments based on NC exceedance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {zones.filter(z => z.ncDelta > 0).length} zones exceed NC targets
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click to auto-generate treatment recommendations
                    </p>
                  </div>
                  <Button onClick={runAutoEstimate}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Estimates
                  </Button>
                </div>

                {autoEstimates.length > 0 && (
                  <div className="space-y-2">
                    {autoEstimates.map(est => (
                      <div key={est.zoneId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium text-sm">{est.zoneName}</p>
                          <p className="text-xs text-muted-foreground">
                            NC Delta: +{est.ncDelta} | {est.recommendedTreatments.length} treatments
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatCurrencySAR(est.estimatedCost)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Line Items Table */}
      {lineItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Selected Items ({lineItems.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLineItems([])}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map(li => {
                  const item = getTreatmentById(li.itemId);
                  if (!item) return null;
                  const unitCost = item.materialCostSAR + item.laborCostSAR;
                  const total = unitCost * li.quantity;
                  
                  return (
                    <TableRow key={li.lineId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={1}
                          value={li.quantity}
                          onChange={(e) => updateQuantity(li.lineId, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrencySAR(unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrencySAR(total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeLineItem(li.lineId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary */}
      {costBreakdown && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Material Costs</p>
                <p className="text-lg font-semibold">{formatCurrencySAR(costBreakdown.subtotalMaterial)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Labor Costs</p>
                <p className="text-lg font-semibold">{formatCurrencySAR(costBreakdown.subtotalLabor)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="contingency" className="text-sm">Contingency:</Label>
                <Input
                  id="contingency"
                  type="number"
                  min={0}
                  max={50}
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="font-medium">{formatCurrencySAR(costBreakdown.contingencyAmount)}</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">Grand Total</p>
              <p className="text-2xl font-bold text-primary">{formatCurrencySAR(costBreakdown.grandTotal)}</p>
            </div>

            <Button onClick={handleExport} className="w-full" disabled={!onExport}>
              <FileDown className="h-4 w-4 mr-2" />
              Export Estimate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
