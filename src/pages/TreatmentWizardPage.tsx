import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, ArrowLeft, Package, Volume2, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { TreatmentRecommendationWizard } from '@/components/acoustic/TreatmentRecommendationWizard';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';

export default function TreatmentWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [wizardOpen, setWizardOpen] = useState(false);

  // Pre-save validation
  const { blockers, warnings } = usePreSaveValidation(
    selectedProjectId || null,
    'treatment-wizard'
  );

  // Get project from URL params
  useEffect(() => {
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl) {
      setSelectedProjectId(projectFromUrl);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [searchParams, projects, selectedProjectId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/design/acoustic-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Acoustic Treatment Wizard
              </h1>
              <p className="text-muted-foreground">
                Generate optimized treatment packages for your project
              </p>
            </div>
          </div>
        </div>

        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />

        {/* Project Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Project</CardTitle>
            <CardDescription>
              Choose a project to analyze and generate treatment recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => setWizardOpen(true)}
                disabled={!selectedProjectId}
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Wizard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Volume2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Step 1: Zone Selection</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which zones need acoustic treatment based on NC exceedance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Step 2-3: Constraints</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define budget limits and performance requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Step 4-5: Packages</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compare Budget, Balanced, and Premium treatment packages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wizard Dialog */}
      <TreatmentRecommendationWizard
        projectId={selectedProjectId}
        projectName={projects.find(p => p.id === selectedProjectId)?.name}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </DashboardLayout>
  );
}
