import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Save, 
  Download,
  Zap,
  Building2,
  Settings,
  FileText
} from 'lucide-react';
import { 
  SystemType, 
  ControlParameters, 
  SYSTEM_TYPE_LABELS, 
  OPERATING_MODE_LABELS,
  OperatingMode,
  DEFAULT_CONTROL_PARAMS 
} from '@/lib/soo-templates';
import { 
  useCreateSOO, 
  useSequenceGenerator,
  GeneratedSequence 
} from '@/hooks/useSequenceOfOperations';
import { useProjects } from '@/hooks/useProjects';
import { useZones } from '@/hooks/useZones';
import { SOOControlInputs } from './SOOControlInputs';
import { SOOPreview } from './SOOPreview';
import { SOOExportDialog } from './SOOExportDialog';
import { toast } from 'sonner';

interface SOOWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialProjectId?: string;
}

type WizardStep = 'system' | 'zones' | 'parameters' | 'preview';

export function SOOWizard({ onComplete, onCancel, initialProjectId }: SOOWizardProps) {
  const [step, setStep] = useState<WizardStep>('system');
  const [documentName, setDocumentName] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [systemType, setSystemType] = useState<SystemType>('ahu');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('cooling_only');
  const [equipmentTag, setEquipmentTag] = useState('');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [controlParams, setControlParams] = useState<ControlParameters>({});
  const [generatedSequence, setGeneratedSequence] = useState<GeneratedSequence | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: projects } = useProjects();
  const { data: zones } = useZones();
  const createSOO = useCreateSOO();
  const { generateSOOSequence } = useSequenceGenerator();

  // Filter zones by project
  const projectZones = projectId
    ? zones?.filter(z => {
        // Would need to join through floors/buildings to get project
        return true; // For now, show all zones
      }) || []
    : zones || [];

  // Get zone names for selected IDs
  const selectedZoneNames = selectedZoneIds
    .map(id => zones?.find(z => z.id === id)?.name || '')
    .filter(Boolean);

  // Initialize control params when system type changes
  useEffect(() => {
    setControlParams(DEFAULT_CONTROL_PARAMS[systemType] || {});
  }, [systemType]);

  // Generate sequence when moving to preview
  useEffect(() => {
    if (step === 'preview') {
      const sequence = generateSOOSequence(
        systemType,
        controlParams,
        equipmentTag || documentName,
        selectedZoneNames
      );
      setGeneratedSequence(sequence);
    }
  }, [step, systemType, controlParams, equipmentTag, documentName, selectedZoneNames, generateSOOSequence]);

  const handleNext = () => {
    switch (step) {
      case 'system':
        if (!documentName.trim()) {
          toast.error('Please enter a document name');
          return;
        }
        setStep('zones');
        break;
      case 'zones':
        setStep('parameters');
        break;
      case 'parameters':
        setStep('preview');
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'zones':
        setStep('system');
        break;
      case 'parameters':
        setStep('zones');
        break;
      case 'preview':
        setStep('parameters');
        break;
    }
  };

  const handleSave = async () => {
    try {
      await createSOO.mutateAsync({
        name: documentName,
        project_id: projectId,
        system_type: systemType,
        equipment_ids: [],
        zone_ids: selectedZoneIds,
        operating_mode: operatingMode,
        control_strategy: controlParams,
        equipment_tag: equipmentTag || documentName,
        zone_names: selectedZoneNames,
      });
      toast.success('Document saved successfully');
      onComplete();
    } catch (error) {
      toast.error('Failed to save document');
    }
  };

  const toggleZone = (zoneId: string) => {
    setSelectedZoneIds(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const steps: { key: WizardStep; label: string; icon: React.ElementType }[] = [
    { key: 'system', label: 'System', icon: Zap },
    { key: 'zones', label: 'Zones', icon: Building2 },
    { key: 'parameters', label: 'Parameters', icon: Settings },
    { key: 'preview', label: 'Preview', icon: FileText },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                index === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle>Select System Type</CardTitle>
            <CardDescription>
              Choose the HVAC system type and basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name *</Label>
              <Input
                id="docName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., AHU-1 Sequence of Operations"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentTag">Equipment Tag</Label>
              <Input
                id="equipmentTag"
                value={equipmentTag}
                onChange={(e) => setEquipmentTag(e.target.value)}
                placeholder="e.g., AHU-1, CH-1, VRF-BLDG-A"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select value={projectId || ''} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects?.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operating Mode</Label>
                <Select value={operatingMode} onValueChange={(v) => setOperatingMode(v as OperatingMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATING_MODE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>System Type *</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(Object.entries(SYSTEM_TYPE_LABELS) as [SystemType, string][]).map(([type, label]) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      systemType === type
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSystemType(type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          systemType === type ? 'bg-primary' : 'bg-muted'
                        }`} />
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'zones' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Served Zones</CardTitle>
            <CardDescription>
              Choose the zones that this system serves (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectZones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No zones available</p>
                <p className="text-sm">You can skip this step and add zones later</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {projectZones.map(zone => (
                    <div
                      key={zone.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedZoneIds.includes(zone.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleZone(zone.id)}
                    >
                      <Checkbox
                        checked={selectedZoneIds.includes(zone.id)}
                        onCheckedChange={() => toggleZone(zone.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{zone.name}</p>
                        {zone.zone_type && (
                          <p className="text-sm text-muted-foreground capitalize">
                            {zone.zone_type.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      {zone.area_sqm && (
                        <Badge variant="secondary">
                          {zone.area_sqm.toLocaleString()} m²
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedZoneIds.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected zones ({selectedZoneIds.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedZoneNames.map((name, index) => (
                    <Badge key={index} variant="outline">{name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'parameters' && (
        <Card>
          <CardHeader>
            <CardTitle>Control Parameters</CardTitle>
            <CardDescription>
              Configure setpoints and control settings for {SYSTEM_TYPE_LABELS[systemType]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SOOControlInputs
              systemType={systemType}
              params={controlParams}
              onChange={setControlParams}
            />
          </CardContent>
        </Card>
      )}

      {step === 'preview' && generatedSequence && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{documentName}</h3>
              <p className="text-sm text-muted-foreground">
                {SYSTEM_TYPE_LABELS[systemType]} • {equipmentTag || 'No tag'}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <SOOPreview sequence={generatedSequence} />

          <SOOExportDialog
            open={showExport}
            onOpenChange={setShowExport}
            sequence={generatedSequence}
            documentName={documentName}
            systemType={SYSTEM_TYPE_LABELS[systemType]}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={step === 'system' ? onCancel : handleBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          {step === 'system' ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex gap-2">
          {step === 'preview' ? (
            <Button onClick={handleSave} disabled={createSOO.isPending}>
              {createSOO.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Document
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
