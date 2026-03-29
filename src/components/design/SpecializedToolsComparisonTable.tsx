import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Flame,
  Wind,
  Thermometer,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import { ProjectSpecializedTools } from '@/hooks/useSpecializedToolsComparison';
import { SPECIALIZED_TOOL_COLORS } from '@/lib/design-completeness-utils';
import { format, parseISO } from 'date-fns';

interface SpecializedToolsComparisonTableProps {
  projects: ProjectSpecializedTools[];
  isLoading?: boolean;
}

type SortField = 'name' | 'score' | 'hwPlant' | 'smoke' | 'thermal' | 'sbc';
type SortDirection = 'asc' | 'desc';

export function SpecializedToolsComparisonTable({ projects, isLoading }: SpecializedToolsComparisonTableProps) {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleRow = (projectId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'name':
        return multiplier * a.projectName.localeCompare(b.projectName);
      case 'score':
        return multiplier * (a.specializedToolsScore - b.specializedToolsScore);
      case 'hwPlant':
        return multiplier * (a.hotWaterPlantCount - b.hotWaterPlantCount);
      case 'smoke':
        return multiplier * (a.smokeControlCount - b.smokeControlCount);
      case 'thermal':
        return multiplier * (a.thermalComfortCount - b.thermalComfortCount);
      case 'sbc':
        return multiplier * (a.sbcComplianceCount - b.sbcComplianceCount);
      default:
        return 0;
    }
  });

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score === 100) return 'default';
    if (score >= 50) return 'secondary';
    if (score > 0) return 'outline';
    return 'destructive';
  };

  const ToolStatusCell = ({
    hasItem,
    count,
    icon: Icon,
    color,
    label,
  }: {
    hasItem: boolean;
    count: number;
    icon: React.ElementType;
    color: string;
    label: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center gap-1.5">
            <Icon className="h-4 w-4" style={{ color: hasItem ? color : undefined }} />
            {hasItem ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-muted-foreground">({count})</span>
              </>
            ) : (
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasItem ? `${count} ${label}(s) configured` : `No ${label} configured`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Project</TableHead>
              <TableHead className="text-center">HW Plant</TableHead>
              <TableHead className="text-center">Smoke Control</TableHead>
              <TableHead className="text-center">Thermal Comfort</TableHead>
              <TableHead className="text-center">SBC Compliance</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell><div className="h-4 w-4 bg-muted rounded" /></TableCell>
                <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                <TableCell><div className="h-4 w-12 bg-muted rounded mx-auto" /></TableCell>
                <TableCell><div className="h-4 w-12 bg-muted rounded mx-auto" /></TableCell>
                <TableCell><div className="h-4 w-12 bg-muted rounded mx-auto" /></TableCell>
                <TableCell><div className="h-4 w-12 bg-muted rounded mx-auto" /></TableCell>
                <TableCell><div className="h-4 w-12 bg-muted rounded mx-auto" /></TableCell>
                <TableCell><div className="h-4 w-4 bg-muted rounded" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No projects found. Create projects and configure specialized tools to see comparison data.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>
              <SortableHeader field="name">Project</SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader field="hwPlant">
                <Flame className="h-4 w-4 mr-1" style={{ color: SPECIALIZED_TOOL_COLORS.hwPlant }} />
                HW Plant
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader field="smoke">
                <Wind className="h-4 w-4 mr-1" style={{ color: SPECIALIZED_TOOL_COLORS.smokeControl }} />
                Smoke
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader field="thermal">
                <Thermometer className="h-4 w-4 mr-1" style={{ color: SPECIALIZED_TOOL_COLORS.thermalComfort }} />
                Thermal
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader field="sbc">
                <ShieldCheck className="h-4 w-4 mr-1" style={{ color: SPECIALIZED_TOOL_COLORS.sbcCompliance }} />
                SBC
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">
              <SortableHeader field="score">Score</SortableHeader>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => {
            const isExpanded = expandedRows.has(project.projectId);
            const hasDetails = project.completedToolsCount > 0;

            return (
              <Collapsible key={project.projectId} asChild open={isExpanded}>
                <>
                  <TableRow className="group">
                    <TableCell>
                      {hasDetails && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRow(project.projectId)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.projectName}</span>
                        {project.projectLocation && (
                          <span className="text-xs text-muted-foreground">{project.projectLocation}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ToolStatusCell
                        hasItem={project.hasHotWaterPlant}
                        count={project.hotWaterPlantCount}
                        icon={Flame}
                        color={SPECIALIZED_TOOL_COLORS.hwPlant}
                        label="HW Plant"
                      />
                    </TableCell>
                    <TableCell>
                      <ToolStatusCell
                        hasItem={project.hasSmokeControl}
                        count={project.smokeControlCount}
                        icon={Wind}
                        color={SPECIALIZED_TOOL_COLORS.smokeControl}
                        label="Smoke Control"
                      />
                    </TableCell>
                    <TableCell>
                      <ToolStatusCell
                        hasItem={project.hasThermalComfort}
                        count={project.thermalComfortCount}
                        icon={Thermometer}
                        color={SPECIALIZED_TOOL_COLORS.thermalComfort}
                        label="Thermal Comfort"
                      />
                    </TableCell>
                    <TableCell>
                      <ToolStatusCell
                        hasItem={project.hasSBCCompliance}
                        count={project.sbcComplianceCount}
                        icon={ShieldCheck}
                        color={SPECIALIZED_TOOL_COLORS.sbcCompliance}
                        label="SBC Check"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getScoreBadgeVariant(project.specializedToolsScore)}>
                        {project.specializedToolsScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => navigate(`/projects/${project.projectId}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Project</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                          {project.hasHotWaterPlant && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Flame className="h-3.5 w-3.5" style={{ color: SPECIALIZED_TOOL_COLORS.hwPlant }} />
                                <span className="text-xs font-medium">Hot Water Plants</span>
                              </div>
                              <ul className="space-y-1">
                                {project.hotWaterPlantDetails.map(detail => (
                                  <li key={detail.id} className="text-xs text-muted-foreground">
                                    {detail.name} <span className="opacity-60">({format(parseISO(detail.created_at), 'MMM d')})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.hasSmokeControl && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Wind className="h-3.5 w-3.5" style={{ color: SPECIALIZED_TOOL_COLORS.smokeControl }} />
                                <span className="text-xs font-medium">Smoke Control</span>
                              </div>
                              <ul className="space-y-1">
                                {project.smokeControlDetails.map(detail => (
                                  <li key={detail.id} className="text-xs text-muted-foreground">
                                    {detail.name} <span className="opacity-60">({format(parseISO(detail.created_at), 'MMM d')})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.hasThermalComfort && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Thermometer className="h-3.5 w-3.5" style={{ color: SPECIALIZED_TOOL_COLORS.thermalComfort }} />
                                <span className="text-xs font-medium">Thermal Comfort</span>
                              </div>
                              <ul className="space-y-1">
                                {project.thermalComfortDetails.map(detail => (
                                  <li key={detail.id} className="text-xs text-muted-foreground">
                                    {detail.name} <span className="opacity-60">({format(parseISO(detail.created_at), 'MMM d')})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.hasSBCCompliance && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <ShieldCheck className="h-3.5 w-3.5" style={{ color: SPECIALIZED_TOOL_COLORS.sbcCompliance }} />
                                <span className="text-xs font-medium">SBC Compliance</span>
                              </div>
                              <ul className="space-y-1">
                                {project.sbcComplianceDetails.map(detail => (
                                  <li key={detail.id} className="text-xs text-muted-foreground">
                                    {detail.name} <span className="opacity-60">({format(parseISO(detail.created_at), 'MMM d')})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
