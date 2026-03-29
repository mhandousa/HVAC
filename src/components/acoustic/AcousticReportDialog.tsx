import React, { useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useAcousticReportExport, AcousticReportData } from '@/hooks/useAcousticReportExport';
import { ZoneAcousticData, FloorAcousticSummary } from '@/hooks/useZoneAcousticAnalysis';
import { RoomAcousticsResult } from '@/lib/room-acoustics-calculations';
import { NoisePath } from '@/lib/noise-path-calculations';

interface AcousticReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  roomAcoustics?: {
    roomName: string;
    result: RoomAcousticsResult;
  };
  noisePath?: {
    path: NoisePath;
    targetNC: number;
  };
  ncCompliance?: {
    zones: ZoneAcousticData[];
    summary: FloorAcousticSummary;
  };
}

export function AcousticReportDialog({
  open,
  onOpenChange,
  projectName = 'Project',
  roomAcoustics,
  noisePath,
  ncCompliance,
}: AcousticReportDialogProps) {
  const [reportProjectName, setReportProjectName] = useState(projectName);
  const [preparedBy, setPreparedBy] = useState('');
  const [includeSections, setIncludeSections] = useState({
    executiveSummary: true,
    roomAcoustics: !!roomAcoustics,
    noisePath: !!noisePath,
    ncCompliance: !!ncCompliance,
    recommendations: true,
  });

  const { generateReport, isGenerating, progress } = useAcousticReportExport();

  const handleGenerate = async () => {
    const reportData: AcousticReportData = {
      projectName: reportProjectName,
      preparedBy: preparedBy || 'Not specified',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      roomAcoustics,
      noisePath,
      ncCompliance,
      includeSections,
    };

    await generateReport(reportData);
    onOpenChange(false);
  };

  const toggleSection = (section: keyof typeof includeSections) => {
    setIncludeSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasData = roomAcoustics || noisePath || ncCompliance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Acoustic Report
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive PDF report combining acoustic analysis data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={reportProjectName}
              onChange={(e) => setReportProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          {/* Prepared By */}
          <div className="space-y-2">
            <Label htmlFor="prepared-by">Prepared By</Label>
            <Input
              id="prepared-by"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="Engineer name or company"
            />
          </div>

          {/* Section Selection */}
          <div className="space-y-3">
            <Label>Include Sections</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exec-summary"
                checked={includeSections.executiveSummary}
                onCheckedChange={() => toggleSection('executiveSummary')}
              />
              <Label htmlFor="exec-summary" className="text-sm font-normal cursor-pointer">
                Executive Summary
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="room-acoustics"
                checked={includeSections.roomAcoustics}
                onCheckedChange={() => toggleSection('roomAcoustics')}
                disabled={!roomAcoustics}
              />
              <Label 
                htmlFor="room-acoustics" 
                className={`text-sm font-normal cursor-pointer ${!roomAcoustics ? 'text-muted-foreground' : ''}`}
              >
                Room Acoustics Analysis {!roomAcoustics && '(no data)'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="noise-path"
                checked={includeSections.noisePath}
                onCheckedChange={() => toggleSection('noisePath')}
                disabled={!noisePath}
              />
              <Label 
                htmlFor="noise-path" 
                className={`text-sm font-normal cursor-pointer ${!noisePath ? 'text-muted-foreground' : ''}`}
              >
                Noise Path Analysis {!noisePath && '(no data)'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="nc-compliance"
                checked={includeSections.ncCompliance}
                onCheckedChange={() => toggleSection('ncCompliance')}
                disabled={!ncCompliance}
              />
              <Label 
                htmlFor="nc-compliance" 
                className={`text-sm font-normal cursor-pointer ${!ncCompliance ? 'text-muted-foreground' : ''}`}
              >
                NC Compliance Summary {!ncCompliance && '(no data)'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recommendations"
                checked={includeSections.recommendations}
                onCheckedChange={() => toggleSection('recommendations')}
              />
              <Label htmlFor="recommendations" className="text-sm font-normal cursor-pointer">
                Recommendations
              </Label>
            </div>
          </div>

          {/* Progress indicator */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Generating report... {progress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !hasData}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
