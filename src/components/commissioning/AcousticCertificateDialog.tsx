import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  User, 
  Settings2,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAcousticCommissioningCertificate, AcousticCertificateOptions, AcousticCertificateSignatory } from '@/hooks/useAcousticCommissioningCertificate';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CommissioningProject = Tables<'commissioning_projects'>;
type CommissioningChecklist = Tables<'commissioning_checklists'>;

interface AcousticCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: CommissioningProject;
  checklists: CommissioningChecklist[];
}

export function AcousticCertificateDialog({
  open,
  onOpenChange,
  project,
  checklists,
}: AcousticCertificateDialogProps) {
  const { downloadCertificate, previewCertificate } = useAcousticCommissioningCertificate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filter to acoustic checklists
  const acousticChecklists = checklists.filter(c => {
    const designData = c.design_data as any;
    return designData?.target_nc !== undefined;
  });

  // Calculate stats
  const stats = acousticChecklists.reduce((acc, c) => {
    const installedData = c.installed_data as any;
    const designData = c.design_data as any;
    const targetNC = designData?.target_nc ?? 40;
    const measuredNC = installedData?.measured_nc;
    
    if (measuredNC === undefined) {
      acc.pending++;
    } else {
      const delta = measuredNC - targetNC;
      if (delta <= 0) acc.pass++;
      else if (delta <= 5) acc.marginal++;
      else acc.fail++;
    }
    return acc;
  }, { pass: 0, marginal: 0, fail: 0, pending: 0 });

  // Form state
  const [certificateType, setCertificateType] = useState<'preliminary' | 'final' | 'conditional'>('final');
  const [certificateNumber, setCertificateNumber] = useState(`AC-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  
  const [includeSections, setIncludeSections] = useState({
    zoneComplianceSummary: true,
    measurementDetails: true,
    terminalUnitBreakdown: false,
    photoDocumentation: true,
    octaveBandData: false,
    remediationHistory: false,
  });

  const [acousticalEngineer, setAcousticalEngineer] = useState<AcousticCertificateSignatory>({
    name: '',
    title: 'Acoustical Engineer',
    date: format(new Date(), 'yyyy-MM-dd'),
    company: '',
    license: '',
  });

  const [commissioningAgent, setCommissioningAgent] = useState<AcousticCertificateSignatory>({
    name: '',
    title: 'Commissioning Agent',
    date: format(new Date(), 'yyyy-MM-dd'),
    company: '',
  });

  const [includeOwner, setIncludeOwner] = useState(false);
  const [owner, setOwner] = useState<AcousticCertificateSignatory>({
    name: '',
    title: 'Owner Representative',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [referenceStandard, setReferenceStandard] = useState('ASHRAE Handbook / Saudi Building Code');

  const addCondition = () => {
    if (newCondition.trim()) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const buildOptions = (): AcousticCertificateOptions => ({
    certificateType,
    certificateNumber,
    includeSections,
    maxPhotosPerZone: 2,
    signatories: {
      acousticalEngineer,
      commissioningAgent,
      owner: includeOwner ? owner : undefined,
    },
    conditions,
    referenceStandard,
  });

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const url = await previewCertificate(project, acousticChecklists, buildOptions());
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const filename = await downloadCertificate(project, acousticChecklists, buildOptions());
      toast.success(`Certificate downloaded: ${filename}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Acoustic Commissioning Certificate
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">{acousticChecklists.length}</p>
            <p className="text-xs text-muted-foreground">Total Zones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.pass}</p>
            <p className="text-xs text-green-700">Pass</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.marginal}</p>
            <p className="text-xs text-yellow-700">Marginal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{stats.fail}</p>
            <p className="text-xs text-red-700">Fail</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Settings2 className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="signatories">
              <User className="h-4 w-4 mr-2" />
              Signatories
            </TabsTrigger>
            <TabsTrigger value="conditions" disabled={certificateType !== 'conditional'}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conditions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <Select value={certificateType} onValueChange={(v) => setCertificateType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preliminary">Preliminary</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Certificate Number</Label>
                <Input 
                  value={certificateNumber} 
                  onChange={(e) => setCertificateNumber(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference Standard</Label>
              <Input 
                value={referenceStandard} 
                onChange={(e) => setReferenceStandard(e.target.value)} 
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Include Sections</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({
                  zoneComplianceSummary: 'Zone Compliance Summary',
                  measurementDetails: 'Measurement Position Details',
                  terminalUnitBreakdown: 'Terminal Unit Breakdown',
                  photoDocumentation: 'Photo Documentation',
                  octaveBandData: 'Octave Band Data',
                  remediationHistory: 'Remediation History',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={includeSections[key as keyof typeof includeSections]}
                      onCheckedChange={(checked) => 
                        setIncludeSections({ ...includeSections, [key]: !!checked })
                      }
                    />
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signatories" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Acoustical Engineer</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input 
                    value={acousticalEngineer.name}
                    onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input 
                    value={acousticalEngineer.title}
                    onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company</Label>
                  <Input 
                    value={acousticalEngineer.company}
                    onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, company: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">License No.</Label>
                  <Input 
                    value={acousticalEngineer.license}
                    onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, license: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Commissioning Agent</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input 
                    value={commissioningAgent.name}
                    onChange={(e) => setCommissioningAgent({ ...commissioningAgent, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input 
                    value={commissioningAgent.title}
                    onChange={(e) => setCommissioningAgent({ ...commissioningAgent, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Company</Label>
                  <Input 
                    value={commissioningAgent.company}
                    onChange={(e) => setCommissioningAgent({ ...commissioningAgent, company: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-owner"
                checked={includeOwner}
                onCheckedChange={(checked) => setIncludeOwner(!!checked)}
              />
              <Label htmlFor="include-owner" className="cursor-pointer">
                Include Owner Representative Signature
              </Label>
            </div>

            {includeOwner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Owner Representative</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input 
                      value={owner.name}
                      onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      value={owner.title}
                      onChange={(e) => setOwner({ ...owner, title: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Add conditions or exceptions that must be resolved for full certification.
            </p>

            <div className="flex gap-2">
              <Textarea
                placeholder="Enter a condition or exception..."
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="min-h-[60px]"
              />
              <Button onClick={addCondition} size="icon" className="h-auto">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {conditions.length > 0 && (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 shrink-0">
                      {index + 1}
                    </Badge>
                    <p className="text-sm flex-1">{condition}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4">
            <Label>Preview</Label>
            <iframe 
              src={previewUrl} 
              className="w-full h-[300px] border rounded-lg mt-2"
              title="Certificate Preview"
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={isGenerating}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating || acousticChecklists.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download Certificate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
