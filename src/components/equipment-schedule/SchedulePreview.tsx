import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScheduleColumn, ScheduleHeader } from '@/hooks/useEquipmentSchedule';
import { GroupedEquipment, EquipmentRow } from '@/hooks/useEquipmentScheduleExport';
import { format } from 'date-fns';

interface SchedulePreviewProps {
  data: GroupedEquipment[];
  columns: ScheduleColumn[];
  header: ScheduleHeader;
  projectName: string;
  notes: string | null;
}

export function SchedulePreview({
  data,
  columns,
  header,
  projectName,
  notes,
}: SchedulePreviewProps) {
  const enabledColumns = columns.filter(c => c.enabled);
  const totalEquipment = data.reduce((sum, g) => sum + g.items.length, 0);

  const formatCellValue = (item: EquipmentRow, column: ScheduleColumn): string => {
    const value = item[column.key as keyof EquipmentRow];
    
    if (column.key === 'install_date' || column.key === 'warranty_expiry') {
      return value ? format(new Date(value as string), 'yyyy-MM-dd') : '-';
    }
    
    return value?.toString() || '-';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return 'bg-green-500/10 text-green-600';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'offline':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (totalEquipment === 0) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No Equipment Selected</p>
            <p className="text-sm mt-1">
              Select a project and adjust filters to see equipment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3 border-b">
        {/* Schedule Header Preview */}
        <div className="text-center space-y-1">
          <CardTitle className="text-lg">
            {header.title || 'MECHANICAL EQUIPMENT SCHEDULE'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{projectName}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {header.projectNumber && <span>Project: {header.projectNumber}</span>}
            {header.revision && <span>Rev: {header.revision}</span>}
            <span>Date: {header.date || format(new Date(), 'yyyy-MM-dd')}</span>
            {header.preparedBy && <span>By: {header.preparedBy}</span>}
          </div>
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t">
          <span className="text-sm text-muted-foreground">
            Total Equipment: <strong>{totalEquipment}</strong>
          </span>
          <Badge variant="outline">{enabledColumns.length} columns</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="min-w-[800px]">
            {data.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Group Header */}
                {group.groupName !== 'All Equipment' && (
                  <div className="bg-muted/50 px-4 py-2 font-medium text-sm border-y">
                    {group.groupName}
                    <Badge variant="secondary" className="ml-2">
                      {group.items.length}
                    </Badge>
                  </div>
                )}
                
                <Table>
                  {groupIndex === 0 && (
                    <TableHeader>
                      <TableRow>
                        {enabledColumns.map(col => (
                          <TableHead 
                            key={col.id}
                            style={{ width: col.width ? `${col.width}px` : 'auto' }}
                            className="text-xs whitespace-nowrap"
                          >
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  )}
                  
                  <TableBody>
                    {group.items.map((item, itemIndex) => (
                      <TableRow key={item.id} className={itemIndex % 2 === 0 ? '' : 'bg-muted/30'}>
                        {enabledColumns.map(col => (
                          <TableCell key={col.id} className="py-2 text-sm">
                            {col.key === 'status' ? (
                              <Badge className={getStatusColor(item.status)}>
                                {item.status || '-'}
                              </Badge>
                            ) : (
                              formatCellValue(item, col)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Notes */}
        {notes && (
          <div className="border-t p-4">
            <p className="text-sm font-medium mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
