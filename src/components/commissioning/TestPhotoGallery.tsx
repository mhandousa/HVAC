import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Trash2, 
  ZoomIn,
  Image as ImageIcon,
  Plus,
  Pencil,
  Tag,
  ArrowLeftRight,
  Camera,
  MoreVertical,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoAnnotationEditor } from './PhotoAnnotationEditor';
import { PhotoComparisonView } from './PhotoComparisonView';
import { DeficiencyTagSelector } from './DeficiencyTagSelector';
import { usePhotoAnnotation } from '@/hooks/usePhotoAnnotation';
import { usePhotoComparison } from '@/hooks/usePhotoComparison';
import { supabase } from '@/integrations/supabase/client';
import { getSeverityInfo, getTagLabel, DeficiencySeverity } from '@/lib/deficiency-types';

interface PhotoMetadata {
  id: string;
  photo_url: string;
  deficiency_tags: string[];
  deficiency_severity: string | null;
  description: string | null;
  is_before_photo: boolean;
  related_after_photo_url: string | null;
  captured_at: string;
}

interface TestPhotoGalleryProps {
  photos: string[];
  testId: string;
  testName: string;
  onDeletePhoto?: (photoUrl: string) => Promise<void>;
  onAddPhotos?: () => void;
  readOnly?: boolean;
}

export function TestPhotoGallery({
  photos,
  testId,
  testName,
  onDeletePhoto,
  onAddPhotos,
  readOnly = false,
}: TestPhotoGalleryProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteConfirmUrl, setDeleteConfirmUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<string | null>(null);
  const [taggingPhoto, setTaggingPhoto] = useState<string | null>(null);
  const [photoMetadata, setPhotoMetadata] = useState<Record<string, PhotoMetadata>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<DeficiencySeverity | null>(null);
  const [description, setDescription] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonBefore, setComparisonBefore] = useState<PhotoMetadata | null>(null);
  const [selectingAfterFor, setSelectingAfterFor] = useState<string | null>(null);
  
  const { saveAnnotatedPhoto, isAnnotatedPhoto } = usePhotoAnnotation();
  const { markAsBefore, linkAfterPhoto, saveRemediationNotes } = usePhotoComparison();

  // Fetch photo metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!testId) return;
      
      const { data } = await supabase
        .from('commissioning_photo_metadata')
        .select('*')
        .eq('test_id', testId);
      
      if (data) {
        const metadataMap: Record<string, PhotoMetadata> = {};
        data.forEach((m) => {
          metadataMap[m.photo_url] = m as PhotoMetadata;
        });
        setPhotoMetadata(metadataMap);
      }
    };

    fetchMetadata();
  }, [testId, photos]);

  if (photos.length === 0 && readOnly) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = async () => {
    if (!deleteConfirmUrl || !onDeletePhoto) return;
    
    setIsDeleting(true);
    try {
      await onDeletePhoto(deleteConfirmUrl);
      if (currentIndex >= photos.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      if (photos.length === 1) {
        setIsLightboxOpen(false);
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmUrl(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setIsLightboxOpen(false);
  };

  const handleAnnotationSave = async (annotatedBlob: Blob) => {
    if (!annotatingPhoto) return;
    await saveAnnotatedPhoto(testId, annotatingPhoto, annotatedBlob);
    setAnnotatingPhoto(null);
  };

  const handleSaveTags = async () => {
    if (!taggingPhoto) return;

    const existingMetadata = photoMetadata[taggingPhoto];
    
    if (existingMetadata) {
      await supabase
        .from('commissioning_photo_metadata')
        .update({
          deficiency_tags: selectedTags,
          deficiency_severity: severity,
          description: description,
        })
        .eq('id', existingMetadata.id);
    } else {
      await supabase.from('commissioning_photo_metadata').insert({
        test_id: testId,
        photo_url: taggingPhoto,
        deficiency_tags: selectedTags,
        deficiency_severity: severity,
        description: description,
      });
    }

    // Refresh metadata
    const { data } = await supabase
      .from('commissioning_photo_metadata')
      .select('*')
      .eq('test_id', testId);
    
    if (data) {
      const metadataMap: Record<string, PhotoMetadata> = {};
      data.forEach((m) => {
        metadataMap[m.photo_url] = m as PhotoMetadata;
      });
      setPhotoMetadata(metadataMap);
    }

    setTaggingPhoto(null);
    setSelectedTags([]);
    setSeverity(null);
    setDescription('');
  };

  const handleMarkAsBefore = async (photoUrl: string) => {
    await markAsBefore(testId, photoUrl);
    // Refresh metadata
    const { data } = await supabase
      .from('commissioning_photo_metadata')
      .select('*')
      .eq('test_id', testId);
    
    if (data) {
      const metadataMap: Record<string, PhotoMetadata> = {};
      data.forEach((m) => {
        metadataMap[m.photo_url] = m as PhotoMetadata;
      });
      setPhotoMetadata(metadataMap);
    }
  };

  const handleSelectAfterPhoto = async (afterUrl: string) => {
    if (!selectingAfterFor) return;
    
    const beforeMetadata = Object.values(photoMetadata).find(
      (m) => m.photo_url === selectingAfterFor && m.is_before_photo
    );
    
    if (beforeMetadata) {
      await linkAfterPhoto(beforeMetadata.id, afterUrl);
      
      // Refresh metadata
      const { data } = await supabase
        .from('commissioning_photo_metadata')
        .select('*')
        .eq('test_id', testId);
      
      if (data) {
        const metadataMap: Record<string, PhotoMetadata> = {};
        data.forEach((m) => {
          metadataMap[m.photo_url] = m as PhotoMetadata;
        });
        setPhotoMetadata(metadataMap);
      }
    }
    
    setSelectingAfterFor(null);
  };

  const openTagEditor = (photoUrl: string) => {
    const metadata = photoMetadata[photoUrl];
    if (metadata) {
      setSelectedTags(metadata.deficiency_tags || []);
      setSeverity((metadata.deficiency_severity as DeficiencySeverity) || null);
      setDescription(metadata.description || '');
    } else {
      setSelectedTags([]);
      setSeverity(null);
      setDescription('');
    }
    setTaggingPhoto(photoUrl);
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="h-3 w-3" />;
      case 'major':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  // Filter photos based on selected filter tags
  const filteredPhotos = filterTags.length > 0
    ? photos.filter((url) => {
        const metadata = photoMetadata[url];
        if (!metadata) return false;
        return filterTags.some((tag) => metadata.deficiency_tags?.includes(tag));
      })
    : photos;

  const displayPhotos = filteredPhotos.slice(0, 3);
  const remainingCount = filteredPhotos.length - 3;

  // Get all unique tags for filter
  const allTags = Array.from(
    new Set(
      Object.values(photoMetadata).flatMap((m) => m.deficiency_tags || [])
    )
  );

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        {displayPhotos.map((url, index) => {
          const metadata = photoMetadata[url];
          const hasTags = metadata?.deficiency_tags?.length > 0;
          const severityInfo = metadata?.deficiency_severity
            ? getSeverityInfo(metadata.deficiency_severity as DeficiencySeverity)
            : null;
          const isBefore = metadata?.is_before_photo;
          const hasAfter = !!metadata?.related_after_photo_url;

          return (
            <button
              key={url}
              onClick={() => {
                if (selectingAfterFor && selectingAfterFor !== url) {
                  handleSelectAfterPhoto(url);
                } else {
                  setCurrentIndex(index);
                  setIsLightboxOpen(true);
                }
              }}
              className={cn(
                'relative h-10 w-10 rounded overflow-hidden border-2 bg-muted hover:ring-2 hover:ring-primary transition-all',
                selectingAfterFor && selectingAfterFor !== url && 'ring-2 ring-green-500 cursor-pointer',
                severityInfo?.borderColor || 'border-transparent'
              )}
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {isAnnotatedPhoto(url) && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-primary-foreground text-center">
                  Annotated
                </div>
              )}
              {hasTags && (
                <div className="absolute top-0 left-0 p-0.5">
                  <Tag className="h-3 w-3 text-white drop-shadow-md" />
                </div>
              )}
              {isBefore && (
                <div className={cn(
                  'absolute top-0 right-0 p-0.5 rounded-bl',
                  hasAfter ? 'bg-green-600' : 'bg-destructive'
                )}>
                  <Camera className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
        
        {remainingCount > 0 && (
          <button
            onClick={() => {
              setCurrentIndex(3);
              setIsLightboxOpen(true);
            }}
            className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/80"
          >
            +{remainingCount}
          </button>
        )}

        {!readOnly && onAddPhotos && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddPhotos}
            className="h-10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}

        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10">
                <Filter className="h-4 w-4" />
                {filterTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {filterTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {filterTags.length > 0 && (
                <>
                  <DropdownMenuItem onClick={() => setFilterTags([])}>
                    Clear Filters
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {allTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => {
                    if (filterTags.includes(tag)) {
                      setFilterTags(filterTags.filter((t) => t !== tag));
                    } else {
                      setFilterTags([...filterTags, tag]);
                    }
                  }}
                >
                  <span className={cn(filterTags.includes(tag) && 'font-medium')}>
                    {getTagLabel(tag)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {photos.length > 0 && (
          <Badge variant="outline" className="ml-auto">
            <ImageIcon className="h-3 w-3 mr-1" />
            {filteredPhotos.length}{filterTags.length > 0 ? `/${photos.length}` : ''} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {selectingAfterFor && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          Click on a photo to link it as the "After" photo, or{' '}
          <button
            className="underline"
            onClick={() => setSelectingAfterFor(null)}
          >
            cancel
          </button>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent 
          className="max-w-4xl p-0 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <DialogTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2 flex-wrap">
                {testName} - Photo {currentIndex + 1} of {filteredPhotos.length}
                {filteredPhotos[currentIndex] && isAnnotatedPhoto(filteredPhotos[currentIndex]) && (
                  <Badge variant="secondary" className="bg-primary/80 text-primary-foreground">
                    <Pencil className="h-3 w-3 mr-1" />
                    Annotated
                  </Badge>
                )}
                {filteredPhotos[currentIndex] && photoMetadata[filteredPhotos[currentIndex]]?.deficiency_severity && (
                  <Badge className={cn(
                    getSeverityInfo(photoMetadata[filteredPhotos[currentIndex]].deficiency_severity as DeficiencySeverity).bgColor,
                    getSeverityInfo(photoMetadata[filteredPhotos[currentIndex]].deficiency_severity as DeficiencySeverity).color
                  )}>
                    {getSeverityIcon(photoMetadata[filteredPhotos[currentIndex]].deficiency_severity!)}
                    <span className="ml-1">
                      {getSeverityInfo(photoMetadata[filteredPhotos[currentIndex]].deficiency_severity as DeficiencySeverity).label}
                    </span>
                  </Badge>
                )}
                {filteredPhotos[currentIndex] && photoMetadata[filteredPhotos[currentIndex]]?.is_before_photo && (
                  <Badge variant="destructive">Before</Badge>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLightboxOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="relative bg-black min-h-[400px] flex items-center justify-center">
            {filteredPhotos.length > 0 && (
              <img
                src={filteredPhotos[currentIndex]}
                alt={`${testName} - Photo ${currentIndex + 1}`}
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}

            {filteredPhotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Tags display */}
          {filteredPhotos[currentIndex] && photoMetadata[filteredPhotos[currentIndex]]?.deficiency_tags?.length > 0 && (
            <div className="px-4 py-2 bg-muted/30 flex flex-wrap gap-1">
              {photoMetadata[filteredPhotos[currentIndex]].deficiency_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {getTagLabel(tag)}
                </Badge>
              ))}
            </div>
          )}

          {/* Bottom bar with thumbnails and actions */}
          <div className="p-4 bg-muted/50 flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {filteredPhotos.map((url, index) => {
                const metadata = photoMetadata[url];
                const severityInfo = metadata?.deficiency_severity
                  ? getSeverityInfo(metadata.deficiency_severity as DeficiencySeverity)
                  : null;

                return (
                  <button
                    key={url}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'relative h-12 w-12 rounded overflow-hidden border-2 transition-all flex-shrink-0',
                      index === currentIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100',
                      severityInfo?.borderColor
                    )}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isAnnotatedPhoto(url) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80">
                        <Pencil className="h-2 w-2 mx-auto text-primary-foreground" />
                      </div>
                    )}
                    {metadata?.deficiency_tags?.length > 0 && (
                      <div className="absolute top-0 left-0 p-0.5">
                        <Tag className="h-2.5 w-2.5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {!readOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openTagEditor(filteredPhotos[currentIndex])}>
                      <Tag className="h-4 w-4 mr-2" />
                      Tag Deficiency
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAnnotatingPhoto(filteredPhotos[currentIndex])}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Annotate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!photoMetadata[filteredPhotos[currentIndex]]?.is_before_photo ? (
                      <DropdownMenuItem onClick={() => handleMarkAsBefore(filteredPhotos[currentIndex])}>
                        <Camera className="h-4 w-4 mr-2" />
                        Mark as "Before"
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setSelectingAfterFor(filteredPhotos[currentIndex])}>
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Link "After" Photo
                      </DropdownMenuItem>
                    )}
                    {photoMetadata[filteredPhotos[currentIndex]]?.is_before_photo &&
                      photoMetadata[filteredPhotos[currentIndex]]?.related_after_photo_url && (
                      <DropdownMenuItem
                        onClick={() => {
                          const metadata = photoMetadata[filteredPhotos[currentIndex]];
                          setComparisonBefore(metadata);
                          setShowComparison(true);
                          setIsLightboxOpen(false);
                        }}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        View Comparison
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {!readOnly && onDeletePhoto && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmUrl(filteredPhotos[currentIndex])}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Annotation Editor */}
      {annotatingPhoto && (
        <PhotoAnnotationEditor
          open={!!annotatingPhoto}
          onOpenChange={(open) => !open && setAnnotatingPhoto(null)}
          imageUrl={annotatingPhoto}
          onSave={handleAnnotationSave}
        />
      )}

      {/* Deficiency Tag Editor */}
      <Dialog open={!!taggingPhoto} onOpenChange={(open) => !open && setTaggingPhoto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Deficiency
            </DialogTitle>
          </DialogHeader>
          <DeficiencyTagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            severity={severity}
            onSeverityChange={setSeverity}
            description={description}
            onDescriptionChange={setDescription}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTaggingPhoto(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTags}>
              Save Tags
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Comparison View */}
      {showComparison && comparisonBefore && (
        <PhotoComparisonView
          open={showComparison}
          onOpenChange={setShowComparison}
          beforePhoto={{
            url: comparisonBefore.photo_url,
            capturedAt: comparisonBefore.captured_at,
            description: comparisonBefore.description || undefined,
          }}
          afterPhoto={{
            url: comparisonBefore.related_after_photo_url!,
          }}
          onSave={(notes) => {
            saveRemediationNotes(comparisonBefore.id, notes);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmUrl} onOpenChange={() => setDeleteConfirmUrl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this photo from the test record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
