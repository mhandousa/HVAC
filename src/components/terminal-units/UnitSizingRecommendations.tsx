import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Volume2, Check, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { 
  VAV_STANDARD_SIZES, 
  FCU_STANDARD_SIZES, 
  SAUDI_NC_STANDARDS,
  VAVStandardSize,
  FCUStandardSize 
} from '@/lib/terminal-unit-calculations';

interface UnitRecommendation {
  size: VAVStandardSize | FCUStandardSize;
  fitScore: number;
  capacityHeadroomPercent: number;
  estimatedNC: number;
  isOptimal: boolean;
  status: 'undersized' | 'optimal' | 'oversized';
  warnings: string[];
  type: 'vav' | 'fcu';
}

interface UnitSizingRecommendationsProps {
  targetCfm: number;
  coolingLoadBtuh?: number;
  spaceType?: string;
  unitCategory: 'vav' | 'fcu';
  onSelectRecommendation?: (recommendation: UnitRecommendation) => void;
}

// Get NC target for space type
const getNCTarget = (spaceType?: string): number => {
  if (!spaceType) return 40; // Default to Office
  const standard = SAUDI_NC_STANDARDS.find(s => 
    s.spaceType.toLowerCase() === spaceType.toLowerCase()
  );
  return standard?.targetNC || 40;
};

// Estimate NC for VAV based on inlet velocity
const estimateVAVNC = (cfm: number, inletSizeIn: number): number => {
  const inletAreaSqFt = Math.PI * Math.pow(inletSizeIn / 24, 2);
  const velocity = cfm / inletAreaSqFt;
  
  if (velocity < 800) return 25;
  if (velocity < 1200) return 30;
  if (velocity < 1600) return 35;
  if (velocity < 2000) return 40;
  return 45;
};

// Estimate NC for FCU based on CFM
const estimateFCUNC = (cfm: number, nominalCfm: number): number => {
  const loadRatio = cfm / nominalCfm;
  if (loadRatio < 0.5) return 25;
  if (loadRatio < 0.7) return 30;
  if (loadRatio < 0.85) return 35;
  if (loadRatio < 0.95) return 40;
  return 45;
};

// Get VAV recommendations
const getVAVRecommendations = (targetCfm: number, spaceType?: string): UnitRecommendation[] => {
  const ncTarget = getNCTarget(spaceType);
  const recommendations: UnitRecommendation[] = [];

  // Find sizes that could work (within 50% to 150% of target)
  const candidateSizes = VAV_STANDARD_SIZES.filter(size => 
    size.maxCfm >= targetCfm * 0.8 || size.minCfm <= targetCfm * 1.5
  ).slice(0, 5);

  candidateSizes.forEach(size => {
    const estimatedNC = estimateVAVNC(targetCfm, size.inlet);
    const warnings: string[] = [];
    let fitScore = 100;
    let status: 'undersized' | 'optimal' | 'oversized' = 'optimal';

    // Check if undersized
    if (size.maxCfm < targetCfm) {
      status = 'undersized';
      fitScore -= 40;
      warnings.push(`Max CFM (${size.maxCfm}) below target (${targetCfm})`);
    }

    // Check if oversized
    const headroom = ((size.maxCfm - targetCfm) / targetCfm) * 100;
    if (headroom > 80) {
      status = 'oversized';
      fitScore -= 20;
      warnings.push(`Significantly oversized (${Math.round(headroom)}% headroom)`);
    } else if (headroom > 50) {
      fitScore -= 10;
    }

    // Optimal headroom bonus (10-30%)
    if (headroom >= 10 && headroom <= 30 && status !== 'undersized') {
      fitScore += 10;
    }

    // NC penalty
    if (estimatedNC > ncTarget) {
      fitScore -= (estimatedNC - ncTarget) * 3;
      warnings.push(`Exceeds NC-${ncTarget} target for ${spaceType || 'Office'}`);
    } else {
      fitScore += 5; // NC compliant bonus
    }

    // Min CFM check
    if (size.minCfm > targetCfm * 0.3) {
      fitScore -= 5;
      warnings.push(`High minimum CFM may limit turndown`);
    }

    recommendations.push({
      size,
      fitScore: Math.max(0, Math.min(100, fitScore)),
      capacityHeadroomPercent: Math.round(headroom),
      estimatedNC,
      isOptimal: false,
      status,
      warnings,
      type: 'vav'
    });
  });

  // Sort by fit score and mark optimal
  recommendations.sort((a, b) => b.fitScore - a.fitScore);
  if (recommendations.length > 0 && recommendations[0].status !== 'undersized') {
    recommendations[0].isOptimal = true;
  }

  return recommendations.slice(0, 4);
};

// Get FCU recommendations
const getFCURecommendations = (targetCfm: number, coolingLoadBtuh: number, spaceType?: string): UnitRecommendation[] => {
  const ncTarget = getNCTarget(spaceType);
  const coolingLoadMbh = coolingLoadBtuh / 1000;
  const recommendations: UnitRecommendation[] = [];

  // Find sizes that could work
  const candidateSizes = FCU_STANDARD_SIZES.filter(size => 
    size.cfm >= targetCfm * 0.7 || size.cfm <= targetCfm * 1.5
  ).slice(0, 5);

  candidateSizes.forEach(size => {
    const estimatedNC = estimateFCUNC(targetCfm, size.cfm);
    const warnings: string[] = [];
    let fitScore = 100;
    let status: 'undersized' | 'optimal' | 'oversized' = 'optimal';

    // Check CFM capacity (FCU has single cfm value, not min/max)
    if (size.cfm < targetCfm) {
      status = 'undersized';
      fitScore -= 35;
      warnings.push(`CFM (${size.cfm}) below target (${targetCfm})`);
    }

    // Check cooling capacity
    if (coolingLoadMbh > 0 && size.coolingMbh < coolingLoadMbh) {
      fitScore -= 25;
      warnings.push(`Cooling capacity (${size.coolingMbh} MBH) may be insufficient`);
    }

    // Headroom calculation
    const cfmHeadroom = ((size.cfm - targetCfm) / targetCfm) * 100;
    if (cfmHeadroom > 80) {
      status = 'oversized';
      fitScore -= 15;
      warnings.push(`Significantly oversized`);
    }

    // Optimal headroom bonus
    if (cfmHeadroom >= 10 && cfmHeadroom <= 40 && status !== 'undersized') {
      fitScore += 10;
    }

    // NC compliance
    if (estimatedNC > ncTarget) {
      fitScore -= (estimatedNC - ncTarget) * 3;
      warnings.push(`May exceed NC-${ncTarget} target`);
    } else {
      fitScore += 5;
    }

    recommendations.push({
      size,
      fitScore: Math.max(0, Math.min(100, fitScore)),
      capacityHeadroomPercent: Math.max(0, Math.round(cfmHeadroom)),
      estimatedNC,
      isOptimal: false,
      status,
      warnings,
      type: 'fcu'
    });
  });

  // Sort and mark optimal
  recommendations.sort((a, b) => b.fitScore - a.fitScore);
  if (recommendations.length > 0 && recommendations[0].status !== 'undersized') {
    recommendations[0].isOptimal = true;
  }

  return recommendations.slice(0, 4);
};

export const UnitSizingRecommendations: React.FC<UnitSizingRecommendationsProps> = ({
  targetCfm,
  coolingLoadBtuh = 0,
  spaceType,
  unitCategory,
  onSelectRecommendation
}) => {
  if (targetCfm <= 0) return null;

  const recommendations = unitCategory === 'vav' 
    ? getVAVRecommendations(targetCfm, spaceType)
    : getFCURecommendations(targetCfm, coolingLoadBtuh, spaceType);

  if (recommendations.length === 0) return null;

  const ncTarget = getNCTarget(spaceType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-emerald-600 dark:text-emerald-400';
      case 'undersized': return 'text-destructive';
      case 'oversized': return 'text-warning dark:text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'optimal': return 'Optimal Fit';
      case 'undersized': return 'Undersized';
      case 'oversized': return 'Oversized';
      default: return status;
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Unit Sizing Recommendations
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Target: {targetCfm.toLocaleString()} CFM
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on {spaceType || 'Office'} space type (NC-{ncTarget} target)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommendations.map((rec, index) => {
            const isVAV = rec.type === 'vav';
            const vavSize = isVAV ? (rec.size as VAVStandardSize) : null;
            const fcuSize = !isVAV ? (rec.size as FCUStandardSize) : null;

            const sizeName = isVAV 
              ? `${vavSize?.inlet}" VAV`
              : `FCU-${fcuSize?.model}`;
            
            const cfmRange = isVAV
              ? `${vavSize?.minCfm}-${vavSize?.maxCfm} CFM`
              : `${fcuSize?.cfm} CFM`;

            return (
              <div
                key={index}
                className={`relative p-3 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                  rec.isOptimal 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onSelectRecommendation?.(rec)}
              >
                {rec.isOptimal && (
                  <Badge 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0"
                  >
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Best
                  </Badge>
                )}

                <div className="space-y-2">
                  <div className="text-center">
                    <p className="font-semibold text-sm">{sizeName}</p>
                    <p className="text-xs text-muted-foreground">{cfmRange}</p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                    <span>NC-{rec.estimatedNC}</span>
                    {rec.estimatedNC <= ncTarget ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    )}
                  </div>

                  <div className={`text-xs text-center font-medium ${getStatusColor(rec.status)}`}>
                    {getStatusLabel(rec.status)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Fit Score</span>
                      <span className="font-medium">{rec.fitScore}%</span>
                    </div>
                    <Progress 
                      value={rec.fitScore} 
                      className="h-1"
                    />
                  </div>

                  {rec.capacityHeadroomPercent > 0 && rec.status !== 'undersized' && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-2.5 w-2.5" />
                      +{rec.capacityHeadroomPercent}% headroom
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warnings Section */}
        {recommendations.some(r => r.warnings.length > 0) && (
          <div className="mt-3 space-y-1">
            {recommendations
              .filter(r => r.isOptimal || r.warnings.length > 0)
              .slice(0, 2)
              .map((rec, index) => {
                const isVAV = rec.type === 'vav';
                const sizeName = isVAV 
                  ? `${(rec.size as VAVStandardSize).inlet}" VAV`
                  : `FCU-${(rec.size as FCUStandardSize).model}`;

                if (rec.isOptimal && rec.warnings.length === 0) {
                  return (
                    <p key={index} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1.5">
                      <Check className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{sizeName}: {rec.capacityHeadroomPercent}% headroom, meets NC-{ncTarget} for {spaceType || 'Office'}</span>
                    </p>
                  );
                }

                return rec.warnings.slice(0, 1).map((warning, wIndex) => (
                  <p key={`${index}-${wIndex}`} className="text-xs text-warning flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{sizeName}: {warning}</span>
                  </p>
                ));
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitSizingRecommendations;
