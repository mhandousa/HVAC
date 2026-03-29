import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoMetadata {
  id: string;
  test_id: string;
  photo_url: string;
  deficiency_tags: string[];
  deficiency_severity: string | null;
  description: string | null;
  is_before_photo: boolean;
  related_after_photo_url: string | null;
  remediation_notes: string | null;
  remediation_completed_at: string | null;
  captured_at: string;
}

interface UsePhotoComparisonReturn {
  isLoading: boolean;
  markAsBefore: (testId: string, photoUrl: string) => Promise<void>;
  linkAfterPhoto: (beforePhotoId: string, afterPhotoUrl: string) => Promise<void>;
  saveRemediationNotes: (metadataId: string, notes: string) => Promise<void>;
  getBeforePhotos: (testId: string) => Promise<PhotoMetadata[]>;
  getComparisonPairs: (testId: string) => Promise<Array<{
    before: PhotoMetadata;
    after: PhotoMetadata | null;
  }>>;
  unlinkPhotos: (beforePhotoId: string) => Promise<void>;
}

export function usePhotoComparison(): UsePhotoComparisonReturn {
  const [isLoading, setIsLoading] = useState(false);

  const markAsBefore = useCallback(async (testId: string, photoUrl: string) => {
    setIsLoading(true);
    try {
      // Check if metadata already exists
      const { data: existing } = await supabase
        .from("commissioning_photo_metadata")
        .select("id")
        .eq("test_id", testId)
        .eq("photo_url", photoUrl)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from("commissioning_photo_metadata")
          .update({ is_before_photo: true })
          .eq("id", existing.id);
      } else {
        // Create new metadata
        await supabase.from("commissioning_photo_metadata").insert({
          test_id: testId,
          photo_url: photoUrl,
          is_before_photo: true,
        });
      }

      toast.success("Photo marked as 'Before' for comparison");
    } catch (error) {
      console.error("Error marking as before:", error);
      toast.error("Failed to mark photo");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkAfterPhoto = useCallback(
    async (beforePhotoId: string, afterPhotoUrl: string) => {
      setIsLoading(true);
      try {
        await supabase
          .from("commissioning_photo_metadata")
          .update({
            related_after_photo_url: afterPhotoUrl,
            remediation_completed_at: new Date().toISOString(),
          })
          .eq("id", beforePhotoId);

        toast.success("After photo linked for comparison");
      } catch (error) {
        console.error("Error linking after photo:", error);
        toast.error("Failed to link photos");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const saveRemediationNotes = useCallback(
    async (metadataId: string, notes: string) => {
      setIsLoading(true);
      try {
        await supabase
          .from("commissioning_photo_metadata")
          .update({ remediation_notes: notes })
          .eq("id", metadataId);

        toast.success("Remediation notes saved");
      } catch (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getBeforePhotos = useCallback(async (testId: string): Promise<PhotoMetadata[]> => {
    const { data, error } = await supabase
      .from("commissioning_photo_metadata")
      .select("*")
      .eq("test_id", testId)
      .eq("is_before_photo", true);

    if (error) throw error;
    return (data || []) as PhotoMetadata[];
  }, []);

  const getComparisonPairs = useCallback(
    async (testId: string): Promise<Array<{ before: PhotoMetadata; after: PhotoMetadata | null }>> => {
      const beforePhotos = await getBeforePhotos(testId);
      
      return beforePhotos.map((before) => ({
        before,
        after: before.related_after_photo_url
          ? {
              ...before,
              photo_url: before.related_after_photo_url,
              is_before_photo: false,
            }
          : null,
      }));
    },
    [getBeforePhotos]
  );

  const unlinkPhotos = useCallback(async (beforePhotoId: string) => {
    setIsLoading(true);
    try {
      await supabase
        .from("commissioning_photo_metadata")
        .update({
          related_after_photo_url: null,
          remediation_completed_at: null,
          remediation_notes: null,
        })
        .eq("id", beforePhotoId);

      toast.success("Photos unlinked");
    } catch (error) {
      console.error("Error unlinking photos:", error);
      toast.error("Failed to unlink photos");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    markAsBefore,
    linkAfterPhoto,
    saveRemediationNotes,
    getBeforePhotos,
    getComparisonPairs,
    unlinkPhotos,
  };
}
