import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useEquipmentWithHealthScores,
  useAnalyzeAllEquipmentHealth,
  getHealthScoreColor,
  getHealthScoreBgColor,
} from '@/hooks/useEquipmentHealth';
import { EquipmentHealthCard } from './EquipmentHealthCard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface HealthScoreDashboardProps {
  onViewEquipmentDetails?: (equipmentId: string) => void;
}

export function HealthScoreDashboard({ onViewEquipmentDetails }: HealthScoreDashboardProps) {
  const { data: equipmentList, isLoading } = useEquipmentWithHealthScores();
  const { mutate: analyzeAll, isPending: isAnalyzingAll } = useAnalyzeAllEquipmentHealth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score-asc');

  // Filter and sort equipment
  const filteredEquipment = useMemo(() => {
    if (!equipmentList) return [];

    let filtered = equipmentList.filter(eq => {
      const matchesSearch = 
        eq.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk = filterRisk === 'all' || 
        (filterRisk === 'unanalyzed' && !eq.health_score) ||
        eq.health_score?.risk_level === filterRisk;

      return matchesSearch && matchesRisk;
    });

    // Sort
    filtered.sort((a, b) => {
      const scoreA = a.health_score?.overall_score ?? 999;
      const scoreB = b.health_score?.overall_score ?? 999;
      
      switch (sortBy) {
        case 'score-asc':
          return scoreA - scoreB;
        case 'score-desc':
          return scoreB - scoreA;
        case 'name':
          return a.tag.localeCompare(b.tag);
        default:
          return 0;
      }
    });

    return filtered;
  }, [equipmentList, searchTerm, filterRisk, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (!equipmentList) return null;

    const withHealth = equipmentList.filter(eq => eq.health_score);
    const scores = withHealth.map(eq => eq.health_score!.overall_score);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const riskCounts = {
      low: withHealth.filter(eq => eq.health_score?.risk_level === 'low').length,
      medium: withHealth.filter(eq => eq.health_score?.risk_level === 'medium').length,
      high: withHealth.filter(eq => eq.health_score?.risk_level === 'high').length,
      critical: withHealth.filter(eq => eq.health_score?.risk_level === 'critical').length,
    };

    const trendCounts = {
      improving: withHealth.filter(eq => eq.health_score?.trend === 'improving').length,
      stable: withHealth.filter(eq => eq.health_score?.trend === 'stable').length,
      declining: withHealth.filter(eq => eq.health_score?.trend === 'declining').length,
    };

    const urgentMaintenance = withHealth.filter(eq => 
      eq.health_score?.maintenance_urgency === 'urgent' || 
      eq.health_score?.maintenance_urgency === 'immediate'
    ).length;

    return {
      total: equipmentList.length,
      analyzed: withHealth.length,
      avgScore,
      riskCounts,
      trendCounts,
      urgentMaintenance,
    };
  }, [equipmentList]);

  // Chart data
  const riskPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Low', value: stats.riskCounts.low, color: 'hsl(var(--success))' },
      { name: 'Medium', value: stats.riskCounts.medium, color: 'hsl(var(--warning))' },
      { name: 'High', value: stats.riskCounts.high, color: 'hsl(var(--orange-500, 249 115 22))' },
      { name: 'Critical', value: stats.riskCounts.critical, color: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const scoreDistribution = useMemo(() => {
    if (!equipmentList) return [];
    const withHealth = equipmentList.filter(eq => eq.health_score);
    
    const ranges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    return ranges.map(r => ({
      range: r.range,
      count: withHealth.filter(eq => {
        const score = eq.health_score!.overall_score;
        return score >= r.min && score <= r.max;
      }).length,
    }));
  }, [equipmentList]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
                <p className={cn('text-3xl font-bold', getHealthScoreColor(stats?.avgScore ?? null))}>
                  {stats?.avgScore ?? '—'}
                </p>
              </div>
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', 
                getHealthScoreBgColor(stats?.avgScore ?? null))}>
                <Activity className={cn('w-6 h-6', getHealthScoreColor(stats?.avgScore ?? null))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipment Analyzed</p>
                <p className="text-3xl font-bold">{stats?.analyzed ?? 0}/{stats?.total ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At-Risk Equipment</p>
                <p className="text-3xl font-bold text-destructive">
                  {(stats?.riskCounts.high ?? 0) + (stats?.riskCounts.critical ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent Maintenance</p>
                <p className="text-3xl font-bold text-warning">{stats?.urgentMaintenance ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {riskPieData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Health Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <span className="font-medium">Improving</span>
                </div>
                <Badge variant="secondary">{stats?.trendCounts.improving ?? 0}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground rotate-45" />
                  <span className="font-medium">Stable</span>
                </div>
                <Badge variant="secondary">{stats?.trendCounts.stable ?? 0}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  <span className="font-medium">Declining</span>
                </div>
                <Badge variant="secondary">{stats?.trendCounts.declining ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Equipment Health Scores</CardTitle>
              <CardDescription>Individual equipment health analysis</CardDescription>
            </div>
            <Button 
              onClick={() => analyzeAll()} 
              disabled={isAnalyzingAll}
              className="gap-2"
            >
              {isAnalyzingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Analyze All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unanalyzed">Unanalyzed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-asc">Score (Low→High)</SelectItem>
                <SelectItem value="score-desc">Score (High→Low)</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Grid */}
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEquipment.map(eq => (
                <EquipmentHealthCard 
                  key={eq.id} 
                  equipment={eq}
                  onViewDetails={onViewEquipmentDetails}
                />
              ))}
            </div>
            
            {filteredEquipment.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || filterRisk !== 'all'
                    ? 'No equipment matches your filters'
                    : 'No equipment found'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
