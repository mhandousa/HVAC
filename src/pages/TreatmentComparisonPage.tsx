import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { TreatmentComparisonTool } from '@/components/acoustic/TreatmentComparisonTool';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';
import { toast } from 'sonner';

export default function TreatmentComparisonPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const ductSize = searchParams.get('size') ? Number(searchParams.get('size')) : undefined;
  const attenuation = searchParams.get('attenuation') ? Number(searchParams.get('attenuation')) : undefined;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSelect = (silencer: ManufacturerSilencer) => {
    toast.success(`Selected ${silencer.model}`, {
      description: 'Navigate to cost estimator to add this silencer.',
      action: {
        label: 'Go to Estimator',
        onClick: () => navigate('/design/acoustic-cost-estimator'),
      },
    });
  };

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
            { label: 'Treatment Comparison' },
          ]}
        />

        <TreatmentComparisonTool
          defaultDuctSize={ductSize}
          defaultAttenuation={attenuation}
          onSelect={handleSelect}
        />
      </div>
    </DashboardLayout>
  );
}
