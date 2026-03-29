import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers } from 'lucide-react';
import { DuctLiningOptimizer as DuctLiningOptimizerComponent } from '@/components/acoustic/DuctLiningOptimizer';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { useZoneContext } from '@/hooks/useZoneContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';

export default function DuctLiningOptimizerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId: storedProjectId, zoneId: storedZoneId, setContext } = useZoneContext();
  
  const projectId = searchParams.get('project') || storedProjectId;
  const zoneId = searchParams.get('zone') || storedZoneId;
  
  const { blockers, warnings } = usePreSaveValidation(
    projectId || null,
    'duct-lining'
  );
  
  useEffect(() => {
    if (projectId) {
      setContext(projectId, zoneId || null, { replace: true });
    }
  }, [projectId, zoneId, setContext]);

  const handleBack = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/design');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Acoustic Engineering', href: '/design' },
            { label: 'Duct Lining Optimizer' },
          ]}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Duct Lining Optimizer</h1>
              <p className="text-muted-foreground">
                Calculate lining length and type to achieve target NC reduction
              </p>
            </div>
          </div>
        </div>

        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />

        <DuctLiningOptimizerComponent />

        <DesignWorkflowNextStep
          currentPath="/design/duct-lining-optimizer"
          projectId={projectId}
          zoneId={zoneId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
