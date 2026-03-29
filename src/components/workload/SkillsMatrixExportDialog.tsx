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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { SkillsMatrixData, SkillDefinition } from '@/hooks/useSkillsMatrix';
import { Technician } from '@/hooks/useTechnicians';
import { toast } from 'sonner';

interface SkillsMatrixExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SkillsMatrixData;
}

type ExportFormat = 'csv' | 'json';
type SkillFilter = 'all' | 'deficiency' | 'equipment';

export function SkillsMatrixExportDialog({
  open,
  onOpenChange,
  data,
}: SkillsMatrixExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [includeCoverage, setIncludeCoverage] = useState(true);
  const [includeGaps, setIncludeGaps] = useState(true);

  const handleExport = () => {
    const filteredSkills = data.skills.filter(skill => {
      if (skillFilter === 'all') return true;
      if (skillFilter === 'deficiency') return skill.type === 'deficiency_category';
      if (skillFilter === 'equipment') return skill.type === 'equipment_type';
      return true;
    });

    if (format === 'csv') {
      exportCSV(data.technicians, filteredSkills, data.matrix, data.coverage, includeCoverage);
    } else {
      exportJSON(data, filteredSkills, includeCoverage, includeGaps);
    }

    toast.success('Skills matrix exported successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Skills Matrix</DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  CSV (Excel compatible)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-blue-600" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Skill Filter */}
          <div className="space-y-3">
            <Label>Include Skills</Label>
            <RadioGroup value={skillFilter} onValueChange={(v) => setSkillFilter(v as SkillFilter)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">All skills</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deficiency" id="deficiency" />
                <Label htmlFor="deficiency" className="cursor-pointer">Deficiency skills only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equipment" id="equipment" />
                <Label htmlFor="equipment" className="cursor-pointer">Equipment skills only</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label>Additional Data</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coverage"
                  checked={includeCoverage}
                  onCheckedChange={(c) => setIncludeCoverage(!!c)}
                />
                <Label htmlFor="coverage" className="cursor-pointer">
                  Include coverage statistics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gaps"
                  checked={includeGaps}
                  onCheckedChange={(c) => setIncludeGaps(!!c)}
                />
                <Label htmlFor="gaps" className="cursor-pointer">
                  Include skill gap analysis
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function exportCSV(
  technicians: Technician[],
  skills: SkillDefinition[],
  matrix: Map<string, Map<string, { level: string | null; certified: boolean }>>,
  coverage: Map<string, { count: number; percentage: number }>,
  includeCoverage: boolean
) {
  // Build header row
  const headers = ['Technician', ...skills.map(s => s.label)];
  
  // Build data rows
  const rows: string[][] = [];
  
  technicians.forEach(tech => {
    const row = [tech.full_name || tech.email];
    const techMatrix = matrix.get(tech.id);
    
    skills.forEach(skill => {
      const key = `${skill.type}:${skill.id}`;
      const cell = techMatrix?.get(key);
      if (cell?.level) {
        const cert = cell.certified ? ' ⭐' : '';
        row.push(cell.level.toUpperCase() + cert);
      } else {
        row.push('—');
      }
    });
    
    rows.push(row);
  });

  // Add coverage row if requested
  if (includeCoverage) {
    const coverageRow = ['Coverage %'];
    skills.forEach(skill => {
      const key = `${skill.type}:${skill.id}`;
      const cov = coverage.get(key);
      coverageRow.push(cov ? `${Math.round(cov.percentage)}%` : '0%');
    });
    rows.push(coverageRow);
  }

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, 'skills-matrix.csv', 'text/csv');
}

function exportJSON(
  data: SkillsMatrixData,
  skills: SkillDefinition[],
  includeCoverage: boolean,
  includeGaps: boolean
) {
  const exportData: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    technicians: data.technicians.map(t => ({
      id: t.id,
      name: t.full_name || t.email,
      skills: skills.map(skill => {
        const key = `${skill.type}:${skill.id}`;
        const cell = data.matrix.get(t.id)?.get(key);
        return {
          skill: skill.label,
          type: skill.type,
          level: cell?.level || null,
          certified: cell?.certified || false,
        };
      }).filter(s => s.level !== null),
    })),
  };

  if (includeCoverage) {
    exportData.coverage = skills.map(skill => {
      const key = `${skill.type}:${skill.id}`;
      const cov = data.coverage.get(key);
      return {
        skill: skill.label,
        type: skill.type,
        count: cov?.count || 0,
        percentage: cov?.percentage || 0,
      };
    });
  }

  if (includeGaps) {
    exportData.gaps = data.gaps;
    exportData.stats = data.stats;
  }

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, 'skills-matrix.json', 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
