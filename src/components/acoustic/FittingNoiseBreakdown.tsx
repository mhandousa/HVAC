import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Info, Lightbulb, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuieterAlternative } from '@/lib/acoustic-noise-calculations';

interface FittingNoise {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  coefficient: number;
  noiseDb: number;
}

interface FittingNoiseBreakdownProps {
  fittings: FittingNoise[];
  totalNoise: number;
  targetNC: number;
  systemType: 'duct' | 'pipe';
  showRecommendations?: boolean;
}

export function FittingNoiseBreakdown({
  fittings,
  totalNoise,
  targetNC,
  systemType,
  showRecommendations = true,
}: FittingNoiseBreakdownProps) {
  const sortedFittings = useMemo(() => {
    return [...fittings].sort((a, b) => b.noiseDb - a.noiseDb);
  }, [fittings]);

  const maxNoise = Math.max(...fittings.map(f => f.noiseDb), 1);
  const ncEquivalent = Math.round(totalNoise - 7);
  const exceeds = ncEquivalent > targetNC;

  const highNoiseFittings = sortedFittings.filter(f => f.noiseDb > 25);

  const getNoiseStatus = (noiseDb: number) => {
    if (noiseDb > 30) return { status: 'high', color: 'text-red-600', bg: 'bg-red-100' };
    if (noiseDb > 20) return { status: 'moderate', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { status: 'low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getNoiseBarColor = (noiseDb: number) => {
    if (noiseDb > 30) return 'bg-red-500';
    if (noiseDb > 20) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Fitting Noise Breakdown
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Total: {totalNoise.toFixed(1)} dB
            </Badge>
            <Badge 
              variant={exceeds ? 'destructive' : 'default'}
              className={exceeds ? '' : 'bg-green-600'}
            >
              NC-{ncEquivalent}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Noise contribution from each {systemType} fitting sorted by impact
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedFittings.length > 0 ? (
          <>
            {/* Fitting Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Fitting</TableHead>
                    <TableHead className="text-center w-16">Qty</TableHead>
                    <TableHead className="text-center w-20">
                      {systemType === 'duct' ? 'C' : 'K'}
                    </TableHead>
                    <TableHead className="w-48">Noise Level</TableHead>
                    <TableHead className="text-center w-20">dB</TableHead>
                    <TableHead className="text-center w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFittings.map((fitting, idx) => {
                    const noiseStatus = getNoiseStatus(fitting.noiseDb);
                    const percentage = (fitting.noiseDb / maxNoise) * 100;
                    
                    return (
                      <TableRow key={fitting.id || idx}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{fitting.name}</p>
                            <p className="text-xs text-muted-foreground">{fitting.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{fitting.quantity}</TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {fitting.coefficient.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full transition-all ${getNoiseBarColor(fitting.noiseDb)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {fitting.noiseDb.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${noiseStatus.bg} ${noiseStatus.color} border-0`}>
                            {noiseStatus.status === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {noiseStatus.status === 'low' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {noiseStatus.status.charAt(0).toUpperCase() + noiseStatus.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Recommendations for High Noise Fittings */}
            {showRecommendations && highNoiseFittings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium text-sm">Noise Reduction Recommendations</span>
                </div>
                <ul className="space-y-2">
                  {highNoiseFittings.slice(0, 3).map(fitting => {
                    const alternative = getQuieterAlternative(fitting.category);
                    if (!alternative) return null;
                    
                    return (
                      <li key={fitting.id} className="text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>
                          <strong>{fitting.name}:</strong> {alternative.recommendation} 
                          <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 border-green-200">
                            -{alternative.estimatedReduction} dB
                          </Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">
                  {fittings.filter(f => f.noiseDb <= 20).length}
                </p>
                <p className="text-xs text-muted-foreground">Low Noise</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-amber-600">
                  {fittings.filter(f => f.noiseDb > 20 && f.noiseDb <= 30).length}
                </p>
                <p className="text-xs text-muted-foreground">Moderate</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-red-600">
                  {fittings.filter(f => f.noiseDb > 30).length}
                </p>
                <p className="text-xs text-muted-foreground">High Noise</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No fittings added yet</p>
            <p className="text-sm">Add fittings to see their noise contribution breakdown</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
