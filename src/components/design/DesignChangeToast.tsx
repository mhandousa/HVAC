import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DesignSaveEvent {
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  timestamp: number;
}

interface UseDesignChangeToastOptions {
  projectId: string | null;
  currentEntityType?: string;
  currentEntityId?: string;
  onReload?: () => void;
}

export function useDesignChangeToast({
  projectId,
  currentEntityType,
  currentEntityId,
  onReload,
}: UseDesignChangeToastOptions) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId || !user?.id) return;

    const channelName = `collaboration:project:${projectId}`;
    const channel = supabase.channel(channelName);

    channel.on('broadcast', { event: 'design_saved' }, (payload) => {
      const event = payload.payload as DesignSaveEvent;
      
      // Ignore own saves
      if (event.userId === user.id) return;

      // Check if it's the same entity we're viewing
      const isSameEntity =
        currentEntityType === event.entityType && currentEntityId === event.entityId;

      const entityLabel = formatEntityType(event.entityType);
      const message = isSameEntity
        ? `${event.userName} saved changes to this ${entityLabel.toLowerCase()}`
        : `${event.userName} saved changes to a ${entityLabel.toLowerCase()}`;

      if (isSameEntity && onReload) {
        toast.info(message, {
          duration: 10000,
          action: {
            label: 'Reload',
            onClick: onReload,
          },
        });
      } else {
        toast.info(message, { duration: 5000 });
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, user?.id, currentEntityType, currentEntityId, onReload]);

  const broadcastSave = useCallback(
    (entityType: string, entityId: string, entityName?: string, userName?: string) => {
      if (!channelRef.current || !user?.id) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'design_saved',
        payload: {
          userId: user.id,
          userName: userName || 'A team member',
          entityType,
          entityId,
          entityName,
          timestamp: Date.now(),
        } satisfies DesignSaveEvent,
      });
    },
    [user?.id]
  );

  return { broadcastSave };
}

function formatEntityType(entityType: string): string {
  const typeMap: Record<string, string> = {
    'load-calculation': 'Load Calculation',
    'load_calculation': 'Load Calculation',
    'equipment-selection': 'Equipment Selection',
    'equipment_selection': 'Equipment Selection',
    'duct-system': 'Duct System',
    'duct_system': 'Duct System',
    'pipe-system': 'Pipe System',
    'pipe_system': 'Pipe System',
    'terminal-unit': 'Terminal Unit',
    'terminal_unit': 'Terminal Unit',
    'diffuser-selection': 'Diffuser Selection',
    'diffuser_selection': 'Diffuser Selection',
    'ahu-configuration': 'AHU Configuration',
    'ahu_configuration': 'AHU Configuration',
    'chiller-selection': 'Chiller Selection',
    'chiller_selection': 'Chiller Selection',
    'boiler-selection': 'Boiler Selection',
    'boiler_selection': 'Boiler Selection',
    ventilation: 'Ventilation Calculation',
    psychrometric: 'Psychrometric Analysis',
    erv: 'ERV Sizing',
  };
  return typeMap[entityType] || entityType.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
