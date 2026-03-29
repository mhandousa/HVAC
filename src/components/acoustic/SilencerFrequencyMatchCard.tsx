import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SilencerMatch, FREQUENCY_BANDS, BandScore } from '@/lib/silencer-frequency-matching';

interface SilencerFrequencyMatchCardProps {
  match: SilencerMatch;
  rank?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onViewSpec?: () => void;
}

const BAND_LABELS: Record<string, string> = {
  '63Hz': '63',
  '125Hz': '125',
  '250Hz': '250',
  '500Hz': '500',
  '1kHz': '1k',
  '2kHz': '2k',
  '4kHz': '4k',
  '8kHz': '8k',
};

function BandStatusIcon({ status }: { status: BandScore['status'] }) {
  switch (status) {
    case 'exceeds':
    case 'meets':
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case 'marginal':
      return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    case 'deficient':
      return <XCircle className="h-3 w-3 text-red-500" />;
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function SilencerFrequencyMatchCard({
  match,
  rank,
  isSelected,
  onSelect,
  onCompare,
  onViewSpec,
}: SilencerFrequencyMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(rank === 1);
  const { silencer, overallScore, bandScores, meetsAllBands, minMargin, recommendation } = match;
  
  // Find the max value for chart scaling
  const maxProvided = Math.max(...bandScores.map(b => b.provided));
  const maxRequired = Math.max(...bandScores.map(b => b.required));
  const chartMax = Math.max(maxProvided, maxRequired, 10);
  
  return (
    <Card className={cn(
      "transition-all",
      isSelected && "ring-2 ring-primary",
      rank === 1 && "border-green-500/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {rank && (
                <Badge variant={rank === 1 ? "default" : "secondary"} className="text-xs">
                  #{rank}
                </Badge>
              )}
              <CardTitle className="text-base">{silencer.model}</CardTitle>
              {meetsAllBands && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  ✓ All Bands
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{silencer.manufacturer}</p>
          </div>
          
          {/* Score Badge */}
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
              {overallScore}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
        
        {/* Score Progress Bar */}
        <div className="mt-2">
          <Progress value={overallScore} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded bg-muted/50 text-center">
            <div className="font-medium">{silencer.dimensions.lengthIn}"</div>
            <div className="text-muted-foreground">Length</div>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <div className="font-medium">{silencer.pressureDropIn}"</div>
            <div className="text-muted-foreground">Δp</div>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <div className="font-medium">NC-{silencer.selfNoiseNC}</div>
            <div className="text-muted-foreground">Self Noise</div>
          </div>
          <div className="p-2 rounded bg-muted/50 text-center">
            <div className={cn("font-medium", minMargin >= 0 ? "text-green-600" : "text-red-500")}>
              {minMargin >= 0 ? '+' : ''}{minMargin}
            </div>
            <div className="text-muted-foreground">Min Margin</div>
          </div>
        </div>
        
        {/* Frequency Band Chart */}
        <div 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Frequency Performance
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Visual Chart */}
          <div className="grid grid-cols-8 gap-1 h-16 items-end bg-muted/30 rounded-lg p-2">
            {bandScores.map(bs => (
              <Tooltip key={bs.band}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 h-full justify-end">
                    {/* Required line marker */}
                    <div 
                      className="w-full border-t-2 border-dashed border-amber-500 absolute"
                      style={{ 
                        bottom: `${(bs.required / chartMax) * 100}%`,
                      }}
                    />
                    {/* Provided bar */}
                    <div 
                      className={cn(
                        "w-full rounded-t transition-all",
                        bs.status === 'deficient' ? 'bg-red-500' :
                        bs.status === 'marginal' ? 'bg-amber-500' :
                        'bg-green-500'
                      )}
                      style={{ 
                        height: `${Math.max(4, (bs.provided / chartMax) * 100)}%`,
                      }}
                    />
                    <span className="text-[9px] text-muted-foreground">{BAND_LABELS[bs.band]}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div className="font-medium">{bs.band}</div>
                    <div>Required: {bs.required} dB</div>
                    <div>Provided: {bs.provided} dB</div>
                    <div className={cn(
                      bs.margin >= 0 ? 'text-green-600' : 'text-red-500'
                    )}>
                      Margin: {bs.margin >= 0 ? '+' : ''}{bs.margin} dB
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <>
            <Separator />
            
            {/* Band-by-band breakdown */}
            <div className="grid grid-cols-4 gap-1 text-xs">
              {bandScores.map(bs => (
                <div 
                  key={bs.band} 
                  className={cn(
                    "p-1.5 rounded flex items-center justify-between",
                    bs.status === 'deficient' ? 'bg-red-50 dark:bg-red-950/30' :
                    bs.status === 'marginal' ? 'bg-amber-50 dark:bg-amber-950/30' :
                    'bg-green-50 dark:bg-green-950/30'
                  )}
                >
                  <span className="font-medium">{BAND_LABELS[bs.band]}Hz</span>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      bs.margin >= 0 ? 'text-green-600' : 'text-red-500'
                    )}>
                      {bs.margin >= 0 ? '+' : ''}{bs.margin}
                    </span>
                    <BandStatusIcon status={bs.status} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Recommendation */}
            <div className="p-2 rounded bg-muted/50 text-xs">
              <span className="text-muted-foreground">{recommendation}</span>
            </div>
            
            {/* Product Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Series</span>
                  <span>{silencer.series}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{silencer.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>
                    {silencer.type === 'round' 
                      ? `${silencer.dimensions.diameterIn}" dia`
                      : `${silencer.dimensions.widthIn}x${silencer.dimensions.heightIn}"`
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Velocity</span>
                  <span>{silencer.maxVelocityFpm} FPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span>{silencer.estimatedCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Availability</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {silencer.localAvailability}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onSelect && (
            <Button 
              size="sm" 
              className="flex-1"
              variant={isSelected ? "secondary" : "default"}
              onClick={onSelect}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          )}
          {onViewSpec && (
            <Button size="sm" variant="outline" onClick={onViewSpec}>
              <FileText className="h-3 w-3 mr-1" />
              Spec
            </Button>
          )}
          {silencer.productUrl && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => window.open(silencer.productUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
