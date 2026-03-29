import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database, Volume2 } from 'lucide-react';
import {
  EQUIPMENT_SOUND_POWER_DATABASE,
  getEquipmentByCategory,
  adjustSoundPowerForCapacity,
  EquipmentSoundPowerEntry,
} from '@/lib/equipment-sound-power-data';
import { OctaveBandData, OCTAVE_BAND_FREQUENCIES } from '@/lib/nc-reference-curves';

type EquipmentCategory = EquipmentSoundPowerEntry['category'];

export interface EquipmentSoundPowerSelectorProps {
  onSelect: (levels: OctaveBandData, equipmentName: string) => void;
  trigger?: React.ReactNode;
}

const CATEGORY_OPTIONS: { value: EquipmentCategory; label: string }[] = [
  { value: 'ahu', label: 'Air Handling Units' },
  { value: 'chiller', label: 'Chillers' },
  { value: 'pump', label: 'Pumps' },
  { value: 'fan', label: 'Fans' },
  { value: 'vav', label: 'VAV Boxes' },
  { value: 'fcu', label: 'Fan Coil Units' },
  { value: 'cooling_tower', label: 'Cooling Towers' },
  { value: 'boiler', label: 'Boilers' },
];

export const EquipmentSoundPowerSelector: React.FC<EquipmentSoundPowerSelectorProps> = ({ onSelect, trigger }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<EquipmentCategory>('ahu');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSoundPowerEntry | null>(null);
  const [capacityValue, setCapacityValue] = useState<number>(50);

  const equipmentList = useMemo(() => getEquipmentByCategory(category), [category]);

  const adjustedLevels = useMemo(() => {
    if (!selectedEquipment) return null;
    return adjustSoundPowerForCapacity(selectedEquipment, capacityValue);
  }, [selectedEquipment, capacityValue]);

  const handleCategoryChange = (newCategory: EquipmentCategory) => {
    setCategory(newCategory);
    setSelectedEquipment(null);
  };

  const handleEquipmentSelect = (equipmentId: string) => {
    const equipment = equipmentList.find((eq) => eq.id === equipmentId);
    if (equipment) {
      setSelectedEquipment(equipment);
      setCapacityValue((equipment.capacityRange.min + equipment.capacityRange.max) / 2);
    }
  };

  const handleUseSelection = () => {
    if (adjustedLevels && selectedEquipment) {
      onSelect(adjustedLevels, selectedEquipment.name);
      setOpen(false);
    }
  };

  const overallLevel = useMemo(() => {
    if (!adjustedLevels) return 0;
    const sum = Object.values(adjustedLevels).reduce((acc, level) => acc + Math.pow(10, level / 10), 0);
    return 10 * Math.log10(sum);
  }, [adjustedLevels]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Database className="w-4 h-4 mr-2" />Select from Database</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Volume2 className="w-5 h-5" />Equipment Sound Power Database</DialogTitle>
          <DialogDescription>Select HVAC equipment to get typical sound power levels (ASHRAE data)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Equipment Category</Label>
            <Select value={category} onValueChange={(v) => handleCategoryChange(v as EquipmentCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Equipment</Label>
            <Select value={selectedEquipment?.id || ''} onValueChange={handleEquipmentSelect}>
              <SelectTrigger><SelectValue placeholder="Choose equipment..." /></SelectTrigger>
              <SelectContent>
                {equipmentList.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.capacityRange.min}-{eq.capacityRange.max} {eq.capacityRange.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEquipment && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Capacity Adjustment</Label>
                <span className="text-sm text-muted-foreground">{capacityValue.toFixed(0)} {selectedEquipment.capacityRange.unit}</span>
              </div>
              <Slider
                value={[capacityValue]}
                onValueChange={(v) => setCapacityValue(v[0])}
                min={selectedEquipment.capacityRange.min}
                max={selectedEquipment.capacityRange.max}
                step={(selectedEquipment.capacityRange.max - selectedEquipment.capacityRange.min) / 100}
              />
            </div>
          )}

          {adjustedLevels && selectedEquipment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedEquipment.name}</CardTitle>
                  <Badge variant="secondary">Overall: {overallLevel.toFixed(0)} dB</Badge>
                </div>
                <CardDescription>Source: {selectedEquipment.source}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {OCTAVE_BAND_FREQUENCIES.map((freq) => <TableHead key={freq} className="text-center text-xs">{freq}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {OCTAVE_BAND_FREQUENCIES.map((freq) => <TableCell key={freq} className="text-center font-medium">{adjustedLevels[freq].toFixed(0)}</TableCell>)}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleUseSelection} disabled={!adjustedLevels}>Use These Levels</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentSoundPowerSelector;
