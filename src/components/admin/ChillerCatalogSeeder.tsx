import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SeedResult {
  seeded: boolean;
  count?: number;
  existingCount?: number;
  byManufacturer?: Record<string, number>;
  byType?: Record<string, number>;
  message: string;
  error?: string;
}

export function ChillerCatalogSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [forceReseed, setForceReseed] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query current chiller count
  const { data: currentCount, isLoading: countLoading } = useQuery({
    queryKey: ["chiller-catalog-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("equipment_catalog")
        .select("*", { count: "exact", head: true })
        .eq("equipment_category", "chiller");

      if (error) throw error;
      return count || 0;
    },
  });

  // Query manufacturers breakdown
  const { data: manufacturerBreakdown } = useQuery({
    queryKey: ["chiller-catalog-manufacturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_catalog")
        .select("manufacturer")
        .eq("equipment_category", "chiller");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        if (item.manufacturer) {
          counts[item.manufacturer] = (counts[item.manufacturer] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: (currentCount || 0) > 0,
  });

  const handleSeed = async () => {
    setIsSeeding(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke<SeedResult>(
        "seed-chiller-catalog",
        { body: { force: forceReseed } }
      );

      if (error) {
        throw error;
      }

      setLastResult(data || null);

      if (data?.seeded) {
        toast({
          title: "Chiller Catalog Seeded",
          description: data.message,
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["chiller-catalog-count"] });
        queryClient.invalidateQueries({ queryKey: ["chiller-catalog-manufacturers"] });
        queryClient.invalidateQueries({ queryKey: ["equipment_catalog"] });
        queryClient.invalidateQueries({ queryKey: ["chiller_catalog"] });
      } else {
        toast({
          title: "Catalog Already Exists",
          description: data?.message || "Chiller catalog was not seeded.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Seed error:", error);
      toast({
        title: "Seeding Failed",
        description: error.message || "Failed to seed chiller catalog",
        variant: "destructive",
      });
      setLastResult({ seeded: false, message: error.message, error: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Chiller Catalog Seeder
        </CardTitle>
        <CardDescription>
          Populate the equipment catalog with AHRI-certified chiller data from Carrier, Trane, York, and Daikin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Chillers:</span>
            {countLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Badge variant={currentCount && currentCount > 0 ? "default" : "secondary"}>
                {currentCount || 0} models
              </Badge>
            )}
          </div>
          {manufacturerBreakdown && Object.keys(manufacturerBreakdown).length > 0 && (
            <div className="flex gap-1">
              {Object.entries(manufacturerBreakdown).map(([mfr, count]) => (
                <Badge key={mfr} variant="outline" className="text-xs">
                  {mfr}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Force Reseed Option */}
        {currentCount && currentCount > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-reseed"
              checked={forceReseed}
              onCheckedChange={(checked) => setForceReseed(checked === true)}
            />
            <Label htmlFor="force-reseed" className="text-sm text-muted-foreground">
              Force reseed (will delete existing chiller entries and re-insert)
            </Label>
          </div>
        )}

        {/* Seed Button */}
        <Button
          onClick={handleSeed}
          disabled={isSeeding}
          className="w-full"
          variant={currentCount && currentCount > 0 && !forceReseed ? "secondary" : "default"}
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Catalog...
            </>
          ) : currentCount && currentCount > 0 ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {forceReseed ? "Reseed Catalog" : "Check Catalog"}
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Chiller Catalog
            </>
          )}
        </Button>

        {/* Last Result */}
        {lastResult && (
          <div
            className={`p-3 rounded-lg ${
              lastResult.seeded
                ? "bg-primary/10 border border-primary/20"
                : lastResult.error
                ? "bg-destructive/10 border border-destructive/20"
                : "bg-muted"
            }`}
          >
            <div className="flex items-start gap-2">
              {lastResult.seeded ? (
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              ) : lastResult.error ? (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              ) : null}
              <div className="flex-1">
                <p className="text-sm font-medium">{lastResult.message}</p>
                {lastResult.byManufacturer && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(lastResult.byManufacturer).map(([mfr, count]) => (
                      <Badge key={mfr} variant="outline" className="text-xs">
                        {mfr}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
                {lastResult.byType && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Types: {Object.entries(lastResult.byType).map(([type, count]) => (
                      <span key={type} className="mr-2">
                        {type.replace("water-cooled-", "WC ").replace("air-cooled-", "AC ")}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Catalog Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>48 models</strong> across 4 major manufacturers</p>
          <p>• Includes AHRI part-load curves for IPLV calculations</p>
          <p>• Water-cooled (centrifugal, screw) and air-cooled (screw, scroll) types</p>
          <p>• SASO, ASHRAE, and AHRI compliance data included</p>
        </div>
      </CardContent>
    </Card>
  );
}
