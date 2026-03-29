import { useTechnicians, Technician } from '@/hooks/useTechnicians';
import { WorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Phone, Mail, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TechnicianPanelProps {
  workOrders: WorkOrder[];
}

export default function TechnicianPanel({ workOrders }: TechnicianPanelProps) {
  const { data: technicians = [], isLoading } = useTechnicians();
  const updateWorkOrder = useUpdateWorkOrder();

  const getAssignedCount = (techId: string) => {
    return workOrders.filter(
      wo => wo.assigned_to === techId && 
      (wo.status === 'open' || wo.status === 'in_progress')
    ).length;
  };

  const handleDragStart = (e: React.DragEvent, technician: Technician) => {
    e.dataTransfer.setData('technicianId', technician.id);
    e.dataTransfer.setData('technicianName', technician.full_name || technician.email);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Technicians
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-2">
            {technicians.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No technicians found
              </div>
            ) : (
              technicians.map((tech) => {
                const assignedCount = getAssignedCount(tech.id);
                
                return (
                  <Card
                    key={tech.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tech)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={tech.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(tech.full_name, tech.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {tech.full_name || tech.email}
                            </p>
                            {assignedCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {assignedCount} active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {tech.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
