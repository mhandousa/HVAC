import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
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
  History,
  Search,
  Download,
  Trash2,
  FileText,
  Calendar,
  Building,
  MapPin,
  User,
  ChevronRight,
  X,
} from 'lucide-react';
import { useCertificateRegistry } from '@/hooks/useCertificateRegistry';
import { CertificateRegistryEntry } from '@/lib/certificate-registry';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CertificateHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABELS = {
  design: 'Design Phase',
  preliminary: 'Preliminary',
  final: 'Final',
};

const TYPE_COLORS = {
  design: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  preliminary: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  final: 'bg-green-500/10 text-green-600 border-green-500/30',
};

export function CertificateHistoryDialog({
  open,
  onOpenChange,
}: CertificateHistoryDialogProps) {
  const {
    entries,
    searchQuery,
    setSearchQuery,
    removeEntry,
    exportToCSV,
    stats,
  } = useCertificateRegistry();

  const [selectedEntry, setSelectedEntry] = useState<CertificateRegistryEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (certificateNumber: string) => {
    removeEntry(certificateNumber);
    setDeleteConfirm(null);
    if (selectedEntry?.certificateNumber === certificateNumber) {
      setSelectedEntry(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Certificate History
            </DialogTitle>
          </DialogHeader>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <span className="text-blue-600">Design:</span>
              <span className="font-medium">{stats.design}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600">Preliminary:</span>
              <span className="font-medium">{stats.preliminary}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">Final:</span>
              <span className="font-medium">{stats.final}</span>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={stats.total === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by certificate number, project, floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Certificate List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No certificates match your search' : 'No certificates generated yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedEntry?.id === entry.id && "bg-muted"
                      )}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium truncate">
                              {entry.certificateNumber}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", TYPE_COLORS[entry.certificateType])}
                            >
                              {TYPE_LABELS[entry.certificateType]}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {entry.projectName}
                            {entry.floorName && ` • ${entry.floorName}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(entry.issueDate), 'MMM d, yyyy')} • {entry.zonesIncluded.length} zones
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Certificate Details */}
            <div className="border rounded-lg overflow-hidden">
              {selectedEntry ? (
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-mono text-lg font-semibold">
                          {selectedEntry.certificateNumber}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={cn("mt-1", TYPE_COLORS[selectedEntry.certificateType])}
                        >
                          {TYPE_LABELS[selectedEntry.certificateType]}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(selectedEntry.certificateNumber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">{selectedEntry.projectName}</span>
                      </div>
                      {selectedEntry.buildingName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Building:</span>
                          <span className="font-medium">{selectedEntry.buildingName}</span>
                        </div>
                      )}
                      {selectedEntry.floorName && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Floor:</span>
                          <span className="font-medium">{selectedEntry.floorName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issue Date:</span>
                        <span className="font-medium">
                          {format(new Date(selectedEntry.issueDate), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Signatories */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Signatories</h4>
                      {selectedEntry.signatories.hvacEngineer ? (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedEntry.signatories.hvacEngineer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedEntry.signatories.hvacEngineer.title})
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No HVAC Engineer</div>
                      )}
                      {selectedEntry.signatories.acousticalEngineer ? (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedEntry.signatories.acousticalEngineer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedEntry.signatories.acousticalEngineer.title})
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No Acoustical Engineer</div>
                      )}
                    </div>

                    <Separator />

                    {/* Zones */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Certified Zones ({selectedEntry.zonesIncluded.length})
                      </h4>
                      <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {selectedEntry.zonesIncluded.map((zone, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                          >
                            <span className="font-medium">{zone.zoneName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">NC-{zone.targetNC}</span>
                              <span>→</span>
                              <span className="text-green-600">NC-{zone.estimatedNC ?? '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Generated: {format(new Date(selectedEntry.generatedAt), 'MMM d, yyyy h:mm a')}
                      {selectedEntry.companyLogoUsed && ' • Logo included'}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a certificate to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Certificate Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the certificate "{deleteConfirm}" from the history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
