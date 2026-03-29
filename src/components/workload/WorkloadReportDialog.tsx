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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWorkloadReportData, DateRangePreset, DateRange } from '@/hooks/useWorkloadReportData';
import { WorkloadReportConfig, downloadWorkloadReportPDF } from '@/lib/workload-report-pdf';
import { downloadWorkloadReportExcel } from '@/lib/workload-report-excel';
import { TechnicianMetrics } from '@/hooks/useTechnicianWorkload';
import { format } from 'date-fns';
import { CalendarIcon, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkloadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians: TechnicianMetrics[];
  preselectedTechnicianId?: string;
}

export function WorkloadReportDialog({
  open,
  onOpenChange,
  technicians,
  preselectedTechnicianId,
}: WorkloadReportDialogProps) {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'individual'>(
    preselectedTechnicianId ? 'individual' : 'summary'
  );
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(),
  });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<string[]>(
    preselectedTechnicianId ? [preselectedTechnicianId] : []
  );
  const [includeSections, setIncludeSections] = useState({
    stats: true,
    charts: true,
    assignments: true,
    skills: false,
    balancing: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, dateRange } = useWorkloadReportData(
    dateRangePreset,
    dateRangePreset === 'custom' ? customDateRange : undefined
  );

  const handleSectionToggle = (section: keyof typeof includeSections) => {
    setIncludeSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTechnicianToggle = (techId: string) => {
    setSelectedTechnicianIds(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const handleSelectAllTechnicians = () => {
    if (selectedTechnicianIds.length === technicians.length) {
      setSelectedTechnicianIds([]);
    } else {
      setSelectedTechnicianIds(technicians.map(t => t.id));
    }
  };

  const handleExport = async () => {
    if (!data) {
      toast.error('Report data is not available');
      return;
    }

    setIsGenerating(true);

    try {
      const config: WorkloadReportConfig = {
        reportType,
        dateRange,
        includeSections,
        technicianIds: reportType === 'individual' ? selectedTechnicianIds : undefined,
      };

      if (exportFormat === 'pdf') {
        downloadWorkloadReportPDF(config, data);
      } else {
        downloadWorkloadReportExcel(config, data);
      }

      toast.success(`${exportFormat.toUpperCase()} report downloaded successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Workload Report
          </DialogTitle>
          <DialogDescription>
            Configure and download a workload report for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(v) => setReportType(v as typeof reportType)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="summary" id="summary" className="peer sr-only" />
                <Label
                  htmlFor="summary"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Summary</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    1-2 page overview
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="detailed" id="detailed" className="peer sr-only" />
                <Label
                  htmlFor="detailed"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Detailed</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Full team report
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                <Label
                  htmlFor="individual"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Individual</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Per technician
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <Select
              value={dateRangePreset}
              onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRangePreset === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(customDateRange.start, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateRange.start}
                      onSelect={(date) =>
                        date && setCustomDateRange(prev => ({ ...prev, start: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(customDateRange.end, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateRange.end}
                      onSelect={(date) =>
                        date && setCustomDateRange(prev => ({ ...prev, end: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Technician Selection (for individual report) */}
          {reportType === 'individual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Technicians</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllTechnicians}
                  className="h-7 text-xs"
                >
                  {selectedTechnicianIds.length === technicians.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {technicians.map(tech => (
                  <div key={tech.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tech.id}
                      checked={selectedTechnicianIds.includes(tech.id)}
                      onCheckedChange={() => handleTechnicianToggle(tech.id)}
                    />
                    <Label
                      htmlFor={tech.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tech.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedTechnicianIds.length === 0 && (
                <p className="text-xs text-destructive">Please select at least one technician</p>
              )}
            </div>
          )}

          {/* Include Sections */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Sections</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stats"
                  checked={includeSections.stats}
                  onCheckedChange={() => handleSectionToggle('stats')}
                />
                <Label htmlFor="stats" className="text-sm font-normal cursor-pointer">
                  Team Statistics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignments"
                  checked={includeSections.assignments}
                  onCheckedChange={() => handleSectionToggle('assignments')}
                />
                <Label htmlFor="assignments" className="text-sm font-normal cursor-pointer">
                  Assignment Details
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="balancing"
                  checked={includeSections.balancing}
                  onCheckedChange={() => handleSectionToggle('balancing')}
                />
                <Label htmlFor="balancing" className="text-sm font-normal cursor-pointer">
                  Balancing Suggestions
                </Label>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as 'pdf' | 'excel')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">PDF</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="excel" id="excel" className="peer sr-only" />
                <Label
                  htmlFor="excel"
                  className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm font-medium">Excel</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isLoading ||
              isGenerating ||
              (reportType === 'individual' && selectedTechnicianIds.length === 0)
            }
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
