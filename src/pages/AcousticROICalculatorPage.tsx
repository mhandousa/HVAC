import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AcousticROICalculator } from '@/components/acoustic/AcousticROICalculator';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useZoneAcousticAnalysis } from '@/hooks/useZoneAcousticAnalysis';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';

export default function AcousticROICalculatorPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const { projectId } = useZoneContext();
  
  const zoneId = searchParams.get('zone') || undefined;
  const costParam = searchParams.get('cost');
  const treatmentCost = costParam ? Number(costParam) : undefined;

  // Get acoustic data
  const { zones } = useZoneAcousticAnalysis(projectId || undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Acoustic Dashboard', href: '/design/acoustic-dashboard' },
            { label: 'ROI Calculator' },
          ]}
        />

        <ToolPageHeader
          toolType="acoustic-roi"
          toolName="Acoustic ROI Calculator"
          projectId={projectId}
          showLockButton={false}
          showValidation={true}
        />

        <AcousticROICalculator
          zones={zones}
          selectedZoneId={zoneId}
          treatmentCost={treatmentCost}
          onZoneChange={(id) => {
            const params = new URLSearchParams(searchParams);
            params.set('zone', id);
            navigate(`?${params.toString()}`, { replace: true });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
