import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkOrders, WorkOrder } from '@/hooks/useWorkOrders';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Columns3, Map, Clock } from 'lucide-react';
import DispatchKanban from '@/components/dispatch/DispatchKanban';
import DispatchCalendar from '@/components/dispatch/DispatchCalendar';
import DispatchMap from '@/components/dispatch/DispatchMap';
import DispatchTimeline from '@/components/dispatch/DispatchTimeline';
import TechnicianPanel from '@/components/dispatch/TechnicianPanel';
import { TechnicianScheduleManager } from '@/components/dispatch/TechnicianScheduleManager';

export default function DispatchBoard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kanban');

  const { data: workOrders = [], isLoading } = useWorkOrders();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispatch Board</h1>
            <p className="text-muted-foreground">
              Schedule and manage work orders visually
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="kanban" className="gap-2">
              <Columns3 className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Map className="w-4 h-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedules
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="kanban" className="mt-6">
                <div className="space-y-4">
                  <TechnicianPanel workOrders={workOrders} />
                  <p className="text-xs text-muted-foreground text-center">
                    Drag technicians onto work order cards to assign them
                  </p>
                  <DispatchKanban workOrders={workOrders} />
                </div>
              </TabsContent>
              <TabsContent value="timeline" className="mt-6">
                <DispatchTimeline workOrders={workOrders} />
              </TabsContent>
              <TabsContent value="calendar" className="mt-6">
                <DispatchCalendar workOrders={workOrders} />
              </TabsContent>
              <TabsContent value="map" className="mt-6">
                <DispatchMap workOrders={workOrders} />
              </TabsContent>
              <TabsContent value="schedules" className="mt-6">
                <TechnicianScheduleManager />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
