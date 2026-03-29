import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Building2,
  TrendingDown,
  Star,
  ChevronDown,
  ChevronUp,
  Volume2,
  Layers,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TieredPackages, TreatmentPackage, PackageTier } from '@/lib/treatment-package-optimizer';
import { formatCurrencySAR } from '@/lib/acoustic-cost-calculations';

interface PackageComparisonStepProps {
  packages: TieredPackages;
  selectedPackageId: string | null;
  onSelectPackage: (packageId: string) => void;
  isGenerating: boolean;
}

const TIER_CONFIG: Record<PackageTier, { icon: React.ElementType; color: string; label: string }> = {
  budget: { icon: DollarSign, color: 'text-green-600', label: 'Budget' },
  balanced: { icon: Star, color: 'text-blue-600', label: 'Recommended' },
  premium: { icon: Star, color: 'text-amber-600', label: 'Premium' },
};

function PackageCard({
  pkg,
  isSelected,
  onSelect,
  isRecommended,
}: {
  pkg: TreatmentPackage;
  isSelected: boolean;
  onSelect: () => void;
  isRecommended?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TIER_CONFIG[pkg.tier];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary',
        isRecommended && 'border-primary/50'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.color)} />
            {pkg.name}
          </CardTitle>
          {isRecommended && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Recommended
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost */}
        <div className="text-center py-3 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold">{formatCurrencySAR(pkg.totalCost)}</p>
          {pkg.totalLifecycleCost !== pkg.totalCost && (
            <p className="text-xs text-muted-foreground mt-1">
              Lifecycle: {formatCurrencySAR(pkg.totalLifecycleCost)}
            </p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-semibold">{pkg.zonesAddressed}/{pkg.zones.length + (pkg.zones.length === 0 ? pkg.zonesAddressed : 0)}</p>
            <p className="text-xs text-muted-foreground">Zones Treated</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-semibold">{pkg.expectedCompliancePercent}%</p>
            <p className="text-xs text-muted-foreground">Compliance</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-semibold">-{pkg.avgNCReduction} dB</p>
            <p className="text-xs text-muted-foreground">Avg Reduction</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-semibold">{pkg.zonesFullyCompliant}</p>
            <p className="text-xs text-muted-foreground">Fully Compliant</p>
          </div>
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View Details
            </>
          )}
        </Button>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-3 pt-2">
            <Separator />
            
            {/* Cost Breakdown */}
            <div>
              <p className="text-xs font-medium mb-2">Cost Breakdown</p>
              <div className="space-y-1">
                {pkg.costBreakdown.silencers > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Volume2 className="h-3 w-3" /> Silencers
                    </span>
                    <span>{formatCurrencySAR(pkg.costBreakdown.silencers)}</span>
                  </div>
                )}
                {pkg.costBreakdown.lining > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="h-3 w-3" /> Duct Lining
                    </span>
                    <span>{formatCurrencySAR(pkg.costBreakdown.lining)}</span>
                  </div>
                )}
                {pkg.costBreakdown.vibrationIsolation > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-3 w-3" /> Vibration
                    </span>
                    <span>{formatCurrencySAR(pkg.costBreakdown.vibrationIsolation)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Zone List */}
            <div>
              <p className="text-xs font-medium mb-2">Zones Treated</p>
              <ScrollArea className="h-[120px]">
                <div className="space-y-1">
                  {pkg.zones.map(zone => (
                    <div
                      key={zone.zoneId}
                      className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{zone.zoneName}</p>
                        <p className="text-muted-foreground">{zone.treatments.length} treatments</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={zone.willBeCompliant ? 'default' : 'secondary'} className="text-xs">
                          NC-{zone.estimatedFinalNC}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Select Button */}
        <Button
          variant={isSelected ? 'default' : 'outline'}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? 'Selected' : 'Select Package'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PackageComparisonStep({
  packages,
  selectedPackageId,
  onSelectPackage,
  isGenerating,
}: PackageComparisonStepProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-lg font-medium">Generating Packages...</p>
        <p className="text-sm text-muted-foreground">Optimizing treatment combinations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Treatment Packages</h3>
        <p className="text-sm text-muted-foreground">
          Based on your requirements, we've generated three optimized packages. Select the one that best fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PackageCard
          pkg={packages.budget}
          isSelected={selectedPackageId === packages.budget.id}
          onSelect={() => onSelectPackage(packages.budget.id)}
        />
        <PackageCard
          pkg={packages.balanced}
          isSelected={selectedPackageId === packages.balanced.id}
          onSelect={() => onSelectPackage(packages.balanced.id)}
          isRecommended
        />
        <PackageCard
          pkg={packages.premium}
          isSelected={selectedPackageId === packages.premium.id}
          onSelect={() => onSelectPackage(packages.premium.id)}
        />
      </div>
    </div>
  );
}
