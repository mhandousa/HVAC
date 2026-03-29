import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Minus, Plus, Calculator, RotateCcw } from 'lucide-react';
import { REFRIGERANT_FITTINGS, ACR_COPPER_SIZES, type FittingType } from '@/lib/vrf-refrigerant-calculations';

interface FittingCount {
  type: string;
  quantity: number;
}

interface VRFFittingsLibraryProps {
  onCalculate?: (equivalentLength: number, fittings: FittingCount[]) => void;
}

export function VRFFittingsLibrary({ onCalculate }: VRFFittingsLibraryProps) {
  const [pipeSize, setPipeSize] = useState(0.625); // 5/8" default
  const [fittingCounts, setFittingCounts] = useState<Record<string, number>>({});
  
  const updateCount = (fittingName: string, delta: number) => {
    setFittingCounts(prev => ({
      ...prev,
      [fittingName]: Math.max(0, (prev[fittingName] || 0) + delta),
    }));
  };
  
  const resetCounts = () => {
    setFittingCounts({});
  };
  
  const { totalEquivalentLength, fittingDetails } = useMemo(() => {
    let total = 0;
    const details: { name: string; quantity: number; equivLength: number }[] = [];
    
    REFRIGERANT_FITTINGS.forEach(fitting => {
      const qty = fittingCounts[fitting.name] || 0;
      if (qty > 0) {
        const equivLength = fitting.equivalentLengthFactor * pipeSize * qty;
        total += equivLength;
        details.push({ name: fitting.name, quantity: qty, equivLength });
      }
    });
    
    return { totalEquivalentLength: total, fittingDetails: details };
  }, [fittingCounts, pipeSize]);
  
  const handleApply = () => {
    if (onCalculate) {
      const fittings = Object.entries(fittingCounts)
        .filter(([_, qty]) => qty > 0)
        .map(([type, quantity]) => ({ type, quantity }));
      onCalculate(totalEquivalentLength, fittings);
    }
  };
  
  const groupedFittings = useMemo(() => {
    const groups: Record<string, FittingType[]> = {};
    REFRIGERANT_FITTINGS.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, []);
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Fittings Equivalent Length Calculator</span>
          <Button variant="ghost" size="sm" onClick={resetCounts}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipe Size Selector */}
        <div className="flex items-center gap-4">
          <div className="space-y-2 flex-1">
            <Label>Pipe Size</Label>
            <Select 
              value={pipeSize.toString()} 
              onValueChange={(v) => setPipeSize(parseFloat(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACR_COPPER_SIZES.map(size => (
                  <SelectItem key={size.od} value={size.od.toString()}>
                    {size.name} ({size.od}" OD)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-right pt-6">
            <div className="text-2xl font-bold">
              {totalEquivalentLength.toFixed(1)} ft
            </div>
            <div className="text-sm text-muted-foreground">
              Total Equivalent Length
            </div>
          </div>
        </div>
        
        {/* Fittings by Category */}
        {Object.entries(groupedFittings).map(([category, fittings]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium capitalize text-sm text-muted-foreground">
              {category}s
            </h4>
            <div className="grid gap-2">
              {fittings.map(fitting => {
                const count = fittingCounts[fitting.name] || 0;
                const equivLength = fitting.equivalentLengthFactor * pipeSize * count;
                
                return (
                  <div 
                    key={fitting.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">{fitting.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({fitting.equivalentLengthFactor}× pipe dia.)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {count > 0 && (
                        <Badge variant="secondary">
                          +{equivLength.toFixed(1)} ft
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCount(fitting.name, -1)}
                          disabled={count === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          value={count}
                          onChange={(e) => setFittingCounts(prev => ({
                            ...prev,
                            [fitting.name]: parseInt(e.target.value) || 0,
                          }))}
                          className="w-16 h-8 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCount(fitting.name, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Summary */}
        {fittingDetails.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium">Summary</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fitting</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Equiv. Length</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fittingDetails.map(detail => (
                  <TableRow key={detail.name}>
                    <TableCell>{detail.name}</TableCell>
                    <TableCell className="text-right">{detail.quantity}</TableCell>
                    <TableCell className="text-right">{detail.equivLength.toFixed(1)} ft</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    {fittingDetails.reduce((sum, d) => sum + d.quantity, 0)}
                  </TableCell>
                  <TableCell className="text-right">{totalEquivalentLength.toFixed(1)} ft</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {onCalculate && (
              <Button onClick={handleApply} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Apply to Selected Unit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
