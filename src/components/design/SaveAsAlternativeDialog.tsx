import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus, GitBranch, Loader2 } from 'lucide-react';
import { useCreateAlternative } from '@/hooks/useDesignAlternatives';

interface SaveAsAlternativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entityType: string;
  entityId?: string;
  data: Record<string, unknown>;
  suggestedName?: string;
}

const PRESET_TAGS = ['cost-effective', 'high-efficiency', 'client-preferred', 'code-minimum', 'premium', 'value-engineering'];

export function SaveAsAlternativeDialog({
  open,
  onOpenChange,
  projectId,
  entityType,
  entityId,
  data,
  suggestedName = '',
}: SaveAsAlternativeDialogProps) {
  const [name, setName] = useState(suggestedName || `Option ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const createAlternative = useCreateAlternative();

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setCustomTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createAlternative.mutateAsync({
      projectId,
      entityType,
      entityId,
      name: name.trim(),
      description: description.trim() || undefined,
      data,
      isPrimary,
      tags,
    });

    // Reset form
    setName('');
    setDescription('');
    setTags([]);
    setIsPrimary(false);
    onOpenChange(false);
  };

  const formatEntityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Save as Alternative
          </DialogTitle>
          <DialogDescription>
            Save the current {formatEntityType(entityType)} design as a named alternative for comparison and review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Alternative Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Option A - Budget Conscious"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the key characteristics of this alternative..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => tags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            
            {/* Selected Tags */}
            {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTag);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleAddTag(customTag)}
                disabled={!customTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Set as Primary */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="primary" className="text-sm font-normal cursor-pointer">
              Set as primary/recommended option
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createAlternative.isPending}
          >
            {createAlternative.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Save Alternative
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
