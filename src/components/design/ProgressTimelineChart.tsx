import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import { TrendingUp, Calendar, Target, Loader2, RefreshCw, Database, Clock, Flame, Wind, Thermometer, ShieldCheck, Wrench, CheckCircle, Circle, Snowflake, Zap } from 'lucide-react';
import { useDesignCompletenessTimeline } from '@/hooks/useDesignCompletenessTimeline';
import { 
  METRIC_COLORS, 
  METRIC_LABELS, 
  SPECIALIZED_TOOL_COLORS, 
  TimelineDataPoint, 
  MilestoneType, 
  Milestone, 
  calculateCombinedHealthScore,
  SEVERITY_THRESHOLDS,
  SEVERITY_ZONE_COLORS,
  THRESHOLD_LINE_COLORS,
} from '@/lib/design-completeness-utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface ProgressTimelineChartProps {
  projectId: string;
  dateRange: '7d' | '30d' | '90d' | 'all';
  onDateRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TimelineDataPoint;
    dataKey: string;
    color: string;
    name: string;
    value: number;
  }>;
  label?: string;
}

const getToolIcon = (type: MilestoneType) => {
  switch (type) {
    case 'chw_plant_complete': return <Snowflake className="h-3 w-3 mr-1" />;
    case 'hw_plant_complete': return <Flame className="h-3 w-3 mr-1" />;
    case 'smoke_control_complete': return <Wind className="h-3 w-3 mr-1" />;
    case 'thermal_comfort_complete': return <Thermometer className="h-3 w-3 mr-1" />;
    case 'sbc_compliance_complete': return <ShieldCheck className="h-3 w-3 mr-1" />;
    case 'ashrae_90_1_complete': return <Zap className="h-3 w-3 mr-1" />;
    case 'all_specialized_complete': return <Wrench className="h-3 w-3 mr-1" />;
    default: return <Target className="h-3 w-3 mr-1" />;
  }
};

// Get milestone color based on category and type
const getMilestoneColor = (milestone: Milestone) => {
  if (milestone.category === 'specialized') {
    switch (milestone.type) {
      case 'chw_plant_complete': return SPECIALIZED_TOOL_COLORS.chwPlant;
      case 'hw_plant_complete': return SPECIALIZED_TOOL_COLORS.hwPlant;
      case 'smoke_control_complete': return SPECIALIZED_TOOL_COLORS.smokeControl;
      case 'thermal_comfort_complete': return SPECIALIZED_TOOL_COLORS.thermalComfort;
      case 'sbc_compliance_complete': return SPECIALIZED_TOOL_COLORS.sbcCompliance;
      case 'ashrae_90_1_complete': return SPECIALIZED_TOOL_COLORS.ashrae90_1;
      case 'all_specialized_complete': return 'hsl(45, 95%, 55%)'; // Gold
      default: return 'hsl(25, 95%, 53%)';
    }
  }
  return 'hsl(var(--primary))';
};

// Category badge component for milestones
const MilestoneCategoryBadge = ({ milestone }: { milestone: Milestone }) => {
  const isSpecialized = milestone.category === 'specialized';
  return (
    <Badge 
      variant="outline" 
      className={`text-[10px] px-1.5 py-0 ${
        isSpecialized 
          ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' 
          : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      }`}
    >
      {isSpecialized ? 'Tool' : 'Zone'}
    </Badge>
  );
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 space-y-2">
      <p className="font-semibold">{data.displayDate}</p>
      
      {/* Combined Health Score - Primary unified metric */}
      <div className="flex items-center justify-between gap-4 pb-2 mb-1 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.combinedHealth }} />
          <span className="font-medium">{METRIC_LABELS.combinedHealth}</span>
        </div>
        <span className="font-bold text-base">{data.combinedHealthScore || 0}%</span>
      </div>
      <div className="text-[10px] text-muted-foreground mb-2">
        Zone (75%): {data.overallPercent}% | Tools (25%): {data.specializedToolsScore || 0}%
      </div>
      
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.overall }} />
            <span>Overall</span>
          </div>
          <span className="font-medium">{data.overallPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.loadCalc }} />
            <span>Load Calc</span>
          </div>
          <span className="font-medium">{data.loadCalcPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.equipment }} />
            <span>Equipment</span>
          </div>
          <span className="font-medium">{data.equipmentPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.distribution }} />
            <span>Distribution</span>
          </div>
          <span className="font-medium">{data.distributionPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.ventilation }} />
            <span>Ventilation</span>
          </div>
          <span className="font-medium">{data.ventilationPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.erv }} />
                      <span>ERV/HRV</span>
                    </div>
                    <span className="font-medium">{data.ervPercent}%</span>
                  </div>
                  
                  {/* Specialized Tools Score as main metric with visual separator */}
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.specializedTools }} />
                      <span>{METRIC_LABELS.specializedTools}</span>
                    </div>
                    <span className="font-medium">{data.specializedToolsScore || 0}%</span>
                  </div>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {data.zonesComplete}/{data.totalZones} zones fully complete
                </div>
      
      {/* Specialized tools status - 6 tools */}
          <div className="pt-2 border-t space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Specialized Tools ({data.specializedToolsScore || 0}%)
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Snowflake className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.chwPlant }} />
                <span>CHW</span>
                {data.hasChwPlant ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.hwPlant }} />
                <span>HW</span>
                {data.hasHwPlant ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.smokeControl }} />
                <span>Smoke</span>
                {data.hasSmokeControl ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.thermalComfort }} />
                <span>Thermal</span>
                {data.hasThermalComfort ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.sbcCompliance }} />
                <span>SBC</span>
                {data.hasSbcCompliance ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" style={{ color: SPECIALIZED_TOOL_COLORS.ashrae90_1 }} />
                <span>90.1</span>
                {data.hasAshrae90_1Compliance ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>
          </div>
      
          {data.milestone && (
            <div className="pt-2 border-t flex items-center gap-2">
              <MilestoneCategoryBadge milestone={data.milestone} />
              <Badge 
                variant="outline" 
                className="text-xs flex items-center"
                style={{ borderColor: `${getMilestoneColor(data.milestone)}50` }}
              >
                {data.milestone.category === 'specialized' 
                  ? getToolIcon(data.milestone.type) 
                  : <Target className="h-3 w-3 mr-1" />}
                {data.milestone.label}
              </Badge>
            </div>
          )}
    </div>
  );
};

export function ProgressTimelineChart({
  projectId,
  dateRange,
  onDateRangeChange,
}: ProgressTimelineChartProps) {
  const queryClient = useQueryClient();
  const [isCapturing, setIsCapturing] = useState(false);
  const { data: timelineData, isLoading } = useDesignCompletenessTimeline(projectId, dateRange);

  const milestonePoints = useMemo(() => {
    if (!timelineData?.timeline) return [];
    return timelineData.timeline.filter(point => point.milestone);
  }, [timelineData?.timeline]);

  const handleCaptureSnapshot = async () => {
    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-design-snapshots', {
        body: { project_id: projectId },
      });

      if (error) throw error;

      toast.success('Snapshot captured successfully', {
        description: `Captured ${data.projectsProcessed} project snapshot(s)`,
      });

      // Invalidate the timeline query to refetch with new snapshot
      queryClient.invalidateQueries({ queryKey: ['design-completeness-timeline', projectId] });
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      toast.error('Failed to capture snapshot', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Design Progress Timeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timelineData || timelineData.timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Design Progress Timeline</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Capture Now</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Take a snapshot of current design completeness</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 opacity-50" />
            <p>No historical data available yet</p>
            <p className="text-sm mt-1">Click "Capture Now" to start tracking progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestData = timelineData.timeline[timelineData.timeline.length - 1];
  const zoneMilestones = timelineData.milestones.filter(m => m.category !== 'specialized');
  const specializedMilestones = timelineData.milestones.filter(m => m.category === 'specialized');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Design Progress Timeline</CardTitle>
              <CardDescription className="flex items-center gap-2">
                Track completion progress over time
                {/* Data source indicator */}
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    timelineData.dataSource === 'snapshots' 
                      ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}
                >
                  {timelineData.dataSource === 'snapshots' ? (
                    <>
                      <Database className="h-3 w-3 mr-1" />
                      Snapshots
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Derived
                    </>
                  )}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Velocity indicator */}
            {timelineData.velocity.zonesPerWeek > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {timelineData.velocity.zonesPerWeek} zones/week
                </span>
                {timelineData.velocity.estimatedCompletionDate && (
                  <Badge variant="outline" className="text-xs">
                    Est. complete: {timelineData.velocity.estimatedCompletionDate}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Manual snapshot capture button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Capture snapshot now</p>
                  {timelineData.lastSnapshotDate && (
                    <p className="text-xs text-muted-foreground">
                      Last: {format(parseISO(timelineData.lastSnapshotDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as '7d' | '30d' | '90d' | 'all')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={timelineData.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11 }} 
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            
            {/* Severity Zone Backgrounds */}
            <ReferenceArea 
              y1={0} 
              y2={SEVERITY_THRESHOLDS.critical}
              fill={SEVERITY_ZONE_COLORS.critical}
              fillOpacity={1}
            />
            <ReferenceArea 
              y1={SEVERITY_THRESHOLDS.critical} 
              y2={SEVERITY_THRESHOLDS.warning}
              fill={SEVERITY_ZONE_COLORS.warning}
              fillOpacity={1}
            />
            <ReferenceArea 
              y1={SEVERITY_THRESHOLDS.warning} 
              y2={100}
              fill={SEVERITY_ZONE_COLORS.good}
              fillOpacity={1}
            />
            
            {/* Threshold Reference Lines */}
            <ReferenceLine 
              y={SEVERITY_THRESHOLDS.critical}
              stroke={THRESHOLD_LINE_COLORS.critical}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ 
                value: 'Critical (33%)', 
                position: 'insideTopRight',
                fill: THRESHOLD_LINE_COLORS.critical,
                fontSize: 10,
                fontWeight: 500,
              }}
            />
            <ReferenceLine 
              y={SEVERITY_THRESHOLDS.warning}
              stroke={THRESHOLD_LINE_COLORS.warning}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ 
                value: 'Warning (66%)', 
                position: 'insideTopRight',
                fill: THRESHOLD_LINE_COLORS.warning,
                fontSize: 10,
                fontWeight: 500,
              }}
            />
            <ReferenceLine 
              y={SEVERITY_THRESHOLDS.complete}
              stroke={THRESHOLD_LINE_COLORS.complete}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ 
                value: 'Complete', 
                position: 'insideBottomRight',
                fill: THRESHOLD_LINE_COLORS.complete,
                fontSize: 10,
                fontWeight: 500,
              }}
            />
            
            {/* Reference lines for milestones */}
            {milestonePoints.map((point, index) => (
              <ReferenceLine
                key={`milestone-${index}`}
                x={point.displayDate}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            ))}

            <Line 
              type="monotone"
              dataKey="overallPercent"
              name="Overall"
              stroke={METRIC_COLORS.overall}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone"
              dataKey="loadCalcPercent"
              name="Load Calculation"
              stroke={METRIC_COLORS.loadCalc}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone"
              dataKey="equipmentPercent"
              name="Equipment Selection"
              stroke={METRIC_COLORS.equipment}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone"
              dataKey="distributionPercent"
              name="Distribution System"
              stroke={METRIC_COLORS.distribution}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone"
              dataKey="ventilationPercent"
              name="Ventilation (62.1)"
              stroke={METRIC_COLORS.ventilation}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone"
              dataKey="ervPercent"
              name="ERV/HRV Sizing"
              stroke={METRIC_COLORS.erv}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            
            {/* Specialized Tools Progress Line - Dashed to differentiate from zone metrics */}
            <Line 
              type="monotone"
              dataKey="specializedToolsScore"
              name={METRIC_LABELS.specializedTools}
              stroke={METRIC_COLORS.specializedTools}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 5, fill: METRIC_COLORS.specializedTools }}
            />
            
            {/* Combined Design Health Score Line - Primary unified metric */}
            <Line 
              type="monotone"
              dataKey="combinedHealthScore"
              name={METRIC_LABELS.combinedHealth}
              stroke={METRIC_COLORS.combinedHealth}
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 6, fill: METRIC_COLORS.combinedHealth, stroke: 'white', strokeWidth: 2 }}
            />

            {/* Milestone markers with category-specific styling */}
            {milestonePoints.map((point, index) => (
              <ReferenceDot
                key={`milestone-dot-${index}`}
                x={point.displayDate}
                y={point.overallPercent}
                r={point.milestone?.category === 'specialized' ? 7 : 6}
                fill={point.milestone ? getMilestoneColor(point.milestone) : 'hsl(var(--primary))'}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Line type legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: METRIC_COLORS.combinedHealth }} />
            <span>Health Score (75% Zone + 25% Tools)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Zone Milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRIC_COLORS.specializedTools }} />
            <span>Tool Milestone</span>
          </div>
        </div>

        {/* Milestones footer - Zone-based */}
        {zoneMilestones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground mr-2">Zone Milestones:</span>
            {zoneMilestones.map((milestone, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                      <Target className="h-3 w-3 mr-1" />
                      {milestone.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">Achieved on {milestone.date}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
        
        {/* Milestones footer - Specialized tools */}
        {specializedMilestones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm text-muted-foreground mr-2">Tool Milestones:</span>
            {specializedMilestones.map((milestone, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-accent transition-colors flex items-center"
                      style={{ 
                        borderColor: `${getMilestoneColor(milestone)}50`,
                        color: getMilestoneColor(milestone),
                      }}
                    >
                      {getToolIcon(milestone.type)}
                      {milestone.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{milestone.label}</p>
                    <p className="text-xs text-muted-foreground">Achieved on {milestone.date}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Current status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mt-4 pt-4 border-t">
          {/* Combined Health Score - Primary */}
          <div className="text-center lg:col-span-1">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.combinedHealth }}>
              {latestData?.combinedHealthScore || calculateCombinedHealthScore(
                latestData?.overallPercent || 0,
                latestData?.specializedToolsScore || 0
              )}%
            </div>
            <div className="text-xs text-muted-foreground font-medium">{METRIC_LABELS.combinedHealth}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              75% Zone + 25% Tools
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.overall }}>
              {latestData?.overallPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Overall</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.loadCalc }}>
              {latestData?.loadCalcPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Load Calc</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.equipment }}>
              {latestData?.equipmentPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Equipment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.distribution }}>
              {latestData?.distributionPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Distribution</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.ventilation }}>
              {latestData?.ventilationPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Ventilation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.erv }}>
              {latestData?.ervPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">ERV/HRV</div>
          </div>
          {/* Specialized Tools column */}
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: METRIC_COLORS.specializedTools }}>
              {latestData?.specializedToolsScore || 0}%
            </div>
            <div className="text-xs text-muted-foreground">{METRIC_LABELS.specializedTools}</div>
            <div className="flex justify-center gap-1 mt-1">
              <Snowflake className={`h-3 w-3 ${latestData?.hasChwPlant ? 'text-cyan-500' : 'text-muted-foreground'}`} />
              <Flame className={`h-3 w-3 ${latestData?.hasHwPlant ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <Wind className={`h-3 w-3 ${latestData?.hasSmokeControl ? 'text-sky-500' : 'text-muted-foreground'}`} />
              <Thermometer className={`h-3 w-3 ${latestData?.hasThermalComfort ? 'text-rose-500' : 'text-muted-foreground'}`} />
              <ShieldCheck className={`h-3 w-3 ${latestData?.hasSbcCompliance ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <Zap className={`h-3 w-3 ${latestData?.hasAshrae90_1Compliance ? 'text-violet-500' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
