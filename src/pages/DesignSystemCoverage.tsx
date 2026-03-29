import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Search, ShieldCheck, ArrowRightLeft, Save, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolIntegration {
  tool: string;
  displayName: string;
  category: string;
  preSaveValidation: boolean;
  dataFlowImport: boolean;
  crossToolValidation: boolean;
  path: string;
}

// Complete list of all design tools and their integration status
const TOOLS_CONFIG: ToolIntegration[] = [
  // Core Calculations
  { tool: 'load-calculation', displayName: 'Load Calculation', category: 'Core Calculations', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/load-calculation' },
  { tool: 'ventilation', displayName: 'Ventilation Calculator', category: 'Core Calculations', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/ventilation-calculator' },
  { tool: 'psychrometric', displayName: 'Psychrometric Chart', category: 'Core Calculations', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/psychrometric' },
  { tool: 'ahu-configuration', displayName: 'AHU Configuration', category: 'Core Calculations', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/ahu-configuration' },
  
  // Equipment Selection
  { tool: 'equipment-selection', displayName: 'Equipment Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/equipment-selection' },
  { tool: 'terminal-unit', displayName: 'Terminal Unit Sizing', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/terminal-unit-sizing' },
  { tool: 'coil-selection', displayName: 'Coil Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/coil-selection' },
  { tool: 'filter-selection', displayName: 'Filter Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/filter-selection' },
  { tool: 'fan-selection', displayName: 'Fan Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/fan-selection' },
  { tool: 'pump-selection', displayName: 'Pump Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/pump-selection' },
  { tool: 'vav-box-selection', displayName: 'VAV Box Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/vav-box-selection' },
  { tool: 'fcu-selection', displayName: 'FCU Selection', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/fcu-selection' },
  { tool: 'vrf-system', displayName: 'VRF Designer', category: 'Equipment Selection', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/vrf-designer' },
  
  // Air Distribution
  { tool: 'duct-system', displayName: 'Duct Designer', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/duct-designer' },
  { tool: 'duct-sizing', displayName: 'Duct Sizing', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/duct-sizing' },
  { tool: 'diffuser', displayName: 'Diffuser Selection', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/diffuser-selection' },
  { tool: 'erv', displayName: 'ERV Sizing', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/erv-sizing' },
  { tool: 'pressure-drop', displayName: 'Pressure Drop Calculator', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/pressure-drop' },
  { tool: 'insulation', displayName: 'Insulation Calculator', category: 'Air Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/insulation-calculator' },
  
  // Water Distribution
  { tool: 'pipe-system', displayName: 'Pipe Designer', category: 'Water Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/pipe-designer' },
  { tool: 'pipe-sizing', displayName: 'Pipe Sizing', category: 'Water Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/pipe-sizing' },
  { tool: 'control-valve-sizing', displayName: 'Control Valve Sizing', category: 'Water Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/control-valve-sizing' },
  { tool: 'expansion-tank-sizing', displayName: 'Expansion Tank Sizing', category: 'Water Distribution', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/expansion-tank-sizing' },
  
  // Plant Design
  { tool: 'chw-plant', displayName: 'CHW Plant', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/chw-plant' },
  { tool: 'hw-plant', displayName: 'HW Plant', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/hw-plant' },
  { tool: 'chiller-selection', displayName: 'Chiller Selection', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/chiller-selection' },
  { tool: 'boiler-selection', displayName: 'Boiler Selection', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/boiler-selection' },
  { tool: 'cooling-tower-sizing', displayName: 'Cooling Tower Sizing', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/cooling-tower-sizing' },
  { tool: 'economizer-sizing', displayName: 'Economizer Sizing', category: 'Plant Design', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/economizer-sizing' },
  
  // Acoustic Analysis
  { tool: 'acoustic', displayName: 'Acoustic Calculator', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/acoustic-calculator' },
  { tool: 'room-acoustics', displayName: 'Room Acoustics', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/room-acoustics' },
  { tool: 'noise-path', displayName: 'Noise Path Analysis', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/noise-path-analysis' },
  { tool: 'duct-lining', displayName: 'Duct Lining Optimizer', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/duct-lining' },
  { tool: 'silencer-selection', displayName: 'Silencer Selection', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/silencer-selection' },
  { tool: 'silencer-sizing', displayName: 'Silencer Sizing', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/silencer-sizing' },
  { tool: 'vibration-isolation', displayName: 'Vibration Isolation', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/vibration-isolation' },
  { tool: 'acoustic-cost', displayName: 'Acoustic Cost Estimator', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/acoustic-cost-estimator' },
  { tool: 'acoustic-roi', displayName: 'Acoustic ROI Calculator', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/acoustic-roi' },
  { tool: 'lifecycle-cost', displayName: 'Lifecycle Cost Analyzer', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/lifecycle-cost-analyzer' },
  { tool: 'treatment-wizard', displayName: 'Treatment Wizard', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/treatment-wizard' },
  { tool: 'acoustic-measurement', displayName: 'Acoustic Measurement', category: 'Acoustic Analysis', preSaveValidation: true, dataFlowImport: false, crossToolValidation: true, path: '/commissioning/acoustic-measurement' },
  
  // Compliance & Analysis
  { tool: 'thermal-comfort', displayName: 'Thermal Comfort', category: 'Compliance & Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/thermal-comfort' },
  { tool: 'smoke-control', displayName: 'Smoke Control', category: 'Compliance & Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/smoke-control' },
  { tool: 'sequence-of-operations', displayName: 'Sequence of Operations', category: 'Compliance & Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/sequence-of-operations' },
  { tool: 'bas-points', displayName: 'BAS Points List', category: 'Compliance & Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/bas-points' },
  { tool: 'equipment-schedule', displayName: 'Equipment Schedule', category: 'Compliance & Analysis', preSaveValidation: true, dataFlowImport: true, crossToolValidation: true, path: '/design/equipment-schedule' },
];

export default function DesignSystemCoverage() {
  const [searchQuery, setSearchQuery] = useState('');

  const coverage = useMemo(() => {
    const total = TOOLS_CONFIG.length;
    const preSaveCount = TOOLS_CONFIG.filter(t => t.preSaveValidation).length;
    const dataFlowCount = TOOLS_CONFIG.filter(t => t.dataFlowImport).length;
    const crossToolCount = TOOLS_CONFIG.filter(t => t.crossToolValidation).length;

    return {
      preSave: Math.round((preSaveCount / total) * 100),
      dataFlow: Math.round((dataFlowCount / total) * 100),
      crossTool: Math.round((crossToolCount / total) * 100),
      overall: Math.round(((preSaveCount + dataFlowCount + crossToolCount) / (total * 3)) * 100),
      total,
      preSaveCount,
      dataFlowCount,
      crossToolCount,
    };
  }, []);

  const filteredTools = useMemo(() => {
    if (!searchQuery) return TOOLS_CONFIG;
    const query = searchQuery.toLowerCase();
    return TOOLS_CONFIG.filter(
      t => t.displayName.toLowerCase().includes(query) || 
           t.category.toLowerCase().includes(query) ||
           t.tool.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categoryStats = useMemo(() => {
    const categories = [...new Set(TOOLS_CONFIG.map(t => t.category))];
    return categories.map(category => {
      const tools = TOOLS_CONFIG.filter(t => t.category === category);
      const preSave = tools.filter(t => t.preSaveValidation).length;
      const dataFlow = tools.filter(t => t.dataFlowImport).length;
      const crossTool = tools.filter(t => t.crossToolValidation).length;
      return {
        category,
        total: tools.length,
        preSave,
        dataFlow,
        crossTool,
        coverage: Math.round(((preSave + dataFlow + crossTool) / (tools.length * 3)) * 100),
      };
    });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design System Coverage</h1>
          <p className="text-muted-foreground mt-1">
            Real-time metrics for PreSaveValidation, DataFlowImportHandler, and CrossToolValidation integration
          </p>
        </div>

        {/* Overall Coverage Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Coverage</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverage.overall}%</div>
              <Progress value={coverage.overall} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {coverage.total} tools tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PreSave Validation</CardTitle>
              <Save className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverage.preSave}%</div>
              <Progress value={coverage.preSave} className="mt-2" indicatorClassName="bg-blue-500" />
              <p className="text-xs text-muted-foreground mt-2">
                {coverage.preSaveCount}/{coverage.total} tools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Flow Import</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverage.dataFlow}%</div>
              <Progress value={coverage.dataFlow} className="mt-2" indicatorClassName="bg-green-500" />
              <p className="text-xs text-muted-foreground mt-2">
                {coverage.dataFlowCount}/{coverage.total} tools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-Tool Validation</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverage.crossTool}%</div>
              <Progress value={coverage.crossTool} className="mt-2" indicatorClassName="bg-purple-500" />
              <p className="text-xs text-muted-foreground mt-2">
                {coverage.crossToolCount}/{coverage.total} tools
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Coverage by Category</CardTitle>
            <CardDescription>Integration status grouped by design tool category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {categoryStats.map(stat => (
                <div key={stat.category} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{stat.category}</span>
                    <Badge variant={stat.coverage === 100 ? 'default' : 'secondary'}>
                      {stat.coverage}%
                    </Badge>
                  </div>
                  <Progress value={stat.coverage} className="h-2 mb-2" />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{stat.total} tools</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tools Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Design Tools</CardTitle>
            <CardDescription>
              Complete list of {TOOLS_CONFIG.length} design tools and their integration status
            </CardDescription>
            <div className="pt-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">PreSave</TableHead>
                  <TableHead className="text-center">DataFlow</TableHead>
                  <TableHead className="text-center">CrossTool</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map(tool => {
                  const isComplete = tool.preSaveValidation && tool.dataFlowImport && tool.crossToolValidation;
                  const integrationCount = [tool.preSaveValidation, tool.dataFlowImport, tool.crossToolValidation].filter(Boolean).length;
                  
                  return (
                    <TableRow key={tool.tool}>
                      <TableCell className="font-medium">{tool.displayName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {tool.preSaveValidation ? (
                          <Check className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {tool.dataFlowImport ? (
                          <Check className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {tool.crossToolValidation ? (
                          <Check className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={isComplete ? 'default' : 'secondary'}
                          className={cn(
                            isComplete ? 'bg-success/10 text-success' : '',
                            integrationCount === 2 ? 'bg-warning/10 text-warning' : '',
                            integrationCount <= 1 ? 'bg-destructive/10 text-destructive' : ''
                          )}
                        >
                          {integrationCount}/3
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
