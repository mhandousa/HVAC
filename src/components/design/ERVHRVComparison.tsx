import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  RefreshCw,
  Thermometer,
  Droplets,
  Zap,
  Trophy,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  ClimateZone, 
  SAUDI_WEATHER_BINS, 
  getClimateZoneDescription,
  getERVRecommendation,
} from '@/lib/saudi-weather-bins';

interface ERVHRVComparisonProps {
  airflowCfm?: number;
  onSelect?: (type: 'erv' | 'hrv') => void;
}

interface ComparisonResult {
  metric: string;
  erv: string | number;
  hrv: string | number;
  winner: 'erv' | 'hrv' | 'tie';
  importance: 'high' | 'medium' | 'low';
}

export function ERVHRVComparison({ airflowCfm = 1500, onSelect }: ERVHRVComparisonProps) {
  const [selectedClimateZone, setSelectedClimateZone] = useState<ClimateZone>('hot_dry');
  const [customAirflow, setCustomAirflow] = useState(airflowCfm);
  
  // Get climate zone info
  const cities = useMemo(() => 
    SAUDI_WEATHER_BINS.filter(c => c.climateZone === selectedClimateZone),
    [selectedClimateZone]
  );
  
  const recommendation = useMemo(() => 
    getERVRecommendation(selectedClimateZone),
    [selectedClimateZone]
  );
  
  // Calculate comparison metrics
  const comparison = useMemo((): ComparisonResult[] => {
    // Base efficiencies
    const ervSensible = 78;
    const ervLatent = 68;
    const hrvSensible = 65;
    const hrvLatent = 0;
    
    // Climate-specific calculations
    let coolingHours: number;
    let latentLoadPercent: number;
    let avgDeltaT: number;
    let avgDeltaW: number;
    
    switch (selectedClimateZone) {
      case 'hot_humid':
        coolingHours = 5000;
        latentLoadPercent = 40;
        avgDeltaT = 15;
        avgDeltaW = 0.010;
        break;
      case 'hot_dry':
        coolingHours = 4500;
        latentLoadPercent = 15;
        avgDeltaT = 22;
        avgDeltaW = 0.003;
        break;
      case 'moderate':
      default:
        coolingHours = 2500;
        latentLoadPercent = 25;
        avgDeltaT = 10;
        avgDeltaW = 0.005;
        break;
    }
    
    // Calculate recovery rates
    const ervSensibleRecovery = (ervSensible / 100) * 1.08 * customAirflow * avgDeltaT;
    const ervLatentRecovery = (ervLatent / 100) * 4840 * customAirflow * avgDeltaW;
    const ervTotalRecovery = ervSensibleRecovery + ervLatentRecovery;
    
    const hrvSensibleRecovery = (hrvSensible / 100) * 1.08 * customAirflow * avgDeltaT;
    const hrvTotalRecovery = hrvSensibleRecovery;
    
    // Annual savings
    const cop = 3.5;
    const electricityRate = 0.18;
    
    const ervKwh = (ervTotalRecovery * coolingHours) / (3412 * cop);
    const hrvKwh = (hrvTotalRecovery * coolingHours) / (3412 * cop);
    
    const ervAnnualSavings = Math.round(ervKwh * electricityRate);
    const hrvAnnualSavings = Math.round(hrvKwh * electricityRate);
    
    // Equipment costs (typical)
    const ervCost = 35000 + customAirflow * 15;
    const hrvCost = 22000 + customAirflow * 10;
    const installationFactor = 0.25;
    
    const ervTotalCost = Math.round(ervCost * (1 + installationFactor));
    const hrvTotalCost = Math.round(hrvCost * (1 + installationFactor));
    
    // Payback
    const ervPayback = ervAnnualSavings > 0 ? ervTotalCost / ervAnnualSavings : 99;
    const hrvPayback = hrvAnnualSavings > 0 ? hrvTotalCost / hrvAnnualSavings : 99;
    
    return [
      {
        metric: 'Sensible Effectiveness',
        erv: `${ervSensible}%`,
        hrv: `${hrvSensible}%`,
        winner: ervSensible > hrvSensible ? 'erv' : hrvSensible > ervSensible ? 'hrv' : 'tie',
        importance: 'high',
      },
      {
        metric: 'Latent Effectiveness',
        erv: `${ervLatent}%`,
        hrv: '0%',
        winner: 'erv',
        importance: selectedClimateZone === 'hot_humid' ? 'high' : 'medium',
      },
      {
        metric: 'Total Recovery (BTU/h)',
        erv: Math.round(ervTotalRecovery).toLocaleString(),
        hrv: Math.round(hrvTotalRecovery).toLocaleString(),
        winner: ervTotalRecovery > hrvTotalRecovery ? 'erv' : 'hrv',
        importance: 'high',
      },
      {
        metric: 'Annual Energy Savings (kWh)',
        erv: Math.round(ervKwh).toLocaleString(),
        hrv: Math.round(hrvKwh).toLocaleString(),
        winner: ervKwh > hrvKwh ? 'erv' : 'hrv',
        importance: 'high',
      },
      {
        metric: 'Annual Cost Savings (SAR)',
        erv: `SAR ${ervAnnualSavings.toLocaleString()}`,
        hrv: `SAR ${hrvAnnualSavings.toLocaleString()}`,
        winner: ervAnnualSavings > hrvAnnualSavings ? 'erv' : 'hrv',
        importance: 'high',
      },
      {
        metric: 'Equipment + Installation',
        erv: `SAR ${ervTotalCost.toLocaleString()}`,
        hrv: `SAR ${hrvTotalCost.toLocaleString()}`,
        winner: hrvTotalCost < ervTotalCost ? 'hrv' : 'erv',
        importance: 'medium',
      },
      {
        metric: 'Simple Payback',
        erv: `${ervPayback.toFixed(1)} years`,
        hrv: `${hrvPayback.toFixed(1)} years`,
        winner: ervPayback < hrvPayback ? 'erv' : 'hrv',
        importance: 'high',
      },
      {
        metric: 'Maintenance Complexity',
        erv: 'Higher',
        hrv: 'Lower',
        winner: 'hrv',
        importance: 'low',
      },
      {
        metric: 'Dehumidification Benefit',
        erv: 'Yes',
        hrv: 'No',
        winner: selectedClimateZone === 'hot_humid' ? 'erv' : 'tie',
        importance: selectedClimateZone === 'hot_humid' ? 'high' : 'low',
      },
    ];
  }, [selectedClimateZone, customAirflow]);
  
  // Monthly comparison chart data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Climate-specific monthly multipliers
    const getMultiplier = (month: number): number => {
      switch (selectedClimateZone) {
        case 'hot_humid':
          return [0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.8, 0.7][month];
        case 'hot_dry':
          return [0.3, 0.4, 0.6, 0.8, 1.0, 1.0, 1.0, 1.0, 0.9, 0.7, 0.4, 0.3][month];
        case 'moderate':
        default:
          return [0.4, 0.4, 0.5, 0.6, 0.8, 0.9, 1.0, 1.0, 0.8, 0.6, 0.5, 0.4][month];
      }
    };
    
    // Base monthly savings
    const baseSavingsErv = selectedClimateZone === 'hot_humid' ? 2500 : 
                          selectedClimateZone === 'hot_dry' ? 2000 : 1200;
    const baseSavingsHrv = selectedClimateZone === 'hot_humid' ? 1200 :
                          selectedClimateZone === 'hot_dry' ? 1600 : 900;
    
    return months.map((month, i) => ({
      month,
      erv: Math.round(baseSavingsErv * getMultiplier(i) * (customAirflow / 1500)),
      hrv: Math.round(baseSavingsHrv * getMultiplier(i) * (customAirflow / 1500)),
    }));
  }, [selectedClimateZone, customAirflow]);
  
  const ervWins = comparison.filter(c => c.winner === 'erv').length;
  const hrvWins = comparison.filter(c => c.winner === 'hrv').length;
  
  return (
    <div className="space-y-6">
      {/* Climate Zone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Select Climate Zone
          </CardTitle>
          <CardDescription>
            Choose the climate zone to see appropriate ERV vs HRV comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={selectedClimateZone} 
            onValueChange={(v) => setSelectedClimateZone(v as ClimateZone)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
              selectedClimateZone === 'hot_dry' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}>
              <RadioGroupItem value="hot_dry" id="hot_dry" />
              <div className="space-y-1">
                <Label htmlFor="hot_dry" className="font-medium cursor-pointer">Hot-Dry Desert</Label>
                <p className="text-xs text-muted-foreground">Riyadh, Makkah, Madinah, Tabuk</p>
                <Badge variant="outline" className="text-xs">Low humidity, high sensible</Badge>
              </div>
            </div>
            
            <div className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
              selectedClimateZone === 'hot_humid' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}>
              <RadioGroupItem value="hot_humid" id="hot_humid" />
              <div className="space-y-1">
                <Label htmlFor="hot_humid" className="font-medium cursor-pointer">Hot-Humid Coastal</Label>
                <p className="text-xs text-muted-foreground">Jeddah, Dammam</p>
                <Badge variant="outline" className="text-xs">High humidity, latent critical</Badge>
              </div>
            </div>
            
            <div className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
              selectedClimateZone === 'moderate' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}>
              <RadioGroupItem value="moderate" id="moderate" />
              <div className="space-y-1">
                <Label htmlFor="moderate" className="font-medium cursor-pointer">Moderate Highland</Label>
                <p className="text-xs text-muted-foreground">Abha</p>
                <Badge variant="outline" className="text-xs">Balanced loads</Badge>
              </div>
            </div>
          </RadioGroup>
          
          <div className="flex items-center gap-4">
            <div>
              <Label>Outdoor Air CFM</Label>
              <Input 
                type="number" 
                value={customAirflow} 
                onChange={(e) => setCustomAirflow(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <p className="text-sm text-muted-foreground pt-5">
              {getClimateZoneDescription(selectedClimateZone)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendation */}
      <Alert className={cn(
        'border-2',
        recommendation.recommended === 'erv' ? 'border-success bg-success/10' :
        recommendation.recommended === 'hrv' ? 'border-info bg-info/10' :
        'border-warning bg-warning/10'
      )}>
        <Trophy className={cn(
          'h-5 w-5',
          recommendation.recommended === 'erv' ? 'text-success' :
          recommendation.recommended === 'hrv' ? 'text-info' :
          'text-warning'
        )} />
        <AlertTitle className="flex items-center gap-2">
          Recommended: {recommendation.recommended === 'erv' ? 'ERV (Enthalpy Recovery)' :
                       recommendation.recommended === 'hrv' ? 'HRV (Sensible Only)' :
                       'Either ERV or HRV'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p>{recommendation.reason}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Latent load represents approximately {recommendation.latentLoadPercent} of total ventilation load in this climate.
          </p>
        </AlertDescription>
      </Alert>
      
      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Performance Comparison
          </CardTitle>
          <CardDescription>
            Side-by-side comparison for {cities.map(c => c.name).join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    ERV
                    <Badge variant="outline" className="ml-1">{ervWins} wins</Badge>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Thermometer className="h-4 w-4 text-info" />
                    HRV
                    <Badge variant="outline" className="ml-1">{hrvWins} wins</Badge>
                  </div>
                </TableHead>
                <TableHead className="text-center w-24">Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row, i) => (
                <TableRow key={i} className={row.importance === 'high' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.metric}
                      {row.importance === 'high' && (
                        <Badge variant="secondary" className="text-[10px]">Key</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    'text-center',
                    row.winner === 'erv' ? 'font-bold text-success' : ''
                  )}>
                    {row.erv}
                  </TableCell>
                  <TableCell className={cn(
                    'text-center',
                    row.winner === 'hrv' ? 'font-bold text-info' : ''
                  )}>
                    {row.hrv}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.winner === 'erv' ? (
                      <Badge className="bg-success">ERV</Badge>
                    ) : row.winner === 'hrv' ? (
                      <Badge className="bg-info">HRV</Badge>
                    ) : (
                      <Badge variant="outline">Tie</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Monthly Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Energy Savings Comparison
          </CardTitle>
          <CardDescription>
            Projected monthly cost savings (SAR) for {customAirflow.toLocaleString()} CFM system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`SAR ${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar 
                  dataKey="erv" 
                  name="ERV Savings" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="hrv" 
                  name="HRV Savings" 
                  fill="hsl(var(--info))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Decision Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-success/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <RefreshCw className="h-5 w-5" />
              Choose ERV When...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <span>Located in hot-humid coastal climate (Jeddah, Dammam)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <span>Latent (moisture) load exceeds 25% of total ventilation load</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <span>Priority on maximum energy savings over initial cost</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <span>Dehumidification capacity of HVAC is limited</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <span>Building has high occupancy (schools, offices, malls)</span>
              </li>
            </ul>
            {onSelect && (
              <Button onClick={() => onSelect('erv')} className="w-full mt-4 bg-success hover:bg-success/90">
                Select ERV
              </Button>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-2 border-info/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-info">
              <Thermometer className="h-5 w-5" />
              Choose HRV When...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-info mt-0.5" />
                <span>Located in hot-dry desert climate (Riyadh, Makkah)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-info mt-0.5" />
                <span>Latent load is minimal (below 15% of total)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-info mt-0.5" />
                <span>Budget constraints require lower initial investment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-info mt-0.5" />
                <span>Lower maintenance preference (no desiccant wheel)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-info mt-0.5" />
                <span>Cross-contamination concerns require separate airstreams</span>
              </li>
            </ul>
            {onSelect && (
              <Button onClick={() => onSelect('hrv')} variant="outline" className="w-full mt-4 border-info text-info hover:bg-info/10">
                Select HRV
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
