import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  GitCompare,
  Filter,
  Star,
  Award,
  Gauge,
  Volume2,
  CheckCircle2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useTreatmentComparison,
  TreatmentComparisonFilters,
  RankedSilencer,
  BadgeType,
  estimateSilencerCost,
} from '@/hooks/useTreatmentComparison';
import { MANUFACTURER_SILENCER_CATALOG, ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';
import { TreatmentOctaveBandChart, silencersToChartData } from './TreatmentOctaveBandChart';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell,
} from 'recharts';

interface TreatmentComparisonToolProps {
  defaultDuctSize?: number;
  defaultAttenuation?: number;
  onSelect?: (silencer: ManufacturerSilencer) => void;
}

const BADGE_CONFIG: Record<BadgeType, { label: string; icon: typeof Star; color: string }> = {
  'best-value': { label: 'Best Value', icon: Star, color: 'text-amber-500' },
  'best-performance': { label: 'Best Performance', icon: Award, color: 'text-blue-500' },
  'lowest-pressure': { label: 'Lowest ΔP', icon: Gauge, color: 'text-green-500' },
  'quietest': { label: 'Quietest', icon: Volume2, color: 'text-purple-500' },
};

const MANUFACTURERS: string[] = [...new Set(MANUFACTURER_SILENCER_CATALOG.map(s => s.manufacturer))];

export function TreatmentComparisonTool({
  defaultDuctSize = 12,
  defaultAttenuation = 15,
  onSelect,
}: TreatmentComparisonToolProps) {
  // Filter state
  const [ductSize, setDuctSize] = useState(defaultDuctSize);
  const [minAttenuation, setMinAttenuation] = useState(defaultAttenuation);
  const [maxPressureDrop, setMaxPressureDrop] = useState(0.5);
  const [silencerType, setSilencerType] = useState<'all' | 'round' | 'rectangular'>('all');
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  
  // Comparison state
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'rank' | 'efficiency' | 'cost' | 'attenuation'>('rank');

  const filters: TreatmentComparisonFilters = {
    ductSizeIn: ductSize,
    minAttenuation,
    maxPressureDropIn: maxPressureDrop,
    silencerType: silencerType === 'all' ? undefined : silencerType,
    manufacturers: selectedManufacturers.length > 0 ? selectedManufacturers : undefined,
  };

  const {
    silencers,
    bestValue,
    bestPerformance,
    lowestPressure,
    quietest,
    chartData,
    totalMatching,
  } = useTreatmentComparison(filters);

  // Sort silencers
  const sortedSilencers = useMemo(() => {
    const sorted = [...silencers];
    switch (sortBy) {
      case 'efficiency':
        sorted.sort((a, b) => b.efficiency - a.efficiency);
        break;
      case 'cost':
        sorted.sort((a, b) => a.estimatedCostSAR - b.estimatedCostSAR);
        break;
      case 'attenuation':
        sorted.sort((a, b) => b.silencer.insertionLoss.overall - a.silencer.insertionLoss.overall);
        break;
      default:
        sorted.sort((a, b) => a.rank - b.rank);
    }
    return sorted;
  }, [silencers, sortBy]);

  // Get selected silencers for octave band comparison
  const comparisonSilencers = useMemo(() => {
    return silencers
      .filter(s => selectedForComparison.includes(s.silencer.id))
      .map(s => s.silencer);
  }, [silencers, selectedForComparison]);

  const toggleComparison = (id: string) => {
    setSelectedForComparison(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const toggleManufacturer = (mfr: string) => {
    setSelectedManufacturers(prev =>
      prev.includes(mfr)
        ? prev.filter(x => x !== mfr)
        : [...prev, mfr]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GitCompare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Treatment Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Compare silencers by cost, performance, and efficiency
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Duct Size (in)</Label>
              <Input
                type="number"
                value={ductSize}
                onChange={e => setDuctSize(Number(e.target.value))}
                min={4}
                max={48}
              />
            </div>

            <div className="space-y-2">
              <Label>Min Attenuation (dB)</Label>
              <Input
                type="number"
                value={minAttenuation}
                onChange={e => setMinAttenuation(Number(e.target.value))}
                min={5}
                max={40}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Pressure Drop (in w.g.)</Label>
              <Input
                type="number"
                value={maxPressureDrop}
                onChange={e => setMaxPressureDrop(Number(e.target.value))}
                min={0.1}
                max={1.0}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={silencerType} onValueChange={(v: any) => setSilencerType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manufacturers</Label>
              <div className="space-y-2">
                {MANUFACTURERS.map(mfr => (
                  <div key={mfr} className="flex items-center gap-2">
                    <Checkbox
                      id={mfr}
                      checked={selectedManufacturers.includes(mfr)}
                      onCheckedChange={() => toggleManufacturer(mfr)}
                    />
                    <label htmlFor={mfr} className="text-sm cursor-pointer">
                      {mfr}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            <div className="pt-4 border-t">
              <p className="text-sm">
                <span className="font-medium text-green-600">{totalMatching}</span> silencers meet requirements
              </p>
              <p className="text-sm text-muted-foreground">
                {silencers.length} total matching size
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Scatter Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cost vs. Attenuation</CardTitle>
              <CardDescription>Click points to add to comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      dataKey="cost"
                      name="Cost"
                      unit=" SAR"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="attenuation"
                      name="Attenuation"
                      unit=" dB"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ZAxis range={[50, 200]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg shadow-lg p-3">
                            <p className="font-medium">{data.label}</p>
                            <p className="text-sm text-muted-foreground">{data.manufacturer}</p>
                            <p className="text-sm">Cost: SAR {data.cost.toLocaleString()}</p>
                            <p className="text-sm">Attenuation: {data.attenuation} dB</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine 
                      y={minAttenuation} 
                      stroke="hsl(var(--destructive))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Min Required', position: 'left', fill: 'hsl(var(--destructive))', fontSize: 11 }}
                    />
                    <Scatter 
                      data={chartData} 
                      onClick={(data) => data && toggleComparison(data.id)}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={
                            selectedForComparison.includes(entry.id)
                              ? 'hsl(var(--primary))'
                              : entry.meetsRequirements
                              ? 'hsl(142 76% 36%)'
                              : 'hsl(var(--muted-foreground))'
                          }
                          opacity={entry.meetsRequirements ? 1 : 0.4}
                          cursor="pointer"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Silencer Comparison</CardTitle>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Best Match</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="cost">Lowest Cost</SelectItem>
                    <SelectItem value="attenuation">Highest dB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Compare</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead className="text-right">Insertion Loss</TableHead>
                      <TableHead className="text-right">Pressure Drop</TableHead>
                      <TableHead className="text-right">Self Noise</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSilencers.slice(0, 15).map((item) => (
                      <TableRow 
                        key={item.silencer.id}
                        className={cn(
                          !item.meetsRequirements && 'opacity-50'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedForComparison.includes(item.silencer.id)}
                            onCheckedChange={() => toggleComparison(item.silencer.id)}
                            disabled={!selectedForComparison.includes(item.silencer.id) && selectedForComparison.length >= 4}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.silencer.model}</span>
                            {item.badges.map(badge => {
                              const config = BADGE_CONFIG[badge];
                              const Icon = config.icon;
                              return (
                                <span key={badge} title={config.label}>
                                  <Icon 
                                    className={cn('h-4 w-4', config.color)} 
                                  />
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.silencer.dimensions.lengthIn}" L
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{item.silencer.manufacturer}</TableCell>
                        <TableCell className="text-right font-medium">
                          {item.silencer.insertionLoss.overall} dB
                        </TableCell>
                        <TableCell className="text-right">
                          {item.silencer.pressureDropIn}" w.g.
                        </TableCell>
                        <TableCell className="text-right">
                          NC-{item.silencer.selfNoiseNC}
                        </TableCell>
                        <TableCell className="text-right">
                          SAR {item.estimatedCostSAR.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.efficiency > 8 ? 'default' : 'secondary'}>
                            {item.efficiency} dB/K
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {onSelect && item.meetsRequirements && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSelect(item.silencer)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Octave Band Comparison */}
          {comparisonSilencers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Octave Band Comparison</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedForComparison([])}
                  >
                    Clear Selection
                  </Button>
                </div>
                <CardDescription>
                  Comparing: {comparisonSilencers.map(s => s.model).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TreatmentOctaveBandChart
                  treatments={silencersToChartData(comparisonSilencers)}
                  requiredAttenuation={minAttenuation}
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
