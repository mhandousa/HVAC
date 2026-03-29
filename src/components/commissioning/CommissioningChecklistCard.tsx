import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Wrench,
  Thermometer,
  Wind,
  Gauge,
  Ruler,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables, Json } from '@/integrations/supabase/types';
import { TestDataEntryDialog } from './TestDataEntryDialog';
import { InstalledDataEntryDialog } from './InstalledDataEntryDialog';
import { VarianceSummaryPanel, calculateVarianceSummary } from './VarianceSummaryPanel';
import { TestPhotoGallery } from './TestPhotoGallery';
import { useCommissioningPhotos } from '@/hooks/useCommissioningPhotos';

type CommissioningChecklist = Tables<'commissioning_checklists'>;
type CommissioningTest = Tables<'commissioning_tests'>;

interface CommissioningChecklistCardProps {
  checklist: CommissioningChecklist;
  tests: CommissioningTest[];
  onUpdateChecklist: (data: { 
    id: string; 
    overall_status?: string;
    installed_data?: Json;
    variance_summary?: Json;
  }) => void;
  onAddTest: (data: Partial<CommissioningTest> & { photos?: File[] }) => void;
}

export function CommissioningChecklistCard({
  checklist,
  tests,
  onUpdateChecklist,
  onAddTest,
}: CommissioningChecklistCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isInstalledDataDialogOpen, setIsInstalledDataDialogOpen] = useState(false);
  const { removePhotoFromTest } = useCommissioningPhotos();

  const passedTests = tests.filter(t => t.result === 'pass').length;
  const failedTests = tests.filter(t => t.result === 'fail').length;
  const totalTests = tests.length;
  const completionPercent = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  // Parse design and installed data
  const designData = checklist.design_data as Record<string, any> | null;
  const installedData = checklist.installed_data as Record<string, any> | null;
  const tolerancePercent = (checklist.variance_summary as any)?.tolerance_percent || 5;
  
  // Calculate variance summary
  const varianceSummary = calculateVarianceSummary(designData, installedData, tolerancePercent);
  
  const handleSaveInstalledData = (newInstalledData: Record<string, any>, newTolerance: number) => {
    const newVarianceSummary = calculateVarianceSummary(designData, newInstalledData, newTolerance);
    
    // Determine overall status based on variance
    let newStatus = checklist.overall_status;
    if (newVarianceSummary) {
      const passRate = newVarianceSummary.total_fields > 0 
        ? newVarianceSummary.within_tolerance / newVarianceSummary.total_fields 
        : 1;
      if (passRate === 1 && totalTests > 0 && failedTests === 0) {
        newStatus = 'pass';
      } else if (passRate < 0.8 || failedTests > 0) {
        newStatus = 'fail';
      } else {
        newStatus = 'pending';
      }
    }
    
    onUpdateChecklist({
      id: checklist.id,
      installed_data: newInstalledData as Json,
      variance_summary: newVarianceSummary as unknown as Json,
      overall_status: newStatus,
    });
  };

  const getChecklistIcon = (type: string) => {
    switch (type) {
      case 'erv': return <Wind className="h-5 w-5" />;
      case 'ahu': return <Wind className="h-5 w-5" />;
      case 'chiller': return <Thermometer className="h-5 w-5" />;
      case 'pump': return <Gauge className="h-5 w-5" />;
      default: return <Wrench className="h-5 w-5" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pass':
        return { label: 'Pass', variant: 'default' as const, color: 'text-green-600', bg: 'bg-green-100' };
      case 'fail':
        return { label: 'Fail', variant: 'destructive' as const, color: 'text-red-600', bg: 'bg-red-100' };
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { label: status, variant: 'outline' as const, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const overallStatus = getStatusConfig(checklist.overall_status);

  return (
    <>
      <Card className={cn(
        checklist.overall_status === 'fail' && 'border-destructive',
        checklist.overall_status === 'pass' && 'border-green-500'
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', overallStatus.bg)}>
                    {getChecklistIcon(checklist.checklist_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {checklist.equipment_tag || checklist.checklist_type.toUpperCase()}
                      <Badge variant={overallStatus.variant}>{overallStatus.label}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {checklist.checklist_type.replace('_', ' ').toUpperCase()} Commissioning
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{passedTests}/{totalTests} Tests</p>
                    <p className="text-xs text-muted-foreground">
                      {failedTests > 0 && <span className="text-destructive">{failedTests} failed</span>}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
              <Progress value={completionPercent} className="mt-3 h-2" />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              
              {/* Design vs Installed Variance Summary */}
              {designData && (
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Design vs Installed Parameters</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsInstalledDataDialogOpen(true)}
                    >
                      <Ruler className="h-4 w-4 mr-1" />
                      {installedData ? 'Edit Installed Data' : 'Enter Installed Data'}
                    </Button>
                  </div>
                  
                  {installedData ? (
                    <VarianceSummaryPanel
                      designData={designData}
                      installedData={installedData}
                      varianceSummary={checklist.variance_summary as any}
                      tolerancePercent={tolerancePercent}
                    />
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        No installed data recorded. Enter installed parameters to calculate variance.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Test Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Test Results</h4>
                  <Button size="sm" variant="outline" onClick={() => setIsTestDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Test
                  </Button>
                </div>

                {tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tests recorded yet. Add tests to track commissioning progress.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tests.map((test) => {
                      const testStatus = getStatusConfig(test.result);
                      const testPhotos = test.photos_urls || [];
                      return (
                        <div 
                          key={test.id} 
                          className={cn(
                            'p-3 rounded-lg border',
                            test.result === 'fail' && 'border-destructive/50 bg-destructive/5',
                            test.result === 'pass' && 'border-green-500/50 bg-green-50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {test.result === 'pass' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : test.result === 'fail' ? (
                                <XCircle className="h-5 w-5 text-destructive" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{test.test_name}</p>
                                {test.test_category && (
                                  <p className="text-xs text-muted-foreground">{test.test_category}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Expected:</span>
                                <span>{test.expected_value}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Actual:</span>
                                <span className={cn(
                                  test.result === 'fail' && 'text-destructive font-medium'
                                )}>{test.actual_value}</span>
                              </div>
                              {test.variance_percent !== null && test.variance_percent !== 0 && (
                                <p className={cn(
                                  'text-xs',
                                  Math.abs(test.variance_percent) > (test.tolerance_percent || 5) 
                                    ? 'text-destructive' 
                                    : 'text-muted-foreground'
                                )}>
                                  Variance: {test.variance_percent.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Photo Gallery */}
                          {testPhotos.length > 0 && (
                            <TestPhotoGallery
                              photos={testPhotos}
                              testId={test.id}
                              testName={test.test_name}
                              onDeletePhoto={async (photoUrl) => {
                                await removePhotoFromTest(test.id, testPhotos, photoUrl);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              {checklist.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{checklist.notes}</p>
                </div>
              )}

              {/* Verified info */}
              {checklist.verified_at && (
                <p className="text-xs text-muted-foreground mt-4">
                  Verified on {format(new Date(checklist.verified_at), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <TestDataEntryDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        checklistType={checklist.checklist_type}
        onSubmit={(data) => {
          onAddTest(data);
          setIsTestDialogOpen(false);
        }}
      />
      
      {designData && (
        <InstalledDataEntryDialog
          open={isInstalledDataDialogOpen}
          onOpenChange={setIsInstalledDataDialogOpen}
          designData={designData}
          installedData={installedData}
          tolerancePercent={tolerancePercent}
          onSave={handleSaveInstalledData}
        />
      )}
    </>
  );
}
