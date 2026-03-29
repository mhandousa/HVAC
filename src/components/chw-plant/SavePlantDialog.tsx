import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface SavePlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantName: string;
  plantTag: string;
  notes: string;
  status: string;
  revision: string;
  onPlantNameChange: (value: string) => void;
  onPlantTagChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRevisionChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isEdit?: boolean;
}

export function SavePlantDialog({
  open,
  onOpenChange,
  plantName,
  plantTag,
  notes,
  status,
  revision,
  onPlantNameChange,
  onPlantTagChange,
  onNotesChange,
  onStatusChange,
  onRevisionChange,
  onSave,
  isSaving,
  isEdit = false,
}: SavePlantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update Plant Configuration' : 'Save Plant Configuration'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the plant configuration details and save changes.'
              : 'Enter a name and details for this plant configuration.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plantName">Plant Name *</Label>
            <Input
              id="plantName"
              value={plantName}
              onChange={(e) => onPlantNameChange(e.target.value)}
              placeholder="e.g., Central Plant - Building A"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plantTag">Plant Tag</Label>
            <Input
              id="plantTag"
              value={plantTag}
              onChange={(e) => onPlantTagChange(e.target.value)}
              placeholder="e.g., CP-01"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="as-built">As-Built</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revision">Revision</Label>
              <Input
                id="revision"
                value={revision}
                onChange={(e) => onRevisionChange(e.target.value)}
                placeholder="A"
                maxLength={5}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Additional notes about this configuration..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!plantName.trim() || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
