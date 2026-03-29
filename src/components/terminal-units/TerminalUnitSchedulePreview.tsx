import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Box, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle 
} from 'lucide-react';
import { 
  type GroupedTerminalUnits, 
  type ScheduleColumn, 
  type ScheduleHeader 
} from '@/hooks/useTerminalUnitScheduleExport';
import { type CFMValidationResult } from '@/hooks/useTerminalUnitValidation';
import { format } from 'date-fns';

interface TerminalUnitSchedulePreviewProps {
  data: GroupedTerminalUnits[];
  columns: ScheduleColumn[];
  header: ScheduleHeader;
  projectName: string;
  notes: string | null;
  validationByUnitId?: Map<string, CFMValidationResult>;
  showValidation?: boolean;
}

const formatUnitType = (type: string): string => {
  const typeMap: Record<string, string> = {
    vav_reheat: 'VAV Reheat',
    vav_cooling: 'VAV Cooling Only',
    vav_fan_powered: 'VAV Fan Powered',
    fcu_2pipe: 'FCU 2-Pipe',
    fcu_4pipe: 'FCU 4-Pipe',
    fcu_electric: 'FCU Electric',
  };
  return typeMap[type] || type;
};

const formatCellValue = (
  item: GroupedTerminalUnits['items'][0], 
  column: ScheduleColumn
): string => {
  const value = item[column.key];
  
  if (column.key === 'unit_type') {
    return formatUnitType(value as string);
  }
  
  if (column.key === 'reheat_type') {
    if (value === 'hot_water') return 'HW';
    if (value === 'electric') return 'Elec';
    if (value === 'none' || !value) return '-';
    return value?.toString() || '-';
  }
  
  if (column.key === 'has_damper' || column.key === 'has_flow_station' || column.key === 'has_discharge_sensor') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return value?.toString() || '-';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'complete':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'draft':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getValidationStatusIcon = (status: CFMValidationResult['status']) => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'no_data':
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
};

const getValidationRowClass = (status: CFMValidationResult['status'] | undefined): string => {
  if (!status) return '';
  switch (status) {
    case 'warning':
      return 'bg-amber-50/50 dark:bg-amber-900/10';
    case 'error':
      return 'bg-destructive/5 dark:bg-destructive/10';
    default:
      return '';
  }
};

export function TerminalUnitSchedulePreview({
  data,
  columns,
  header,
  projectName,
  notes,
  validationByUnitId,
  showValidation = false,
}: TerminalUnitSchedulePreviewProps) {
  const enabledColumns = columns.filter(c => c.enabled);
  
  // Calculate summary stats
  const totalUnits = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);
  const totalCfm = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + (i.supply_cfm || 0) * i.quantity, 0), 0);
  
  if (data.length === 0 || totalUnits === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">No Terminal Units Selected</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Add terminal units from the Terminal Unit Sizing tool to see a preview of your schedule here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 border-b">
          {/* Schedule Header */}
          <div className="text-center space-y-1">
            <CardTitle className="text-lg font-bold uppercase tracking-wide">
              {header.title || 'TERMINAL UNIT SCHEDULE'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{projectName}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              {header.projectNumber && <span>Project: {header.projectNumber}</span>}
              {header.revision && <span>Rev: {header.revision}</span>}
              <span>Date: {header.date || format(new Date(), 'yyyy-MM-dd')}</span>
              {header.preparedBy && <span>By: {header.preparedBy}</span>}
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Units:</span>
              <Badge variant="secondary">{totalUnits}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total CFM:</span>
              <Badge variant="secondary">{totalCfm.toLocaleString()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Columns:</span>
              <Badge variant="outline">{enabledColumns.length}</Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              {data.map((group, groupIndex) => (
                <div key={group.groupName} className={groupIndex > 0 ? 'mt-6' : ''}>
                  {/* Group Header */}
                  <div className="bg-muted/50 px-3 py-2 rounded-t-md border border-b-0 flex items-center justify-between">
                    <span className="font-medium text-sm">{group.groupName}</span>
                    <Badge variant="outline" className="text-xs">
                      {group.items.reduce((s, i) => s + i.quantity, 0)} units
                    </Badge>
                  </div>
                  
                  {/* Group Table */}
                  <div className="border rounded-b-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          {showValidation && (
                            <TableHead className="text-xs font-medium whitespace-nowrap py-2 w-[60px]">
                              Status
                            </TableHead>
                          )}
                          {enabledColumns.map((col) => (
                            <TableHead 
                              key={col.key} 
                              className="text-xs font-medium whitespace-nowrap py-2"
                            >
                              {col.label}
                            </TableHead>
                          ))}
                          {showValidation && (
                            <>
                              <TableHead className="text-xs font-medium whitespace-nowrap py-2 w-[80px]">
                                Req CFM
                              </TableHead>
                              <TableHead className="text-xs font-medium whitespace-nowrap py-2 w-[70px]">
                                Δ%
                              </TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, idx) => {
                          const validation = validationByUnitId?.get(item.id);
                          const rowBgClass = showValidation && validation 
                            ? getValidationRowClass(validation.status)
                            : (idx % 2 === 0 ? 'bg-background' : 'bg-muted/20');
                          
                          return (
                            <TableRow 
                              key={item.id} 
                              className={rowBgClass}
                            >
                              {showValidation && (
                                <TableCell className="py-2">
                                  {validation ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center cursor-help">
                                          {getValidationStatusIcon(validation.status)}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-[250px]">
                                        <div className="space-y-1">
                                          <p className="font-medium text-xs">
                                            {validation.status === 'pass' && 'CFM within tolerance'}
                                            {validation.status === 'warning' && 'CFM variance warning'}
                                            {validation.status === 'error' && 'CFM variance error'}
                                            {validation.status === 'no_data' && 'No load calculation'}
                                          </p>
                                          {validation.messages.map((msg, i) => (
                                            <p key={i} className="text-xs text-muted-foreground">{msg}</p>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <div className="flex items-center justify-center">
                                      <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                  )}
                                </TableCell>
                              )}
                              {enabledColumns.map((col) => (
                                <TableCell 
                                  key={col.key} 
                                  className="text-xs py-2 whitespace-nowrap"
                                >
                                  {col.key === 'status' ? (
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-[10px] ${getStatusColor(item.status)}`}
                                    >
                                      {item.status}
                                    </Badge>
                                  ) : (
                                    formatCellValue(item, col)
                                  )}
                                </TableCell>
                              ))}
                              {showValidation && validation && (
                                <>
                                  <TableCell className="text-xs py-2 whitespace-nowrap text-muted-foreground">
                                    {validation.requiredCfm !== null 
                                      ? validation.requiredCfm.toLocaleString() 
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs py-2 whitespace-nowrap">
                                    {validation.cfmVariancePercent !== null ? (
                                      <span className={
                                        validation.status === 'pass' 
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : validation.status === 'warning'
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-destructive'
                                      }>
                                        {validation.cfmVariancePercent > 0 ? '+' : ''}
                                        {validation.cfmVariancePercent.toFixed(1)}%
                                      </span>
                                    ) : '-'}
                                  </TableCell>
                                </>
                              )}
                              {showValidation && !validation && (
                                <>
                                  <TableCell className="text-xs py-2">-</TableCell>
                                  <TableCell className="text-xs py-2">-</TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
              
              {/* Notes Section */}
              {notes && (
                <div className="mt-6 p-3 bg-muted/30 rounded-md border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
