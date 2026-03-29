import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Zap,
  Settings,
  Fan,
  Wind,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  CircleDot,
  Filter,
  Building2,
  Snowflake,
} from 'lucide-react';

type StageStatus = 'complete' | 'partial' | 'missing';

interface ValidationFlowDiagramProps {
  stageStatus: {
    loadCalculations: { count: number; hasData: boolean };
    equipmentSelections: { count: number; hasData: boolean; linkedToLoads: number };
    terminalUnits: { count: number; hasData: boolean };
    ahuConfigurations: { count: number; hasData: boolean };
    vrfSystems: { count: number; hasData: boolean };
    ductSystems: { count: number; hasData: boolean; linkedToLoads: number };
    pipeSystems: { count: number; hasData: boolean; linkedToLoads: number };
    // Equipment selection tools
    coilSelections?: { count: number; hasData: boolean; linkedToAhu: number };
    filterSelections?: { count: number; hasData: boolean; linkedToAhu: number };
    coolingTowerSelections?: { count: number; hasData: boolean; linkedToPlant: number };
    chillerSelections?: { count: number; hasData: boolean; linkedToPlant: number };
  };
  crossToolValidation?: {
    zoneLoadVsTerminal: { pass: number; fail: number; warning: number };
    terminalVsAhu: { pass: number; fail: number; warning: number };
    vrfCapacityRatio: { pass: number; fail: number; warning: number };
    diffuserAcoustic: { pass: number; fail: number; warning: number };
    // Equipment selection tool validations
    ahuVsCoil?: { pass: number; fail: number; warning: number };
    ahuVsFilter?: { pass: number; fail: number; warning: number };
    equipmentVsTower?: { pass: number; fail: number; warning: number };
  };
}

function getStageStatus(hasData: boolean, linkedCount?: number, totalCount?: number): StageStatus {
  if (!hasData) return 'missing';
  if (linkedCount !== undefined && totalCount !== undefined && linkedCount < totalCount) return 'partial';
  return 'complete';
}

function StageNode({ 
  name, 
  icon: Icon, 
  count, 
  status,
  subLabel,
  compact = false,
}: { 
  name: string;
  icon: typeof Zap;
  count: number;
  status: StageStatus;
  subLabel?: string;
  compact?: boolean;
}) {
  const statusStyles = {
    complete: 'border-success bg-success/5',
    partial: 'border-warning bg-warning/5',
    missing: 'border-muted bg-muted/5',
  };

  const StatusIcon = status === 'complete' ? CheckCircle2 : status === 'partial' ? AlertTriangle : null;

  return (
    <div className={cn(
      'rounded-lg border-2 text-center relative',
      statusStyles[status],
      compact ? 'p-2 min-w-[80px]' : 'p-3 min-w-[100px]'
    )}>
      {StatusIcon && (
        <div className="absolute -top-2 -right-2">
          <StatusIcon className={cn(
            'w-4 h-4',
            status === 'complete' ? 'text-success' : 'text-warning'
          )} />
        </div>
      )}
      <Icon className={cn('mx-auto mb-1 text-primary', compact ? 'w-4 h-4' : 'w-5 h-5')} />
      <p className={cn('font-medium', compact ? 'text-[10px]' : 'text-xs')}>{name}</p>
      <p className={cn('font-bold', compact ? 'text-sm' : 'text-lg')}>{count}</p>
      {subLabel && (
        <p className="text-[10px] text-muted-foreground">{subLabel}</p>
      )}
    </div>
  );
}

function ConnectionArrow({ status, vertical = false }: { status: 'valid' | 'warning' | 'error' | 'missing'; vertical?: boolean }) {
  const colors = {
    valid: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
    missing: 'text-muted-foreground',
  };

  const ArrowIcon = vertical ? ArrowDown : ArrowRight;

  return (
    <div className="flex items-center justify-center px-1">
      <ArrowIcon className={cn('w-4 h-4', colors[status])} />
    </div>
  );
}

function ValidationCounter({ 
  label, 
  pass, 
  fail, 
  warning 
}: { 
  label: string;
  pass: number;
  fail: number;
  warning: number;
}) {
  const total = pass + fail + warning;
  if (total === 0) return null;

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {pass > 0 && (
          <Badge variant="outline" className="bg-success/10 text-success text-[10px] px-1.5 py-0">
            {pass} ✓
          </Badge>
        )}
        {warning > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning text-[10px] px-1.5 py-0">
            {warning} !
          </Badge>
        )}
        {fail > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0">
            {fail} ✗
          </Badge>
        )}
      </div>
    </div>
  );
}

export function ValidationFlowDiagram({ stageStatus, crossToolValidation }: ValidationFlowDiagramProps) {
  const stages = useMemo(() => ({
    loadCalcs: {
      name: 'Load Calcs',
      icon: Zap,
      count: stageStatus.loadCalculations.count,
      status: getStageStatus(stageStatus.loadCalculations.hasData),
    },
    equipment: {
      name: 'Equipment',
      icon: Settings,
      count: stageStatus.equipmentSelections.count,
      status: getStageStatus(
        stageStatus.equipmentSelections.hasData,
        stageStatus.equipmentSelections.linkedToLoads,
        stageStatus.equipmentSelections.count
      ),
      subLabel: `${stageStatus.equipmentSelections.linkedToLoads} linked`,
    },
    terminal: {
      name: 'Terminal Units',
      icon: Fan,
      count: stageStatus.terminalUnits.count,
      status: getStageStatus(stageStatus.terminalUnits.hasData),
    },
    ahu: {
      name: 'AHU',
      icon: Wind,
      count: stageStatus.ahuConfigurations.count,
      status: getStageStatus(stageStatus.ahuConfigurations.hasData),
    },
    vrf: {
      name: 'VRF',
      icon: Thermometer,
      count: stageStatus.vrfSystems.count,
      status: getStageStatus(stageStatus.vrfSystems.hasData),
    },
    // Equipment selection tool stages
    coil: {
      name: 'Coils',
      icon: CircleDot,
      count: stageStatus.coilSelections?.count || 0,
      status: getStageStatus(
        stageStatus.coilSelections?.hasData || false,
        stageStatus.coilSelections?.linkedToAhu,
        stageStatus.coilSelections?.count
      ),
      subLabel: stageStatus.coilSelections?.linkedToAhu 
        ? `${stageStatus.coilSelections.linkedToAhu} to AHU` 
        : undefined,
    },
    filter: {
      name: 'Filters',
      icon: Filter,
      count: stageStatus.filterSelections?.count || 0,
      status: getStageStatus(
        stageStatus.filterSelections?.hasData || false,
        stageStatus.filterSelections?.linkedToAhu,
        stageStatus.filterSelections?.count
      ),
      subLabel: stageStatus.filterSelections?.linkedToAhu 
        ? `${stageStatus.filterSelections.linkedToAhu} to AHU` 
        : undefined,
    },
    coolingTower: {
      name: 'Cooling Tower',
      icon: Building2,
      count: stageStatus.coolingTowerSelections?.count || 0,
      status: getStageStatus(
        stageStatus.coolingTowerSelections?.hasData || false,
        stageStatus.coolingTowerSelections?.linkedToPlant,
        stageStatus.coolingTowerSelections?.count
      ),
      subLabel: stageStatus.coolingTowerSelections?.linkedToPlant 
        ? `${stageStatus.coolingTowerSelections.linkedToPlant} linked` 
        : undefined,
    },
    chiller: {
      name: 'Chillers',
      icon: Snowflake,
      count: stageStatus.chillerSelections?.count || 0,
      status: getStageStatus(
        stageStatus.chillerSelections?.hasData || false,
        stageStatus.chillerSelections?.linkedToPlant,
        stageStatus.chillerSelections?.count
      ),
      subLabel: stageStatus.chillerSelections?.linkedToPlant 
        ? `${stageStatus.chillerSelections.linkedToPlant} to plant` 
        : undefined,
    },
  }), [stageStatus]);

  // Determine connection statuses based on data availability and validation results
  const getConnectionStatus = (from: string, to: string): 'valid' | 'warning' | 'error' | 'missing' => {
    if (from === 'loadCalcs' && to === 'equipment') {
      if (!stageStatus.loadCalculations.hasData) return 'missing';
      if (!stageStatus.equipmentSelections.hasData) return 'missing';
      if (stageStatus.equipmentSelections.linkedToLoads === 0) return 'error';
      if (stageStatus.equipmentSelections.linkedToLoads < stageStatus.equipmentSelections.count) return 'warning';
      return 'valid';
    }
    if (from === 'loadCalcs' && to === 'terminal') {
      if (!stageStatus.loadCalculations.hasData) return 'missing';
      if (!stageStatus.terminalUnits.hasData) return 'missing';
      if (crossToolValidation?.zoneLoadVsTerminal.fail) return 'error';
      if (crossToolValidation?.zoneLoadVsTerminal.warning) return 'warning';
      return 'valid';
    }
    if (from === 'terminal' && to === 'ahu') {
      if (!stageStatus.terminalUnits.hasData) return 'missing';
      if (!stageStatus.ahuConfigurations.hasData) return 'missing';
      if (crossToolValidation?.terminalVsAhu.fail) return 'error';
      if (crossToolValidation?.terminalVsAhu.warning) return 'warning';
      return 'valid';
    }
    // Equipment selection tool connections
    if (from === 'ahu' && to === 'coil') {
      if (!stageStatus.ahuConfigurations.hasData) return 'missing';
      if (!stageStatus.coilSelections?.hasData) return 'missing';
      if (stageStatus.coilSelections.linkedToAhu === 0) return 'error';
      if (stageStatus.coilSelections.linkedToAhu < stageStatus.coilSelections.count) return 'warning';
      if (crossToolValidation?.ahuVsCoil?.fail) return 'error';
      if (crossToolValidation?.ahuVsCoil?.warning) return 'warning';
      return 'valid';
    }
    if (from === 'ahu' && to === 'filter') {
      if (!stageStatus.ahuConfigurations.hasData) return 'missing';
      if (!stageStatus.filterSelections?.hasData) return 'missing';
      if (stageStatus.filterSelections.linkedToAhu === 0) return 'error';
      if (stageStatus.filterSelections.linkedToAhu < stageStatus.filterSelections.count) return 'warning';
      if (crossToolValidation?.ahuVsFilter?.fail) return 'error';
      if (crossToolValidation?.ahuVsFilter?.warning) return 'warning';
      return 'valid';
    }
    if (from === 'equipment' && to === 'coolingTower') {
      if (!stageStatus.equipmentSelections.hasData) return 'missing';
      if (!stageStatus.coolingTowerSelections?.hasData) return 'missing';
      if (stageStatus.coolingTowerSelections.linkedToPlant === 0) return 'warning';
      if (crossToolValidation?.equipmentVsTower?.fail) return 'error';
      if (crossToolValidation?.equipmentVsTower?.warning) return 'warning';
      return 'valid';
    }
    return 'missing';
  };

  // Check if we have any equipment selection tools data
  const hasEquipmentSelectionTools = 
    (stageStatus.coilSelections?.count || 0) > 0 ||
    (stageStatus.filterSelections?.count || 0) > 0 ||
    (stageStatus.coolingTowerSelections?.count || 0) > 0 ||
    (stageStatus.chillerSelections?.count || 0) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cross-Tool Validation Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Flow: Load → Equipment → Terminal → AHU */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <StageNode {...stages.loadCalcs} />
            <ConnectionArrow status={getConnectionStatus('loadCalcs', 'equipment')} />
            <StageNode {...stages.equipment} />
            <ConnectionArrow status={getConnectionStatus('loadCalcs', 'terminal')} />
            <StageNode {...stages.terminal} />
            <ConnectionArrow status={getConnectionStatus('terminal', 'ahu')} />
            <StageNode {...stages.ahu} />
          </div>

          {/* Equipment Selection Tools Row */}
          {hasEquipmentSelectionTools && (
            <div className="pt-2 border-t border-dashed">
              <p className="text-xs text-muted-foreground text-center mb-3">Equipment Selection Tools</p>
              <div className="flex items-start justify-center gap-6 flex-wrap">
                {/* AHU → Coils branch */}
                {(stageStatus.coilSelections?.count || 0) > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] text-muted-foreground">from AHU</div>
                    <ConnectionArrow status={getConnectionStatus('ahu', 'coil')} vertical />
                    <StageNode {...stages.coil} compact />
                  </div>
                )}

                {/* AHU → Filters branch */}
                {(stageStatus.filterSelections?.count || 0) > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] text-muted-foreground">from AHU</div>
                    <ConnectionArrow status={getConnectionStatus('ahu', 'filter')} vertical />
                    <StageNode {...stages.filter} compact />
                  </div>
                )}

                {/* Equipment → Cooling Tower branch */}
                {(stageStatus.coolingTowerSelections?.count || 0) > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] text-muted-foreground">from Equipment</div>
                    <ConnectionArrow status={getConnectionStatus('equipment', 'coolingTower')} vertical />
                    <StageNode {...stages.coolingTower} compact />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VRF Branch */}
          {stageStatus.vrfSystems.count > 0 && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs text-muted-foreground">VRF Path:</div>
              <StageNode {...stages.vrf} />
              {crossToolValidation?.vrfCapacityRatio && (
                <ValidationCounter 
                  label="Capacity Ratio" 
                  {...crossToolValidation.vrfCapacityRatio} 
                />
              )}
            </div>
          )}

          {/* Validation Counters */}
          {crossToolValidation && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <ValidationCounter 
                label="Zone → Terminal CFM" 
                {...crossToolValidation.zoneLoadVsTerminal} 
              />
              <ValidationCounter 
                label="Terminal → AHU CFM" 
                {...crossToolValidation.terminalVsAhu} 
              />
              <ValidationCounter 
                label="VRF Capacity Ratio" 
                {...crossToolValidation.vrfCapacityRatio} 
              />
              <ValidationCounter 
                label="Diffuser NC Rating" 
                {...crossToolValidation.diffuserAcoustic} 
              />
              {/* Equipment selection tool counters */}
              {crossToolValidation.ahuVsCoil && (
                <ValidationCounter 
                  label="AHU → Coil" 
                  {...crossToolValidation.ahuVsCoil} 
                />
              )}
              {crossToolValidation.ahuVsFilter && (
                <ValidationCounter 
                  label="AHU → Filter" 
                  {...crossToolValidation.ahuVsFilter} 
                />
              )}
              {crossToolValidation.equipmentVsTower && (
                <ValidationCounter 
                  label="Chiller → Tower" 
                  {...crossToolValidation.equipmentVsTower} 
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}