import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function usePhotoAnnotation() {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveAnnotatedPhoto = async (
    testId: string,
    originalUrl: string,
    annotatedBlob: Blob
  ): Promise<string> => {
    setIsSaving(true);

    try {
      // Generate file name based on original
      const originalFileName = originalUrl.split('/').pop() || 'photo';
      const baseName = originalFileName.replace(/\.[^/.]+$/, '');
      const annotatedFileName = `${testId}/${baseName}-annotated-${Date.now()}.jpg`;

      // Upload annotated image
      const { error: uploadError } = await supabase.storage
        .from('commissioning-photos')
        .upload(annotatedFileName, annotatedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('commissioning-photos')
        .getPublicUrl(annotatedFileName);

      const annotatedUrl = urlData.publicUrl;

      // Get current test photos
      const { data: testData, error: fetchError } = await supabase
        .from('commissioning_tests')
        .select('photos_urls')
        .eq('id', testId)
        .single();

      if (fetchError) throw fetchError;

      const currentPhotos = (testData?.photos_urls as string[]) || [];
      
      // Add annotated URL after the original
      const originalIndex = currentPhotos.indexOf(originalUrl);
      const updatedPhotos = [...currentPhotos];
      
      if (originalIndex !== -1) {
        // Insert annotated version right after original
        updatedPhotos.splice(originalIndex + 1, 0, annotatedUrl);
      } else {
        // Just append if original not found
        updatedPhotos.push(annotatedUrl);
      }

      // Update test record
      const { error: updateError } = await supabase
        .from('commissioning_tests')
        .update({ photos_urls: updatedPhotos })
        .eq('id', testId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['commissioning-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['commissioning-tests'] });

      toast({
        title: 'Annotation saved',
        description: 'The annotated photo has been saved successfully.',
      });

      return annotatedUrl;
    } catch (error) {
      console.error('Error saving annotated photo:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save annotated photo',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const isAnnotatedPhoto = (photoUrl: string): boolean => {
    return photoUrl.includes('-annotated-');
  };

  const getOriginalPhotoUrl = (annotatedUrl: string): string | null => {
    // Try to find the original photo from an annotated URL
    const match = annotatedUrl.match(/(.+)-annotated-\d+\.jpg$/);
    if (match) {
      return `${match[1]}.jpg`;
    }
    return null;
  };

  return {
    saveAnnotatedPhoto,
    isAnnotatedPhoto,
    getOriginalPhotoUrl,
    isSaving,
  };
}
