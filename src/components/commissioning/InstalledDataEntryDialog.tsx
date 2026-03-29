import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, AlertTriangle, XCircle, Equal, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateVarianceSummary } from "./VarianceSummaryPanel";

interface InstalledDataEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designData: Record<string, any>;
  installedData: Record<string, any> | null;
  tolerancePercent: number;
  onSave: (installedData: Record<string, any>, tolerancePercent: number) => void;
}

const getFieldType = (value: any): 'number' | 'text' | 'boolean' => {
  if (typeof value === 'boolean') return 'boolean';
  if (!isNaN(parseFloat(String(value)))) return 'number';
  return 'text';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'match':
      return <Equal className="h-4 w-4 text-muted-foreground" />;
    case 'within_tolerance':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

export function InstalledDataEntryDialog({
  open,
  onOpenChange,
  designData,
  installedData,
  tolerancePercent: initialTolerance,
  onSave,
}: InstalledDataEntryDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tolerance, setTolerance] = useState(initialTolerance);
  
  // Initialize form data from existing installed data or design data structure
  useEffect(() => {
    if (open) {
      const initialData: Record<string, any> = {};
      Object.keys(designData).forEach(key => {
        // Skip nested objects
        if (typeof designData[key] === 'object' && designData[key] !== null && !Array.isArray(designData[key])) {
          return;
        }
        initialData[key] = installedData?.[key] ?? '';
      });
      setFormData(initialData);
      setTolerance(initialTolerance);
    }
  }, [open, designData, installedData, initialTolerance]);
  
  // Calculate real-time variance
  const varianceSummary = calculateVarianceSummary(designData, formData, tolerance);
  
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    // Convert numeric strings back to numbers where appropriate
    const processedData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        processedData[key] = null;
      } else if (getFieldType(designData[key]) === 'number' && !isNaN(parseFloat(String(value)))) {
        processedData[key] = parseFloat(String(value));
      } else {
        processedData[key] = value;
      }
    });
    
    onSave(processedData, tolerance);
    onOpenChange(false);
  };
  
  const fieldList = Object.keys(designData).filter(key => {
    const value = designData[key];
    return !(typeof value === 'object' && value !== null && !Array.isArray(value));
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Enter Installed Parameters
          </DialogTitle>
          <DialogDescription>
            Enter the actual installed values to compare against design specifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Tolerance Slider */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Tolerance Threshold</Label>
              <Badge variant="outline">{tolerance}%</Badge>
            </div>
            <Slider
              value={[tolerance]}
              onValueChange={(values) => setTolerance(values[0])}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Values within ±{tolerance}% are considered acceptable
            </p>
          </div>
          
          {/* Field Entry Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Parameter</th>
                  <th className="text-right py-3 px-4 font-medium w-28">Design</th>
                  <th className="text-left py-3 px-4 font-medium w-36">Installed</th>
                  <th className="text-center py-3 px-4 font-medium w-24">Variance</th>
                </tr>
              </thead>
              <tbody>
                {fieldList.map((field, idx) => {
                  const designValue = designData[field];
                  const installedValue = formData[field];
                  const fieldType = getFieldType(designValue);
                  
                  // Find variance for this field
                  const fieldVariance = varianceSummary?.fields.find(f => f.field === field);
                  
                  return (
                    <tr key={field} className={cn("border-t", idx % 2 === 0 && "bg-muted/20")}>
                      <td className="py-3 px-4 capitalize font-medium">
                        {field.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {String(designValue)}
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type={fieldType === 'number' ? 'number' : 'text'}
                          value={installedValue}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                          className="h-8"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {fieldVariance && installedValue !== '' && (
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(fieldVariance.status)}
                            {fieldVariance.variance_percent !== null && (
                              <span className={cn(
                                "text-xs font-mono",
                                fieldVariance.status === 'within_tolerance' && "text-green-600",
                                fieldVariance.status === 'warning' && "text-yellow-600",
                                fieldVariance.status === 'fail' && "text-destructive"
                              )}>
                                {fieldVariance.variance_percent > 0 ? '+' : ''}
                                {fieldVariance.variance_percent.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Summary */}
          {varianceSummary && varianceSummary.fields.some(f => formData[f.field] !== '') && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium">Overall Status</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    varianceSummary.within_tolerance === varianceSummary.total_fields && "bg-green-100 text-green-800",
                    varianceSummary.within_tolerance >= varianceSummary.total_fields * 0.8 && varianceSummary.within_tolerance < varianceSummary.total_fields && "bg-yellow-100 text-yellow-800",
                    varianceSummary.within_tolerance < varianceSummary.total_fields * 0.8 && "bg-red-100 text-red-800"
                  )}
                >
                  {varianceSummary.within_tolerance}/{varianceSummary.total_fields} Within Tolerance
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Installed Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
