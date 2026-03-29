import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  joinedAt: string;
  isEditing: boolean;
}

interface UsePresenceOptions {
  entityType: string;
  entityId: string | null;
  projectId?: string;
}

interface UsePresenceReturn {
  activeUsers: PresenceUser[];
  isConnected: boolean;
  trackEditing: (isEditing: boolean) => void;
  otherEditorsCount: number;
  hasOtherEditors: boolean;
}

export function usePresence({
  entityType,
  entityId,
  projectId,
}: UsePresenceOptions): UsePresenceReturn {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userProfileRef = useRef<{ fullName: string; avatarUrl?: string; email: string } | null>(null);

  // Fetch current user's profile for display
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

  // Track editing state changes
  const trackEditing = useCallback((editing: boolean) => {
    setIsEditing(editing);
    
    if (channelRef.current && user?.id && userProfileRef.current) {
      channelRef.current.track({
        id: user.id,
        fullName: userProfileRef.current.fullName,
        avatarUrl: userProfileRef.current.avatarUrl,
        email: userProfileRef.current.email,
        joinedAt: new Date().toISOString(),
        isEditing: editing,
      });
    }
  }, [user?.id]);

  // Subscribe to presence channel
  useEffect(() => {
    if (!entityId || !user?.id) {
      setActiveUsers([]);
      setIsConnected(false);
      return;
    }

    const channelName = projectId 
      ? `design:${entityType}:${projectId}:${entityId}`
      : `design:${entityType}:${entityId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Global collaboration channel for project-wide presence
    const globalChannelName = projectId ? `collaboration:project:${projectId}` : null;
    let globalChannel: RealtimeChannel | null = null;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: PresenceUser[] = [];

        Object.values(presenceState).forEach((presences) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presenceData = presences[0] as unknown as PresenceUser;
            // Exclude current user from the list
            if (presenceData.id && presenceData.id !== user.id) {
              users.push(presenceData);
            }
          }
        });

        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          // Wait for profile to be loaded before tracking
          const waitForProfile = async () => {
            let attempts = 0;
            while (!userProfileRef.current && attempts < 10) {
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
            }
            
            if (userProfileRef.current) {
              const presenceData = {
                id: user.id,
                fullName: userProfileRef.current.fullName,
                avatarUrl: userProfileRef.current.avatarUrl,
                email: userProfileRef.current.email,
                joinedAt: new Date().toISOString(),
                isEditing: isEditing,
              };

              await channel.track(presenceData);

              // Also broadcast to global channel if available
              if (globalChannelName) {
                globalChannel = supabase.channel(globalChannelName, {
                  config: { presence: { key: user.id } },
                });

                globalChannel.subscribe(async (globalStatus) => {
                  if (globalStatus === 'SUBSCRIBED') {
                    await globalChannel!.track({
                      ...presenceData,
                      currentTool: entityType,
                      currentEntityId: entityId,
                    });
                  }
                });
              }
            }
          };
          
          waitForProfile();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      if (globalChannel) {
        globalChannel.untrack();
        supabase.removeChannel(globalChannel);
      }
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [entityType, entityId, projectId, user?.id, isEditing]);

  const otherEditorsCount = activeUsers.filter(u => u.isEditing).length;
  const hasOtherEditors = otherEditorsCount > 0;

  return {
    activeUsers,
    isConnected,
    trackEditing,
    otherEditorsCount,
    hasOtherEditors,
  };
}
