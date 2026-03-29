import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  ArrowLeft,
  Download,
  Edit,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useSOOList, 
  useSOOById,
  useUpdateSOO,
  SequenceOfOperations,
  SYSTEM_TYPE_LABELS
} from '@/hooks/useSequenceOfOperations';
import { SOODocumentList } from '@/components/soo/SOODocumentList';
import { SOOWizard } from '@/components/soo/SOOWizard';
import { SOOPreview } from '@/components/soo/SOOPreview';
import { SOOControlInputs } from '@/components/soo/SOOControlInputs';
import { SOOExportDialog } from '@/components/soo/SOOExportDialog';
import { GeneratedSequence, ControlParameters, SystemType } from '@/lib/soo-templates';
import { toast } from 'sonner';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'list' | 'create' | 'view' | 'edit';

export default function SequenceOfOperationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || undefined;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [showExport, setShowExport] = useState(false);
  const [editParams, setEditParams] = useState<ControlParameters>({});

  const { data: documents = [], isLoading } = useSOOList(projectId);
  const { data: selectedDoc } = useSOOById(selectedDocId || undefined);
  const updateSOO = useUpdateSOO();
  const { canSave } = useToolValidation(
    projectId || null,
    'sequence-of-ops',
    { checkStageLock: true }
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSelectDocument = (doc: SequenceOfOperations) => {
    setSelectedDocId(doc.id);
    setEditParams(doc.control_strategy as ControlParameters);
    setViewMode('view');
    setActiveTab('preview');
  };

  const handleExportDocument = (doc: SequenceOfOperations) => {
    setSelectedDocId(doc.id);
    setShowExport(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDocId(null);
    setActiveTab('preview');
  };

  const handleSaveChanges = async () => {
    if (!selectedDocId) return;

    try {
      await updateSOO.mutateAsync({
        id: selectedDocId,
        control_strategy: editParams,
      });
      toast.success('Changes saved');
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleStatusChange = async (status: 'draft' | 'review' | 'approved') => {
    if (!selectedDocId) return;

    try {
      await updateSOO.mutateAsync({
        id: selectedDocId,
        status,
      });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode !== 'list' && (
              <Button variant="ghost" size="icon" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Sequence of Operations
              </h1>
              <p className="text-muted-foreground">
                {viewMode === 'list' && 'Create and manage control sequences for HVAC systems'}
                {viewMode === 'create' && 'Create new sequence of operations'}
                {viewMode === 'view' && selectedDoc && `${selectedDoc.name}`}
                {viewMode === 'edit' && 'Edit document'}
              </p>
            </div>
            <ActiveEditorsIndicator
              entityType="sequence_of_operations"
              entityId={selectedDocId || null}
              projectId={projectId || undefined}
            />

            {/* Phase 18: Edit Conflict Warning */}
            <EditConflictWarning
              entityType="sequence_of_ops"
              entityId={selectedDocId}
              currentRevisionNumber={0}
              onReload={() => window.location.reload()}
            />
          </div>

          {viewMode === 'view' && selectedDoc && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {selectedDoc.status === 'draft' && (
                <Button onClick={() => handleStatusChange('review')}>
                  Submit for Review
                </Button>
              )}
              {selectedDoc.status === 'review' && (
                <Button onClick={() => handleStatusChange('approved')}>
                  Approve
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' && (
          <SOODocumentList
            documents={documents}
            isLoading={isLoading}
            onSelect={handleSelectDocument}
            onCreateNew={() => setViewMode('create')}
            onExport={handleExportDocument}
          />
        )}

        {viewMode === 'create' && (
          <SOOWizard
            onComplete={handleBackToList}
            onCancel={handleBackToList}
            initialProjectId={projectId}
          />
        )}

        {viewMode === 'view' && selectedDoc && (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'edit')}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit Parameters</TabsTrigger>
                </TabsList>

                {activeTab === 'edit' && (
                  <Button onClick={handleSaveChanges} disabled={!canSave || updateSOO.isPending}>
                    {updateSOO.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                )}
              </div>

              <TabsContent value="preview" className="mt-4">
                <SOOPreview
                  sequence={selectedDoc.generated_sequence as GeneratedSequence}
                  customSections={selectedDoc.custom_sections as Record<string, string>}
                  onCustomSectionChange={(key, content) => {
                    updateSOO.mutate({
                      id: selectedDocId!,
                      custom_sections: {
                        ...(selectedDoc.custom_sections as Record<string, string>),
                        [key]: content,
                      },
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="edit" className="mt-4">
                <ToolPageHeader
                  toolType="sequence-of-ops"
                  toolName="Sequence of Operations"
                  projectId={projectId || null}
                  showLockButton={false}
                  showValidation={true}
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Control Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SOOControlInputs
                      systemType={selectedDoc.system_type as SystemType}
                      params={editParams}
                      onChange={setEditParams}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Export Dialog */}
        {selectedDoc && (
          <SOOExportDialog
            open={showExport}
            onOpenChange={setShowExport}
            sequence={selectedDoc.generated_sequence as GeneratedSequence}
            documentName={selectedDoc.name}
            systemType={SYSTEM_TYPE_LABELS[selectedDoc.system_type as keyof typeof SYSTEM_TYPE_LABELS] || selectedDoc.system_type}
          />
        )}

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/sequence-of-operations"
          projectId={projectId}
        />
      </div>
    </DashboardLayout>
  );
}
