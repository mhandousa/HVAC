import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { LifecycleCostAnalyzer } from '@/components/acoustic/LifecycleCostAnalyzer';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { toast } from 'sonner';

export default function LifecycleCostAnalyzerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');

  // Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectId, 'lifecycle-cost', { checkStageLock: true });

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
            { label: 'Lifecycle Cost Analyzer' },
          ]}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Lifecycle Cost Analyzer</h1>
              <p className="text-muted-foreground">
                Compare total cost of ownership including maintenance, replacements, and NPV analysis
              </p>
            </div>
          </div>
        </div>

        <ToolPageHeader
          toolType="lifecycle-cost"
          toolName="Lifecycle Cost Analyzer"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {projectId && (
          <DataFlowImportHandler
            projectId={projectId}
            currentTool="lifecycle-cost"
            onImportEquipmentData={(data) => {
              toast.success(`Loaded ${data.selectedCount} equipment items for lifecycle analysis`);
            }}
          />
        )}

        <LifecycleCostAnalyzer />
      </div>
    </DashboardLayout>
  );
}
