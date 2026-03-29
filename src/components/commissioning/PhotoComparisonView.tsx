import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeftRight,
  Layers,
  SplitSquareHorizontal,
  Download,
  Check,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface PhotoComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beforePhoto: {
    url: string;
    capturedAt?: string;
    description?: string;
  };
  afterPhoto: {
    url: string;
    capturedAt?: string;
    description?: string;
  };
  onSave?: (remediationNotes: string) => void;
}

export function PhotoComparisonView({
  open,
  onOpenChange,
  beforePhoto,
  afterPhoto,
  onSave,
}: PhotoComparisonViewProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider" | "overlay">(
    "side-by-side"
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [remediationNotes, setRemediationNotes] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Date unknown";
    try {
      return format(new Date(dateStr), "MMM d, yyyy h:mm a");
    } catch {
      return dateStr;
    }
  };

  const exportComparison = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load both images
    const beforeImg = new Image();
    const afterImg = new Image();
    beforeImg.crossOrigin = "anonymous";
    afterImg.crossOrigin = "anonymous";

    await Promise.all([
      new Promise((resolve) => {
        beforeImg.onload = resolve;
        beforeImg.src = beforePhoto.url;
      }),
      new Promise((resolve) => {
        afterImg.onload = resolve;
        afterImg.src = afterPhoto.url;
      }),
    ]);

    // Set canvas size for side-by-side
    const width = Math.max(beforeImg.width, afterImg.width);
    const height = Math.max(beforeImg.height, afterImg.height);
    canvas.width = width * 2 + 40; // 40px gap
    canvas.height = height + 80; // Space for labels

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw labels
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#dc2626";
    ctx.fillText("BEFORE", 20, 35);
    ctx.fillStyle = "#16a34a";
    ctx.fillText("AFTER", width + 60, 35);

    // Draw images
    ctx.drawImage(beforeImg, 0, 50, width, height);
    ctx.drawImage(afterImg, width + 40, 50, width, height);

    // Add dates
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(formatDate(beforePhoto.capturedAt), 20, height + 70);
    ctx.fillText(formatDate(afterPhoto.capturedAt), width + 60, height + 70);

    // Download
    const link = document.createElement("a");
    link.download = `comparison-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSave = () => {
    onSave?.(remediationNotes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Photo Comparison - Remediation Documentation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* View Mode Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as typeof viewMode)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="side-by-side" className="gap-1">
                <SplitSquareHorizontal className="h-4 w-4" />
                Side by Side
              </TabsTrigger>
              <TabsTrigger value="slider" className="gap-1">
                <ArrowLeftRight className="h-4 w-4" />
                Slider
              </TabsTrigger>
              <TabsTrigger value="overlay" className="gap-1">
                <Layers className="h-4 w-4" />
                Overlay
              </TabsTrigger>
            </TabsList>

            {/* Side by Side View */}
            <TabsContent value="side-by-side" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">BEFORE</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(beforePhoto.capturedAt)}
                    </span>
                  </div>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={beforePhoto.url}
                      alt="Before"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {beforePhoto.description && (
                    <p className="text-sm text-muted-foreground">
                      {beforePhoto.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">AFTER</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(afterPhoto.capturedAt)}
                    </span>
                  </div>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={afterPhoto.url}
                      alt="After"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {afterPhoto.description && (
                    <p className="text-sm text-muted-foreground">
                      {afterPhoto.description}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Slider View */}
            <TabsContent value="slider" className="mt-4">
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {/* After image (full) */}
                  <img
                    src={afterPhoto.url}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* Before image (clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={beforePhoto.url}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ width: `${100 / (sliderPosition / 100)}%` }}
                    />
                  </div>
                  {/* Slider line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="h-4 w-4" />
                    </div>
                  </div>
                  {/* Labels */}
                  <Badge variant="destructive" className="absolute top-2 left-2">
                    BEFORE
                  </Badge>
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    AFTER
                  </Badge>
                </div>
                <div className="px-4">
                  <Slider
                    value={[sliderPosition]}
                    onValueChange={([v]) => setSliderPosition(v)}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Overlay View */}
            <TabsContent value="overlay" className="mt-4">
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {/* Before image */}
                  <img
                    src={beforePhoto.url}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* After image with opacity */}
                  <img
                    src={afterPhoto.url}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ opacity: overlayOpacity / 100 }}
                  />
                  {/* Labels */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant="destructive" style={{ opacity: 1 - overlayOpacity / 100 }}>
                      BEFORE
                    </Badge>
                    <Badge className="bg-green-600" style={{ opacity: overlayOpacity / 100 }}>
                      AFTER
                    </Badge>
                  </div>
                </div>
                <div className="px-4">
                  <Label className="text-sm mb-2 block">
                    Opacity: {overlayOpacity}%
                  </Label>
                  <Slider
                    value={[overlayOpacity]}
                    onValueChange={([v]) => setOverlayOpacity(v)}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Remediation Notes */}
          <div className="space-y-2">
            <Label>Remediation Notes</Label>
            <Textarea
              placeholder="Describe the remediation work performed..."
              value={remediationNotes}
              onChange={(e) => setRemediationNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export Comparison
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save & Close
              </Button>
            </div>
          </div>

          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
