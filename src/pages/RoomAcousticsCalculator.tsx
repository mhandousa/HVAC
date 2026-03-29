import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { RoomAcousticsCalculator as RoomAcousticsCalculatorComponent } from '@/components/acoustic/RoomAcousticsCalculator';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { useZoneContext } from '@/hooks/useZoneContext';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';

export default function RoomAcousticsCalculatorPage() {
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
            { label: 'Room Acoustics Calculator' },
          ]}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Room Acoustics Calculator</h1>
              <p className="text-muted-foreground">
                Convert sound power to pressure with room absorption and distance effects
              </p>
            </div>
          </div>
        </div>

        <ToolPageHeader
          toolType="room-acoustics"
          toolName="Room Acoustics Calculator"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        <RoomAcousticsCalculatorComponent />

        <DesignWorkflowNextStep
          currentPath="/design/room-acoustics"
          projectId={projectId}
          zoneId={zoneId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
