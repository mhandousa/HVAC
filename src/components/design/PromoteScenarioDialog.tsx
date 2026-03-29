import { useState, useEffect } from 'react';
import { Loader2, Upload, Tag } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { usePromoteScenarioToAlternative } from '@/hooks/usePromoteScenarioToAlternative';
import type { Scenario } from '@/contexts/SandboxContext';

const PRESET_TAGS = [
  'sandbox-promoted',
  'what-if',
  'comparison',
  'optimized',
  'baseline-variant',
  'cost-analysis',
];

interface PromoteScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario | null;
  projectId: string;
  entityType: string;
  entityId?: string;
  /** Additional data to merge with scenario (e.g., current form state) */
  additionalData?: Record<string, unknown>;
}

export function PromoteScenarioDialog({
  open,
  onOpenChange,
  scenario,
  projectId,
  entityType,
  entityId,
  additionalData = {},
}: PromoteScenarioDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['sandbox-promoted']);
  const [customTag, setCustomTag] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const { promoteScenario, isPending } = usePromoteScenarioToAlternative({
    projectId,
    entityType,
    entityId,
    additionalData,
  });

  // Reset form when dialog opens with new scenario
  useEffect(() => {
    if (open && scenario) {
      setName(`${scenario.name} (from Sandbox)`);
      setDescription(scenario.description || `Promoted from sandbox scenario "${scenario.name}"`);
      setTags(['sandbox-promoted']);
      setCustomTag('');
      setIsPrimary(false);
    }
  }, [open, scenario]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCustomTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!scenario) return;

    const result = await promoteScenario(scenario, {
      name: name.trim(),
      description: description.trim(),
      tags,
      isPrimary,
    });

    if (result) {
      onOpenChange(false);
    }
  };

  const formatEntityType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!scenario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Promote Scenario to Alternative
          </DialogTitle>
          <DialogDescription>
            Save sandbox scenario "{scenario.name}" as a permanent {formatEntityType(entityType)} alternative.
            This will preserve your what-if analysis for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="promote-name">Alternative Name</Label>
            <Input
              id="promote-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this alternative"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="promote-description">Description (optional)</Label>
            <Textarea
              id="promote-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes this alternative unique..."
              rows={3}
            />
          </div>

          {/* Scenario Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="text-sm font-medium">Scenario Details</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {Object.keys(scenario.modifications).length} parameter modifications</p>
              {scenario.results && (
                <p>• Includes calculated results</p>
              )}
              <p>• Created: {scenario.createdAt.toLocaleString()}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() =>
                    tags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)
                  }
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTag);
                  }
                }}
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(customTag)}
                disabled={!customTag.trim()}
              >
                <Tag className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Set as Primary */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="promote-primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="promote-primary" className="text-sm font-normal cursor-pointer">
              Set as primary alternative for this {formatEntityType(entityType).toLowerCase()}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Promote to Alternative
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
