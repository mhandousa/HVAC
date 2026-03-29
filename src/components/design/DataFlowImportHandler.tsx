import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDesignDataFlow, type UpstreamData } from '@/hooks/useDesignDataFlow';
import { ImportSourceCard } from './import-handler/ImportSourceCard';
import { IMPORT_SOURCES, getRelevantSources, type ImportSource } from './import-handler/importSourceConfig';

// Typed import data interfaces
export interface ImportLoadData {
  totalCoolingTons: number;
  totalHeatingMbh: number;
  totalCfm: number;
  zoneCount: number;
  items: Array<{ id: string; name: string; coolingBtuh: number; heatingBtuh: number; cfm: number }>;
}

export interface ImportVentilationData {
  totalOutdoorAirCfm: number;
  totalSupplyAirCfm: number;
  calculationCount: number;
}

export interface ImportEquipmentData {
  selectedCount: number;
  totalCapacityTons: number;
}

export interface ImportAHUData {
  ahuCount: number;
  totalDesignCfm: number;
}

export interface ImportTerminalData {
  count: number;
  totalCfm: number;
}

export interface ImportDuctData {
  systemCount: number;
  systemsWithoutFanCount: number;
}

export interface ImportPipeData {
  systemCount: number;
  systemsWithoutPumpCount: number;
}

export interface ImportCHWPlantData {
  plantCount: number;
  totalCapacityTons: number;
  plants: Array<{
    id: string;
    name: string;
    capacityTons: number;
    chillerType: string | null;
    chwSupplyF: number | null;
    chwReturnF: number | null;
    cwSupplyF: number | null;
  }>;
}

export interface DataFlowImportHandlerProps {
  projectId: string | null;
  zoneId?: string | null;
  currentTool: string;
  className?: string;
  layout?: 'grid' | 'list';
  showEmptySources?: boolean;
  // Import handlers
  onImportLoadData?: (data: ImportLoadData) => void;
  onImportVentilationData?: (data: ImportVentilationData) => void;
  onImportEquipmentData?: (data: ImportEquipmentData) => void;
  onImportAHUData?: (data: ImportAHUData) => void;
  onImportTerminalData?: (data: ImportTerminalData) => void;
  onImportDuctData?: (data: ImportDuctData) => void;
  onImportPipeData?: (data: ImportPipeData) => void;
  onImportCHWPlantData?: (data: ImportCHWPlantData) => void;
}

export function DataFlowImportHandler({
  projectId,
  zoneId,
  currentTool,
  className,
  layout = 'grid',
  showEmptySources = false,
  onImportLoadData,
  onImportVentilationData,
  onImportEquipmentData,
  onImportAHUData,
  onImportTerminalData,
  onImportDuctData,
  onImportPipeData,
  onImportCHWPlantData,
}: DataFlowImportHandlerProps) {
  const navigate = useNavigate();
  const { data: upstreamData, isLoading } = useDesignDataFlow(projectId, zoneId);
  const [importingSource, setImportingSource] = useState<string | null>(null);

  // Get relevant sources for current tool
  const relevantSourceIds = useMemo(() => getRelevantSources(currentTool), [currentTool]);

  // Filter and prepare sources
  const displaySources = useMemo(() => {
    if (!upstreamData) return [];
    
    return IMPORT_SOURCES.filter(source => {
      // Check if source is relevant for current tool
      if (!relevantSourceIds.includes(source.id)) return false;
      
      // Optionally filter out empty sources
      if (!showEmptySources && !source.isAvailable(upstreamData)) return false;
      
      return true;
    });
  }, [relevantSourceIds, upstreamData, showEmptySources]);

  // Handle import action
  const handleImport = async (source: ImportSource) => {
    setImportingSource(source.id);

    try {
      // Simulate a brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      switch (source.id) {
        case 'load-calculations':
          if (onImportLoadData && upstreamData) {
            onImportLoadData({
              totalCoolingTons: upstreamData.loadCalculations.totalCoolingTons,
              totalHeatingMbh: upstreamData.loadCalculations.totalHeatingMbh,
              totalCfm: upstreamData.loadCalculations.totalCfm,
              zoneCount: upstreamData.loadCalculations.zoneCount,
              items: upstreamData.loadCalculations.items.map(item => ({
                id: item.id,
                name: item.calculation_name,
                coolingBtuh: item.cooling_load_btuh || 0,
                heatingBtuh: item.heating_load_btuh || 0,
                cfm: item.cfm_required || 0,
              })),
            });
            toast.success(`Imported ${upstreamData.loadCalculations.zoneCount} zones from Load Calculations`);
          } else {
            navigate(`/design/load-calculation?project=${projectId}`);
          }
          break;

        case 'ventilation-calculations':
          if (onImportVentilationData && upstreamData) {
            onImportVentilationData({
              totalOutdoorAirCfm: upstreamData.ventilationCalcs.totalOutdoorAirCfm,
              totalSupplyAirCfm: upstreamData.ventilationCalcs.totalSupplyAirCfm,
              calculationCount: upstreamData.ventilationCalcs.calculationCount,
            });
            toast.success(`Imported ${upstreamData.ventilationCalcs.calculationCount} ventilation calculations`);
          } else {
            navigate(`/design/ventilation-calculator?project=${projectId}`);
          }
          break;

        case 'equipment-selections':
          if (onImportEquipmentData && upstreamData) {
            onImportEquipmentData({
              selectedCount: upstreamData.equipmentSelections.selectedCount,
              totalCapacityTons: upstreamData.equipmentSelections.totalCapacityTons,
            });
            toast.success(`Imported ${upstreamData.equipmentSelections.selectedCount} equipment selections`);
          } else {
            navigate(`/design/equipment-selection?project=${projectId}`);
          }
          break;

        case 'ahu-configurations':
          if (onImportAHUData && upstreamData) {
            onImportAHUData({
              ahuCount: upstreamData.ahuConfigurations.ahuCount,
              totalDesignCfm: upstreamData.ahuConfigurations.totalDesignCfm,
            });
            toast.success(`Imported ${upstreamData.ahuConfigurations.ahuCount} AHU configurations`);
          } else {
            navigate(`/design/ahu-configuration?project=${projectId}`);
          }
          break;

        case 'terminal-units':
          if (onImportTerminalData && upstreamData) {
            onImportTerminalData({
              count: upstreamData.terminalUnits.count,
              totalCfm: upstreamData.terminalUnits.totalCfm,
            });
            toast.success(`Imported ${upstreamData.terminalUnits.count} terminal units`);
          } else {
            navigate(`/design/terminal-unit-sizing?project=${projectId}`);
          }
          break;

        case 'duct-systems':
          if (onImportDuctData && upstreamData) {
            onImportDuctData({
              systemCount: upstreamData.ductSystems.systems.length,
              systemsWithoutFanCount: upstreamData.ductSystems.systemsWithoutFan.length,
            });
            toast.success(`Imported ${upstreamData.ductSystems.systems.length} duct systems`);
          } else {
            navigate(`/design/duct-designer?project=${projectId}`);
          }
          break;

        case 'pipe-systems':
          if (onImportPipeData && upstreamData) {
            onImportPipeData({
              systemCount: upstreamData.pipeSystems.systems.length,
              systemsWithoutPumpCount: upstreamData.pipeSystems.systemsWithoutPump.length,
            });
            toast.success(`Imported ${upstreamData.pipeSystems.systems.length} pipe systems`);
          } else {
            navigate(`/design/pipe-designer?project=${projectId}`);
          }
          break;

        case 'chw-plants':
          if (onImportCHWPlantData && upstreamData) {
            onImportCHWPlantData({
              plantCount: upstreamData.chwPlants.plantCount,
              totalCapacityTons: upstreamData.chwPlants.totalCapacityTons,
              plants: upstreamData.chwPlants.items.map(p => ({
                id: p.id,
                name: p.plant_name,
                capacityTons: p.design_cooling_load_tons,
                chillerType: p.chiller_type,
                chwSupplyF: p.chw_supply_temp_f,
                chwReturnF: p.chw_return_temp_f,
                cwSupplyF: p.cw_supply_temp_f,
              })),
            });
            toast.success(`Imported ${upstreamData.chwPlants.plantCount} CHW plant(s)`);
          } else {
            navigate(`/design/chw-plant?project=${projectId}`);
          }
          break;
      }
    } catch (error) {
      toast.error('Failed to import data');
    } finally {
      setImportingSource(null);
    }
  };

  // Get last updated time for a source (mock for now, would come from actual data)
  const getLastUpdated = (source: ImportSource): string | undefined => {
    if (!upstreamData) return undefined;
    // In a real implementation, this would come from the upstream data timestamps
    const dataSection = upstreamData[source.dataKey];
    if (dataSection && 'available' in dataSection && dataSection.available) {
      // Mock relative time - in production, use actual timestamps
      return formatDistanceToNow(new Date(Date.now() - Math.random() * 86400000 * 3), { addSuffix: true });
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Database className="h-5 w-5 animate-pulse" />
          <span>Loading data sources...</span>
        </div>
      </div>
    );
  }

  if (!upstreamData || displaySources.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <ArrowDownToLine className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No data sources available for import
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Complete upstream design steps first
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      layout === 'grid' 
        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
        : "flex flex-col gap-4",
      className
    )}>
      {displaySources.map((source) => (
        <ImportSourceCard
          key={source.id}
          source={source}
          data={upstreamData}
          onImport={() => handleImport(source)}
          isImporting={importingSource === source.id}
          lastUpdated={getLastUpdated(source)}
        />
      ))}
    </div>
  );
}
