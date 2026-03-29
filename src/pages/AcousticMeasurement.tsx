import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileNCMeasurementWorkflow } from '@/components/commissioning/mobile/MobileNCMeasurementWorkflow';
import { useCommissioningChecklists } from '@/hooks/useCommissioning';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';

interface AcousticDesignData {
  zone_id?: string;
  zone_name?: string;
  floor_name?: string;
  space_type?: string;
  target_nc?: number;
}

interface AcousticInstalledData {
  measured_nc?: number;
  measurement_date?: string;
  measurement_positions?: {
    position: string;
    nc_reading: number;
  }[];
  ambient_conditions?: {
    hvac_mode?: string;
    background_nc?: number;
  };
  technician_notes?: string;
  equipment_used?: string;
  photos?: string[];
}

export default function AcousticMeasurement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const zoneIdParam = searchParams.get('zoneId');
  const autoStart = searchParams.get('autoStart') === 'true';
  
  const { checklists, isLoading } = useCommissioningChecklists(projectId);
  // Pre-save validation
  const { blockers, warnings, canSave } = usePreSaveValidation(projectId || null, 'acoustic-measurement');

  // Filter to acoustic checklists
  const acousticChecklists = (checklists || []).filter(c => {
    const designData = c.design_data as AcousticDesignData | null;
    return designData?.target_nc !== undefined;
  });

  // Transform to zone format
  const zones = acousticChecklists.map(c => {
    const designData = c.design_data as AcousticDesignData | null;
    const installedData = c.installed_data as AcousticInstalledData | null;
    
    return {
      id: c.id,
      name: designData?.zone_name || c.equipment_tag || 'Unknown Zone',
      floorName: designData?.floor_name || '',
      targetNC: designData?.target_nc ?? 40,
      status: installedData?.measured_nc !== undefined ? 'completed' as const : 'pending' as const,
    };
  });

  const handleSubmit = async (data: {
    zoneId: string;
    measuredNC: number;
    positions: { position: string; nc_reading: number }[];
    notes: string;
    equipmentModel: string;
    hvacMode: string;
    backgroundNC: number | null;
    photos: string[];
  }) => {
    // Check if save is allowed
    if (!canSave) {
      toast.error('Cannot save: Stage is locked or has validation errors');
      return;
    }
    const checklist = acousticChecklists.find(c => c.id === data.zoneId);
    if (!checklist) return;

    const installedData: AcousticInstalledData = {
      measured_nc: data.measuredNC,
      measurement_date: new Date().toISOString(),
      measurement_positions: data.positions,
      ambient_conditions: {
        hvac_mode: data.hvacMode,
        background_nc: data.backgroundNC ?? undefined,
      },
      technician_notes: data.notes,
      equipment_used: data.equipmentModel,
      photos: data.photos,
    };

    // Determine overall status
    const designData = checklist.design_data as AcousticDesignData | null;
    const targetNC = designData?.target_nc ?? 40;
    const delta = data.measuredNC - targetNC;
    const overallStatus = delta <= 0 ? 'pass' : delta <= 5 ? 'pass' : 'fail';

    try {
      await supabase
        .from('commissioning_checklists')
        .update({
          installed_data: installedData as unknown as Json,
          overall_status: overallStatus,
          verified_at: new Date().toISOString(),
        })
        .eq('id', data.zoneId);
      
      toast.success('Measurement saved successfully');
      navigate(`/commissioning`);
    } catch (error) {
      console.error('Error saving measurement:', error);
      toast.error('Failed to save measurement');
    }
  };

  const handleClose = () => {
    navigate(projectId ? `/commissioning?projectId=${projectId}` : '/commissioning');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground mb-4">
          No acoustic verification zones found for this project.
        </p>
        <button 
          onClick={handleClose}
          className="text-primary underline"
        >
          Return to Commissioning
        </button>
      </div>
    );
  }

  return (
    <MobileNCMeasurementWorkflow
      zones={zones}
      onSubmit={handleSubmit}
      onClose={handleClose}
      initialZoneId={zoneIdParam || undefined}
      autoStart={autoStart}
    />
  );
}
