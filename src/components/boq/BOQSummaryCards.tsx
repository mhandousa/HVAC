import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Droplets, 
  Thermometer, 
  Wind,
  Wrench,
  Server,
  Anchor,
  Box,
} from 'lucide-react';
import { EnhancedBOQSummary } from '@/types/boq';

interface BOQSummaryCardsProps {
  summary: EnhancedBOQSummary;
}

export function BOQSummaryCards({ summary }: BOQSummaryCardsProps) {
  const cards = [
    {
      icon: Package,
      title: 'Duct Metal',
      value: `${summary.totalDuctAreaSqFt.toFixed(0)} ft²`,
      subtitle: `${summary.totalDuctWeightLbs.toFixed(0)} lbs • ${summary.totalDuctLengthFt.toFixed(0)} ft`,
    },
    {
      icon: Droplets,
      title: 'Pipe Material',
      value: `${summary.totalPipeLengthFt.toFixed(0)} ft`,
      subtitle: `${summary.totalPipeWeightLbs.toFixed(0)} lbs`,
    },
    {
      icon: Wind,
      title: 'Air Terminals',
      value: `${summary.totalDiffusers + summary.totalTerminalUnits}`,
      subtitle: `${summary.totalDiffusers} diffusers • ${summary.totalTerminalUnits} terminal units`,
    },
    {
      icon: Server,
      title: 'Equipment & AHUs',
      value: `${summary.totalEquipmentPieces + summary.totalAHUs}`,
      subtitle: `${summary.totalEquipmentPieces} equipment • ${summary.totalAHUs} AHUs`,
    },
    {
      icon: Box,
      title: 'Fittings',
      value: `${summary.totalDuctFittings + summary.totalPipeFittings}`,
      subtitle: `${summary.totalDuctFittings} duct • ${summary.totalPipeFittings} pipe`,
    },
    {
      icon: Wrench,
      title: 'Accessories',
      value: `${summary.totalAccessories}`,
      subtitle: 'Dampers, actuators, sensors',
    },
    {
      icon: Anchor,
      title: 'Supports',
      value: `${summary.totalSupports}`,
      subtitle: 'Hangers, anchors, guides',
    },
    {
      icon: Thermometer,
      title: 'Insulation',
      value: `${summary.totalInsulationAreaSqM.toFixed(1)} m²`,
      subtitle: `Est. SAR ${summary.totalInsulationCostSAR.toFixed(0)}`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <card.icon className="h-4 w-4" />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
