import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface GlobalPresenceUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  currentTool: string;
  currentEntityId: string;
  isEditing: boolean;
  joinedAt: string;
}

interface UseGlobalPresenceOptions {
  projectId: string | null;
}

interface UseGlobalPresenceReturn {
  activeUsers: GlobalPresenceUser[];
  isConnected: boolean;
  usersByTool: Map<string, GlobalPresenceUser[]>;
  editingUsersCount: number;
}

export function useGlobalPresence({
  projectId,
}: UseGlobalPresenceOptions): UseGlobalPresenceReturn {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<GlobalPresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId || !user?.id) {
      setActiveUsers([]);
      setIsConnected(false);
      return;
    }

    const channelName = `collaboration:project:${projectId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: GlobalPresenceUser[] = [];

        Object.values(presenceState).forEach((presences) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presenceData = presences[0] as unknown as GlobalPresenceUser;
            // Include all users except current user
            if (presenceData.id && presenceData.id !== user.id) {
              users.push(presenceData);
            }
          }
        });

        setActiveUsers(users);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [projectId, user?.id]);

  // Group users by tool
  const usersByTool = new Map<string, GlobalPresenceUser[]>();
  activeUsers.forEach((u) => {
    const tool = u.currentTool || 'unknown';
    if (!usersByTool.has(tool)) {
      usersByTool.set(tool, []);
    }
    usersByTool.get(tool)!.push(u);
  });

  const editingUsersCount = activeUsers.filter((u) => u.isEditing).length;

  return {
    activeUsers,
    isConnected,
    usersByTool,
    editingUsersCount,
  };
}

// Helper to broadcast presence to global channel
export function useBroadcastToGlobal(
  projectId: string | null,
  entityType: string,
  entityId: string | null,
  isEditing: boolean
) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userProfileRef = useRef<{ fullName: string; avatarUrl?: string; email: string } | null>(null);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('user_id', user.id)
        .single();

      if (data) {
        userProfileRef.current = {
          fullName: data.full_name || data.email || 'Unknown User',
          avatarUrl: data.avatar_url || undefined,
          email: data.email || '',
        };
      }
    }

    fetchProfile();
  }, [user?.id]);

  // Subscribe and track
  useEffect(() => {
    if (!projectId || !user?.id || !entityId) {
      return;
    }

    const channelName = `collaboration:project:${projectId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Wait for profile
        let attempts = 0;
        while (!userProfileRef.current && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (userProfileRef.current) {
          await channel.track({
            id: user.id,
            fullName: userProfileRef.current.fullName,
            avatarUrl: userProfileRef.current.avatarUrl,
            email: userProfileRef.current.email,
            currentTool: entityType,
            currentEntityId: entityId,
            isEditing: isEditing,
            joinedAt: new Date().toISOString(),
          });
        }
      }
    });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, entityType, entityId, user?.id, isEditing]);

  // Update editing state
  const updateEditingState = useCallback(
    async (editing: boolean) => {
      if (channelRef.current && userProfileRef.current && user?.id && entityId) {
        await channelRef.current.track({
          id: user.id,
          fullName: userProfileRef.current.fullName,
          avatarUrl: userProfileRef.current.avatarUrl,
          email: userProfileRef.current.email,
          currentTool: entityType,
          currentEntityId: entityId,
          isEditing: editing,
          joinedAt: new Date().toISOString(),
        });
      }
    },
    [user?.id, entityType, entityId]
  );

  return { updateEditingState };
}
