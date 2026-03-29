import { useState } from 'react';
import { Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateTemplate, TEMPLATE_TYPES } from '@/hooks/useDesignTemplates';

interface SaveAsTemplateDialogProps {
  templateType: string;
  templateData: Record<string, unknown>;
  trigger?: React.ReactNode;
  defaultName?: string;
}

export function SaveAsTemplateDialog({
  templateType,
  templateData,
  trigger,
  defaultName = '',
}: SaveAsTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const createTemplate = useCreateTemplate();
  const typeInfo = TEMPLATE_TYPES[templateType as keyof typeof TEMPLATE_TYPES];

  const handleSave = async () => {
    if (!name.trim()) return;
    
    await createTemplate.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      templateType,
      templateData,
      isPublic,
    });
    
    setOpen(false);
    setName('');
    setDescription('');
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as {typeInfo?.label || 'Design'} Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Office Building Standard"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template includes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="template-public">Make Public</Label>
              <p className="text-xs text-muted-foreground">
                Allow other organizations to use this template
              </p>
            </div>
            <Switch
              id="template-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || createTemplate.isPending}
          >
            {createTemplate.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
