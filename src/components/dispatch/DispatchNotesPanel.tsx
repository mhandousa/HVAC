import { useState } from 'react';
import { useDispatchNotes, useCreateDispatchNote } from '@/hooks/useDispatchNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface DispatchNotesPanelProps {
  workOrderId: string;
}

const noteTypeColors: Record<string, string> = {
  status_update: 'bg-blue-500/20 text-blue-700',
  customer_communication: 'bg-green-500/20 text-green-700',
  internal: 'bg-yellow-500/20 text-yellow-700',
  escalation: 'bg-red-500/20 text-red-700',
};

export function DispatchNotesPanel({ workOrderId }: DispatchNotesPanelProps) {
  const { data: notes = [], isLoading } = useDispatchNotes(workOrderId);
  const createNote = useCreateDispatchNote();
  
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('status_update');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createNote.mutate({
      work_order_id: workOrderId,
      content: content.trim(),
      note_type: noteType,
      is_internal: isInternal,
    }, {
      onSuccess: () => {
        setContent('');
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <MessageSquare className="h-4 w-4" />
        <h3 className="font-medium">Dispatch Notes</h3>
        <Badge variant="secondary" className="ml-auto">{notes.length}</Badge>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={noteTypeColors[note.note_type] || 'bg-gray-500/20'}>
                    {note.note_type.replace('_', ' ')}
                  </Badge>
                  {note.is_internal && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Internal
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(note.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t space-y-3">
        <div className="flex gap-2">
          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_update">Status Update</SelectItem>
              <SelectItem value="customer_communication">Customer Comm</SelectItem>
              <SelectItem value="internal">Internal Note</SelectItem>
              <SelectItem value="escalation">Escalation</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 ml-auto">
            {isInternal ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            <Switch checked={isInternal} onCheckedChange={setIsInternal} />
            <Label className="text-xs">Internal</Label>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleSubmit();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSubmit}
            disabled={!content.trim() || createNote.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
