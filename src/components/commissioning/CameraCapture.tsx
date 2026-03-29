import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Camera,
  SwitchCamera,
  X,
  Check,
  RotateCcw,
  Zap,
  ZapOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setHasFlash(!!capabilities?.torch);
      
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      // Cleanup on close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCapturedImage(null);
      setFlashOn(false);
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, startCamera]);

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Flash toggle failed:', err);
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mirror if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const usePhoto = async () => {
    if (!capturedImage) return;
    
    // Convert data URL to File
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    onCapture(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-black">
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="relative aspect-[3/4] bg-black">
          {/* Camera preview or captured image */}
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  facingMode === 'user' && 'scale-x-[-1]'
                )}
              />
              
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                    <p>Starting camera...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center p-4">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-destructive" />
                    <p>{error}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={startCamera}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Controls */}
        <div className="bg-black p-4">
          {capturedImage ? (
            // Review controls
            <div className="flex items-center justify-center gap-8">
              <Button
                variant="outline"
                size="lg"
                onClick={retake}
                className="bg-transparent border-white text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Retake
              </Button>
              <Button
                size="lg"
                onClick={usePhoto}
                className="bg-primary"
              >
                <Check className="h-5 w-5 mr-2" />
                Use Photo
              </Button>
            </div>
          ) : (
            // Capture controls
            <div className="flex items-center justify-between">
              {/* Flash toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFlash}
                disabled={!hasFlash || isInitializing}
                className="text-white hover:bg-white/20 h-12 w-12"
              >
                {flashOn ? (
                  <Zap className="h-6 w-6 text-yellow-400" />
                ) : (
                  <ZapOff className="h-6 w-6" />
                )}
              </Button>
              
              {/* Capture button */}
              <button
                onClick={capturePhoto}
                disabled={isInitializing || !!error}
                className={cn(
                  'w-16 h-16 rounded-full bg-white border-4 border-gray-300 transition-transform',
                  'hover:scale-105 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <span className="sr-only">Capture photo</span>
              </button>
              
              {/* Switch camera */}
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCamera}
                disabled={isInitializing}
                className="text-white hover:bg-white/20 h-12 w-12"
              >
                <SwitchCamera className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
