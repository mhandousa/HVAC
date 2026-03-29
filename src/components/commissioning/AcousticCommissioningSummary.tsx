import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { CommissioningChecklist } from '@/hooks/useCommissioning';
import { cn } from '@/lib/utils';

interface AcousticCommissioningSummaryProps {
  checklists: CommissioningChecklist[];
}

interface AcousticDesignData {
  zone_id?: string;
  zone_name?: string;
  space_type?: string;
  target_nc?: number;
  estimated_nc?: number | null;
}

interface AcousticInstalledData {
  measured_nc?: number;
}

export function AcousticCommissioningSummary({ checklists }: AcousticCommissioningSummaryProps) {
  // Filter to acoustic-related checklists (those with target_nc in design_data)
  const acousticChecklists = useMemo(() => {
    return checklists.filter(c => {
      const designData = c.design_data as AcousticDesignData | null;
      return designData?.target_nc !== undefined;
    });
  }, [checklists]);

  const stats = useMemo(() => {
    let verified = 0;
    let exceeding = 0;
    let marginal = 0;
    let pending = 0;
    let totalMeasured = 0;
    let totalTarget = 0;

    acousticChecklists.forEach(c => {
      const designData = c.design_data as AcousticDesignData | null;
      const installedData = c.installed_data as AcousticInstalledData | null;
      const targetNC = designData?.target_nc ?? 40;
      const measuredNC = installedData?.measured_nc;

      if (measuredNC === undefined) {
        pending++;
      } else {
        totalMeasured += measuredNC;
        totalTarget += targetNC;
        const delta = measuredNC - targetNC;
        if (delta <= 0) {
          verified++;
        } else if (delta <= 5) {
          marginal++;
        } else {
          exceeding++;
        }
      }
    });

    const completed = verified + marginal + exceeding;
    const avgMeasuredNC = completed > 0 ? Math.round(totalMeasured / completed) : null;
    const avgTargetNC = acousticChecklists.length > 0 
      ? Math.round(totalTarget / acousticChecklists.length) 
      : null;

    return {
      total: acousticChecklists.length,
      verified,
      exceeding,
      marginal,
      pending,
      completed,
      avgMeasuredNC,
      avgTargetNC,
      completionPercent: acousticChecklists.length > 0 
        ? Math.round((completed / acousticChecklists.length) * 100) 
        : 0,
      passRate: completed > 0 
        ? Math.round((verified / completed) * 100) 
        : 0,
    };
  }, [acousticChecklists]);

  if (acousticChecklists.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Acoustic Verification Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Zones Verified</span>
            <span className="font-medium">{stats.completed}/{stats.total}</span>
          </div>
          <Progress value={stats.completionPercent} className="h-2" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{stats.verified}</p>
            <p className="text-xs text-green-700">Pass</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-yellow-600">{stats.marginal}</p>
            <p className="text-xs text-yellow-700">Marginal</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-destructive">{stats.exceeding}</p>
            <p className="text-xs text-red-700">Exceed</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Target className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        <Separator />

        {/* Averages */}
        {stats.avgMeasuredNC !== null && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Measured NC</p>
              <p className="text-xl font-bold">NC-{stats.avgMeasuredNC}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Avg Target NC</p>
              <p className="text-xl font-bold text-muted-foreground">NC-{stats.avgTargetNC}</p>
            </div>
          </div>
        )}

        {/* Pass Rate */}
        {stats.completed > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Overall Pass Rate</span>
            <Badge 
              variant="secondary"
              className={cn(
                stats.passRate >= 80 && 'bg-green-100 text-green-800',
                stats.passRate >= 50 && stats.passRate < 80 && 'bg-yellow-100 text-yellow-800',
                stats.passRate < 50 && 'bg-red-100 text-red-800'
              )}
            >
              {stats.passRate}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
