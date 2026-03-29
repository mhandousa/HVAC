import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, VolumeX } from 'lucide-react';
import { ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';

interface SilencerComparisonTableProps {
  silencers: ManufacturerSilencer[];
  requiredAttenuation?: number;
  selectedModel?: string;
  onSelect?: (silencer: ManufacturerSilencer) => void;
}

export function SilencerComparisonTable({
  silencers,
  requiredAttenuation,
  selectedModel,
  onSelect,
}: SilencerComparisonTableProps) {
  if (silencers.length === 0) {
    return null;
  }

  // Helper to get nested property values
  const getSpecValue = (silencer: ManufacturerSilencer, key: string): string | number => {
    switch (key) {
      case 'ductSize':
        return silencer.dimensions.diameterIn || silencer.dimensions.widthIn || silencer.sizeRange.minIn;
      case 'insertionLoss':
        return silencer.insertionLoss.overall;
      case 'length':
        return silencer.dimensions.lengthIn;
      default:
        return (silencer as any)[key];
    }
  };

  const specs = [
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'series', label: 'Series' },
    { key: 'ductSize', label: 'Duct Size', suffix: '"' },
    { key: 'insertionLoss', label: 'Insertion Loss', suffix: ' dB', highlight: true },
    { key: 'pressureDropIn', label: 'Pressure Drop', suffix: '" w.g.' },
    { key: 'selfNoiseNC', label: 'Self-Noise', prefix: 'NC-' },
    { key: 'length', label: 'Length', suffix: '"' },
    { key: 'maxVelocityFpm', label: 'Max Velocity', suffix: ' FPM' },
  ];

  const getBestValue = (key: string): number | string => {
    const values = silencers.map((s) => getSpecValue(s, key));
    
    if (key === 'insertionLoss') {
      return Math.max(...values.filter((v) => typeof v === 'number') as number[]);
    }
    if (key === 'pressureDropIn' || key === 'selfNoiseNC') {
      return Math.min(...values.filter((v) => typeof v === 'number') as number[]);
    }
    if (key === 'length') {
      return Math.min(...values.filter((v) => typeof v === 'number') as number[]);
    }
    if (key === 'maxVelocityFpm') {
      return Math.max(...values.filter((v) => typeof v === 'number') as number[]);
    }
    return values[0];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <VolumeX className="h-4 w-4" />
          Side-by-Side Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  Specification
                </th>
                {silencers.map((s) => (
                  <th
                    key={s.model}
                    className={`text-center py-2 px-3 min-w-[120px] ${
                      selectedModel === s.model ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="font-medium">{s.model}</div>
                    {selectedModel === s.model && (
                      <Badge variant="default" className="mt-1 text-xs">
                        Selected
                      </Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map(({ key, label, prefix = '', suffix = '', highlight }) => {
                const bestValue = getBestValue(key);

                return (
                  <tr key={key} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3 text-muted-foreground">{label}</td>
                    {silencers.map((s) => {
                      const value = getSpecValue(s, key);
                      const isBest = value === bestValue && typeof value === 'number';
                      const meetsReq =
                        key === 'insertionLoss' &&
                        requiredAttenuation !== undefined &&
                        (value as number) >= requiredAttenuation;

                      return (
                        <td
                          key={s.model}
                          className={`text-center py-2 px-3 ${
                            selectedModel === s.model ? 'bg-primary/5' : ''
                          }`}
                        >
                          <span
                            className={`${isBest ? 'font-bold text-primary' : ''} ${
                              highlight && meetsReq ? 'text-green-600' : ''
                            }`}
                          >
                            {prefix}
                            {value}
                            {suffix}
                          </span>
                          {isBest && key !== 'manufacturer' && key !== 'series' && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] px-1 py-0"
                            >
                              Best
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Selection Row */}
              {onSelect && (
                <tr>
                  <td className="py-3 px-3"></td>
                  {silencers.map((s) => (
                    <td key={s.model} className="text-center py-3 px-3">
                      <Button
                        variant={selectedModel === s.model ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onSelect(s)}
                      >
                        {selectedModel === s.model ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Requirement Line */}
        {requiredAttenuation && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-4 h-0.5 bg-destructive" />
            <span>
              Required attenuation: {requiredAttenuation} dB
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
