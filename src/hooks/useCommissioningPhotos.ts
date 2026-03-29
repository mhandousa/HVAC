import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useCommissioningPhotos() {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadPhotos = async (testId: string, files: File[]): Promise<string[]> => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${testId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('commissioning-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('commissioning-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload one or more photos',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAnnotatedPhoto = async (
    testId: string,
    blob: Blob,
    originalFileName?: string
  ): Promise<string> => {
    setIsUploading(true);

    try {
      const baseName = originalFileName?.replace(/\.[^/.]+$/, '') || 'photo';
      const fileName = `${testId}/${baseName}-annotated-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('commissioning-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('commissioning-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading annotated photo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload annotated photo',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (testId: string, photoUrl: string): Promise<void> => {
    try {
      // Extract the file path from the URL
      const urlParts = photoUrl.split('/commissioning-photos/');
      if (urlParts.length < 2) throw new Error('Invalid photo URL');
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('commissioning-photos')
        .remove([filePath]);

      if (error) throw error;

      toast({ title: 'Photo deleted' });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTestPhotos = async (
    testId: string,
    currentPhotos: string[],
    newPhotos: string[]
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('commissioning_tests')
        .update({ photos_urls: [...currentPhotos, ...newPhotos] })
        .eq('id', testId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests'] });
    } catch (error) {
      console.error('Error updating test photos:', error);
      throw error;
    }
  };

  const removePhotoFromTest = async (
    testId: string,
    currentPhotos: string[],
    photoToRemove: string
  ): Promise<void> => {
    try {
      // Delete from storage
      await deletePhoto(testId, photoToRemove);

      // Update the test record
      const updatedPhotos = currentPhotos.filter(url => url !== photoToRemove);
      const { error } = await supabase
        .from('commissioning_tests')
        .update({ photos_urls: updatedPhotos.length > 0 ? updatedPhotos : null })
        .eq('id', testId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests'] });
    } catch (error) {
      console.error('Error removing photo from test:', error);
      throw error;
    }
  };

  const getPhotosForCertificate = async (photoUrls: string[]): Promise<{ url: string; base64: string }[]> => {
    const results: { url: string; base64: string }[] = [];

    for (const url of photoUrls) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        results.push({ url, base64 });
      } catch (error) {
        console.error('Error fetching photo for certificate:', error);
        // Skip failed photos
      }
    }

    return results;
  };

  return {
    uploadPhotos,
    uploadAnnotatedPhoto,
    deletePhoto,
    updateTestPhotos,
    removePhotoFromTest,
    getPhotosForCertificate,
    isUploading,
  };
}
