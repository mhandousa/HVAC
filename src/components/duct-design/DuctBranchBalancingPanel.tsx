import { DuctSystemAnalysis, getBranchBalanceColor, getBranchBalanceStatus } from '@/hooks/useDuctSystemAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wind, CheckCircle2, AlertTriangle, Gauge, SlidersHorizontal } from 'lucide-react';

interface DuctBranchBalancingPanelProps {
  analysis: DuctSystemAnalysis;
  onSelectBranch?: (terminalSegmentId: string) => void;
  selectedBranchId?: string;
}

interface BranchCardProps {
  branch: DuctSystemAnalysis['branches'][0];
  criticalPathPressure: number;
  isSelected: boolean;
  onSelect: () => void;
}

function BranchCard({ branch, criticalPathPressure, isSelected, onSelect }: BranchCardProps) {
  const progressPercent = criticalPathPressure > 0 
    ? (branch.pressureDrop / criticalPathPressure) * 100 
    : 0;
  
  const isCritical = branch.deltaFromCritical === 0;
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isCritical ? 'border-primary bg-primary/5' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{branch.branchName}</span>
          </div>
          {isCritical ? (
            <Badge variant="default" className="text-xs">Critical</Badge>
          ) : (
            <Badge 
              variant="outline" 
              className={`text-xs ${getBranchBalanceColor(branch.deltaFromCritical)}`}
            >
              {getBranchBalanceStatus(branch.deltaFromCritical)}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">CFM:</span>
            <span className="ml-1 font-medium">{branch.cfm.toFixed(0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">ΔP:</span>
            <span className="ml-1 font-medium">{branch.pressureDrop.toFixed(1)} Pa</span>
          </div>
        </div>
        
        <Progress value={progressPercent} className="h-1.5" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Δ Critical: {branch.deltaFromCritical.toFixed(1)} Pa</span>
          {branch.damperRequired && branch.recommendedDamperPosition && (
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              {branch.recommendedDamperPosition}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DuctBranchBalancingPanel({ 
  analysis, 
  onSelectBranch,
  selectedBranchId 
}: DuctBranchBalancingPanelProps) {
  const branchesRequiringDamper = analysis.branches.filter(b => b.damperRequired);
  
  return (
    <div className="h-full flex flex-col">
      {/* Summary Card */}
      <Card className="m-2 mb-0">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            System Balance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1 mt-0.5">
                {analysis.isBalanced ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-emerald-600">Balanced</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-600">Needs Adjustment</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Critical ΔP:</span>
              <p className="font-medium">{analysis.criticalPathPressureDrop.toFixed(1)} Pa</p>
            </div>
            <div>
              <span className="text-muted-foreground">Max Delta:</span>
              <p className="font-medium">{analysis.maxBranchDelta.toFixed(1)} Pa</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Branches:</span>
              <p className="font-medium">{analysis.branches.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Branch List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {analysis.branches.map((branch) => (
            <BranchCard
              key={branch.branchId}
              branch={branch}
              criticalPathPressure={analysis.criticalPathPressureDrop}
              isSelected={selectedBranchId === branch.terminalSegmentId}
              onSelect={() => onSelectBranch?.(branch.terminalSegmentId)}
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Damper Recommendations */}
      {branchesRequiringDamper.length > 0 && (
        <Card className="m-2 mt-0 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <SlidersHorizontal className="h-4 w-4" />
              Damper Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1 text-xs">
              {branchesRequiringDamper.map((branch) => (
                <div 
                  key={branch.branchId} 
                  className="flex items-center justify-between py-1 border-b border-amber-200 dark:border-amber-800 last:border-0"
                >
                  <span className="font-medium">{branch.branchName}</span>
                  <span className="text-muted-foreground">
                    Set to {branch.recommendedDamperPosition}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
