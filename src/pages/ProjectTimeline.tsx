import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Download, Loader2, Calendar } from 'lucide-react';
import { TimelineSummaryCard } from '@/components/timeline/TimelineSummaryCard';
import { ProjectTimelineGantt } from '@/components/timeline/ProjectTimelineGantt';
import { TimelineLegend } from '@/components/timeline/TimelineLegend';
import { StageProgressBar } from '@/components/timeline/StageProgressBar';
import { MilestoneEditor } from '@/components/timeline/MilestoneEditor';
import { TimelineSetupWizard } from '@/components/timeline/TimelineSetupWizard';
import { useTimelineAnalytics } from '@/hooks/useTimelineAnalytics';
import { ProjectStageMilestone } from '@/hooks/useProjectMilestones';
import { STAGE_TIMING_CONFIGS } from '@/lib/timeline-utils';

export default function ProjectTimeline() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectStageMilestone | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
  
  // Get timeline analytics
  const { data: analytics, milestones, isLoading: analyticsLoading } = useTimelineAnalytics(projectId || null);
  
  const isLoading = projectLoading || analyticsLoading;
  const hasMilestones = milestones.length > 0;
  
  // Sort milestones by stage order
  const sortedMilestones = [...milestones].sort((a, b) => {
    const aConfig = STAGE_TIMING_CONFIGS.find(s => s.stageId === a.stage_id);
    const bConfig = STAGE_TIMING_CONFIGS.find(s => s.stageId === b.stage_id);
    return (aConfig?.order || 0) - (bConfig?.order || 0);
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">Project Timeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasMilestones && (
            <Button variant="outline" size="sm" onClick={() => setShowSetupWizard(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
        </div>
      </div>
      
      {/* No milestones state */}
      {!hasMilestones && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Timeline Set Up</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Generate milestones for all design stages based on your project dates to track progress and identify delays.
            </p>
            <Button onClick={() => setShowSetupWizard(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Set Up Timeline
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Timeline content */}
      {hasMilestones && analytics && (
        <>
          {/* Summary Card */}
          <TimelineSummaryCard analytics={analytics} projectName={project.name} />
          
          {/* Main content tabs */}
          <Tabs defaultValue="gantt" className="space-y-4">
            <TabsList>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
              <TabsTrigger value="list">Milestone List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gantt" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Project Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectTimelineGantt 
                    milestones={milestones} 
                    onMilestoneClick={setSelectedMilestone}
                  />
                  <div className="mt-4 pt-4 border-t">
                    <TimelineLegend />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">All Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {sortedMilestones.map((milestone) => (
                      <StageProgressBar
                        key={milestone.id}
                        milestone={milestone}
                        onClick={() => setSelectedMilestone(milestone)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {/* Milestone Editor Dialog */}
      <MilestoneEditor
        milestone={selectedMilestone}
        open={!!selectedMilestone}
        onOpenChange={(open) => !open && setSelectedMilestone(null)}
      />
      
      {/* Setup Wizard Dialog */}
      {project && (
        <TimelineSetupWizard
          projectId={project.id}
          organizationId={project.organization_id}
          projectStartDate={project.start_date}
          projectEndDate={project.end_date}
          open={showSetupWizard}
          onOpenChange={setShowSetupWizard}
        />
      )}
    </div>
  );
}
