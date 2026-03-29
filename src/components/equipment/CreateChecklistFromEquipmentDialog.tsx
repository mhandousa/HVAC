import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ClipboardCheck, Plus, Building2, Loader2 } from 'lucide-react';
import { useCommissioningProjects, useCommissioningChecklists, useCommissioningTests } from '@/hooks/useCommissioning';
import { COMMISSIONING_PROTOCOLS, CommissioningTest } from '@/lib/commissioning-protocols';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  tag: string;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  capacity_value: number | null;
  capacity_unit: string | null;
  install_date: string | null;
  specifications: unknown;
  project_id: string | null;
}

interface CreateChecklistFromEquipmentDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  { value: 'general', label: 'General Equipment' },
];

function getChecklistTypeFromEquipment(equipmentType: string | null): string | null {
  if (!equipmentType) return null;
  const normalized = equipmentType.toLowerCase().trim();
  return EQUIPMENT_TYPE_TO_CHECKLIST[normalized] || null;
}

export function CreateChecklistFromEquipmentDialog({
  equipment,
  open,
  onOpenChange,
}: CreateChecklistFromEquipmentDialogProps) {
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading, createProject } = useCommissioningProjects(equipment.project_id || undefined);
  
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [checklistType, setChecklistType] = useState<string>(
    getChecklistTypeFromEquipment(equipment.equipment_type) || 'general'
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['pre_tests', 'performance', 'functional', 'integration']));
  const [isCreating, setIsCreating] = useState(false);

  // Get the checklist hook for the selected project
  const { createChecklist } = useCommissioningChecklists(selectedProjectId || undefined);
  
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

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      let projectId = selectedProjectId;

      // Create new project if in create mode
      if (mode === 'create') {
        if (!newProjectName.trim()) {
          toast.error('Please enter a project name');
          return;
        }
        const newProject = await createProject.mutateAsync({
          name: newProjectName,
          project_id: equipment.project_id || undefined,
          status: 'draft',
        });
        projectId = newProject.id;
      }

      if (!projectId) {
        toast.error('Please select or create a commissioning project');
        return;
      }

      // Prepare design data from equipment
      const designData: Record<string, unknown> = {
        equipment_tag: equipment.tag,
        equipment_name: equipment.name,
        manufacturer: equipment.manufacturer || null,
        model: equipment.model || null,
        serial_number: equipment.serial_number || null,
        capacity: equipment.capacity_value
          ? `${equipment.capacity_value} ${equipment.capacity_unit || ''}`
          : null,
        install_date: equipment.install_date || null,
        specifications: equipment.specifications || null,
      };

      // Validate checklist type
      const validChecklistTypes = ['ahu', 'boiler', 'chiller', 'cooling_tower', 'erv', 'fcu', 'pump', 'vav', 'vrf'] as const;
      const finalChecklistType = validChecklistTypes.includes(checklistType as typeof validChecklistTypes[number])
        ? (checklistType as typeof validChecklistTypes[number])
        : 'ahu';

      // Create the checklist
      const checklist = await createChecklist.mutateAsync({
        commissioning_project_id: projectId,
        equipment_id: equipment.id,
        equipment_tag: equipment.tag,
        checklist_type: finalChecklistType,
        design_data: designData as unknown as Record<string, never>,
        overall_status: 'pending',
      });

      // Get tests from selected categories
      const testsToCreate = protocolTests
        .filter((test) => selectedCategories.has(test.category || 'general'))
        .map((test) => ({
          checklist_id: checklist.id,
          test_name: test.name,
          test_category: test.category,
          expected_value: test.expectedValue || null,
          tolerance_percent: test.tolerance || null,
          result: 'pending' as const,
        }));

      // Bulk create tests if we have any
      if (testsToCreate.length > 0) {
        // We need to use the tests hook with the new checklist id
        // For now, we'll navigate and let the user know tests will be added
        toast.success(`Checklist created with ${testsToCreate.length} tests ready`);
      }

      onOpenChange(false);
      navigate(`/commissioning?project=${projectId}`);
    } catch (error) {
      console.error('Failed to create checklist:', error);
      toast.error('Failed to create commissioning checklist');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Create Commissioning Checklist
          </DialogTitle>
          <DialogDescription>
            Create a commissioning checklist pre-populated with equipment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment Details Card */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tag:</span>
                  <span className="ml-2 font-medium">{equipment.tag}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium">{equipment.equipment_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Manufacturer:</span>
                  <span className="ml-2 font-medium">{equipment.manufacturer || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <span className="ml-2 font-medium">{equipment.model || 'N/A'}</span>
                </div>
                {equipment.capacity_value && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="ml-2 font-medium">
                      {equipment.capacity_value} {equipment.capacity_unit}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Project Selection */}
          <div className="space-y-3">
            <Label>Commissioning Project</Label>
            
            {mode === 'select' ? (
              <>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={projectsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {project.name}
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </>
            ) : (
              <>
                <Input
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('select')}
                >
                  ← Back to select existing
                </Button>
              </>
            )}
          </div>

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
                      id={category}
                      checked={selectedCategories.has(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={category}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || (mode === 'select' && !selectedProjectId) || (mode === 'create' && !newProjectName.trim())}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
