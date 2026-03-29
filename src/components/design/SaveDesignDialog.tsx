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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

interface SaveDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultName?: string;
  defaultProjectId?: string | null;
  onSave: (data: { name: string; projectId: string | null; notes: string }) => Promise<void>;
  isSaving?: boolean;
}

export function SaveDesignDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultName = '',
  defaultProjectId,
  onSave,
  isSaving = false,
}: SaveDesignDialogProps) {
  const [name, setName] = useState(defaultName);
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId || null);
  const [notes, setNotes] = useState('');
  const { data: projects, isLoading: loadingProjects } = useProjects();

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), projectId, notes: notes.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Link to Project (Optional)</Label>
            <Select value={projectId || ''} onValueChange={(v) => setProjectId(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {loadingProjects ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : (
                  projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
