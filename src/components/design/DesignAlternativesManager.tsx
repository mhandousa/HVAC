import { useState } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  GitBranch,
  Star,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  GitCompare,
  Check,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  useDesignAlternatives,
  useDeleteAlternative,
  useSetPrimaryAlternative,
  useUpdateAlternative,
  type DesignAlternative,
} from '@/hooks/useDesignAlternatives';
import { useProfile } from '@/hooks/useOrganization';

interface DesignAlternativesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId?: string;
  onLoadAlternative?: (data: Record<string, unknown>) => void;
  onCompare?: (alternatives: DesignAlternative[]) => void;
  onCreateNew?: () => void;
}

export function DesignAlternativesManager({
  open,
  onOpenChange,
  entityType,
  entityId,
  onLoadAlternative,
  onCompare,
  onCreateNew,
}: DesignAlternativesManagerProps) {
  const { data: profile } = useProfile();
  const { data: alternatives = [], isLoading } = useDesignAlternatives(entityType, entityId);
  const deleteAlternative = useDeleteAlternative();
  const setPrimary = useSetPrimaryAlternative();
  const updateAlternative = useUpdateAlternative();

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStartEdit = (alt: DesignAlternative) => {
    setEditingId(alt.id);
    setEditName(alt.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateAlternative.mutateAsync({ id: editingId, name: editName.trim() });
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAlternative.mutateAsync(deleteId);
    setDeleteId(null);
    setSelectedForCompare(prev => prev.filter(id => id !== deleteId));
  };

  const handleSetPrimary = async (alt: DesignAlternative) => {
    if (!profile?.organization_id) return;
    await setPrimary.mutateAsync({
      id: alt.id,
      entityType: alt.entity_type,
      entityId: alt.entity_id || undefined,
      organizationId: profile.organization_id,
    });
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 for comparison
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length < 2) return;
    const selected = alternatives.filter(a => selectedForCompare.includes(a.id));
    onCompare?.(selected);
  };

  const formatEntityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Design Alternatives
            </SheetTitle>
            <SheetDescription>
              Manage saved alternatives for {formatEntityType(entityType)}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                {selectedForCompare.length >= 2 && (
                  <Button size="sm" variant="outline" onClick={handleCompare}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare ({selectedForCompare.length})
                  </Button>
                )}
                {onCreateNew && (
                  <Button size="sm" onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                )}
              </div>
            </div>

            {/* Alternatives List */}
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-3 pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : alternatives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No alternatives saved yet</p>
                    <p className="text-sm mt-1">Save your current design as an alternative to compare options</p>
                  </div>
                ) : (
                  alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className={`
                        relative border rounded-lg p-4 transition-colors
                        ${selectedForCompare.includes(alt.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                        ${alt.is_primary ? 'ring-2 ring-amber-500/30' : ''}
                      `}
                    >
                      {/* Selection Checkbox for Compare */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedForCompare.includes(alt.id) ? 'default' : 'ghost'}
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleCompareSelection(alt.id)}
                            >
                              <GitCompare className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {selectedForCompare.includes(alt.id) ? 'Remove from comparison' : 'Add to comparison'}
                          </TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onLoadAlternative && (
                              <DropdownMenuItem onClick={() => onLoadAlternative(alt.data)}>
                                <Download className="h-4 w-4 mr-2" />
                                Load this alternative
                              </DropdownMenuItem>
                            )}
                            {!alt.is_primary && (
                              <DropdownMenuItem onClick={() => handleSetPrimary(alt)}>
                                <Star className="h-4 w-4 mr-2" />
                                Set as primary
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleStartEdit(alt)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(alt.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Content */}
                      <div className="pr-20">
                        {/* Name with Edit */}
                        {editingId === alt.id ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            {alt.is_primary && (
                              <Star className="h-4 w-4 text-primary fill-primary" />
                            )}
                            <span className="font-medium">{alt.name}</span>
                          </div>
                        )}

                        {/* Description */}
                        {alt.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {alt.description}
                          </p>
                        )}

                        {/* Tags */}
                        {alt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {alt.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={alt.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(alt.profile?.full_name || null)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{alt.profile?.full_name || 'Unknown'}</span>
                          </div>
                          <span>•</span>
                          <span>{format(new Date(alt.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alternative?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this design alternative. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
