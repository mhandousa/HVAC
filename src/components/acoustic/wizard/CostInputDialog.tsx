import React, { useState } from 'react';
import { formatCurrencySAR } from '@/lib/currency-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseName: string;
  currentCosts: {
    quotedCost?: number;
    agreedCost?: number;
    actualCost?: number;
  };
  onSave: (costs: { quotedCost?: number; agreedCost?: number; actualCost?: number; notes?: string }) => void;
}

export function CostInputDialog({
  open,
  onOpenChange,
  phaseName,
  currentCosts,
  onSave,
}: CostInputDialogProps) {
  const [quotedCost, setQuotedCost] = useState<string>(
    currentCosts.quotedCost?.toString() || ''
  );
  const [agreedCost, setAgreedCost] = useState<string>(
    currentCosts.agreedCost?.toString() || ''
  );
  const [actualCost, setActualCost] = useState<string>(
    currentCosts.actualCost?.toString() || ''
  );
  const [notes, setNotes] = useState('');

  const parseNumber = (value: string): number | undefined => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  };

  const quotedNum = parseNumber(quotedCost);
  const agreedNum = parseNumber(agreedCost);
  const actualNum = parseNumber(actualCost);

  // Calculate variances
  const quotedToAgreedVariance = quotedNum && agreedNum 
    ? agreedNum - quotedNum 
    : undefined;
  const agreedToActualVariance = agreedNum && actualNum 
    ? actualNum - agreedNum 
    : undefined;

  const getVarianceDisplay = (variance: number | undefined) => {
    if (variance === undefined) return null;
    const isNegative = variance < 0;
    const isPositive = variance > 0;
    
    return (
      <div className={cn(
        'flex items-center gap-1 text-xs',
        isNegative && 'text-emerald-600',
        isPositive && 'text-destructive',
        !isNegative && !isPositive && 'text-muted-foreground'
      )}>
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {!isNegative && !isPositive && <Minus className="h-3 w-3" />}
        {formatCurrencySAR(Math.abs(variance))}
        {isNegative && ' under'}
        {isPositive && ' over'}
      </div>
    );
  };

  const handleSave = () => {
    onSave({
      quotedCost: quotedNum,
      agreedCost: agreedNum,
      actualCost: actualNum,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Costs
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{phaseName}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quoted Cost */}
          <div className="space-y-2">
            <Label htmlFor="quoted">Contractor Quote (SAR)</Label>
            <Input
              id="quoted"
              type="number"
              placeholder="Enter quoted amount"
              value={quotedCost}
              onChange={(e) => setQuotedCost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Original quote from the contractor
            </p>
          </div>

          {/* Agreed Cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="agreed">Agreed Cost (SAR)</Label>
              {getVarianceDisplay(quotedToAgreedVariance)}
            </div>
            <Input
              id="agreed"
              type="number"
              placeholder="Enter agreed amount"
              value={agreedCost}
              onChange={(e) => setAgreedCost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Final negotiated price
            </p>
          </div>

          {/* Actual Cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="actual">Actual Cost (SAR)</Label>
              {getVarianceDisplay(agreedToActualVariance)}
            </div>
            <Input
              id="actual"
              type="number"
              placeholder="Enter actual amount (after completion)"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Real cost after work is completed
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Cost Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Explain any cost variance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Costs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
