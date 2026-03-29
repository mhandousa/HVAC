import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity } from 'lucide-react';
import { VibrationIsolationCalculator } from '@/components/acoustic/VibrationIsolationCalculator';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { useZoneContext } from '@/hooks/useZoneContext';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';

export default function VibrationIsolationTool() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId: storedProjectId, zoneId: storedZoneId, setContext } = useZoneContext();
  
  const projectId = searchParams.get('project') || storedProjectId;
  const zoneId = searchParams.get('zone') || storedZoneId;
  
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
            { label: 'Vibration Isolation Calculator' },
          ]}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Vibration Isolation Calculator</h1>
              <p className="text-muted-foreground">
                Select isolators for equipment mounting based on weight, speed, and floor construction
              </p>
            </div>
          </div>
        </div>

        <ToolPageHeader
          toolType="vibration-isolation"
          toolName="Vibration Isolation Calculator"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        <DataFlowImportHandler
          projectId={projectId}
          zoneId={zoneId}
          currentTool="vibration-isolation"
        />

        <VibrationIsolationCalculator />

        <DesignWorkflowNextStep
          currentPath="/design/vibration-isolation"
          projectId={projectId}
          zoneId={zoneId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
