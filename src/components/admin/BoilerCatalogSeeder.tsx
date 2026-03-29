import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flame, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function BoilerCatalogSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ seeded: boolean; count?: number; message?: string } | null>(null);

  const handleSeed = async (force = false) => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-boiler-catalog', {
        body: {},
        headers: force ? {} : undefined,
      });

      // If we need to force, call with query param
      if (!force && data && !data.seeded && data.message?.includes('already contains')) {
        setSeedResult(data);
        toast.info(data.message);
        setIsSeeding(false);
        return;
      }

      if (error) throw error;
      
      setSeedResult(data);
      if (data.seeded) {
        toast.success(`Seeded ${data.count} boiler models`);
      } else {
        toast.info(data.message || 'Catalog already seeded');
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed boiler catalog');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleForceReseed = async () => {
    setIsSeeding(true);
    try {
      // Call with force parameter via URL
      const { data, error } = await supabase.functions.invoke('seed-boiler-catalog?force=true', {
        body: {},
      });

      if (error) throw error;
      
      setSeedResult(data);
      toast.success(`Reseeded ${data.count} boiler models`);
    } catch (error) {
      console.error('Reseed error:', error);
      toast.error('Failed to reseed boiler catalog');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-medium">Boiler Catalog</span>
        </div>
        {seedResult?.seeded && (
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            {seedResult.count} models
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Seed the equipment catalog with boiler models from Lochinvar, Weil-McLain, 
        Cleaver-Brooks, and Fulton. Includes AFUE ratings, turndown ratios, and fuel types.
      </p>
      
      <div className="flex gap-2">
        <Button onClick={() => handleSeed(false)} disabled={isSeeding}>
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Flame className="mr-2 h-4 w-4" />
              Seed Boiler Catalog
            </>
          )}
        </Button>
        
        {seedResult && !seedResult.seeded && (
          <Button variant="outline" onClick={handleForceReseed} disabled={isSeeding}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Reseed
          </Button>
        )}
      </div>
    </div>
  );
}
