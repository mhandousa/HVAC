import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataSource {
  name: string;
  count: number;
  isLoading?: boolean;
}

interface BOQDataSourceIndicatorProps {
  dataSources: {
    ductSystems: DataSource;
    pipeSystems: DataSource;
    terminalUnits: DataSource;
    diffusers: DataSource;
    equipment: DataSource;
    ahus: DataSource;
  };
  isLoading?: boolean;
}

export function BOQDataSourceIndicator({ dataSources, isLoading }: BOQDataSourceIndicatorProps) {
  const sources = [
    { key: 'ductSystems', label: 'Duct Systems', data: dataSources.ductSystems },
    { key: 'pipeSystems', label: 'Pipe Systems', data: dataSources.pipeSystems },
    { key: 'terminalUnits', label: 'Terminal Units', data: dataSources.terminalUnits },
    { key: 'diffusers', label: 'Diffusers/Grilles', data: dataSources.diffusers },
    { key: 'equipment', label: 'Equipment', data: dataSources.equipment },
    { key: 'ahus', label: 'AHU Configurations', data: dataSources.ahus },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          sources.map(source => (
            <div 
              key={source.key}
              className={cn(
                "flex items-center justify-between py-1.5 px-2 rounded-md text-sm",
                source.data.count > 0 
                  ? "bg-primary/5 text-foreground" 
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {source.data.count > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{source.label}</span>
              </div>
              <span className="font-medium">
                {source.data.count > 0 ? source.data.count : '—'}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
