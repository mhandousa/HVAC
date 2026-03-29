import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, Edit2, Grid3X3 } from 'lucide-react';
import { useSkillsMatrix, SkillsMatrixData } from '@/hooks/useSkillsMatrix';
import { SkillType } from '@/lib/technician-skills';
import { SkillsMatrixCell } from './SkillsMatrixCell';
import { SkillCoverageStats } from './SkillCoverageStats';
import { SkillGapAlert } from './SkillGapAlert';
import { SkillsMatrixExportDialog } from './SkillsMatrixExportDialog';
import { TechnicianSkillsEditor } from './TechnicianSkillsEditor';
import { cn } from '@/lib/utils';

export function SkillsMatrixGrid() {
  const [skillTypeFilter, setSkillTypeFilter] = useState<SkillType | 'all'>('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editingTechnicianId, setEditingTechnicianId] = useState<string | null>(null);

  const matrixData = useSkillsMatrix(skillTypeFilter === 'all' ? undefined : skillTypeFilter);

  if (matrixData.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const editingTechnician = matrixData.technicians.find(t => t.id === editingTechnicianId);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <SkillCoverageStats stats={matrixData.stats} />

      {/* Gap Alert */}
      <SkillGapAlert gaps={matrixData.gaps} />

      {/* Matrix Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-5 h-5 text-primary" />
            <CardTitle>Skills Matrix</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {matrixData.technicians.length} technicians × {matrixData.skills.length} skills
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={skillTypeFilter} onValueChange={(v) => setSkillTypeFilter(v as SkillType | 'all')}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                <TabsTrigger value="deficiency_category" className="text-xs px-3 h-7">Deficiency</TabsTrigger>
                <TabsTrigger value="equipment_type" className="text-xs px-3 h-7">Equipment</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {matrixData.technicians.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No technicians found. Add team members to view the skills matrix.
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-background p-2 text-left text-xs font-medium text-muted-foreground min-w-[180px] border-b">
                        Technician
                      </th>
                      {matrixData.skills.map((skill) => (
                        <th
                          key={`${skill.type}:${skill.id}`}
                          className="p-2 text-center text-xs font-medium text-muted-foreground border-b min-w-[70px]"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="truncate max-w-[60px]" title={skill.label}>
                              {skill.label.length > 10 ? skill.label.substring(0, 8) + '…' : skill.label}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1 py-0 h-4",
                                skill.type === 'deficiency_category' 
                                  ? 'border-purple-500/30 text-purple-600 dark:text-purple-400' 
                                  : 'border-blue-500/30 text-blue-600 dark:text-blue-400'
                              )}
                            >
                              {skill.type === 'deficiency_category' ? 'DEF' : 'EQP'}
                            </Badge>
                          </div>
                        </th>
                      ))}
                      <th className="p-2 text-center text-xs font-medium text-muted-foreground border-b min-w-[60px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.technicians.map((tech) => (
                      <tr key={tech.id} className="border-b border-muted/50 hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-background p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={tech.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(tech.full_name || tech.email).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate max-w-[130px]">
                              {tech.full_name || tech.email}
                            </span>
                          </div>
                        </td>
                        {matrixData.skills.map((skill) => {
                          const key = `${skill.type}:${skill.id}`;
                          const cell = matrixData.matrix.get(tech.id)?.get(key);
                          return (
                            <td key={key} className="p-1 text-center">
                              <div className="flex justify-center">
                                <SkillsMatrixCell
                                  level={cell?.level || null}
                                  certified={cell?.certified || false}
                                  certificationExpiry={cell?.certificationExpiry || null}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingTechnicianId(tech.id)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Coverage Row */}
                    <tr className="bg-muted/30 font-medium">
                      <td className="sticky left-0 z-10 bg-muted/30 p-2 text-xs text-muted-foreground">
                        Coverage
                      </td>
                      {matrixData.skills.map((skill) => {
                        const key = `${skill.type}:${skill.id}`;
                        const cov = matrixData.coverage.get(key);
                        const percentage = cov?.percentage || 0;
                        return (
                          <td key={key} className="p-1 text-center">
                            <span
                              className={cn(
                                'text-xs font-medium',
                                percentage >= 70 ? 'text-emerald-600' :
                                percentage >= 50 ? 'text-amber-600' :
                                percentage >= 30 ? 'text-orange-600' :
                                'text-destructive'
                              )}
                            >
                              {Math.round(percentage)}%
                            </span>
                          </td>
                        );
                      })}
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
            <span className="text-xs text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-10 h-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">BAS</div>
              <span className="text-xs">Basic</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] text-amber-700 dark:text-amber-400">INT</div>
              <span className="text-xs">Intermediate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] text-blue-700 dark:text-blue-400">ADV</div>
              <span className="text-xs">Advanced</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] text-emerald-700 dark:text-emerald-400">EXP</div>
              <span className="text-xs">Expert</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground/50">—</div>
              <span className="text-xs">No skill</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <SkillsMatrixExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={matrixData}
      />

      {/* Skills Editor Dialog */}
      {editingTechnician && (
        <TechnicianSkillsEditor
          technicianId={editingTechnician.id}
          technicianName={editingTechnician.full_name || editingTechnician.email}
          open={!!editingTechnicianId}
          onOpenChange={(open) => !open && setEditingTechnicianId(null)}
        />
      )}
    </div>
  );
}
