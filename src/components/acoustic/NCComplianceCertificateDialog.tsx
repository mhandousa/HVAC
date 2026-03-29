import { useState, useMemo, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  User,
  Building,
  Calendar,
  Image,
} from 'lucide-react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import {
  useNCComplianceCertificate,
  NCComplianceCertificateOptions,
  SignatoryInfo,
  generateCertificateNumber,
} from '@/hooks/useNCComplianceCertificate';
import { CompanyLogoUpload } from './CompanyLogoUpload';
import { getLogoDataUrl } from '@/lib/company-branding';

interface NCComplianceCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: ZoneAcousticData[];
  projectName?: string;
  buildingName?: string;
  floorName?: string;
}

export function NCComplianceCertificateDialog({
  open,
  onOpenChange,
  zones,
  projectName = 'Untitled Project',
  buildingName,
  floorName,
}: NCComplianceCertificateDialogProps) {
  const { downloadCertificate, previewCertificate } = useNCComplianceCertificate();
  
  // Filter compliant zones
  const compliantZones = useMemo(
    () => zones.filter(z => z.status === 'acceptable'),
    [zones]
  );

  // Form state
  const [certificateType, setCertificateType] = useState<'design' | 'preliminary' | 'final'>('design');
  const [certificateNumber, setCertificateNumber] = useState(generateCertificateNumber());
  const [referenceStandard, setReferenceStandard] = useState('ASHRAE Handbook / Saudi Building Code');
  const [includeTerminalDetails, setIncludeTerminalDetails] = useState(true);
  const [includeOctaveBandEstimate, setIncludeOctaveBandEstimate] = useState(false);
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Signatory state
  const [hvacEngineer, setHvacEngineer] = useState<SignatoryInfo>({
    name: '',
    title: 'HVAC Design Engineer',
    company: '',
  });
  const [acousticalEngineer, setAcousticalEngineer] = useState<SignatoryInfo>({
    name: '',
    title: 'Acoustical Consultant',
    company: '',
    license: '',
  });

  // Logo state
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Load existing logo on mount
  useEffect(() => {
    const existingLogo = getLogoDataUrl();
    if (existingLogo) {
      setCompanyLogo(existingLogo);
    }
  }, []);

  // Regenerate certificate number when dialog opens
  useEffect(() => {
    if (open) {
      setCertificateNumber(generateCertificateNumber());
    }
  }, [open]);

  const buildOptions = (): NCComplianceCertificateOptions => ({
    certificateType,
    certificateNumber,
    projectName,
    buildingName,
    floorName,
    referenceStandard,
    includeTerminalDetails,
    includeOctaveBandEstimate,
    signatories: {
      hvacEngineer: hvacEngineer.name ? hvacEngineer : undefined,
      acousticalEngineer: acousticalEngineer.name ? acousticalEngineer : undefined,
    },
    notes: notes || undefined,
    issueDate: new Date(issueDate),
    companyLogo,
  });

  const handlePreview = () => {
    const url = previewCertificate(compliantZones, buildOptions());
    setPreviewUrl(url);
    setActiveTab('preview');
  };

  const handleDownload = () => {
    downloadCertificate(compliantZones, buildOptions());
  };

  const hasCompliantZones = compliantZones.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            NC Compliance Certificate Generator
          </DialogTitle>
        </DialogHeader>

        {!hasCompliantZones ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Compliant Zones Available</h3>
            <p className="text-muted-foreground max-w-md">
              There are no zones that meet their NC targets. Compliance certificates can only 
              be generated for zones with "Acceptable" acoustic status.
            </p>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="signatories">Signatories</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="general" className="mt-0 space-y-4">
                  {/* Summary Badge */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">
                        {compliantZones.length} zone{compliantZones.length !== 1 ? 's' : ''} meeting NC targets
                      </span>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      100% Compliant
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Certificate Type */}
                    <div className="space-y-2">
                      <Label>Certificate Type</Label>
                      <Select value={certificateType} onValueChange={(v) => setCertificateType(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="design">Design Phase Verification</SelectItem>
                          <SelectItem value="preliminary">Preliminary Assessment</SelectItem>
                          <SelectItem value="final">Final Compliance Certification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Certificate Number */}
                    <div className="space-y-2">
                      <Label>Certificate Number</Label>
                      <Input
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        placeholder="NC-2026-0001"
                      />
                    </div>

                    {/* Issue Date */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Issue Date
                      </Label>
                      <Input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                      />
                    </div>

                    {/* Reference Standard */}
                    <div className="space-y-2">
                      <Label>Reference Standard</Label>
                      <Input
                        value={referenceStandard}
                        onChange={(e) => setReferenceStandard(e.target.value)}
                        placeholder="ASHRAE Handbook / Saudi Building Code"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Optional Sections */}
                  <div className="space-y-3">
                    <Label>Optional Sections</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeTerminal"
                          checked={includeTerminalDetails}
                          onCheckedChange={(c) => setIncludeTerminalDetails(c as boolean)}
                        />
                        <label htmlFor="includeTerminal" className="text-sm cursor-pointer">
                          Include Terminal Unit Details
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeOctave"
                          checked={includeOctaveBandEstimate}
                          onCheckedChange={(c) => setIncludeOctaveBandEstimate(c as boolean)}
                        />
                        <label htmlFor="includeOctave" className="text-sm cursor-pointer">
                          Include Octave Band Estimates (if available)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Additional Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any additional notes or clarifications..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="mt-0 space-y-4">
                  <CompanyLogoUpload onLogoChange={setCompanyLogo} />
                  <p className="text-xs text-muted-foreground">
                    Your logo will appear in the top-left corner of the certificate header.
                    The logo is saved locally and will be used for future certificates.
                  </p>
                </TabsContent>

                <TabsContent value="signatories" className="mt-0 space-y-6">
                  {/* HVAC Engineer */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Label className="text-base font-medium">HVAC Design Engineer</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={hvacEngineer.name}
                          onChange={(e) => setHvacEngineer({ ...hvacEngineer, name: e.target.value })}
                          placeholder="Engineer Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={hvacEngineer.title}
                          onChange={(e) => setHvacEngineer({ ...hvacEngineer, title: e.target.value })}
                          placeholder="HVAC Design Engineer"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Company</Label>
                        <Input
                          value={hvacEngineer.company}
                          onChange={(e) => setHvacEngineer({ ...hvacEngineer, company: e.target.value })}
                          placeholder="Company Name"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Acoustical Engineer */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <Label className="text-base font-medium">Acoustical Consultant</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={acousticalEngineer.name}
                          onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, name: e.target.value })}
                          placeholder="Consultant Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={acousticalEngineer.title}
                          onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, title: e.target.value })}
                          placeholder="Acoustical Consultant"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={acousticalEngineer.company}
                          onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, company: e.target.value })}
                          placeholder="Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>License Number</Label>
                        <Input
                          value={acousticalEngineer.license}
                          onChange={(e) => setAcousticalEngineer({ ...acousticalEngineer, license: e.target.value })}
                          placeholder="License/Registration #"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0 h-full">
                  {previewUrl ? (
                    <div className="border rounded-lg overflow-hidden h-[500px]">
                      <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        title="Certificate Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg border-dashed">
                      <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Click "Generate Preview" to see the certificate
                      </p>
                      <Button onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Generate Preview
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">
                  {compliantZones.length} zone{compliantZones.length !== 1 ? 's' : ''} will be included
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
