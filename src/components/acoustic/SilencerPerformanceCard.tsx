import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Check, ExternalLink, VolumeX, Ruler, Wind, Volume2 } from 'lucide-react';
import { ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';
import { OCTAVE_BAND_FREQUENCIES } from '@/lib/nc-reference-curves';

interface SilencerPerformanceCardProps {
  silencer: ManufacturerSilencer;
  isSelected?: boolean;
  onSelect?: () => void;
  requiredAttenuation?: number;
  showFullDetails?: boolean;
}

export function SilencerPerformanceCard({
  silencer,
  isSelected = false,
  onSelect,
  requiredAttenuation,
  showFullDetails = false,
}: SilencerPerformanceCardProps) {
  // Generate chart data from octave band insertion loss
  const chartData = OCTAVE_BAND_FREQUENCIES.map((freq) => ({
    frequency: freq.replace('Hz', '').replace('k', 'k'),
    loss: silencer.insertionLoss.octaveBands[freq as keyof typeof silencer.insertionLoss.octaveBands],
  }));

  const meetsRequirement =
    requiredAttenuation !== undefined &&
    silencer.insertionLoss.overall >= requiredAttenuation;

  const getBestForBadges = (): string[] => {
    const badges: string[] = [];
    if (silencer.insertionLoss.overall >= 15) badges.push('High Attenuation');
    if (silencer.pressureDropIn <= 0.3) badges.push('Low Pressure Drop');
    if (silencer.selfNoiseNC <= 25) badges.push('Low Self-Noise');
    if (silencer.dimensions.lengthIn <= 36) badges.push('Compact');
    return badges;
  };

  const bestForBadges = getBestForBadges();

  return (
    <Card
      className={`relative transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary border-primary'
          : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{silencer.model}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {silencer.manufacturer} • {silencer.series}
            </div>
          </div>
          {meetsRequirement !== undefined && (
            <Badge
              variant={meetsRequirement ? 'default' : 'secondary'}
              className={meetsRequirement ? 'bg-green-500' : ''}
            >
              {meetsRequirement ? 'Meets Requirement' : 'Below Target'}
            </Badge>
          )}
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Attenuation</div>
            <div className="font-bold text-primary">{silencer.insertionLoss.overall} dB</div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Size</div>
            <div className="font-bold">{silencer.dimensions.diameterIn || silencer.dimensions.widthIn}"</div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">PD</div>
            <div className="font-bold">{silencer.pressureDropIn}" w.g.</div>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Self-Noise</div>
            <div className="font-bold">NC-{silencer.selfNoiseNC}</div>
          </div>
        </div>

        {/* Octave Band Chart */}
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="frequency"
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 30]}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
                formatter={(value: number) => [`${value} dB`, 'Insertion Loss']}
              />
              {requiredAttenuation && (
                <ReferenceLine
                  y={requiredAttenuation}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                />
              )}
              <Bar dataKey="loss" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best For Badges */}
        {bestForBadges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bestForBadges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Full Details */}
        {showFullDetails && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Length
                </span>
                <span className="font-medium">{silencer.dimensions.lengthIn}"</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Wind className="h-3 w-3" /> Max Velocity
                </span>
                <span className="font-medium">{silencer.maxVelocityFpm} FPM</span>
              </div>
            </div>

            {/* Octave Band Table */}
            <div className="text-xs">
              <div className="font-medium mb-1">Octave Band Insertion Loss (dB)</div>
              <div className="grid grid-cols-8 gap-1">
                {OCTAVE_BAND_FREQUENCIES.map((freq) => (
                  <div key={freq} className="text-center p-1 rounded bg-muted/30">
                    <div className="text-muted-foreground text-[10px]">
                      {freq.replace('Hz', '')}
                    </div>
                    <div className="font-medium">
                      {silencer.insertionLoss.octaveBands[freq as keyof typeof silencer.insertionLoss.octaveBands]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {silencer.datasheetUrl && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a
                  href={silencer.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Datasheet
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
