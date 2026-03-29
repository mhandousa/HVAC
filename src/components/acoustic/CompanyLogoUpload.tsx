import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  getLogoDataUrl,
  processLogoFile,
  setCompanyLogo,
  clearCompanyLogo,
} from '@/lib/company-branding';
import { cn } from '@/lib/utils';

interface CompanyLogoUploadProps {
  onLogoChange?: (logoDataUrl: string | null) => void;
  className?: string;
}

export function CompanyLogoUpload({ onLogoChange, className }: CompanyLogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing logo on mount
  useEffect(() => {
    const existing = getLogoDataUrl();
    if (existing) {
      setLogoUrl(existing);
      onLogoChange?.(existing);
    }
  }, [onLogoChange]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const { base64, mimeType } = await processLogoFile(file);
      setCompanyLogo(base64, mimeType);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      setLogoUrl(dataUrl);
      onLogoChange?.(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  }, [onLogoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClear = useCallback(() => {
    clearCompanyLogo();
    setLogoUrl(null);
    onLogoChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onLogoChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">Company Logo</Label>
      
      {logoUrl ? (
        <div className="relative">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="h-12 w-24 flex items-center justify-center bg-white rounded border overflow-hidden">
              <img 
                src={logoUrl} 
                alt="Company logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              Logo will appear in certificate header
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
            onChange={handleInputChange}
          />
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drop logo here or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, or SVG (max 500KB)
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
