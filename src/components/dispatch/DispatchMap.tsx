import { useState, useEffect, useRef } from 'react';
import { WorkOrder } from '@/hooks/useWorkOrders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Key, AlertCircle, Timer, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DispatchMapProps {
  workOrders: WorkOrder[];
}

const statusConfig = {
  open: { icon: AlertCircle, color: '#3b82f6', className: 'bg-info/10 text-info' },
  in_progress: { icon: Timer, color: '#f59e0b', className: 'bg-warning/10 text-warning' },
  completed: { icon: CheckCircle2, color: '#22c55e', className: 'bg-success/10 text-success' },
  cancelled: { color: '#6b7280', className: 'bg-muted text-muted-foreground' },
};

export default function DispatchMap({ workOrders }: DispatchMapProps) {
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Check for stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('mapbox_public_token');
    if (storedToken) {
      setMapboxToken(storedToken);
    }
  }, []);

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_public_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [46.6753, 24.7136], // Riyadh, Saudi Arabia
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setIsMapReady(false);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Filter work orders by status for the sidebar
  const activeWorkOrders = workOrders.filter(
    wo => wo.status === 'open' || wo.status === 'in_progress'
  );

  if (!mapboxToken) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Mapbox Token Required
          </CardTitle>
          <CardDescription>
            Enter your Mapbox public token to enable the map view. You can get one at{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              mapbox.com <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button onClick={handleSaveToken} disabled={!tokenInput.trim()}>
            Save Token
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
      {/* Map */}
      <Card className="lg:col-span-3 overflow-hidden">
        <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
      </Card>

      {/* Sidebar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Active Work Orders
          </CardTitle>
          <CardDescription className="text-xs">
            {activeWorkOrders.length} orders to dispatch
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2 pr-2">
              {activeWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No active work orders
                </div>
              ) : (
                activeWorkOrders.map((wo) => {
                  const status = statusConfig[wo.status];
                  
                  return (
                    <Card key={wo.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm line-clamp-1">{wo.title}</h4>
                          <Badge 
                            variant="outline"
                            className={cn('text-[10px] shrink-0', status.className)}
                          >
                            {wo.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {wo.equipment_tag && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {wo.equipment_tag}
                          </p>
                        )}
                        {wo.assigned_profile?.full_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            → {wo.assigned_profile.full_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
