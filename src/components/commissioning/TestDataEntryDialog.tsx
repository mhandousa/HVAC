import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMISSIONING_PROTOCOLS } from '@/lib/commissioning-protocols';
import { PhotoUploadButton } from './PhotoUploadButton';

interface TestDataEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistType: string;
  onSubmit: (data: {
    test_name: string;
    test_category: string | null;
    expected_value: string | null;
    actual_value: string | null;
    tolerance_percent: number | null;
    variance_percent: number | null;
    result: string;
    notes?: string | null;
    technician_name?: string | null;
    photos?: File[];
  }) => void;
}

export function TestDataEntryDialog({
  open,
  onOpenChange,
  checklistType,
  onSubmit,
}: TestDataEntryDialogProps) {
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [tolerancePercent, setTolerancePercent] = useState(5);
  const [notes, setNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  // Get available tests for this checklist type
  const protocol = Object.values(COMMISSIONING_PROTOCOLS).find(
    (p) => p.equipmentType === checklistType
  );
  const availableTests = protocol?.tests || [];

  const handleProtocolSelect = (testId: string) => {
    const test = availableTests.find(t => t.id === testId);
    if (test) {
      setTestName(test.name);
      setTestCategory(test.category);
      setTolerancePercent(test.tolerance || 5);
      if (test.expectedValue) {
        setExpectedValue(test.expectedValue);
      }
    }
  };

  // Calculate variance in real-time
  const varianceData = useMemo(() => {
    if (!expectedValue || !actualValue) {
      return { variance: null, result: 'pending' as const, status: 'pending' as const };
    }
    
    const expected = parseFloat(expectedValue);
    const actual = parseFloat(actualValue);
    
    if (isNaN(expected) || isNaN(actual)) {
      // String comparison
      const match = expectedValue.toLowerCase() === actualValue.toLowerCase();
      return { 
        variance: null, 
        result: match ? 'pass' as const : 'fail' as const,
        status: match ? 'match' as const : 'fail' as const
      };
    }
    
    if (expected === 0) {
      return { variance: null, result: 'pending' as const, status: 'pending' as const };
    }
    
    const variance = ((actual - expected) / expected) * 100;
    const absVariance = Math.abs(variance);
    
    let result: 'pass' | 'fail' = absVariance <= tolerancePercent ? 'pass' : 'fail';
    let status: 'within_tolerance' | 'warning' | 'fail' = 'within_tolerance';
    
    if (absVariance > tolerancePercent * 1.5) {
      status = 'fail';
    } else if (absVariance > tolerancePercent) {
      status = 'warning';
      result = 'fail';
    }
    
    return { variance, result, status };
  }, [expectedValue, actualValue, tolerancePercent]);

  const handlePhotosSelected = (files: File[]) => {
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit({
      test_name: testName,
      test_category: testCategory || null,
      expected_value: expectedValue || null,
      actual_value: actualValue || null,
      tolerance_percent: tolerancePercent,
      variance_percent: varianceData.variance,
      result: varianceData.result,
      notes: notes || null,
      technician_name: technicianName || null,
      photos: selectedPhotos.length > 0 ? selectedPhotos : undefined,
    });

    // Reset form
    setTestName('');
    setTestCategory('');
    setExpectedValue('');
    setActualValue('');
    setTolerancePercent(5);
    setNotes('');
    setTechnicianName('');
    setSelectedPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Test Data</DialogTitle>
          <DialogDescription>
            Enter test measurements to verify equipment performance against design specifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableTests.length > 0 && (
            <div>
              <Label>Quick Select Test</Label>
              <Select onValueChange={handleProtocolSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name} ({test.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g., Supply Air Temperature"
              />
            </div>
            <div>
              <Label htmlFor="test-category">Category</Label>
              <Input
                id="test-category"
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                placeholder="e.g., Temperature"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected">Expected Value</Label>
              <Input
                id="expected"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder="e.g., 55°F"
              />
            </div>
            <div>
              <Label htmlFor="actual">Actual Value</Label>
              <Input
                id="actual"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                placeholder="e.g., 56°F"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tolerance">Tolerance (%)</Label>
              <Input
                id="tolerance"
                type="number"
                value={tolerancePercent}
                onChange={(e) => setTolerancePercent(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            
            {/* Real-time Variance Preview */}
            <div>
              <Label>Variance Preview</Label>
              <div className={cn(
                "h-9 px-3 flex items-center justify-between rounded-md border",
                varianceData.status === 'within_tolerance' && "bg-green-50 border-green-200",
                varianceData.status === 'warning' && "bg-yellow-50 border-yellow-200",
                varianceData.status === 'fail' && "bg-destructive/10 border-destructive/30",
                varianceData.status === 'pending' && "bg-muted"
              )}>
                {varianceData.status === 'pending' ? (
                  <span className="text-sm text-muted-foreground">Enter values...</span>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {varianceData.status === 'within_tolerance' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {varianceData.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {varianceData.status === 'fail' && <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm font-medium">
                        {varianceData.result === 'pass' ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                    {varianceData.variance !== null && (
                      <Badge variant="outline" className="text-xs">
                        {varianceData.variance > 0 ? '+' : ''}{varianceData.variance.toFixed(1)}%
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="technician">Technician Name</Label>
            <Input
              id="technician"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="Name of person performing test"
            />
          </div>

          <div>
            <Label>Photos</Label>
            <PhotoUploadButton
              selectedPhotos={selectedPhotos}
              onPhotosSelected={handlePhotosSelected}
              onRemovePhoto={handleRemovePhoto}
              maxPhotos={5}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations or comments..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!testName || !expectedValue || !actualValue}
            className={cn(
              varianceData.result === 'pass' && "bg-green-600 hover:bg-green-700"
            )}
          >
            Record Test {varianceData.result !== 'pending' && `(${varianceData.result === 'pass' ? 'Pass' : 'Fail'})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
