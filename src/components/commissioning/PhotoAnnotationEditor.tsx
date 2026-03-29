import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Type,
  Square,
  Circle,
  Pencil,
  Highlighter,
  Undo2,
  Redo2,
  Trash2,
  X,
  Loader2,
  Check,
} from 'lucide-react';

type ToolType = 'arrow' | 'text' | 'rectangle' | 'circle' | 'freehand' | 'highlight';

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  points: Point[];
  bounds?: { x: number; y: number; width: number; height: number };
  text?: string;
}

interface PhotoAnnotationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (annotatedImageBlob: Blob) => Promise<void>;
}

const COLORS = [
  { name: 'red', value: '#ef4444' },
  { name: 'yellow', value: '#eab308' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'green', value: '#22c55e' },
  { name: 'white', value: '#ffffff' },
  { name: 'black', value: '#000000' },
];

const STROKE_WIDTHS = [
  { name: 'thin', value: 2 },
  { name: 'medium', value: 4 },
  { name: 'thick', value: 8 },
];

export function PhotoAnnotationEditor({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: PhotoAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const [tool, setTool] = useState<ToolType>('arrow');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      
      // Calculate canvas size to fit container while maintaining aspect ratio
      const maxWidth = Math.min(window.innerWidth - 100, 900);
      const maxHeight = window.innerHeight - 300;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      
      setCanvasSize({ width, height });
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;
    
    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw all annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      switch (annotation.type) {
        case 'arrow':
          if (annotation.points.length >= 2) {
            const start = annotation.points[0];
            const end = annotation.points[annotation.points.length - 1];
            drawArrow(ctx, start, end, annotation.strokeWidth);
          }
          break;
        case 'text':
          if (annotation.text && annotation.points.length > 0) {
            ctx.font = `${annotation.strokeWidth * 4}px sans-serif`;
            ctx.fillText(annotation.text, annotation.points[0].x, annotation.points[0].y);
          }
          break;
        case 'rectangle':
          if (annotation.bounds) {
            ctx.strokeRect(
              annotation.bounds.x,
              annotation.bounds.y,
              annotation.bounds.width,
              annotation.bounds.height
            );
          }
          break;
        case 'circle':
          if (annotation.bounds) {
            ctx.beginPath();
            const cx = annotation.bounds.x + annotation.bounds.width / 2;
            const cy = annotation.bounds.y + annotation.bounds.height / 2;
            const rx = Math.abs(annotation.bounds.width) / 2;
            const ry = Math.abs(annotation.bounds.height) / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'freehand':
          if (annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            for (let i = 1; i < annotation.points.length; i++) {
              ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case 'highlight':
          if (annotation.bounds) {
            ctx.globalAlpha = 0.4;
            ctx.fillRect(
              annotation.bounds.x,
              annotation.bounds.y,
              annotation.bounds.width,
              annotation.bounds.height
            );
            ctx.globalAlpha = 1;
          }
          break;
      }
    });
  }, [annotations, image]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point, lineWidth: number) => {
    const headLength = lineWidth * 4;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e);
    
    if (tool === 'text') {
      setTextPosition(point);
      return;
    }
    
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoints([point]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const point = getCanvasPoint(e);
    
    if (tool === 'freehand') {
      setCurrentPoints((prev) => [...prev, point]);
      
      // Draw current stroke
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentPoints.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    } else {
      setCurrentPoints([startPoint, point]);
      // Redraw for preview
      redrawCanvas();
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = strokeWidth;
        
        switch (tool) {
          case 'arrow':
            drawArrow(ctx, startPoint, point, strokeWidth);
            break;
          case 'rectangle':
            ctx.strokeRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
            break;
          case 'circle':
            ctx.beginPath();
            const cx = (startPoint.x + point.x) / 2;
            const cy = (startPoint.y + point.y) / 2;
            const rx = Math.abs(point.x - startPoint.x) / 2;
            const ry = Math.abs(point.y - startPoint.y) / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'highlight':
            ctx.globalAlpha = 0.4;
            ctx.fillRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
            ctx.globalAlpha = 1;
            break;
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !startPoint || currentPoints.length === 0) {
      setIsDrawing(false);
      return;
    }
    
    const endPoint = currentPoints[currentPoints.length - 1];
    
    const newAnnotation: Annotation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: tool,
      color,
      strokeWidth,
      points: tool === 'freehand' ? currentPoints : [startPoint, endPoint],
    };
    
    if (['rectangle', 'circle', 'highlight'].includes(tool)) {
      newAnnotation.bounds = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      };
    }
    
    addAnnotation(newAnnotation);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handleTextSubmit = () => {
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      setTextInput('');
      return;
    }
    
    const newAnnotation: Annotation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: 'text',
      color,
      strokeWidth,
      points: [textPosition],
      text: textInput,
    };
    
    addAnnotation(newAnnotation);
    setTextPosition(null);
    setTextInput('');
  };

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    setAnnotations([]);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsSaving(true);
    
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });
      
      await onSave(blob);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save annotated image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' },
    { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
    { type: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
    { type: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
    { type: 'freehand', icon: <Pencil className="h-4 w-4" />, label: 'Draw' },
    { type: 'highlight', icon: <Highlighter className="h-4 w-4" />, label: 'Highlight' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Annotate Photo</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full" ref={containerRef}>
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center bg-muted/50 p-4 overflow-auto">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="border rounded-lg shadow-lg cursor-crosshair touch-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
              
              {/* Text input overlay */}
              {textPosition && (
                <div
                  className="absolute flex gap-1"
                  style={{ left: textPosition.x, top: textPosition.y }}
                >
                  <Input
                    autoFocus
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTextSubmit();
                      if (e.key === 'Escape') {
                        setTextPosition(null);
                        setTextInput('');
                      }
                    }}
                    placeholder="Enter text..."
                    className="w-48 h-8"
                  />
                  <Button size="sm" onClick={handleTextSubmit}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 bg-muted/30 border-t">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tools */}
              <div className="flex items-center gap-1">
                {tools.map((t) => (
                  <Button
                    key={t.type}
                    variant={tool === t.type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTool(t.type)}
                    title={t.label}
                  >
                    {t.icon}
                  </Button>
                ))}
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Colors */}
              <div className="flex items-center gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform',
                      color === c.value ? 'border-foreground scale-110' : 'border-muted-foreground/30'
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Stroke width */}
              <div className="flex items-center gap-1">
                {STROKE_WIDTHS.map((sw) => (
                  <Button
                    key={sw.name}
                    variant={strokeWidth === sw.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStrokeWidth(sw.value)}
                    title={sw.name}
                    className="w-10"
                  >
                    <div
                      className="bg-current rounded-full"
                      style={{ width: sw.value * 2, height: sw.value * 2 }}
                    />
                  </Button>
                ))}
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* History controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={annotations.length === 0}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Annotation'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
