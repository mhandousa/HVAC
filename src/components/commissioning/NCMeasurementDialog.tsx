import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  Plus, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MeasurementPosition {
  position: string;
  nc_reading: number;
}

interface NCMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNC: number;
  zoneName: string;
  onSave: (data: {
    measured_nc: number;
    measurement_date: string;
    measurement_positions: MeasurementPosition[];
    ambient_conditions: {
      hvac_mode: string;
      occupancy: string;
      background_nc?: number;
    };
    equipment_used?: string;
    technician_notes?: string;
  }) => void;
}

const PRESET_POSITIONS = [
  'Room Center',
  'Near Diffuser 1',
  'Near Diffuser 2',
  'Workstation A',
  'Workstation B',
  'Near Return Grille',
  'Entry Door',
  'Window Side',
];

export function NCMeasurementDialog({
  open,
  onOpenChange,
  targetNC,
  zoneName,
  onSave,
}: NCMeasurementDialogProps) {
  const [positions, setPositions] = useState<MeasurementPosition[]>([
    { position: 'Room Center', nc_reading: 0 },
  ]);
  const [hvacMode, setHvacMode] = useState<string>('cooling');
  const [occupancy, setOccupancy] = useState<string>('unoccupied');
  const [backgroundNC, setBackgroundNC] = useState<string>('');
  const [equipmentUsed, setEquipmentUsed] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Calculate average NC from positions
  const validReadings = positions.filter(p => p.nc_reading > 0);
  const averageNC = validReadings.length > 0
    ? Math.round(validReadings.reduce((sum, p) => sum + p.nc_reading, 0) / validReadings.length)
    : null;
  
  const ncDelta = averageNC !== null ? averageNC - targetNC : null;

  const addPosition = () => {
    const unusedPositions = PRESET_POSITIONS.filter(
      p => !positions.some(pos => pos.position === p)
    );
    const nextPosition = unusedPositions[0] || `Position ${positions.length + 1}`;
    setPositions([...positions, { position: nextPosition, nc_reading: 0 }]);
  };

  const updatePosition = (index: number, field: keyof MeasurementPosition, value: string | number) => {
    const updated = [...positions];
    if (field === 'nc_reading') {
      updated[index].nc_reading = typeof value === 'string' ? parseInt(value) || 0 : value;
    } else {
      updated[index].position = value as string;
    }
    setPositions(updated);
  };

  const removePosition = (index: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (validReadings.length === 0) {
      toast.error('Please enter at least one NC measurement');
      return;
    }

    onSave({
      measured_nc: averageNC!,
      measurement_date: new Date().toISOString(),
      measurement_positions: positions.filter(p => p.nc_reading > 0),
      ambient_conditions: {
        hvac_mode: hvacMode,
        occupancy,
        background_nc: backgroundNC ? parseInt(backgroundNC) : undefined,
      },
      equipment_used: equipmentUsed || undefined,
      technician_notes: notes || undefined,
    });

    // Reset form
    setPositions([{ position: 'Room Center', nc_reading: 0 }]);
    setBackgroundNC('');
    setNotes('');
    onOpenChange(false);
    toast.success('Measurements saved');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            NC Measurements
          </DialogTitle>
          <DialogDescription>
            Enter field noise measurements for {zoneName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Target NC</p>
              <p className="text-2xl font-bold">NC-{targetNC}</p>
            </div>
            {averageNC !== null && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Measured Average</p>
                <p className={cn(
                  'text-2xl font-bold',
                  ncDelta !== null && ncDelta > 5 && 'text-destructive',
                  ncDelta !== null && ncDelta > 0 && ncDelta <= 5 && 'text-yellow-600',
                  ncDelta !== null && ncDelta <= 0 && 'text-green-600'
                )}>
                  NC-{averageNC}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {ncDelta !== null && ncDelta > 5 && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {ncDelta !== null && ncDelta <= 0 && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <span className={cn(
                    'text-sm',
                    ncDelta !== null && ncDelta > 0 ? 'text-destructive' : 'text-green-600'
                  )}>
                    {ncDelta !== null && (ncDelta > 0 ? `+${ncDelta}` : ncDelta)} dB
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Ambient Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>HVAC Mode</Label>
              <Select value={hvacMode} onValueChange={setHvacMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cooling">Cooling</SelectItem>
                  <SelectItem value="heating">Heating</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Occupancy</Label>
              <Select value={occupancy} onValueChange={setOccupancy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unoccupied">Unoccupied</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background NC (HVAC Off)</Label>
              <Input
                type="number"
                placeholder="e.g., 25"
                value={backgroundNC}
                onChange={(e) => setBackgroundNC(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipment Used</Label>
              <Input
                placeholder="e.g., Extech SL130"
                value={equipmentUsed}
                onChange={(e) => setEquipmentUsed(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Measurement Positions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Measurement Positions</Label>
              <Badge variant="outline">{validReadings.length} readings</Badge>
            </div>
            
            <div className="space-y-2">
              {positions.map((pos, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={pos.position}
                    onValueChange={(v) => updatePosition(index, 'position', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                      <SelectItem value={pos.position}>{pos.position}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      type="number"
                      className="w-24 pr-8"
                      placeholder="NC"
                      value={pos.nc_reading || ''}
                      onChange={(e) => updatePosition(index, 'nc_reading', e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      NC
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePosition(index)}
                    disabled={positions.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={addPosition}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Technician Notes</Label>
            <Textarea
              placeholder="Any observations, issues, or recommendations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={validReadings.length === 0}>
            Save Measurements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
