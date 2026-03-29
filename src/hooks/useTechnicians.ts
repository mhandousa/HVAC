import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, Profile } from './useOrganization';

export interface Technician {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

export function useTechnicians() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['technicians', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone, avatar_url, role')
        .eq('organization_id', organization.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Technician[];
    },
    enabled: !!organization?.id,
  });
}
