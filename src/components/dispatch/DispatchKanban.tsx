import { useState } from 'react';
import { WorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertCircle, 
  Timer, 
  CheckCircle2, 
  XCircle,
  Calendar,
  User,
  Wrench,
  GripVertical,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DispatchKanbanProps {
  workOrders: WorkOrder[];
}

const columns = [
  { 
    id: 'open' as const, 
    title: 'Open', 
    icon: AlertCircle, 
    className: 'border-info/30 bg-info/5' 
  },
  { 
    id: 'in_progress' as const, 
    title: 'In Progress', 
    icon: Timer, 
    className: 'border-warning/30 bg-warning/5' 
  },
  { 
    id: 'completed' as const, 
    title: 'Completed', 
    icon: CheckCircle2, 
    className: 'border-success/30 bg-success/5' 
  },
  { 
    id: 'cancelled' as const, 
    title: 'Cancelled', 
    icon: XCircle, 
    className: 'border-muted bg-muted/30' 
  },
];

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info border-info/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  urgent: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function DispatchKanban({ workOrders }: DispatchKanbanProps) {
  const updateWorkOrder = useUpdateWorkOrder();
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, workOrderId: string) => {
    e.dataTransfer.setData('workOrderId', workOrderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, workOrderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const technicianId = e.dataTransfer.types.includes('technicianid');
    if (technicianId) {
      setDragOverCard(workOrderId);
    }
  };

  const handleCardDragLeave = () => {
    setDragOverCard(null);
  };

  const handleCardDrop = async (e: React.DragEvent, workOrderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCard(null);
    
    const technicianId = e.dataTransfer.getData('technicianId');
    const technicianName = e.dataTransfer.getData('technicianName');
    
    if (technicianId) {
      try {
        await updateWorkOrder.mutateAsync({ id: workOrderId, assigned_to: technicianId });
        toast.success(`Assigned to ${technicianName}`);
      } catch (error) {
        toast.error('Failed to assign technician');
      }
      return;
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: WorkOrder['status']) => {
    e.preventDefault();
    const workOrderId = e.dataTransfer.getData('workOrderId');
    
    if (!workOrderId) return;

    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder || workOrder.status === newStatus) return;

    try {
      await updateWorkOrder.mutateAsync({ id: workOrderId, status: newStatus });
      toast.success(`Moved to ${columns.find(c => c.id === newStatus)?.title}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getColumnWorkOrders = (status: WorkOrder['status']) => {
    return workOrders.filter(wo => wo.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnWorkOrders = getColumnWorkOrders(column.id);
        const Icon = column.icon;
        
        return (
          <Card 
            key={column.id} 
            className={cn('border-2', column.className)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {column.title}
                </span>
                <Badge variant="secondary" className="rounded-full">
                  {columnWorkOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-380px)] pr-2">
                <div className="space-y-2">
                  {columnWorkOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No work orders
                    </div>
                  ) : (
                    columnWorkOrders.map((wo) => (
                      <Card
                        key={wo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, wo.id)}
                        onDragOver={(e) => handleCardDragOver(e, wo.id)}
                        onDragLeave={handleCardDragLeave}
                        onDrop={(e) => handleCardDrop(e, wo.id)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing hover:shadow-md transition-all group',
                          dragOverCard === wo.id && 'ring-2 ring-primary ring-offset-2'
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium text-sm line-clamp-2">{wo.title}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-[10px] shrink-0', priorityColors[wo.priority])}
                                >
                                  {wo.priority}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {wo.equipment_tag && (
                                  <div className="flex items-center gap-1 font-mono">
                                    <Wrench className="w-3 h-3" />
                                    {wo.equipment_tag}
                                  </div>
                                )}
                                {wo.assigned_profile?.full_name ? (
                                  <div className="flex items-center gap-1 text-primary">
                                    <User className="w-3 h-3" />
                                    {wo.assigned_profile.full_name}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground/50 italic">
                                    <UserPlus className="w-3 h-3" />
                                    Unassigned
                                  </div>
                                )}
                                {wo.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(wo.due_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
