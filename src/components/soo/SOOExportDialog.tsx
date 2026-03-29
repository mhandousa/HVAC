import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, FileSpreadsheet, Copy, Download, Loader2 } from 'lucide-react';
import { GeneratedSequence } from '@/lib/soo-templates';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SOOExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: GeneratedSequence;
  documentName: string;
  systemType: string;
}

type ExportFormat = 'pdf' | 'csv' | 'clipboard';

interface ExportOptions {
  includeDescription: boolean;
  includeStartup: boolean;
  includeOperation: boolean;
  includeShutdown: boolean;
  includeSafety: boolean;
  includeAlarms: boolean;
  includeSetpoints: boolean;
  includeMaintenance: boolean;
}

export function SOOExportDialog({
  open,
  onOpenChange,
  sequence,
  documentName,
  systemType,
}: SOOExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [options, setOptions] = useState<ExportOptions>({
    includeDescription: true,
    includeStartup: true,
    includeOperation: true,
    includeShutdown: true,
    includeSafety: true,
    includeAlarms: true,
    includeSetpoints: true,
    includeMaintenance: true,
  });

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generateTextContent = (): string => {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('SEQUENCE OF OPERATIONS');
    lines.push('='.repeat(60));
    lines.push('');
    
    if (companyName) lines.push(`Company: ${companyName}`);
    if (projectName) lines.push(`Project: ${projectName}`);
    lines.push(`Document: ${documentName}`);
    lines.push(`System Type: ${systemType}`);
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');

    if (options.includeDescription) {
      lines.push('-'.repeat(40));
      lines.push('SYSTEM DESCRIPTION');
      lines.push('-'.repeat(40));
      lines.push(sequence.systemDescription);
      lines.push('');
      lines.push('Equipment:');
      sequence.equipmentList.forEach(eq => lines.push(`  - ${eq}`));
      lines.push('');
    }

    if (options.includeStartup && sequence.startupSequence.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('STARTUP SEQUENCE');
      lines.push('-'.repeat(40));
      sequence.startupSequence.forEach(step => {
        lines.push(`${step.stepNumber}. ${step.description}`);
        if (step.condition) lines.push(`   Condition: ${step.condition}`);
        lines.push(`   Action: ${step.action}`);
        if (step.setpoint) lines.push(`   Setpoint: ${step.setpoint}`);
        lines.push('');
      });
    }

    if (options.includeOperation && sequence.normalOperation.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('NORMAL OPERATION');
      lines.push('-'.repeat(40));
      sequence.normalOperation.forEach(step => {
        lines.push(`${step.stepNumber}. ${step.description}`);
        if (step.condition) lines.push(`   Condition: ${step.condition}`);
        lines.push(`   Action: ${step.action}`);
        if (step.setpoint) lines.push(`   Setpoint: ${step.setpoint}`);
        lines.push('');
      });
    }

    if (options.includeShutdown && sequence.shutdownSequence.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('SHUTDOWN SEQUENCE');
      lines.push('-'.repeat(40));
      sequence.shutdownSequence.forEach(step => {
        lines.push(`${step.stepNumber}. ${step.description}`);
        if (step.condition) lines.push(`   Condition: ${step.condition}`);
        lines.push(`   Action: ${step.action}`);
        lines.push('');
      });
    }

    if (options.includeSafety && sequence.safetyInterlocks.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('SAFETY INTERLOCKS');
      lines.push('-'.repeat(40));
      sequence.safetyInterlocks.forEach(step => {
        lines.push(`${step.stepNumber}. ${step.description}`);
        lines.push(`   Condition: ${step.condition}`);
        lines.push(`   Action: ${step.action}`);
        lines.push('');
      });
    }

    if (options.includeAlarms && sequence.alarmConditions.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('ALARM CONDITIONS');
      lines.push('-'.repeat(40));
      sequence.alarmConditions.forEach(alarm => {
        lines.push(`[${alarm.severity.toUpperCase()}] ${alarm.alarmName}`);
        lines.push(`   Condition: ${alarm.condition}`);
        lines.push(`   Action: ${alarm.action}`);
        lines.push('');
      });
    }

    if (options.includeSetpoints && sequence.setpointSchedule.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('SETPOINT SCHEDULE');
      lines.push('-'.repeat(40));
      sequence.setpointSchedule.forEach(sp => {
        lines.push(`${sp.parameter}: ${sp.setpoint} ${sp.units}${sp.range ? ` (Range: ${sp.range})` : ''}`);
      });
      lines.push('');
    }

    if (options.includeMaintenance && sequence.maintenanceNotes.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('MAINTENANCE NOTES');
      lines.push('-'.repeat(40));
      sequence.maintenanceNotes.forEach(note => lines.push(`• ${note}`));
    }

    return lines.join('\n');
  };

  const generateCSVContent = (): string => {
    const rows: string[][] = [];
    
    // Header info
    rows.push(['Sequence of Operations']);
    rows.push(['Document', documentName]);
    rows.push(['System Type', systemType]);
    rows.push(['Generated', new Date().toLocaleDateString()]);
    rows.push([]);

    // Setpoints (most useful for BAS integration)
    if (options.includeSetpoints) {
      rows.push(['SETPOINT SCHEDULE']);
      rows.push(['Parameter', 'Setpoint', 'Range', 'Units']);
      sequence.setpointSchedule.forEach(sp => {
        rows.push([sp.parameter, sp.setpoint, sp.range || '', sp.units]);
      });
      rows.push([]);
    }

    // Alarms
    if (options.includeAlarms) {
      rows.push(['ALARM CONDITIONS']);
      rows.push(['Alarm Name', 'Condition', 'Severity', 'Action']);
      sequence.alarmConditions.forEach(alarm => {
        rows.push([alarm.alarmName, alarm.condition, alarm.severity, alarm.action]);
      });
      rows.push([]);
    }

    // Sequences
    const addSequenceRows = (title: string, steps: typeof sequence.startupSequence) => {
      rows.push([title]);
      rows.push(['Step', 'Description', 'Condition', 'Action', 'Setpoint']);
      steps.forEach(step => {
        rows.push([
          String(step.stepNumber),
          step.description,
          step.condition || '',
          step.action,
          step.setpoint || ''
        ]);
      });
      rows.push([]);
    };

    if (options.includeStartup) addSequenceRows('STARTUP SEQUENCE', sequence.startupSequence);
    if (options.includeOperation) addSequenceRows('NORMAL OPERATION', sequence.normalOperation);
    if (options.includeShutdown) addSequenceRows('SHUTDOWN SEQUENCE', sequence.shutdownSequence);
    if (options.includeSafety) addSequenceRows('SAFETY INTERLOCKS', sequence.safetyInterlocks);

    // Convert to CSV
    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Sequence of Operations', 14, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (companyName) {
      doc.text(`Company: ${companyName}`, 14, yPos);
      yPos += 6;
    }
    if (projectName) {
      doc.text(`Project: ${projectName}`, 14, yPos);
      yPos += 6;
    }
    doc.text(`Document: ${documentName}`, 14, yPos);
    yPos += 6;
    doc.text(`System: ${systemType}`, 14, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, yPos);
    yPos += 12;

    // System Description
    if (options.includeDescription) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('System Description', 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(sequence.systemDescription, 180);
      doc.text(descLines, 14, yPos);
      yPos += descLines.length * 5 + 10;
    }

    // Setpoint Schedule Table
    if (options.includeSetpoints && sequence.setpointSchedule.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Setpoint Schedule', 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Setpoint', 'Range', 'Units']],
        body: sequence.setpointSchedule.map(sp => [
          sp.parameter,
          sp.setpoint,
          sp.range || '-',
          sp.units
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Alarm Conditions Table
    if (options.includeAlarms && sequence.alarmConditions.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alarm Conditions', 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Alarm', 'Severity', 'Condition', 'Action']],
        body: sequence.alarmConditions.map(alarm => [
          alarm.alarmName,
          alarm.severity.toUpperCase(),
          alarm.condition,
          alarm.action
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
        columnStyles: {
          1: { 
            cellWidth: 20,
            fontStyle: 'bold',
          }
        },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Sequence sections
    const addSequenceSection = (title: string, steps: typeof sequence.startupSequence) => {
      if (steps.length === 0) return;

      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Step', 'Description', 'Action']],
        body: steps.map(step => [
          String(step.stepNumber),
          step.description,
          step.action
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
        },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    };

    if (options.includeStartup) addSequenceSection('Startup Sequence', sequence.startupSequence);
    if (options.includeOperation) addSequenceSection('Normal Operation', sequence.normalOperation);
    if (options.includeShutdown) addSequenceSection('Shutdown Sequence', sequence.shutdownSequence);
    if (options.includeSafety) addSequenceSection('Safety Interlocks', sequence.safetyInterlocks);

    // Maintenance Notes
    if (options.includeMaintenance && sequence.maintenanceNotes.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Maintenance Notes', 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      sequence.maintenanceNotes.forEach(note => {
        const lines = doc.splitTextToSize(`• ${note}`, 180);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 5 + 2;
      });
    }

    // Save
    const filename = `SOO_${documentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'pdf':
          await exportToPDF();
          toast.success('PDF exported successfully');
          break;
        case 'csv':
          const csvContent = generateCSVContent();
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `SOO_${documentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
          csvLink.click();
          URL.revokeObjectURL(csvUrl);
          toast.success('CSV exported successfully');
          break;
        case 'clipboard':
          const textContent = generateTextContent();
          await navigator.clipboard.writeText(textContent);
          toast.success('Copied to clipboard');
          break;
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Sequence of Operations</DialogTitle>
          <DialogDescription>
            Choose format and sections to include in the export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name (Optional)</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
              />
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (for BAS import)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clipboard" id="clipboard" />
                <Label htmlFor="clipboard" className="flex items-center gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <Label>Include Sections</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'includeDescription', label: 'Description' },
                { key: 'includeStartup', label: 'Startup' },
                { key: 'includeOperation', label: 'Operation' },
                { key: 'includeShutdown', label: 'Shutdown' },
                { key: 'includeSafety', label: 'Safety' },
                { key: 'includeAlarms', label: 'Alarms' },
                { key: 'includeSetpoints', label: 'Setpoints' },
                { key: 'includeMaintenance', label: 'Maintenance' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={options[key as keyof ExportOptions]}
                    onCheckedChange={() => toggleOption(key as keyof ExportOptions)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
