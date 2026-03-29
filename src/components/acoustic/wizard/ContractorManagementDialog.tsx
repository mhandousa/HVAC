import React, { useState } from 'react';
import { Contractor, SPECIALIZATION_LABELS, ContractorSpecialization } from '@/types/contractor';
import { ContractorForm } from './ContractorForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractorManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractors: Contractor[];
  onAddContractor: (contractor: Omit<Contractor, 'id' | 'createdAt'>) => void;
  onUpdateContractor: (id: string, updates: Partial<Contractor>) => void;
  onDeleteContractor: (id: string) => void;
}

export function ContractorManagementDialog({
  open,
  onOpenChange,
  contractors,
  onAddContractor,
  onUpdateContractor,
  onDeleteContractor,
}: ContractorManagementDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredContractors = contractors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFormSubmit = (data: Omit<Contractor, 'id' | 'createdAt'>) => {
    if (editingContractor) {
      onUpdateContractor(editingContractor.id, data);
    } else {
      onAddContractor(data);
    }
    setShowForm(false);
    setEditingContractor(undefined);
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    onDeleteContractor(id);
    setDeleteConfirmId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contractor Management
            </DialogTitle>
          </DialogHeader>

          {showForm ? (
            <div className="flex-1 overflow-auto">
              <ContractorForm
                contractor={editingContractor}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingContractor(undefined);
                }}
              />
            </div>
          ) : (
            <>
              {/* Search and Add */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contractors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contractor
                </Button>
              </div>

              {/* Contractor List */}
              <ScrollArea className="flex-1 min-h-[300px]">
                <div className="space-y-2">
                  {filteredContractors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No contractors match your search' : 'No contractors added yet'}
                    </div>
                  ) : (
                    filteredContractors.map((contractor) => (
                      <div
                        key={contractor.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        {/* Contractor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{contractor.name}</span>
                            {contractor.isPreferred && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Award className="h-3 w-3" />
                                Preferred
                              </Badge>
                            )}
                          </div>
                          {contractor.companyName && (
                            <p className="text-sm text-muted-foreground truncate">
                              {contractor.companyName}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contractor.specializations.map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {SPECIALIZATION_LABELS[spec as ContractorSpecialization]}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Rating */}
                        {contractor.rating && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  i < (contractor.rating ?? 0)
                                    ? 'fill-chart-4 text-chart-4'
                                    : 'text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                        )}

                        {/* Contact Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`tel:${contractor.phone}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`mailto:${contractor.email}`)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(contractor)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(contractor.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contractor? This will also remove any phase assignments for this contractor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
