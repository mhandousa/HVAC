import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Equipment {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  category_id: string | null;
  tag: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  equipment_type: string | null;
  capacity_value: number | null;
  capacity_unit: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  status: string;
  specifications: unknown;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentInput {
  tag: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  equipment_type?: string;
  capacity_value?: number;
  capacity_unit?: string;
  project_id?: string;
  zone_id?: string;
  install_date?: string;
  warranty_expiry?: string;
}

export interface UpdateEquipmentInput {
  id: string;
  tag?: string;
  name?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  equipment_type?: string;
  capacity_value?: number;
  capacity_unit?: string;
  install_date?: string;
  warranty_expiry?: string;
  status?: string;
  zone_id?: string;
  // Note: project_id is automatically synced from zone_id by database trigger
  // Do not set project_id manually when zone_id is provided
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('tag', { ascending: true });

      if (error) throw error;
      return data as Equipment[];
    },
  });
}

/**
 * Creates new equipment.
 * Note: If zone_id is provided, the database trigger will automatically
 * set project_id based on the zone's location hierarchy.
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEquipmentInput) => {
      // First get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile?.organization_id) {
        throw new Error('You must belong to an organization to add equipment');
      }

      // If zone_id is set, don't manually set project_id - let the trigger handle it
      const { project_id, zone_id, ...rest } = input;
      const insertData = {
        ...rest,
        zone_id,
        // Only include project_id if zone_id is not set
        ...(zone_id ? {} : { project_id }),
        organization_id: profile.organization_id,
      };

      const { data, error } = await supabase
        .from('equipment')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add equipment');
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEquipmentInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update equipment');
    },
  });
}

// Lifecycle utilities
export function getWarrantyStatus(warranty_expiry: string | null): {
  status: 'expired' | 'expiring-soon' | 'valid' | 'unknown';
  daysRemaining: number | null;
  label: string;
  className: string;
} {
  if (!warranty_expiry) {
    return { status: 'unknown', daysRemaining: null, label: 'No warranty', className: 'bg-muted text-muted-foreground' };
  }

  const expiry = new Date(warranty_expiry);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysRemaining: diffDays, label: 'Expired', className: 'bg-destructive/10 text-destructive' };
  } else if (diffDays <= 90) {
    return { status: 'expiring-soon', daysRemaining: diffDays, label: `${diffDays} days left`, className: 'bg-warning/10 text-warning' };
  } else {
    return { status: 'valid', daysRemaining: diffDays, label: 'Valid', className: 'bg-success/10 text-success' };
  }
}

export function getEquipmentAge(install_date: string | null): {
  years: number | null;
  label: string;
} {
  if (!install_date) {
    return { years: null, label: 'Unknown age' };
  }

  const install = new Date(install_date);
  const now = new Date();
  const diffTime = now.getTime() - install.getTime();
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

  if (diffYears === 0) {
    return { years: 0, label: `${diffMonths} months old` };
  }
  return { years: diffYears, label: `${diffYears} year${diffYears !== 1 ? 's' : ''} old` };
}

export function useEquipmentWithExpiringWarranties(days: number = 90) {
  const { data: equipment = [] } = useEquipment();
  
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  return equipment.filter(eq => {
    if (!eq.warranty_expiry) return false;
    const expiry = new Date(eq.warranty_expiry);
    return expiry >= today && expiry <= futureDate;
  }).sort((a, b) => {
    return new Date(a.warranty_expiry!).getTime() - new Date(b.warranty_expiry!).getTime();
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete equipment');
    },
  });
}
