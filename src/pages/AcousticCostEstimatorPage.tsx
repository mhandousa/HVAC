import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { AcousticCostEstimator } from '@/components/acoustic/AcousticCostEstimator';
import { useZoneAcousticAnalysis } from '@/hooks/useZoneAcousticAnalysis';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { toast } from 'sonner';

export default function AcousticCostEstimatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');

  // Get zone acoustic data if project is specified
  const { zones } = useZoneAcousticAnalysis(projectId || undefined);

  // Pre-save validation
  const { blockers, warnings } = usePreSaveValidation(projectId, 'acoustic-cost');
  
  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['zone-acoustic-analysis', projectId] });
  };

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
            { label: 'Treatment Cost Estimator' },
          ]}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acoustic Treatment Cost Estimator</h1>
              <p className="text-muted-foreground">
                Calculate material and installation costs for silencers, duct lining, and isolators
              </p>
            </div>
          </div>
        </div>

        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />

        <EditConflictWarning
          entityType="acoustic_cost"
          entityId={projectId}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />

        {projectId && (
          <DataFlowImportHandler
            projectId={projectId}
            currentTool="acoustic-cost"
            onImportEquipmentData={(data) => {
              toast.success(`Loaded ${data.selectedCount} equipment items for cost analysis`);
            }}
          />
        )}

        <AcousticCostEstimator zones={zones} />
      </div>
    </DashboardLayout>
  );
}
