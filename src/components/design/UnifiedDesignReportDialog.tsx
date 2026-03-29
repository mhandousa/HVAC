import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useUnifiedDesignReport, DEFAULT_REPORT_CONFIG, ReportSectionConfig } from '@/hooks/useUnifiedDesignReport';
import { DesignReportPreview } from './DesignReportPreview';
import { toast } from 'sonner';

interface UnifiedDesignReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function UnifiedDesignReportDialog({ 
  open, 
  onOpenChange, 
  projectId: initialProjectId 
}: UnifiedDesignReportDialogProps) {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [config, setConfig] = useState<ReportSectionConfig>(DEFAULT_REPORT_CONFIG);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, exportToPDF, exportToExcel } = useUnifiedDesignReport(selectedProjectId || undefined);

  // Set initial project when dialog opens
  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [initialProjectId, projects, open]);

  const handleConfigChange = (key: keyof ReportSectionConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExportPDF = async () => {
    if (!data) {
      toast.error('No data available for export');
      return;
    }
    
    setIsExporting(true);
    try {
      exportToPDF(data, config);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF report');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!data) {
      toast.error('No data available for export');
      return;
    }
    
    setIsExporting(true);
    try {
      exportToExcel(data, config);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate Excel report');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const sectionOptions = [
    { key: 'coverPage' as const, label: 'Cover Page', description: 'Project title and info' },
    { key: 'executiveSummary' as const, label: 'Executive Summary', description: 'Key metrics overview' },
    { key: 'loadCalculations' as const, label: 'Load Calculations', description: 'Zone-by-zone loads' },
    { key: 'equipmentSelections' as const, label: 'Equipment Selections', description: 'Selected equipment' },
    { key: 'ductSystems' as const, label: 'Duct Systems', description: 'Air distribution' },
    { key: 'pipeSystems' as const, label: 'Pipe Systems', description: 'Water distribution' },
    { key: 'vrfSystems' as const, label: 'VRF Systems', description: 'VRF configuration' },
    { key: 'ventilationCalculations' as const, label: 'Ventilation Calcs', description: 'ASHRAE 62.1 results' },
    { key: 'ervSizing' as const, label: 'ERV/HRV Sizing', description: 'Energy recovery analysis' },
    { key: 'chilledWaterPlants' as const, label: 'CHW Plants', description: 'Chilled water plant sizing' },
    { key: 'hotWaterPlants' as const, label: 'HW Plants', description: 'Hot water plant sizing' },
    { key: 'smokeControl' as const, label: 'Smoke Control', description: 'NFPA 92 calculations' },
    { key: 'thermalComfort' as const, label: 'Thermal Comfort', description: 'ASHRAE 55 analysis' },
    { key: 'complianceChecks' as const, label: 'Compliance', description: 'SBC/ASHRAE 90.1 checks' },
    { key: 'acousticAnalysis' as const, label: 'Acoustic Analysis', description: 'NC compliance results' },
    { key: 'coilSelections' as const, label: 'Coil Selections', description: 'Cooling & heating coils' },
    { key: 'filterSelections' as const, label: 'Filter Selections', description: 'Air filtration schedule' },
    { key: 'terminalUnits' as const, label: 'Terminal Units', description: 'VAV boxes & FCUs' },
    { key: 'coolingTowers' as const, label: 'Cooling Towers', description: 'Heat rejection equipment' },
    { key: 'detailedAppendix' as const, label: 'Detailed Appendix', description: 'Segment schedules' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Unified Design Report
          </DialogTitle>
          <DialogDescription>
            Combine all design data into a comprehensive project report
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Project Selector */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="project">Project</Label>
            <Select 
              value={selectedProjectId} 
              onValueChange={setSelectedProjectId}
              disabled={projectsLoading}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {(projects || []).map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                    {project.client_name && ` - ${project.client_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="preview" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <DesignReportPreview 
                  data={data || null} 
                  config={config} 
                  isLoading={isLoading}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="config" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Report Sections</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {sectionOptions.map(section => (
                        <div 
                          key={section.key}
                          className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={section.key}
                            checked={config[section.key]}
                            onCheckedChange={(checked) => 
                              handleConfigChange(section.key, checked === true)
                            }
                          />
                          <div className="space-y-1">
                            <Label 
                              htmlFor={section.key} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {section.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(DEFAULT_REPORT_CONFIG)}
                      >
                        Reset to Default
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig({
                          ...config,
                          loadCalculations: true,
                          equipmentSelections: true,
                          ductSystems: true,
                          pipeSystems: true,
                          vrfSystems: true,
                          ventilationCalculations: true,
                          ervSizing: true,
                          chilledWaterPlants: true,
                          hotWaterPlants: true,
                          smokeControl: true,
                          thermalComfort: true,
                          complianceChecks: true,
                          acousticAnalysis: true,
                          coilSelections: true,
                          filterSelections: true,
                          terminalUnits: true,
                          coolingTowers: true,
                        })}
                      >
                        Select All Sections
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-4" />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!data || isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={!data || isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
