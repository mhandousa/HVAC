import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Wind, 
  Thermometer, 
  ShieldCheck, 
  Snowflake,
  Zap,
  CheckCircle, 
  Circle, 
  ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SpecializedToolsPanelProps {
  projectId: string;
  hasChilledWaterPlant: boolean;
  chilledWaterPlantCount: number;
  hasHotWaterPlant: boolean;
  hotWaterPlantCount: number;
  hasSmokeControl: boolean;
  smokeControlCount: number;
  hasThermalComfort: boolean;
  thermalComfortCount: number;
  hasSBCCompliance: boolean;
  sbcComplianceCount: number;
  hasASHRAE90_1Compliance: boolean;
  ashrae90_1ComplianceCount: number;
  specializedToolsScore: number;
}

interface ToolConfig {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  colorClass: string;
  bgClass: string;
}

const TOOLS: ToolConfig[] = [
  {
    key: 'chilledWater',
    name: 'Chilled Water Plant',
    icon: Snowflake,
    route: '/design/chw-plant',
    colorClass: 'text-cyan-500',
    bgClass: 'bg-cyan-500/10',
  },
  {
    key: 'hotWater',
    name: 'Hot Water Plant',
    icon: Flame,
    route: '/design/hw-plant',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
  },
  {
    key: 'smokeControl',
    name: 'Smoke Control',
    icon: Wind,
    route: '/design/smoke-control',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  {
    key: 'thermalComfort',
    name: 'Thermal Comfort',
    icon: Thermometer,
    route: '/design/thermal-comfort',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
  },
  {
    key: 'sbcCompliance',
    name: 'SBC Compliance',
    icon: ShieldCheck,
    route: '/design/sbc-compliance',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
  },
  {
    key: 'ashrae90_1',
    name: 'ASHRAE 90.1',
    icon: Zap,
    route: '/design/ashrae-compliance',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
  },
];

export function SpecializedToolsPanel({
  projectId,
  hasChilledWaterPlant,
  chilledWaterPlantCount,
  hasHotWaterPlant,
  hotWaterPlantCount,
  hasSmokeControl,
  smokeControlCount,
  hasThermalComfort,
  thermalComfortCount,
  hasSBCCompliance,
  sbcComplianceCount,
  hasASHRAE90_1Compliance,
  ashrae90_1ComplianceCount,
  specializedToolsScore,
}: SpecializedToolsPanelProps) {
  const navigate = useNavigate();

  const getToolStatus = (key: string) => {
    switch (key) {
      case 'chilledWater':
        return { isComplete: hasChilledWaterPlant, count: chilledWaterPlantCount };
      case 'hotWater':
        return { isComplete: hasHotWaterPlant, count: hotWaterPlantCount };
      case 'smokeControl':
        return { isComplete: hasSmokeControl, count: smokeControlCount };
      case 'thermalComfort':
        return { isComplete: hasThermalComfort, count: thermalComfortCount };
      case 'sbcCompliance':
        return { isComplete: hasSBCCompliance, count: sbcComplianceCount };
      case 'ashrae90_1':
        return { isComplete: hasASHRAE90_1Compliance, count: ashrae90_1ComplianceCount };
      default:
        return { isComplete: false, count: 0 };
    }
  };

  const handleOpenTool = (route: string) => {
    navigate(`${route}?project=${projectId}`);
  };

  const completedCount = [hasChilledWaterPlant, hasHotWaterPlant, hasSmokeControl, hasThermalComfort, hasSBCCompliance, hasASHRAE90_1Compliance].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Specialized Tools Progress</CardTitle>
            <CardDescription>
              Project-level design tools completion ({completedCount}/6 complete)
            </CardDescription>
          </div>
          <Badge 
            variant={specializedToolsScore === 100 ? 'default' : 'secondary'}
            className="text-sm"
          >
            {specializedToolsScore}%
          </Badge>
        </div>
        <Progress value={specializedToolsScore} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const { isComplete, count } = getToolStatus(tool.key);
            const Icon = tool.icon;

            return (
              <div
                key={tool.key}
                className={`
                  relative rounded-lg border p-4 transition-all
                  ${isComplete 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-md ${tool.bgClass}`}>
                    <Icon className={`h-5 w-5 ${tool.colorClass}`} />
                  </div>
                  {isComplete ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Circle className="h-3 w-3" />
                      Not Started
                    </Badge>
                  )}
                </div>

                <h4 className="font-medium text-sm mb-1">{tool.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {count} {count === 1 ? 'configuration' : 'configurations'}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleOpenTool(tool.route)}
                >
                  Open Tool
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
