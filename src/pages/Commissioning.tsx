import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Plus,
  FileText,
  ListChecks,
  Volume2,
} from 'lucide-react';
import { useCommissioningProjects, useCommissioningChecklists, useCommissioningTests } from '@/hooks/useCommissioning';
import { useProjects } from '@/hooks/useProjects';
import { useCommissioningPhotos } from '@/hooks/useCommissioningPhotos';
import { CommissioningProjectList } from '@/components/commissioning/CommissioningProjectList';
import { CommissioningChecklistCard } from '@/components/commissioning/CommissioningChecklistCard';
import { AcousticChecklistCard } from '@/components/commissioning/AcousticChecklistCard';
import { AcousticCommissioningSummary } from '@/components/commissioning/AcousticCommissioningSummary';
import { CommissioningReportExport } from '@/components/commissioning/CommissioningReportExport';
import { AddChecklistWithEquipmentDialog } from '@/components/commissioning/AddChecklistWithEquipmentDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';

export default function Commissioning() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddChecklistDialog, setShowAddChecklistDialog] = useState(false);
  const { data: projects } = useProjects();
  
  const {
    projects: commissioningProjects,
    isLoading,
    createProject,
  } = useCommissioningProjects();

  const {
    checklists: projectChecklists,
    updateChecklist,
  } = useCommissioningChecklists(selectedProjectId || '');

  // Get tests for all checklists
  const allChecklistIds = (projectChecklists || []).map(c => c.id);
  const firstChecklistId = allChecklistIds[0] || '';
  const { tests, createTest } = useCommissioningTests(firstChecklistId);

  const selectedCommissioningProject = (commissioningProjects || []).find(p => p.id === selectedProjectId);
  const { uploadPhotos, isUploading } = useCommissioningPhotos();
  const { toast } = useToast();

  // Stats
  const totalProjects = (commissioningProjects || []).length;
  const completedProjects = (commissioningProjects || []).filter(p => p.status === 'completed').length;
  const inProgressProjects = (commissioningProjects || []).filter(p => p.status === 'in_progress').length;
  const totalChecklists = (projectChecklists || []).length;
  const completedChecklists = (projectChecklists || []).filter(c => c.overall_status === 'passed').length;

  // Separate acoustic vs equipment checklists
  const acousticChecklists = (projectChecklists || []).filter(c => {
    const designData = c.design_data as any;
    return designData?.target_nc !== undefined;
  });
  const equipmentChecklists = (projectChecklists || []).filter(c => {
    const designData = c.design_data as any;
    return designData?.target_nc === undefined;
  });

  // Handle adding test with photos
  const handleAddTest = useCallback(async (checklistId: string, data: any) => {
    try {
      const { photos, ...testData } = data;
      
      // If photos are included, upload them first
      let photos_urls: string[] | undefined;
      if (photos && photos.length > 0) {
        // Generate a temporary ID for file organization
        const tempId = `temp-${Date.now()}`;
        photos_urls = await uploadPhotos(tempId, photos);
      }
      
      // Create the test with photo URLs
      createTest.mutate({
        ...testData,
        photos_urls,
      });
    } catch (error) {
      console.error('Error adding test with photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to add test',
        variant: 'destructive',
      });
    }
  }, [createTest, uploadPhotos, toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              HVAC Commissioning
            </h1>
            <p className="text-muted-foreground mt-1">
              Equipment commissioning checklists with design vs. installed verification
            </p>
          </div>
          <Button onClick={() => {
            if (projects?.[0]) {
              createProject.mutate({
                name: `Commissioning - ${new Date().toLocaleDateString()}`,
                project_id: projects[0].id,
              });
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Commissioning Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Checklists</p>
                  <p className="text-2xl font-bold">{completedChecklists}/{totalChecklists}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ListChecks className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              {totalChecklists > 0 && (
                <Progress 
                  value={(completedChecklists / totalChecklists) * 100} 
                  className="mt-3 h-2"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">
              <Building2 className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="checklists" disabled={!selectedProjectId}>
              <ListChecks className="h-4 w-4 mr-2" />
              Checklists
              {selectedProjectId && totalChecklists > 0 && (
                <Badge variant="secondary" className="ml-2">{totalChecklists}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" disabled={!selectedProjectId}>
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            {(commissioningProjects || []).length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No Commissioning Projects"
                description="Create your first commissioning project to start tracking equipment verification."
                action={{
                  label: 'Create Project',
                  onClick: () => {
                    if (projects?.[0]) {
                      createProject.mutate({
                        name: `Commissioning - ${new Date().toLocaleDateString()}`,
                        project_id: projects[0].id,
                      });
                    }
                  }
                }}
              />
            ) : (
              <CommissioningProjectList
                projects={commissioningProjects || []}
                selectedId={selectedProjectId}
                onSelect={setSelectedProjectId}
              />
            )}
          </TabsContent>

          <TabsContent value="checklists" className="space-y-4">
            {!selectedProjectId ? (
              <EmptyState
                icon={ListChecks}
                title="Select a Project"
                description="Choose a commissioning project from the Projects tab to view its checklists."
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Equipment Checklists</h3>
                  <Button onClick={() => setShowAddChecklistDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Checklist
                  </Button>
                </div>
                
                {(projectChecklists || []).length === 0 ? (
                  <EmptyState
                    icon={ListChecks}
                    title="No Checklists"
                    description="Add equipment checklists to this commissioning project."
                    action={{
                      label: 'Add Checklist',
                      onClick: () => setShowAddChecklistDialog(true),
                    }}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Acoustic Checklists Section */}
                    {acousticChecklists.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Acoustic Verification</h4>
                          <Badge variant="secondary">{acousticChecklists.length}</Badge>
                        </div>
                        <AcousticCommissioningSummary checklists={acousticChecklists as any} />
                        <div className="grid gap-4">
                          {acousticChecklists.map((checklist) => (
                            <AcousticChecklistCard
                              key={checklist.id}
                              checklist={checklist}
                              tests={(checklist.tests || []) as any}
                              onUpdateChecklist={(data) => updateChecklist.mutate({ id: data.id, overall_status: data.overall_status as any })}
                              onAddTest={(data) => handleAddTest(checklist.id, data)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Equipment Checklists Section */}
                    {equipmentChecklists.length > 0 && (
                      <div className="space-y-4">
                        {acousticChecklists.length > 0 && (
                          <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Equipment Verification</h4>
                            <Badge variant="secondary">{equipmentChecklists.length}</Badge>
                          </div>
                        )}
                        <div className="grid gap-4">
                          {equipmentChecklists.map((checklist) => (
                            <CommissioningChecklistCard
                              key={checklist.id}
                              checklist={checklist}
                              tests={(checklist.tests || []) as any}
                              onUpdateChecklist={(data) => updateChecklist.mutate({ id: data.id, overall_status: data.overall_status as any })}
                              onAddTest={(data) => handleAddTest(checklist.id, data)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {selectedCommissioningProject ? (
              <CommissioningReportExport
                project={selectedCommissioningProject as any}
                checklists={(projectChecklists || []) as any}
                tests={(tests || []) as any}
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="Select a Project"
                description="Choose a commissioning project to generate reports."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Checklist Dialog */}
      {selectedProjectId && (
        <AddChecklistWithEquipmentDialog
          projectId={selectedProjectId}
          open={showAddChecklistDialog}
          onOpenChange={setShowAddChecklistDialog}
        />
      )}
    </DashboardLayout>
  );
}
