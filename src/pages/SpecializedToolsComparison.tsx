import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, Table2, BarChart3, ChevronsUpDown, Check, X, Wrench } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSpecializedToolsComparison } from '@/hooks/useSpecializedToolsComparison';
import { SpecializedToolsComparisonStats } from '@/components/design/SpecializedToolsComparisonStats';
import { SpecializedToolsComparisonTable } from '@/components/design/SpecializedToolsComparisonTable';
import { SpecializedToolsComparisonChart, SpecializedToolsScoreDistribution } from '@/components/design/SpecializedToolsComparisonChart';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function SpecializedToolsComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    projectIdFromUrl ? [projectIdFromUrl] : []
  );
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  
  const { data: projectsData } = useProjects();
  const projects = projectsData || [];
  
  const { data: comparisonData, isLoading } = useSpecializedToolsComparison(
    selectedProjectIds.length > 0 ? selectedProjectIds : undefined
  );

  // Sync URL with single project selection
  useEffect(() => {
    if (selectedProjectIds.length === 1) {
      setSearchParams({ project: selectedProjectIds[0] });
    } else if (selectedProjectIds.length === 0) {
      setSearchParams({});
    }
  }, [selectedProjectIds, setSearchParams]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const clearSelection = () => {
    setSelectedProjectIds([]);
  };

  const handleExport = () => {
    if (!comparisonData) return;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Specialized Tools Comparison Report'],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Summary Statistics'],
      ['Total Projects', comparisonData.summary.totalProjects],
      ['Average Score', `${comparisonData.summary.averageScore}%`],
      ['Projects with Hot Water Plant', comparisonData.summary.projectsWithHotWaterPlant],
      ['Projects with Smoke Control', comparisonData.summary.projectsWithSmokeControl],
      ['Projects with Thermal Comfort', comparisonData.summary.projectsWithThermalComfort],
      ['Projects with SBC Compliance', comparisonData.summary.projectsWithSBCCompliance],
      ['Fully Complete Projects', comparisonData.summary.fullyCompleteProjects],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Comparison detail sheet
    const detailData = [
      ['Project', 'Location', 'Status', 'HW Plant', 'HW Count', 'Smoke Control', 'Smoke Count', 
       'Thermal Comfort', 'Thermal Count', 'SBC Compliance', 'SBC Count', 'Score'],
      ...comparisonData.projects.map(p => [
        p.projectName,
        p.projectLocation || '',
        p.projectStatus,
        p.hasHotWaterPlant ? 'Yes' : 'No',
        p.hotWaterPlantCount,
        p.hasSmokeControl ? 'Yes' : 'No',
        p.smokeControlCount,
        p.hasThermalComfort ? 'Yes' : 'No',
        p.thermalComfortCount,
        p.hasSBCCompliance ? 'Yes' : 'No',
        p.sbcComplianceCount,
        `${p.specializedToolsScore}%`,
      ]),
    ];
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Project Comparison');

    // Individual tools sheet
    const toolEntries: any[][] = [
      ['Project', 'Tool Type', 'Entry Name', 'Created Date'],
    ];
    comparisonData.projects.forEach(project => {
      project.hotWaterPlantDetails.forEach(d => {
        toolEntries.push([project.projectName, 'Hot Water Plant', d.name, d.created_at]);
      });
      project.smokeControlDetails.forEach(d => {
        toolEntries.push([project.projectName, 'Smoke Control', d.name, d.created_at]);
      });
      project.thermalComfortDetails.forEach(d => {
        toolEntries.push([project.projectName, 'Thermal Comfort', d.name, d.created_at]);
      });
      project.sbcComplianceDetails.forEach(d => {
        toolEntries.push([project.projectName, 'SBC Compliance', d.name, d.created_at]);
      });
    });
    const toolsSheet = XLSX.utils.aoa_to_sheet(toolEntries);
    XLSX.utils.book_append_sheet(workbook, toolsSheet, 'Tool Entries');

    XLSX.writeFile(workbook, `specialized-tools-comparison-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Design Health', href: `/design/health${selectedProjectIds.length === 1 ? `?project=${selectedProjectIds[0]}` : ''}` },
            { label: 'Specialized Tools' },
          ]}
        />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Specialized Tools Comparison</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Compare specialized design tools completion across projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <Popover open={projectSelectorOpen} onOpenChange={setProjectSelectorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between">
                  {selectedProjectIds.length === 0 
                    ? 'All Projects' 
                    : `${selectedProjectIds.length} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList>
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => toggleProject(project.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProjectIds.includes(project.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {selectedProjectIds.length > 0 && (
                  <div className="border-t p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={clearSelection}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button onClick={handleExport} disabled={!comparisonData || comparisonData.projects.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Selected projects badges */}
        {selectedProjectIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedProjectIds.map(id => {
              const project = projects.find(p => p.id === id);
              return project ? (
                <Badge key={id} variant="secondary" className="gap-1">
                  {project.name}
                  <button
                    onClick={() => toggleProject(id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}

        {/* Stats Cards */}
        <SpecializedToolsComparisonStats 
          summary={comparisonData?.summary || {
            totalProjects: 0,
            projectsWithHotWaterPlant: 0,
            projectsWithSmokeControl: 0,
            projectsWithThermalComfort: 0,
            projectsWithSBCCompliance: 0,
            fullyCompleteProjects: 0,
            averageScore: 0,
          }} 
          isLoading={isLoading}
        />

        {/* Main Content with Tabs */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Chart View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <SpecializedToolsComparisonTable 
              projects={comparisonData?.projects || []} 
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="chart" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SpecializedToolsComparisonChart 
                  projects={comparisonData?.projects || []} 
                  isLoading={isLoading}
                />
              </div>
              <div>
                <SpecializedToolsScoreDistribution 
                  projects={comparisonData?.projects || []} 
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
