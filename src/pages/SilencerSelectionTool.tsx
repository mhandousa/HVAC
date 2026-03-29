import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  VolumeX,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import { FrequencyBandRequirementsInput } from '@/components/acoustic/FrequencyBandRequirementsInput';
import { SilencerFrequencyMatchCard } from '@/components/acoustic/SilencerFrequencyMatchCard';
import {
  FrequencyBandRequirements,
  SilencerFilterCriteria,
  SilencerMatch,
  findMatchingSilencers,
  getDefaultRequirements,
  ncGapToFrequencyRequirements,
  generateSilencerSpec,
} from '@/lib/silencer-frequency-matching';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';

const SILENCER_MANUFACTURERS = ['Price Industries', 'Vibro-Acoustics', 'McGill AirFlow', 'Ruskin', 'Trane'];
import { toast } from 'sonner';

export default function SilencerSelectionTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const projectId = searchParams.get('project') || storedProjectId;
  
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  // Get initial values from URL params (when coming from remediation panel)
  const initialAttenuation = parseInt(searchParams.get('attenuation') || '10');
  const initialCurrentNC = parseInt(searchParams.get('currentNC') || '0');
  const initialTargetNC = parseInt(searchParams.get('targetNC') || '0');
  
  // Frequency band requirements
  const [requirements, setRequirements] = useState<FrequencyBandRequirements>(() => {
    if (initialCurrentNC && initialTargetNC) {
      return ncGapToFrequencyRequirements(initialCurrentNC, initialTargetNC);
    }
    return getDefaultRequirements(initialAttenuation);
  });
  
  // Physical criteria
  const [ductType, setDuctType] = useState<'round' | 'rectangular' | ''>('');
  const [ductSize, setDuctSize] = useState<string>('');
  const [maxLength, setMaxLength] = useState<string>('');
  const [maxPressureDrop, setMaxPressureDrop] = useState<string>('');
  
  // Preference criteria
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [maxCost, setMaxCost] = useState<'$' | '$$' | '$$$' | '$$$$' | ''>('');
  const [application, setApplication] = useState<string>('');
  const [availability, setAvailability] = useState<string>('');
  
  // Results
  const [selectedSilencer, setSelectedSilencer] = useState<SilencerMatch | null>(null);
  const [showSpecDialog, setShowSpecDialog] = useState(false);
  const [specText, setSpecText] = useState('');
  
  // Build filter criteria
  const criteria: SilencerFilterCriteria = useMemo(() => ({
    ductType: ductType || undefined,
    minDiameter: ductSize ? parseInt(ductSize) - 2 : undefined,
    maxDiameter: ductSize ? parseInt(ductSize) + 2 : undefined,
    maxLength: maxLength ? parseInt(maxLength) : undefined,
    maxPressureDrop: maxPressureDrop ? parseFloat(maxPressureDrop) : undefined,
    manufacturers: selectedManufacturers.length > 0 ? selectedManufacturers : undefined,
    maxCost: maxCost || undefined,
    application: application as any || undefined,
    availability: availability as any || undefined,
  }), [ductType, ductSize, maxLength, maxPressureDrop, selectedManufacturers, maxCost, application, availability]);
  
  // Find matching silencers
  const matches = useMemo(() => {
    return findMatchingSilencers(requirements, criteria, 40);
  }, [requirements, criteria]);
  
  const handleManufacturerToggle = (manufacturer: string) => {
    setSelectedManufacturers(prev => 
      prev.includes(manufacturer)
        ? prev.filter(m => m !== manufacturer)
        : [...prev, manufacturer]
    );
  };
  
  const handleViewSpec = (match: SilencerMatch) => {
    const spec = generateSilencerSpec(match.silencer, match);
    setSpecText(spec);
    setShowSpecDialog(true);
  };
  
  const handleCopySpec = () => {
    navigator.clipboard.writeText(specText);
    toast.success('Specification copied to clipboard');
  };
  
  const handleDownloadSpec = () => {
    const blob = new Blob([specText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silencer-spec-${selectedSilencer?.silencer.model || 'selection'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Specification downloaded');
  };
  
  // Count how many meet all requirements
  const perfectMatches = matches.filter(m => m.meetsAllBands).length;
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <VolumeX className="h-6 w-6" />
              Silencer Selection Tool
            </h1>
            <p className="text-muted-foreground">
              Find silencers based on frequency-specific attenuation requirements
            </p>
          </div>
        </div>
        
        <ToolPageHeader
          toolType="silencer-selection"
          toolName="Silencer Selection Tool"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Criteria */}
          <div className="space-y-4">
            {/* Frequency Requirements */}
            <FrequencyBandRequirementsInput
              requirements={requirements}
              onRequirementsChange={setRequirements}
              currentNC={initialCurrentNC || undefined}
              targetNC={initialTargetNC || undefined}
            />
            
            {/* Physical Requirements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Physical Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Duct Type</Label>
                    <Select value={ductType} onValueChange={(v: any) => setDuctType(v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="rectangular">Rectangular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Duct Size (in)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 12"
                      value={ductSize}
                      onChange={(e) => setDuctSize(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Max Length (in)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Max Δp (in w.g.)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 0.5"
                      value={maxPressureDrop}
                      onChange={(e) => setMaxPressureDrop(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-xs">Application</Label>
                  <Select value={application} onValueChange={setApplication}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="supply">Supply</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="exhaust">Exhaust</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Manufacturers */}
                <div className="space-y-2">
                  <Label className="text-xs">Manufacturers</Label>
                  <div className="flex flex-wrap gap-1">
                    {SILENCER_MANUFACTURERS.map(mfr => (
                      <Badge
                        key={mfr}
                        variant={selectedManufacturers.includes(mfr) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => handleManufacturerToggle(mfr)}
                      >
                        {mfr}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Max Budget</Label>
                    <Select value={maxCost} onValueChange={(v: any) => setMaxCost(v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="$">$ (Economy)</SelectItem>
                        <SelectItem value="$$">$$ (Standard)</SelectItem>
                        <SelectItem value="$$$">$$$ (Premium)</SelectItem>
                        <SelectItem value="$$$$">$$$$ (High-end)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Availability</Label>
                    <Select value={availability} onValueChange={setAvailability}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="in-stock">In Stock Only</SelectItem>
                        <SelectItem value="regional">Regional + In Stock</SelectItem>
                        <SelectItem value="import">All (incl. Import)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Results Summary */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-bold">{matches.length}</span>
                      <span className="text-muted-foreground ml-2">matching silencers</span>
                    </div>
                    {perfectMatches > 0 && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {perfectMatches} meet all bands
                      </Badge>
                    )}
                  </div>
                  {selectedSilencer && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Selected:</span>
                      <Badge variant="secondary">{selectedSilencer.silencer.model}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Results List */}
            {matches.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="grid gap-4 md:grid-cols-2 pr-4">
                  {matches.map((match, index) => (
                    <SilencerFrequencyMatchCard
                      key={match.silencer.id}
                      match={match}
                      rank={index + 1}
                      isSelected={selectedSilencer?.silencer.id === match.silencer.id}
                      onSelect={() => setSelectedSilencer(match)}
                      onViewSpec={() => handleViewSpec(match)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Matching Silencers</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No silencers in the database match your criteria. Try relaxing the physical 
                    constraints or lowering the attenuation requirements.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Specification Dialog */}
        <Dialog open={showSpecDialog} onOpenChange={setShowSpecDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Silencer Specification</DialogTitle>
              <DialogDescription>
                Generated specification for the selected silencer
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] mt-4">
              <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {specText}
              </pre>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCopySpec}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={handleDownloadSpec}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/silencer-selection"
          projectId={projectId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
