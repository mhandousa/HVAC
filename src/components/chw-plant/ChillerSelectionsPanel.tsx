import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Snowflake, Plus, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useChillerSelectionsByPlant } from '@/hooks/useChillerSelections';
import { Skeleton } from '@/components/ui/skeleton';

interface ChillerSelectionsPanelProps {
  plantId: string | null;
  plantName?: string;
  requiredCapacityTons?: number;
}

export function ChillerSelectionsPanel({ 
  plantId, 
  plantName,
  requiredCapacityTons = 0 
}: ChillerSelectionsPanelProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  
  const { data: chillerSelections, isLoading } = useChillerSelectionsByPlant(plantId || undefined);

  const handleOpenSelectionTool = () => {
    const url = `/design/chiller-selection?project=${projectId || ''}${plantId ? `&plant=${plantId}` : ''}`;
    navigate(url);
  };

  // Calculate totals
  const totalCapacity = chillerSelections?.reduce((sum, c) => sum + (c.rated_capacity_tons || 0), 0) || 0;
  const avgIplv = chillerSelections?.length 
    ? chillerSelections.reduce((sum, c) => sum + (c.rated_iplv || 0), 0) / chillerSelections.length 
    : 0;
  const capacityMet = totalCapacity >= requiredCapacityTons;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="h-4 w-4" />
            Chiller Selections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="h-4 w-4 text-primary" />
            Chiller Selections
          </CardTitle>
          {chillerSelections && chillerSelections.length > 0 && (
            <Badge variant={capacityMet ? 'default' : 'destructive'} className="text-xs">
              {capacityMet ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Capacity Met</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Undersized</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chillerSelections && chillerSelections.length > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-primary">{chillerSelections.length}</div>
                <div className="text-xs text-muted-foreground">Chillers</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{totalCapacity.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Tons</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{avgIplv.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Avg IPLV</div>
              </div>
            </div>

            {/* Chiller List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chillerSelections.map((chiller) => (
                <div 
                  key={chiller.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                >
                  <div>
                    <div className="font-medium">{chiller.chiller_tag || chiller.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {chiller.manufacturer} {chiller.model_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{chiller.rated_capacity_tons} tons</div>
                    <div className="text-xs text-muted-foreground">
                      IPLV: {chiller.rated_iplv?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Open Tool Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleOpenSelectionTool}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Selection Tool
            </Button>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <Snowflake className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No chillers selected yet
              </p>
              {requiredCapacityTons > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Required: {requiredCapacityTons.toFixed(0)} tons
                </p>
              )}
            </div>
            <Button 
              className="w-full"
              onClick={handleOpenSelectionTool}
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Chillers
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
