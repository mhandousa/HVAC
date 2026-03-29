import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, FileSpreadsheet, Copy, Download, FileDown } from 'lucide-react';
import type { ExportOptions } from '@/hooks/useTerminalUnitScheduleExport';

interface TerminalUnitScheduleExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  onCopy: () => void;
  scheduleName: string;
  unitCount: number;
}

export function TerminalUnitScheduleExportDialog({
  open,
  onOpenChange,
  onExport,
  onCopy,
  scheduleName,
  unitCount,
}: TerminalUnitScheduleExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'a3'>('a4');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [filename, setFilename] = useState(scheduleName.toLowerCase().replace(/\s+/g, '-'));

  const handleExport = () => {
    onExport({
      format,
      orientation,
      paperSize,
      includeHeader,
      includeSummary,
      includeNotes,
      filename: filename || undefined,
    });
    onOpenChange(false);
  };

  const handleCopy = () => {
    onCopy();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Terminal Unit Schedule
          </DialogTitle>
          <DialogDescription>
            Export {unitCount} terminal unit{unitCount !== 1 ? 's' : ''} to PDF or Excel format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  format === 'pdf'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText className={`h-8 w-8 ${format === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-muted-foreground">Print-ready document</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  format === 'excel'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className={`h-8 w-8 ${format === 'excel' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className="font-medium">Excel</div>
                  <div className="text-xs text-muted-foreground">Editable spreadsheet</div>
                </div>
              </button>
            </div>
          </div>

          {/* PDF Options */}
          {format === 'pdf' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Page Orientation</Label>
                <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as 'portrait' | 'landscape')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape" className="font-normal cursor-pointer">Landscape</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait" className="font-normal cursor-pointer">Portrait</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Paper Size</Label>
                <RadioGroup value={paperSize} onValueChange={(v) => setPaperSize(v as 'a4' | 'letter' | 'a3')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a4" id="a4" />
                      <Label htmlFor="a4" className="font-normal cursor-pointer">A4</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="letter" id="letter" />
                      <Label htmlFor="letter" className="font-normal cursor-pointer">Letter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a3" id="a3" />
                      <Label htmlFor="a3" className="font-normal cursor-pointer">A3</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include Sections</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-header" className="font-normal cursor-pointer">
                  Project Header
                </Label>
                <Switch
                  id="include-header"
                  checked={includeHeader}
                  onCheckedChange={setIncludeHeader}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-summary" className="font-normal cursor-pointer">
                  Unit Summary
                </Label>
                <Switch
                  id="include-summary"
                  checked={includeSummary}
                  onCheckedChange={setIncludeSummary}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-notes" className="font-normal cursor-pointer">
                  Notes Section
                </Label>
                <Switch
                  id="include-notes"
                  checked={includeNotes}
                  onCheckedChange={setIncludeNotes}
                />
              </div>
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="terminal-unit-schedule"
              />
              <span className="text-sm text-muted-foreground">
                .{format === 'pdf' ? 'pdf' : 'xlsx'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
