import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Wind, 
  Droplets, 
  Package, 
  Snowflake,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  Thermometer,
  Filter,
  Boxes,
  Building2,
} from 'lucide-react';
import { UnifiedDesignReportData, ReportSectionConfig } from '@/hooks/useUnifiedDesignReport';
import { cn } from '@/lib/utils';

interface DesignReportPreviewProps {
  data: UnifiedDesignReportData | null;
  config: ReportSectionConfig;
  isLoading?: boolean;
}

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  count: number;
  included: boolean;
  colorClass: string;
  metrics?: string[];
}

function SectionCard({ icon: Icon, title, count, included, colorClass, metrics }: SectionCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      included ? "bg-card" : "bg-muted/50 opacity-60"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        {included ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-xs text-muted-foreground">items</span>
      </div>
      {metrics && metrics.length > 0 && (
        <div className="mt-2 space-y-1">
          {metrics.map((metric, idx) => (
            <p key={idx} className="text-xs text-muted-foreground">{metric}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function DesignReportPreview({ data, config, isLoading }: DesignReportPreviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Select a project to preview the report
          </p>
        </CardContent>
      </Card>
    );
  }

  const sections: SectionCardProps[] = [
    {
      icon: Calculator,
      title: 'Load Calculations',
      count: data.loadCalculations.items.length,
      included: config.loadCalculations,
      colorClass: 'bg-primary/10 text-primary',
      metrics: [
        `${data.summary.totalCoolingLoadTons.toFixed(1)} Tons cooling`,
        `${(data.summary.totalHeatingLoadBtuh / 1000).toFixed(0)} kBTU/h heating`,
      ],
    },
    {
      icon: Package,
      title: 'Equipment Selections',
      count: data.equipmentSelections.items.length,
      included: config.equipmentSelections,
      colorClass: 'bg-amber-500/10 text-amber-500',
      metrics: [
        `${data.equipmentSelections.approvedCount} approved`,
        `${data.equipmentSelections.pendingCount} pending`,
      ],
    },
    {
      icon: Wind,
      title: 'Duct Systems',
      count: data.ductSystems.length,
      included: config.ductSystems,
      colorClass: 'bg-blue-500/10 text-blue-500',
      metrics: data.ductSystems.length > 0 
        ? [`${data.summary.totalAirflowCfm.toLocaleString()} CFM total`]
        : [],
    },
    {
      icon: Droplets,
      title: 'Pipe Systems',
      count: data.pipeSystems.length,
      included: config.pipeSystems,
      colorClass: 'bg-cyan-500/10 text-cyan-500',
      metrics: data.pipeSystems.length > 0
        ? [`${data.summary.totalWaterFlowGpm.toLocaleString()} GPM total`]
        : [],
    },
    {
      icon: Snowflake,
      title: 'VRF Systems',
      count: data.vrfSystems.length,
      included: config.vrfSystems,
      colorClass: 'bg-indigo-500/10 text-indigo-500',
      metrics: [],
    },
    {
      icon: Wind,
      title: 'Ventilation Calcs',
      count: data.ventilationCalculations?.items.length || 0,
      included: config.ventilationCalculations,
      colorClass: 'bg-teal-500/10 text-teal-500',
      metrics: data.ventilationCalculations && data.ventilationCalculations.items.length > 0
        ? [`${data.summary.totalOutdoorAirCfm?.toLocaleString() || 0} CFM outdoor air`]
        : [],
    },
    {
      icon: RefreshCw,
      title: 'ERV/HRV Sizing',
      count: data.ervSizing?.items.length || 0,
      included: config.ervSizing,
      colorClass: 'bg-pink-500/10 text-pink-500',
      metrics: data.ervSizing && data.ervSizing.items.length > 0
        ? [`${data.summary.totalEnergySavingsKwh?.toLocaleString() || 0} kWh savings`]
        : [],
    },
    {
      icon: Volume2,
      title: 'Acoustic Analysis',
      count: data.acousticAnalysis?.items.length || 0,
      included: config.acousticAnalysis,
      colorClass: 'bg-purple-500/10 text-purple-500',
      metrics: data.acousticAnalysis && data.acousticAnalysis.items.length > 0
        ? [
            `${data.acousticAnalysis.zonesMeetingTarget}/${data.acousticAnalysis.totalZonesWithAcoustics} zones passing`,
            data.acousticAnalysis.averageNC ? `Avg NC-${data.acousticAnalysis.averageNC}` : '',
          ].filter(Boolean)
        : [],
    },
    // New sections for 5 additional design tools
    {
      icon: Thermometer,
      title: 'Coil Selections',
      count: data.coilSelections?.totalCount || 0,
      included: config.coilSelections,
      colorClass: 'bg-cyan-500/10 text-cyan-500',
      metrics: data.coilSelections && data.coilSelections.totalCount > 0
        ? [`${data.coilSelections.totalCoolingCapacityTons.toFixed(1)} tons cooling`]
        : [],
    },
    {
      icon: Filter,
      title: 'Filter Selections',
      count: data.filterSelections?.totalCount || 0,
      included: config.filterSelections,
      colorClass: 'bg-gray-500/10 text-gray-500',
      metrics: data.filterSelections && data.filterSelections.totalCount > 0
        ? [`Avg MERV ${data.filterSelections.averageMervRating.toFixed(0)}`]
        : [],
    },
    {
      icon: Boxes,
      title: 'Terminal Units',
      count: data.terminalUnits?.totalCount || 0,
      included: config.terminalUnits,
      colorClass: 'bg-violet-500/10 text-violet-500',
      metrics: data.terminalUnits && data.terminalUnits.totalCount > 0
        ? [`${data.terminalUnits.totalAirflowCfm.toLocaleString()} CFM`]
        : [],
    },
    {
      icon: Building2,
      title: 'Cooling Towers',
      count: data.coolingTowers?.totalCount || 0,
      included: config.coolingTowers,
      colorClass: 'bg-teal-500/10 text-teal-500',
      metrics: data.coolingTowers && data.coolingTowers.totalCount > 0
        ? [`${data.coolingTowers.totalCapacityTons.toFixed(0)} tons`]
        : [],
    },
  ];

  const includedSections = sections.filter(s => s.included && s.count > 0).length;
  const totalItems = sections.filter(s => s.included).reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold">{data.project.name}</h4>
              <p className="text-xs text-muted-foreground">
                {data.project.client_name && `${data.project.client_name} • `}
                {data.project.location || 'No location'}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {totalItems} items in report
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Design Completeness</span>
              <span className="font-medium">{data.summary.designCompleteness}%</span>
            </div>
            <Progress value={data.summary.designCompleteness} className="h-2" />
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{data.summary.totalCoolingLoadTons.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Tons</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">{data.summary.totalAirflowCfm.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">CFM</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-500">{data.summary.totalWaterFlowGpm.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">GPM</p>
            </div>
            {(data.summary.totalOutdoorAirCfm || 0) > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-teal-500">{data.summary.totalOutdoorAirCfm?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">OA CFM</p>
              </div>
            )}
            {(data.summary.totalEnergySavingsKwh || 0) > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-pink-500">{data.summary.totalEnergySavingsKwh?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">kWh Saved</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <SectionCard key={section.title} {...section} />
        ))}
      </div>

      {/* Included Sections Summary */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        {includedSections} of {sections.length} sections will be included in the report
      </div>
    </div>
  );
}
