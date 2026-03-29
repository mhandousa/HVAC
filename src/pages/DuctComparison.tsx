import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Wind, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDuctSystems } from '@/hooks/useDuctSystems';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { format } from 'date-fns';

interface ComparisonMetric {
  label: string;
  key: string;
  unit: string;
  higherIsBetter: boolean;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { label: 'Total Airflow', key: 'total_airflow_cfm', unit: 'CFM', higherIsBetter: false },
  { label: 'Static Pressure', key: 'system_static_pressure_pa', unit: 'Pa', higherIsBetter: false },
  { label: 'Design Velocity', key: 'design_velocity_fpm', unit: 'FPM', higherIsBetter: false },
  { label: 'Fan Power', key: 'fan_power_kw', unit: 'kW', higherIsBetter: false },
];

export default function DuctComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectId = searchParams.get('project') || storedProjectId || null;
  const { user } = useAuth();

  // Sync zone context
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  const { data: systems, isLoading } = useDuctSystems(projectId || undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');

  const toggleSystem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const selectedSystems = useMemo(() => 
    systems?.filter(s => selectedIds.has(s.id)) || [],
    [systems, selectedIds]
  );

  const chartData = useMemo(() => {
    if (selectedSystems.length === 0) return [];

    return COMPARISON_METRICS.map(metric => {
      const data: Record<string, any> = { metric: metric.label };
      selectedSystems.forEach(system => {
        data[system.system_name] = (system as any)[metric.key] || 0;
      });
      return data;
    });
  }, [selectedSystems]);

  const radarData = useMemo(() => {
    if (selectedSystems.length === 0) return [];

    const maxValues = COMPARISON_METRICS.reduce((acc, metric) => {
      acc[metric.key] = Math.max(...selectedSystems.map(s => (s as any)[metric.key] || 0), 1);
      return acc;
    }, {} as Record<string, number>);

    return COMPARISON_METRICS.map(metric => {
      const data: Record<string, any> = { metric: metric.label, fullMark: 100 };
      selectedSystems.forEach(system => {
        const value = (system as any)[metric.key] || 0;
        data[system.system_name] = Math.round((value / maxValues[metric.key]) * 100);
      });
      return data;
    });
  }, [selectedSystems]);

  const colors = ['hsl(199, 89%, 48%)', 'hsl(262, 83%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)'];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold">Duct System Comparison</h1>
              </div>
              <Badge variant="outline">
                {selectedIds.size} of {systems?.length || 0} selected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Bar Chart
              </Button>
              <Button
                variant={chartType === 'radar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('radar')}
              >
                Radar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - System Selection */}
          <div className="w-80 border-r bg-card p-4">
            <h3 className="font-medium mb-3">Select Systems to Compare</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select up to 4 duct systems for side-by-side comparison
            </p>
            
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading systems...</p>
                ) : systems?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No duct systems found</p>
                ) : (
                  systems?.map((system, index) => (
                    <Card
                      key={system.id}
                      className={`cursor-pointer transition-colors ${
                        selectedIds.has(system.id) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleSystem(system.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(system.id)}
                            onCheckedChange={() => toggleSystem(system.id)}
                            disabled={!selectedIds.has(system.id) && selectedIds.size >= 4}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {selectedIds.has(system.id) && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: colors[Array.from(selectedIds).indexOf(system.id)] }}
                                />
                              )}
                              <span className="font-medium truncate">{system.system_name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {system.system_type} • {system.total_airflow_cfm?.toFixed(0) || 0} CFM
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(system.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-auto">
            {selectedSystems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Wind className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No Systems Selected</p>
                <p className="text-sm">Select duct systems from the left panel to compare</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="metric" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {selectedSystems.map((system, index) => (
                              <Bar 
                                key={system.id} 
                                dataKey={system.system_name} 
                                fill={colors[index]} 
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            {selectedSystems.map((system, index) => (
                              <Radar
                                key={system.id}
                                name={system.system_name}
                                dataKey={system.system_name}
                                stroke={colors[index]}
                                fill={colors[index]}
                                fillOpacity={0.2}
                              />
                            ))}
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detailed Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Metric</th>
                            {selectedSystems.map((system, index) => (
                              <th key={system.id} className="text-right py-2 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: colors[index] }}
                                  />
                                  <span className="font-medium">{system.system_name}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 px-3 text-muted-foreground">System Type</td>
                            {selectedSystems.map(system => (
                              <td key={system.id} className="text-right py-2 px-3 capitalize">
                                {system.system_type?.replace('_', ' ')}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-3 text-muted-foreground">Duct Material</td>
                            {selectedSystems.map(system => (
                              <td key={system.id} className="text-right py-2 px-3 capitalize">
                                {system.duct_material?.replace('_', ' ') || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 px-3 text-muted-foreground">Design Method</td>
                            {selectedSystems.map(system => (
                              <td key={system.id} className="text-right py-2 px-3 capitalize">
                                {system.design_method?.replace('_', ' ') || '-'}
                              </td>
                            ))}
                          </tr>
                          {COMPARISON_METRICS.map(metric => {
                            const values = selectedSystems.map(s => (s as any)[metric.key] || 0);
                            const bestValue = metric.higherIsBetter 
                              ? Math.max(...values) 
                              : Math.min(...values.filter(v => v > 0));
                            
                            return (
                              <tr key={metric.key} className="border-b">
                                <td className="py-2 px-3 text-muted-foreground">{metric.label}</td>
                                {selectedSystems.map(system => {
                                  const value = (system as any)[metric.key] || 0;
                                  const isBest = value === bestValue && value > 0;
                                  return (
                                    <td 
                                      key={system.id} 
                                      className={`text-right py-2 px-3 font-mono ${isBest ? 'text-success font-medium' : ''}`}
                                    >
                                      {value.toFixed(1)} {metric.unit}
                                      {isBest && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          <tr className="border-b">
                            <td className="py-2 px-3 text-muted-foreground">Target Friction</td>
                            {selectedSystems.map(system => (
                              <td key={system.id} className="text-right py-2 px-3 font-mono">
                                {system.target_friction_rate?.toFixed(3) || '-'} in/100ft
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-muted-foreground">Status</td>
                            {selectedSystems.map(system => (
                              <td key={system.id} className="text-right py-2 px-3">
                                <Badge variant="outline" className="capitalize">
                                  {system.status || 'draft'}
                                </Badge>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSystems.length >= 2 && (
                        <>
                          {(() => {
                            const lowestPressure = [...selectedSystems].sort((a, b) => 
                              (a.system_static_pressure_pa || 0) - (b.system_static_pressure_pa || 0)
                            )[0];
                            return (
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10">
                                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                                <div>
                                  <p className="font-medium text-success">Lowest Static Pressure</p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{lowestPressure.system_name}</span> has the lowest 
                                    static pressure at {lowestPressure.system_static_pressure_pa?.toFixed(0)} Pa, 
                                    resulting in lower fan energy consumption.
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          
                          {(() => {
                            const highVelocity = selectedSystems.filter(s => (s.design_velocity_fpm || 0) > 2000);
                            if (highVelocity.length > 0) {
                              return (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10">
                                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                                  <div>
                                    <p className="font-medium text-warning">High Velocity Warning</p>
                                    <p className="text-sm text-muted-foreground">
                                      {highVelocity.map(s => s.system_name).join(', ')} 
                                      {highVelocity.length === 1 ? ' has' : ' have'} velocities exceeding 
                                      2000 FPM which may cause noise issues in occupied spaces.
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {(() => {
                            const lowestPower = [...selectedSystems]
                              .filter(s => (s.fan_power_kw || 0) > 0)
                              .sort((a, b) => (a.fan_power_kw || 0) - (b.fan_power_kw || 0))[0];
                            if (lowestPower) {
                              return (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                                  <Wind className="w-5 h-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium text-primary">Most Energy Efficient</p>
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-medium">{lowestPower.system_name}</span> requires only {' '}
                                      {lowestPower.fan_power_kw?.toFixed(2)} kW fan power, making it the most 
                                      energy-efficient option.
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Workflow Navigation */}
      <DesignWorkflowNextStep
        currentPath="/design/duct-comparison"
        projectId={projectId || undefined}
      />
    </DashboardLayout>
  );
}
