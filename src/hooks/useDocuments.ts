import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';

export interface Document {
  id: string;
  organization_id: string;
  project_id: string | null;
  equipment_id: string | null;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  // Joined data
  equipment?: {
    name: string;
    tag: string;
  } | null;
  project?: {
    name: string;
  } | null;
}

export interface UploadDocumentInput {
  file: File;
  name: string;
  document_type?: string;
  equipment_id?: string;
  project_id?: string;
}

export function useDocuments() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['documents', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          equipment(name, tag),
          project:projects(name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!organization?.id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      if (!organization?.id) throw new Error('No organization found');

      // Create unique file path
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, input.file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          organization_id: organization.id,
          uploaded_by: profile?.id,
          name: input.name,
          file_path: filePath,
          file_type: input.file.type,
          file_size: input.file.size,
          document_type: input.document_type,
          equipment_id: input.equipment_id || null,
          project_id: input.project_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;
      return data;
    },
  });
}

export function getDocumentUrl(filePath: string): string {
  const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}
