import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeficiencySeverity } from "@/lib/deficiency-types";

const DB_NAME = "commissioning-photos-db";
const DB_VERSION = 1;
const STORE_NAME = "offline-photos";

export interface OfflinePhotoMetadata {
  deficiencyTags?: string[];
  severity?: DeficiencySeverity;
  description?: string;
  isBefore?: boolean;
  capturedAt: string;
  fileName: string;
}

export interface OfflinePhoto {
  id: string;
  testId: string;
  checklistId: string;
  blob: Blob;
  metadata: OfflinePhotoMetadata;
  status: "pending" | "uploading" | "failed" | "synced";
  retryCount: number;
  createdAt: string;
  error?: string;
}

interface UseOfflinePhotoQueueReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncProgress: { current: number; total: number };
  queuePhoto: (
    testId: string,
    checklistId: string,
    blob: Blob,
    metadata: OfflinePhotoMetadata
  ) => Promise<string>;
  syncPendingPhotos: () => Promise<void>;
  getPendingPhotos: () => Promise<OfflinePhoto[]>;
  clearSyncedPhotos: () => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("testId", "testId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

async function addToStore(photo: OfflinePhoto): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(photo);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function updateInStore(photo: OfflinePhoto): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(photo);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteFromStore(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAllFromStore(): Promise<OfflinePhoto[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getByStatus(status: OfflinePhoto["status"]): Promise<OfflinePhoto[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.getAll(status);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export function useOfflinePhotoQueue(): UseOfflinePhotoQueueReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getByStatus("pending");
      const failed = await getByStatus("failed");
      setPendingCount(pending.length + failed.length);
    } catch (error) {
      console.error("Error getting pending count:", error);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing photos...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Photos will be queued for later.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updatePendingCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncPendingPhotos();
    }
  }, [isOnline, pendingCount]);

  const queuePhoto = useCallback(
    async (
      testId: string,
      checklistId: string,
      blob: Blob,
      metadata: OfflinePhotoMetadata
    ): Promise<string> => {
      const id = crypto.randomUUID();
      const photo: OfflinePhoto = {
        id,
        testId,
        checklistId,
        blob,
        metadata,
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      await addToStore(photo);
      await updatePendingCount();

      return id;
    },
    [updatePendingCount]
  );

  const uploadPhoto = async (photo: OfflinePhoto): Promise<string> => {
    const fileName = `${photo.checklistId}/${photo.testId}/${Date.now()}-${photo.metadata.fileName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("commissioning-photos")
      .upload(fileName, photo.blob, {
        contentType: photo.blob.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("commissioning-photos")
      .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    // Update test with new photo URL
    const { data: test } = await supabase
      .from("commissioning_tests")
      .select("photos_urls")
      .eq("id", photo.testId)
      .single();

    const currentUrls = (test?.photos_urls as string[]) || [];
    await supabase
      .from("commissioning_tests")
      .update({ photos_urls: [...currentUrls, photoUrl] })
      .eq("id", photo.testId);

    // Save metadata if there are deficiency tags
    if (photo.metadata.deficiencyTags?.length || photo.metadata.isBefore) {
      await supabase.from("commissioning_photo_metadata").insert({
        test_id: photo.testId,
        photo_url: photoUrl,
        deficiency_tags: photo.metadata.deficiencyTags || [],
        deficiency_severity: photo.metadata.severity || null,
        description: photo.metadata.description || null,
        is_before_photo: photo.metadata.isBefore || false,
        captured_at: photo.metadata.capturedAt,
      });
    }

    return photoUrl;
  };

  const syncPendingPhotos = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);

    try {
      const pending = await getByStatus("pending");
      const failed = await getByStatus("failed");
      const toSync = [...pending, ...failed.filter((p) => p.retryCount < 3)];

      if (toSync.length === 0) {
        setIsSyncing(false);
        return;
      }

      setSyncProgress({ current: 0, total: toSync.length });

      for (let i = 0; i < toSync.length; i++) {
        const photo = toSync[i];

        try {
          // Mark as uploading
          photo.status = "uploading";
          await updateInStore(photo);

          // Upload
          await uploadPhoto(photo);

          // Mark as synced and delete
          await deleteFromStore(photo.id);

          setSyncProgress({ current: i + 1, total: toSync.length });
        } catch (error) {
          console.error("Error uploading photo:", error);
          photo.status = "failed";
          photo.retryCount += 1;
          photo.error = error instanceof Error ? error.message : "Upload failed";
          await updateInStore(photo);
        }
      }

      await updatePendingCount();
      toast.success("Photos synced successfully!");
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync some photos");
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  const getPendingPhotos = useCallback(async (): Promise<OfflinePhoto[]> => {
    const pending = await getByStatus("pending");
    const failed = await getByStatus("failed");
    return [...pending, ...failed];
  }, []);

  const clearSyncedPhotos = useCallback(async () => {
    const synced = await getByStatus("synced");
    for (const photo of synced) {
      await deleteFromStore(photo.id);
    }
    await updatePendingCount();
  }, [updatePendingCount]);

  const removePhoto = useCallback(
    async (id: string) => {
      await deleteFromStore(id);
      await updatePendingCount();
    },
    [updatePendingCount]
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncProgress,
    queuePhoto,
    syncPendingPhotos,
    getPendingPhotos,
    clearSyncedPhotos,
    removePhoto,
  };
}
