import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, FileText, Trash2, Edit, Download } from 'lucide-react';
import { EquipmentSchedule } from '@/hooks/useEquipmentSchedule';
import { format } from 'date-fns';

interface SavedSchedulesListProps {
  schedules: EquipmentSchedule[];
  isLoading: boolean;
  onSelect: (schedule: EquipmentSchedule) => void;
  onEdit: (schedule: EquipmentSchedule) => void;
  onDelete: (scheduleId: string) => void;
  onExport: (schedule: EquipmentSchedule) => void;
}

export function SavedSchedulesList({
  schedules,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
  onExport,
}: SavedSchedulesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'superseded':
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saved Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved schedules</p>
            <p className="text-xs mt-1">Create a new schedule to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {schedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onSelect(schedule)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{schedule.name}</p>
                      <Badge variant="outline" className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                      {schedule.revision && (
                        <Badge variant="secondary" className="text-xs">
                          Rev {schedule.revision}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {schedule.equipment_ids?.length || 0} items • 
                      Updated {format(new Date(schedule.updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(schedule); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(schedule); }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(schedule.id); }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
