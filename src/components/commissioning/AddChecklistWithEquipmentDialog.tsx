import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardCheck, 
  Search, 
  Loader2, 
  Package,
  ArrowRight,
} from 'lucide-react';
import { useEquipment, Equipment } from '@/hooks/useEquipment';
import { useCommissioningChecklists } from '@/hooks/useCommissioning';
import { COMMISSIONING_PROTOCOLS, CommissioningTest } from '@/lib/commissioning-protocols';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddChecklistWithEquipmentDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EQUIPMENT_TYPE_TO_CHECKLIST: Record<string, string> = {
  'erv': 'erv',
  'hrv': 'erv',
  'energy recovery ventilator': 'erv',
  'heat recovery ventilator': 'erv',
  'ahu': 'ahu',
  'air handling unit': 'ahu',
  'air handler': 'ahu',
  'chiller': 'chiller',
  'water-cooled chiller': 'chiller',
  'air-cooled chiller': 'chiller',
  'fcu': 'fcu',
  'fan coil': 'fcu',
  'fan coil unit': 'fcu',
  'vav': 'vav',
  'variable air volume': 'vav',
  'vrf': 'vrf',
  'vrv': 'vrf',
  'pump': 'pump',
  'chilled water pump': 'pump',
  'condenser pump': 'pump',
  'cooling tower': 'cooling_tower',
  'boiler': 'boiler',
  'split': 'split_system',
  'split system': 'split_system',
  'package unit': 'package_unit',
  'rooftop unit': 'package_unit',
  'rtu': 'package_unit',
};

const CHECKLIST_TYPE_OPTIONS = [
  { value: 'ahu', label: 'Air Handling Unit (AHU)' },
  { value: 'erv', label: 'Energy Recovery Ventilator (ERV)' },
  { value: 'chiller', label: 'Chiller' },
  { value: 'fcu', label: 'Fan Coil Unit (FCU)' },
  { value: 'vav', label: 'Variable Air Volume (VAV)' },
  { value: 'vrf', label: 'VRF/VRV System' },
  { value: 'pump', label: 'Pump' },
  { value: 'cooling_tower', label: 'Cooling Tower' },
  { value: 'boiler', label: 'Boiler' },
  { value: 'split_system', label: 'Split System' },
  { value: 'package_unit', label: 'Package Unit / RTU' },
  { value: 'acoustic', label: 'Zone Acoustic Verification' },
  { value: 'general', label: 'General Equipment' },
];

function getChecklistTypeFromEquipment(equipmentType: string | null): string | null {
  if (!equipmentType) return null;
  const normalized = equipmentType.toLowerCase().trim();
  return EQUIPMENT_TYPE_TO_CHECKLIST[normalized] || null;
}

export function AddChecklistWithEquipmentDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: AddChecklistWithEquipmentDialogProps) {
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipment();
  const { createChecklist } = useCommissioningChecklists(projectId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [skipEquipment, setSkipEquipment] = useState(false);
  const [checklistType, setChecklistType] = useState<string>('general');
  const [equipmentTag, setEquipmentTag] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['pre_tests', 'performance', 'functional', 'integration'])
  );
  const [isCreating, setIsCreating] = useState(false);

  // Filter equipment based on search query
  const filteredEquipment = useMemo(() => {
    if (!searchQuery.trim()) return equipment;
    const query = searchQuery.toLowerCase();
    return equipment.filter(
      (eq) =>
        eq.tag.toLowerCase().includes(query) ||
        eq.name.toLowerCase().includes(query) ||
        eq.equipment_type?.toLowerCase().includes(query) ||
        eq.manufacturer?.toLowerCase().includes(query) ||
        eq.model?.toLowerCase().includes(query)
    );
  }, [equipment, searchQuery]);

  // Get protocol tests for the selected checklist type
  const protocolTests = useMemo(() => {
    const protocol = COMMISSIONING_PROTOCOLS[checklistType as keyof typeof COMMISSIONING_PROTOCOLS];
    if (!protocol) return [];
    return protocol.tests || [];
  }, [checklistType]);

  // Group tests by category
  const testsByCategory = useMemo(() => {
    const grouped: Record<string, CommissioningTest[]> = {};
    protocolTests.forEach((test) => {
      const category = test.category || 'general';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(test);
    });
    return grouped;
  }, [protocolTests]);

  const categoryLabels: Record<string, string> = {
    pre_tests: 'Pre-Tests',
    performance: 'Performance Tests',
    functional: 'Functional Tests',
    integration: 'Integration Tests',
    safety: 'Safety Tests',
    general: 'General Tests',
  };

  const toggleCategory = (category: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedCategories(newSet);
  };

  const handleSelectEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setSkipEquipment(false);
    setEquipmentTag(eq.tag);
    
    // Auto-detect checklist type
    const detectedType = getChecklistTypeFromEquipment(eq.equipment_type);
    if (detectedType) {
      setChecklistType(detectedType);
    }
  };

  const handleSkipEquipment = () => {
    setSelectedEquipment(null);
    setSkipEquipment(true);
    setEquipmentTag('');
    setChecklistType('general');
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      // Validate
      if (!skipEquipment && !selectedEquipment) {
        toast.error('Please select equipment or skip to create without equipment');
        return;
      }

      if (skipEquipment && !equipmentTag.trim()) {
        toast.error('Please enter an equipment tag');
        return;
      }

      // Prepare design data from equipment
      const designData: Record<string, unknown> = selectedEquipment
        ? {
            equipment_tag: selectedEquipment.tag,
            equipment_name: selectedEquipment.name,
            manufacturer: selectedEquipment.manufacturer || null,
            model: selectedEquipment.model || null,
            serial_number: selectedEquipment.serial_number || null,
            capacity: selectedEquipment.capacity_value
              ? `${selectedEquipment.capacity_value} ${selectedEquipment.capacity_unit || ''}`
              : null,
            install_date: selectedEquipment.install_date || null,
            specifications: selectedEquipment.specifications || null,
          }
        : {
            equipment_tag: equipmentTag,
          };

      // Validate checklist type
      const validChecklistTypes = ['ahu', 'boiler', 'chiller', 'cooling_tower', 'erv', 'fcu', 'pump', 'vav', 'vrf'] as const;
      const finalChecklistType = validChecklistTypes.includes(checklistType as typeof validChecklistTypes[number])
        ? (checklistType as typeof validChecklistTypes[number])
        : 'ahu';

      // Create the checklist
      await createChecklist.mutateAsync({
        commissioning_project_id: projectId,
        equipment_id: selectedEquipment?.id || null,
        equipment_tag: selectedEquipment?.tag || equipmentTag,
        checklist_type: finalChecklistType,
        design_data: designData as unknown as Record<string, never>,
        overall_status: 'pending',
      });

      // Count tests that would be created
      const testsCount = protocolTests.filter((test) =>
        selectedCategories.has(test.category || 'general')
      ).length;

      toast.success(
        `Checklist created${testsCount > 0 ? ` with ${testsCount} protocol tests ready` : ''}`
      );

      // Reset state
      setSelectedEquipment(null);
      setSkipEquipment(false);
      setSearchQuery('');
      setEquipmentTag('');
      setChecklistType('general');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create checklist:', error);
      toast.error('Failed to create commissioning checklist');
    } finally {
      setIsCreating(false);
    }
  };

  const showChecklistConfig = selectedEquipment || skipEquipment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Add Commissioning Checklist
          </DialogTitle>
          <DialogDescription>
            Select equipment to link or create a checklist without equipment
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {!showChecklistConfig ? (
            /* Step 1: Equipment Selection */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link to Equipment (Optional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tag, name, type, manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                {equipmentLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEquipment.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Package className="h-10 w-10 mb-2" />
                    <p>{searchQuery ? 'No equipment found' : 'No equipment in system'}</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredEquipment.map((eq) => (
                      <Card
                        key={eq.id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-accent',
                          selectedEquipment?.id === eq.id && 'ring-2 ring-primary bg-accent'
                        )}
                        onClick={() => handleSelectEquipment(eq)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{eq.tag}</span>
                                {eq.equipment_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {eq.equipment_type}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {[eq.manufacturer, eq.model].filter(Boolean).join(' • ') || eq.name}
                              </p>
                            </div>
                            {eq.capacity_value && (
                              <Badge variant="secondary">
                                {eq.capacity_value} {eq.capacity_unit}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleSkipEquipment}
              >
                Skip - Create without equipment link
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            /* Step 2: Checklist Configuration */
            <div className="space-y-4">
              {/* Selected Equipment Summary */}
              {selectedEquipment && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{selectedEquipment.tag}</span>
                          {selectedEquipment.equipment_type && (
                            <Badge variant="outline">{selectedEquipment.equipment_type}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {[selectedEquipment.manufacturer, selectedEquipment.model]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEquipment(null);
                          setSkipEquipment(false);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manual Tag Entry (when skipped) */}
              {skipEquipment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Equipment Tag</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSkipEquipment(false)}
                    >
                      ← Select Equipment
                    </Button>
                  </div>
                  <Input
                    placeholder="Enter equipment tag (e.g., AHU-01)"
                    value={equipmentTag}
                    onChange={(e) => setEquipmentTag(e.target.value)}
                  />
                </div>
              )}

              <Separator />

              {/* Checklist Type Selection */}
              <div className="space-y-2">
                <Label>Checklist Type</Label>
                <Select value={checklistType} onValueChange={setChecklistType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Protocol Test Categories */}
              {Object.keys(testsByCategory).length > 0 && (
                <div className="space-y-2">
                  <Label>Protocol Tests</Label>
                  <div className="space-y-2 rounded-md border p-3">
                    {Object.entries(testsByCategory).map(([category, tests]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.has(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <label
                          htmlFor={`cat-${category}`}
                          className="flex-1 text-sm font-medium leading-none cursor-pointer"
                        >
                          {categoryLabels[category] || category}
                        </label>
                        <Badge variant="secondary" className="text-xs">
                          {tests.length} tests
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showChecklistConfig && (
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                (!selectedEquipment && !equipmentTag.trim())
              }
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Checklist
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
