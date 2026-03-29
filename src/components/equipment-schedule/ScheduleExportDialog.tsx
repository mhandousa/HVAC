import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { FileDown, FileSpreadsheet, Copy } from 'lucide-react';
import { ExportOptions } from '@/hooks/useEquipmentScheduleExport';

interface ScheduleExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  onCopy: () => void;
  scheduleName: string;
}

export function ScheduleExportDialog({
  open,
  onOpenChange,
  onExport,
  onCopy,
  scheduleName,
}: ScheduleExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    orientation: 'landscape',
    paperSize: 'a4',
    includeHeader: true,
    includeNotes: true,
    includeSummary: true,
    filename: scheduleName.toLowerCase().replace(/\s+/g, '-'),
  });

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  const handleCopy = () => {
    onCopy();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Equipment Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(v) => setOptions({ ...options, format: v as 'pdf' | 'excel' })}
              className="grid grid-cols-2 gap-4"
            >
              <div className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${
                options.format === 'pdf' ? 'border-primary bg-primary/5' : ''
              }`}>
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${
                options.format === 'excel' ? 'border-primary bg-primary/5' : ''
              }`}>
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel Spreadsheet
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* PDF Options */}
          {options.format === 'pdf' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <RadioGroup
                    value={options.orientation}
                    onValueChange={(v) => setOptions({ ...options, orientation: v as 'portrait' | 'landscape' })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait" className="cursor-pointer">Portrait</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape" className="cursor-pointer">Landscape</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <RadioGroup
                    value={options.paperSize}
                    onValueChange={(v) => setOptions({ ...options, paperSize: v as 'a4' | 'letter' | 'a3' })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a4" id="a4" />
                      <Label htmlFor="a4" className="cursor-pointer">A4</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="letter" id="letter" />
                      <Label htmlFor="letter" className="cursor-pointer">Letter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a3" id="a3" />
                      <Label htmlFor="a3" className="cursor-pointer">A3</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include Sections</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeHeader" className="font-normal">Project Header</Label>
                <Switch
                  id="includeHeader"
                  checked={options.includeHeader}
                  onCheckedChange={(checked) => setOptions({ ...options, includeHeader: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeSummary" className="font-normal">Equipment Summary</Label>
                <Switch
                  id="includeSummary"
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => setOptions({ ...options, includeSummary: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeNotes" className="font-normal">Notes Section</Label>
                <Switch
                  id="includeNotes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) => setOptions({ ...options, includeNotes: checked })}
                />
              </div>
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={options.filename}
              onChange={(e) => setOptions({ ...options, filename: e.target.value })}
              placeholder="equipment-schedule"
            />
            <p className="text-xs text-muted-foreground">
              .{options.format === 'pdf' ? 'pdf' : 'xlsx'} will be added automatically
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button onClick={handleExport} className="gap-2">
            {options.format === 'pdf' ? (
              <FileDown className="h-4 w-4" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export {options.format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
