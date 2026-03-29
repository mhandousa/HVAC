import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCommissioningCertificate, CertificateOptions, CertificateSignatory } from '@/hooks/useCommissioningCertificate';
import type { Tables } from '@/integrations/supabase/types';

type CommissioningProject = Tables<'commissioning_projects'>;
type CommissioningChecklist = Tables<'commissioning_checklists'>;
type CommissioningTest = Tables<'commissioning_tests'>;

interface CommissioningCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: CommissioningProject;
  checklists: CommissioningChecklist[];
  tests: CommissioningTest[];
}

export function CommissioningCertificateDialog({
  open,
  onOpenChange,
  project,
  checklists,
  tests,
}: CommissioningCertificateDialogProps) {
  const { generateCertificate, generateCertificateNumber } = useCommissioningCertificate();
  const [isGenerating, setIsGenerating] = useState(false);

  const [certificateType, setCertificateType] = useState<'preliminary' | 'final' | 'conditional'>('final');
  const [certificateNumber, setCertificateNumber] = useState('');
  
  const [includeSections, setIncludeSections] = useState({
    varianceSummary: true,
    testResultsSummary: true,
    testDetails: true,
    failedTestsOnly: false,
    photoDocumentation: true,
  });

  const [maxPhotosPerTest, setMaxPhotosPerTest] = useState(3);

  const [commissioningAgent, setCommissioningAgent] = useState<CertificateSignatory>({
    name: '',
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [contractor, setContractor] = useState<CertificateSignatory>({
    name: '',
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [owner, setOwner] = useState<CertificateSignatory>({
    name: '',
    title: '',
    date: '',
  });

  const [conditions, setConditions] = useState<string[]>(['']);

  // Calculate total photos available
  const totalPhotos = tests.reduce((count, test) => {
    const photos = (test.photos_urls as string[]) || [];
    return count + photos.length;
  }, 0);

  useEffect(() => {
    if (open) {
      setCertificateNumber(generateCertificateNumber(project.id));
    }
  }, [open, project.id]);

  const handleAddCondition = () => {
    setConditions([...conditions, '']);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const options: CertificateOptions = {
        certificateType,
        certificateNumber,
        includeSections,
        maxPhotosPerTest,
        signatories: {
          commissioningAgent,
          contractor,
          owner: owner.name ? owner : undefined,
        },
        conditions: conditions.filter(c => c.trim() !== ''),
      };

      await generateCertificate(project, checklists, tests, options);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isValid = commissioningAgent.name && contractor.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Generate Commissioning Certificate
          </DialogTitle>
          <DialogDescription>
            Configure certificate options and enter signatory information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Certificate Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Certificate Type</Label>
              <RadioGroup
                value={certificateType}
                onValueChange={(value) => setCertificateType(value as any)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preliminary" id="preliminary" />
                  <Label htmlFor="preliminary" className="font-normal cursor-pointer">
                    <span className="font-medium">Preliminary</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (Pre-functional testing complete)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="final" id="final" />
                  <Label htmlFor="final" className="font-normal cursor-pointer">
                    <span className="font-medium">Final</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (All testing complete and passed)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conditional" id="conditional" />
                  <Label htmlFor="conditional" className="font-normal cursor-pointer">
                    <span className="font-medium">Conditional</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (Passed with exceptions)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Certificate Number */}
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="CX-2026-001"
              />
            </div>

            <Separator />

            {/* Include Sections */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include Sections</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="varianceSummary"
                    checked={includeSections.varianceSummary}
                    onCheckedChange={(checked) =>
                      setIncludeSections({ ...includeSections, varianceSummary: !!checked })
                    }
                  />
                  <Label htmlFor="varianceSummary" className="font-normal cursor-pointer">
                    Variance Summary (Design vs. Installed)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="testResultsSummary"
                    checked={includeSections.testResultsSummary}
                    onCheckedChange={(checked) =>
                      setIncludeSections({ ...includeSections, testResultsSummary: !!checked })
                    }
                  />
                  <Label htmlFor="testResultsSummary" className="font-normal cursor-pointer">
                    Test Results Summary
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="testDetails"
                    checked={includeSections.testDetails}
                    onCheckedChange={(checked) =>
                      setIncludeSections({ ...includeSections, testDetails: !!checked })
                    }
                  />
                  <Label htmlFor="testDetails" className="font-normal cursor-pointer">
                    Individual Test Details
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="failedTestsOnly"
                    checked={includeSections.failedTestsOnly}
                    disabled={!includeSections.testDetails}
                    onCheckedChange={(checked) =>
                      setIncludeSections({ ...includeSections, failedTestsOnly: !!checked })
                    }
                  />
                  <Label 
                    htmlFor="failedTestsOnly" 
                    className={`font-normal cursor-pointer ${!includeSections.testDetails ? 'text-muted-foreground' : ''}`}
                  >
                    Failed Tests Only
                  </Label>
                </div>
                
                <Separator className="my-2" />
                
                {/* Photo Documentation Option */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photoDocumentation"
                    checked={includeSections.photoDocumentation}
                    onCheckedChange={(checked) =>
                      setIncludeSections({ ...includeSections, photoDocumentation: !!checked })
                    }
                  />
                  <Label htmlFor="photoDocumentation" className="font-normal cursor-pointer flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Photo Documentation
                    {totalPhotos > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({totalPhotos} photos available)
                      </span>
                    )}
                  </Label>
                </div>
                
                {includeSections.photoDocumentation && (
                  <div className="ml-6 flex items-center gap-2">
                    <Label htmlFor="maxPhotosPerTest" className="text-sm text-muted-foreground whitespace-nowrap">
                      Max photos per test:
                    </Label>
                    <Input
                      id="maxPhotosPerTest"
                      type="number"
                      min={1}
                      max={10}
                      value={maxPhotosPerTest}
                      onChange={(e) => setMaxPhotosPerTest(parseInt(e.target.value) || 3)}
                      className="w-20 h-8"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Signatories */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Signatories</Label>

              {/* Commissioning Agent */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Commissioning Agent *</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="agentName" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="agentName"
                      value={commissioningAgent.name}
                      onChange={(e) => setCommissioningAgent({ ...commissioningAgent, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agentTitle" className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      id="agentTitle"
                      value={commissioningAgent.title}
                      onChange={(e) => setCommissioningAgent({ ...commissioningAgent, title: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agentDate" className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      id="agentDate"
                      type="date"
                      value={commissioningAgent.date}
                      onChange={(e) => setCommissioningAgent({ ...commissioningAgent, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contractor */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Contractor Representative *</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="contractorName" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="contractorName"
                      value={contractor.name}
                      onChange={(e) => setContractor({ ...contractor, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contractorTitle" className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      id="contractorTitle"
                      value={contractor.title}
                      onChange={(e) => setContractor({ ...contractor, title: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contractorDate" className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      id="contractorDate"
                      type="date"
                      value={contractor.date}
                      onChange={(e) => setContractor({ ...contractor, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Owner (Optional) */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Owner Representative (Optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ownerName" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="ownerName"
                      value={owner.name}
                      onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerTitle" className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      id="ownerTitle"
                      value={owner.title}
                      onChange={(e) => setOwner({ ...owner, title: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerDate" className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      id="ownerDate"
                      type="date"
                      value={owner.date}
                      onChange={(e) => setOwner({ ...owner, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions (for Conditional certificates) */}
            {certificateType === 'conditional' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Conditions / Exceptions</Label>
                  <p className="text-sm text-muted-foreground">
                    List any conditions or exceptions that must be addressed
                  </p>
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={condition}
                          onChange={(e) => handleConditionChange(index, e.target.value)}
                          placeholder={`Condition ${index + 1}`}
                          className="min-h-[60px]"
                        />
                        {conditions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCondition}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!isValid || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {includeSections.photoDocumentation && totalPhotos > 0 
                  ? 'Loading photos...' 
                  : 'Generating...'}
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Generate Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
