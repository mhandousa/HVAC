import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Camera, X, Upload, Loader2, ChevronDown, Tag, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CameraCapture } from './CameraCapture';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { DeficiencyTagSelector } from './DeficiencyTagSelector';
import { useOfflinePhotoQueue, OfflinePhotoMetadata } from '@/hooks/useOfflinePhotoQueue';
import { DeficiencySeverity } from '@/lib/deficiency-types';

interface PhotoUploadButtonProps {
  onPhotosSelected: (files: File[], metadata?: OfflinePhotoMetadata) => void;
  selectedPhotos: File[];
  onRemovePhoto: (index: number) => void;
  isUploading?: boolean;
  maxPhotos?: number;
  className?: string;
  testId?: string;
  checklistId?: string;
}

export function PhotoUploadButton({
  onPhotosSelected,
  selectedPhotos,
  onRemovePhoto,
  isUploading = false,
  maxPhotos = 5,
  className,
  testId,
  checklistId,
}: PhotoUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isBeforePhoto, setIsBeforePhoto] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<DeficiencySeverity | null>(null);
  const [description, setDescription] = useState('');
  
  const isMobile = useIsMobile();
  const { isOnline, pendingCount, queuePhoto } = useOfflinePhotoQueue();

  const createMetadata = (fileName: string): OfflinePhotoMetadata => ({
    deficiencyTags: selectedTags.length > 0 ? selectedTags : undefined,
    severity: severity || undefined,
    description: description || undefined,
    isBefore: isBeforePhoto,
    capturedAt: new Date().toISOString(),
    fileName,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxPhotos - selectedPhotos.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      if (!isOnline && testId && checklistId) {
        // Queue for offline upload
        for (const file of filesToAdd) {
          await queuePhoto(testId, checklistId, file, createMetadata(file.name));
        }
      } else {
        const metadata = createMetadata(filesToAdd[0].name);
        onPhotosSelected(filesToAdd, metadata);
      }
    }
    
    // Reset input and form state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    resetForm();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    const remainingSlots = maxPhotos - selectedPhotos.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      if (!isOnline && testId && checklistId) {
        for (const file of filesToAdd) {
          await queuePhoto(testId, checklistId, file, createMetadata(file.name));
        }
      } else {
        const metadata = createMetadata(filesToAdd[0].name);
        onPhotosSelected(filesToAdd, metadata);
      }
    }
    resetForm();
  };

  const handleCameraCapture = async (file: File) => {
    const remainingSlots = maxPhotos - selectedPhotos.length;
    if (remainingSlots > 0) {
      if (!isOnline && testId && checklistId) {
        await queuePhoto(testId, checklistId, file, createMetadata(file.name));
      } else {
        const metadata = createMetadata(file.name);
        onPhotosSelected([file], metadata);
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setIsBeforePhoto(false);
    setSelectedTags([]);
    setSeverity(null);
    setDescription('');
    setShowTagging(false);
  };

  const canAddMore = selectedPhotos.length < maxPhotos;

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={!canAddMore || isUploading}
      />

      {/* Offline indicator */}
      <div className="flex items-center justify-between">
        <OfflineSyncIndicator />
        {!isOnline && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <WifiOff className="h-4 w-4" />
            <span>Offline mode</span>
          </div>
        )}
      </div>

      {/* Mobile: Show camera button prominently */}
      {isMobile && canAddMore && !isUploading && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg"
          onClick={() => setShowCamera(true)}
        >
          <Camera className="h-6 w-6 mr-2" />
          Take Photo
        </Button>
      )}

      {/* Drop zone */}
      <div
        onClick={() => canAddMore && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
          (!canAddMore || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-sm">
            <p className="font-medium">
              {isUploading ? 'Uploading...' : isMobile ? 'Or tap to browse files' : 'Drag photos here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP • Max {maxPhotos} images, 5MB each
            </p>
          </div>
        </div>
      </div>

      {/* Before photo checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="before-photo"
          checked={isBeforePhoto}
          onCheckedChange={(checked) => setIsBeforePhoto(checked === true)}
        />
        <Label htmlFor="before-photo" className="text-sm cursor-pointer">
          Mark as "Before" photo for comparison
        </Label>
      </div>

      {/* Deficiency tagging (collapsible) */}
      <Collapsible open={showTagging} onOpenChange={setShowTagging}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tag Deficiency (optional)
              {selectedTags.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({selectedTags.length} selected)
                </span>
              )}
            </span>
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              showTagging && 'rotate-180'
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <DeficiencyTagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            severity={severity}
            onSeverityChange={setSeverity}
            description={description}
            onDescriptionChange={setDescription}
            compact
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Preview thumbnails */}
      {selectedPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected Photos ({selectedPhotos.length}/{maxPhotos})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPhotos.map((file, index) => (
              <div
                key={index}
                className="relative group h-16 w-16 rounded-md overflow-hidden border bg-muted"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto(index);
                  }}
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending uploads indicator */}
      {pendingCount > 0 && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          {pendingCount} photo{pendingCount !== 1 ? 's' : ''} waiting to sync when online
        </div>
      )}

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={showCamera}
        onOpenChange={setShowCamera}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
