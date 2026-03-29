import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Camera, ChevronLeft, ChevronRight, X, Columns2 } from 'lucide-react';

interface RemediationPhotoGalleryProps {
  beforePhotos: string[];
  afterPhotos: string[];
  className?: string;
}

export function RemediationPhotoGallery({
  beforePhotos,
  afterPhotos,
  className = '',
}: RemediationPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxTab, setLightboxTab] = useState<'before' | 'after'>('before');
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  const currentPhotos = lightboxTab === 'before' ? beforePhotos : afterPhotos;

  const openLightbox = (tab: 'before' | 'after', index: number) => {
    setLightboxTab(tab);
    setLightboxIndex(index);
    setLightboxOpen(true);
    setCompareMode(false);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const max = currentPhotos.length - 1;
    if (direction === 'prev') {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : max);
    } else {
      setLightboxIndex(lightboxIndex < max ? lightboxIndex + 1 : 0);
    }
  };

  const hasBeforeAndAfter = beforePhotos.length > 0 && afterPhotos.length > 0;

  return (
    <div className={className}>
      <Tabs defaultValue="before" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="before" className="text-xs">
            Before ({beforePhotos.length})
          </TabsTrigger>
          <TabsTrigger value="after" className="text-xs">
            After ({afterPhotos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="before" className="mt-2">
          {beforePhotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {beforePhotos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => openLightbox('before', idx)}
                  className="aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={url}
                    alt={`Before ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Camera className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No before photos
            </div>
          )}
        </TabsContent>

        <TabsContent value="after" className="mt-2">
          {afterPhotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {afterPhotos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => openLightbox('after', idx)}
                  className="aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={url}
                    alt={`After ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Camera className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No after photos
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <div className="relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium capitalize">
                  {lightboxTab} Photos
                </span>
                <span className="text-white/60 text-sm">
                  {lightboxIndex + 1} / {currentPhotos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasBeforeAndAfter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompareMode(!compareMode)}
                    className="text-white hover:bg-white/20"
                  >
                    <Columns2 className="h-4 w-4 mr-1" />
                    Compare
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {compareMode && hasBeforeAndAfter ? (
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="relative">
                  <img
                    src={beforePhotos[Math.min(lightboxIndex, beforePhotos.length - 1)]}
                    alt="Before"
                    className="w-full h-[70vh] object-contain bg-black"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Before
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={afterPhotos[Math.min(lightboxIndex, afterPhotos.length - 1)]}
                    alt="After"
                    className="w-full h-[70vh] object-contain bg-black"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    After
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-center min-h-[70vh]">
                <img
                  src={currentPhotos[lightboxIndex]}
                  alt={`Photo ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />

                {/* Navigation */}
                {currentPhotos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateLightbox('prev')}
                      className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateLightbox('next')}
                      className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Tab switcher at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex gap-2">
                <Button
                  variant={lightboxTab === 'before' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setLightboxTab('before');
                    setLightboxIndex(0);
                  }}
                  className="text-white"
                  disabled={beforePhotos.length === 0}
                >
                  Before ({beforePhotos.length})
                </Button>
                <Button
                  variant={lightboxTab === 'after' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setLightboxTab('after');
                    setLightboxIndex(0);
                  }}
                  className="text-white"
                  disabled={afterPhotos.length === 0}
                >
                  After ({afterPhotos.length})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
