import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, Wind, Droplets, Thermometer, GitBranch, 
  RefreshCw, ClipboardCheck, ExternalLink, ArrowRight,
  Building2, Box, Snowflake, Flame
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '../DesignWorkflowNextStep';
import { WizardStageData } from '@/hooks/useWizardState';

interface WizardStageContentProps {
  stageId: WorkflowStageId;
  projectId: string;
  stageData: Partial<WizardStageData>;
  selectedZoneIds: string[];
  onOpenTool: (stageId: WorkflowStageId) => void;
  onNext: () => void;
  onSkip: () => void;
  isLastStage: boolean;
}

interface StageConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  dataKey: keyof WizardStageData;
  toolPath: string;
  primaryAction: string;
  skipLabel?: string;
  renderData: (data: WizardStageData[keyof WizardStageData]) => React.ReactNode;
  getAutoPopulationInfo: (prevData: Partial<WizardStageData>) => string[];
}

const STAGE_CONFIGS: Record<WorkflowStageId, StageConfig> = {
  load: {
    title: 'Load Calculation',
    description: 'Calculate heating and cooling loads for each zone based on building characteristics, internal gains, and climate data.',
    icon: Calculator,
    dataKey: 'loadCalculation',
    toolPath: '/design/load-calculation',
    primaryAction: 'Open Load Calculator',
    renderData: (data) => {
      const d = data as WizardStageData['loadCalculation'];
      if (!d) return <p className="text-sm text-muted-foreground">No calculations yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Total Cooling" value={`${d.totalCoolingTons.toFixed(1)} tons`} />
          <DataCard label="Total Heating" value={`${d.totalHeatingMbh.toFixed(1)} MBH`} />
          <DataCard label="Supply Airflow" value={`${d.totalCfm.toLocaleString()} CFM`} />
          <DataCard label="Zones Calculated" value={`${d.zonesCalculated} zones`} />
        </div>
      );
    },
    getAutoPopulationInfo: () => ['Zone areas from project structure', 'Climate data from project location'],
  },
  ventilation: {
    title: 'Ventilation Calculation',
    description: 'Determine outdoor air requirements per ASHRAE 62.1 based on occupancy and space types.',
    icon: Wind,
    dataKey: 'ventilation',
    toolPath: '/design/ventilation-calculator',
    primaryAction: 'Open Ventilation Calculator',
    skipLabel: 'Skip (no occupied zones)',
    renderData: (data) => {
      const d = data as WizardStageData['ventilation'];
      if (!d) return <p className="text-sm text-muted-foreground">No ventilation data yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="System CFM" value={`${d.systemCfm.toLocaleString()} CFM`} />
          <DataCard label="Outdoor Air" value={`${d.outdoorAirCfm.toLocaleString()} CFM`} />
          <DataCard label="Zones Configured" value={`${d.zonesConfigured} zones`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `CFM from load calculations: ${prev.loadCalculation?.totalCfm?.toLocaleString() || '—'} CFM`,
      'Zone occupancy from space types',
    ],
  },
  psychrometric: {
    title: 'Psychrometric Analysis',
    description: 'Analyze air properties and processes to optimize coil selection and system performance.',
    icon: Droplets,
    dataKey: 'psychrometric',
    toolPath: '/design/psychrometric', // Phase 8: Fixed path
    primaryAction: 'Open Psychrometric Chart',
    skipLabel: 'Skip (optional)',
    renderData: (data) => {
      const d = data as WizardStageData['psychrometric'];
      if (!d || !d.hasAnalysis) return <p className="text-sm text-muted-foreground">No analysis performed yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Supply Air Temp" value={`${d.supplyAirTemp}°F`} />
          <DataCard label="Return Air Temp" value={`${d.returnAirTemp}°F`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Supply CFM: ${prev.loadCalculation?.totalCfm?.toLocaleString() || '—'} CFM`,
      'Outdoor conditions from climate data',
    ],
  },
  ahu: {
    title: 'AHU Configuration',
    description: 'Configure air handling units with coils, filters, and fans based on system requirements.',
    icon: Building2,
    dataKey: 'ahu',
    toolPath: '/design/ahu-configuration',
    primaryAction: 'Open AHU Configuration',
    renderData: (data) => {
      const d = data as WizardStageData['ahu'];
      if (!d) return <p className="text-sm text-muted-foreground">No AHUs configured yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="AHU Count" value={`${d.ahuCount} units`} />
          <DataCard label="Total Design CFM" value={`${d.totalDesignCfm.toLocaleString()} CFM`} />
          <DataCard label="Configured AHUs" value={`${d.configuredAhus} AHUs`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `System CFM: ${prev.loadCalculation?.totalCfm?.toLocaleString() || '—'} CFM`,
      `Outdoor air CFM: ${prev.ventilation?.outdoorAirCfm?.toLocaleString() || '—'} CFM`,
    ],
  },
  terminal: {
    title: 'Terminal Unit Sizing',
    description: 'Size VAV boxes, FCUs, and zone terminal units based on zone loads.',
    icon: Box,
    dataKey: 'terminal',
    toolPath: '/design/terminal-unit-sizing',
    primaryAction: 'Open Terminal Sizing',
    renderData: (data) => {
      const d = data as WizardStageData['terminal'];
      if (!d) return <p className="text-sm text-muted-foreground">No terminal units sized yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Terminal Units" value={`${d.terminalUnitCount} units`} />
          <DataCard label="Zones Covered" value={`${d.zonesWithTerminals} zones`} />
          <DataCard label="Total Capacity" value={`${d.totalCapacity.toFixed(1)} tons`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Zone cooling loads from load calculations`,
      `Equipment capacity: ${prev.equipment?.totalCapacityTons?.toFixed(1) || '—'} tons`,
    ],
  },
  equipment: {
    title: 'Equipment Selection',
    description: 'Select HVAC equipment that meets the calculated loads with appropriate capacity and efficiency.',
    icon: Snowflake,
    dataKey: 'equipment',
    toolPath: '/design/equipment-selection',
    primaryAction: 'Open Equipment Selector',
    renderData: (data) => {
      const d = data as WizardStageData['equipment'];
      if (!d) return <p className="text-sm text-muted-foreground">No equipment selected yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Equipment Count" value={`${d.equipmentCount} units`} />
          <DataCard label="Total Capacity" value={`${d.totalCapacityTons.toFixed(1)} tons`} />
          <DataCard label="Zones Covered" value={`${d.zonesWithEquipment} zones`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Required cooling: ${prev.loadCalculation?.totalCoolingTons?.toFixed(1) || '—'} tons`,
      `Required heating: ${prev.loadCalculation?.totalHeatingMbh?.toFixed(1) || '—'} MBH`,
    ],
  },
  distribution: {
    title: 'Air Distribution',
    description: 'Design duct systems, size terminals, and plan air distribution to each zone.',
    icon: GitBranch,
    dataKey: 'distribution',
    toolPath: '/design/duct-designer',
    primaryAction: 'Open Duct Designer',
    renderData: (data) => {
      const d = data as WizardStageData['distribution'];
      if (!d) return <p className="text-sm text-muted-foreground">No distribution systems yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Duct Systems" value={`${d.ductSystemsCount} systems`} />
          <DataCard label="Pipe Systems" value={`${d.pipeSystemsCount} systems`} />
          <DataCard label="Zones Covered" value={`${d.zonesWithDistribution} zones`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `System CFM: ${prev.loadCalculation?.totalCfm?.toLocaleString() || '—'} CFM`,
      `Equipment: ${prev.equipment?.equipmentCount || '—'} units`,
    ],
  },
  diffuser: {
    title: 'Terminal Devices',
    description: 'Select diffusers, grilles, and registers for air distribution to zones.',
    icon: Wind,
    dataKey: 'diffuser',
    toolPath: '/design/diffuser-selection',
    primaryAction: 'Open Diffuser Selection',
    renderData: (data) => {
      const d = data as WizardStageData['diffuser'];
      if (!d) return <p className="text-sm text-muted-foreground">No diffusers selected yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Diffuser Count" value={`${d.diffuserCount} types`} />
          <DataCard label="Total Quantity" value={`${d.totalQuantity} units`} />
          <DataCard label="Zones Covered" value={`${d.zonesWithDiffusers} zones`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Duct systems: ${prev.distribution?.ductSystemsCount || '—'} systems`,
      'Zone CFM requirements from terminals',
    ],
  },
  erv: {
    title: 'Energy Recovery',
    description: 'Size energy recovery ventilators to recover energy from exhaust air and reduce load.',
    icon: RefreshCw,
    dataKey: 'erv',
    toolPath: '/design/erv-sizing',
    primaryAction: 'Open ERV Sizing',
    skipLabel: 'Skip (low outdoor air)',
    renderData: (data) => {
      const d = data as WizardStageData['erv'];
      if (!d) return <p className="text-sm text-muted-foreground">No ERV units sized yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="ERV Units" value={`${d.ervUnitsCount} units`} />
          <DataCard label="Recovery Effectiveness" value={`${(d.recoveryEffectiveness * 100).toFixed(0)}%`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Outdoor air CFM: ${prev.ventilation?.outdoorAirCfm?.toLocaleString() || '—'} CFM`,
      'Climate zone for effectiveness',
    ],
  },
  plant: {
    title: 'Plant Equipment',
    description: 'Size central plant equipment including chillers, boilers, and cooling towers.',
    icon: Flame,
    dataKey: 'plant',
    toolPath: '/design/chw-plant',
    primaryAction: 'Open Plant Design',
    skipLabel: 'Skip (no central plant)',
    renderData: (data) => {
      const d = data as WizardStageData['plant'];
      if (!d) return <p className="text-sm text-muted-foreground">No plant equipment configured yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="CHW Plant" value={d.hasChwPlant ? 'Configured' : 'None'} />
          <DataCard label="HW Plant" value={d.hasHwPlant ? 'Configured' : 'None'} />
          <DataCard label="Total Capacity" value={`${d.totalPlantCapacity.toFixed(0)} tons`} />
        </div>
      );
    },
    getAutoPopulationInfo: (prev) => [
      `Total cooling load: ${prev.equipment?.totalCapacityTons?.toFixed(1) || '—'} tons`,
      'Diversity factors from equipment selection',
    ],
  },
  compliance: {
    title: 'Compliance Verification',
    description: 'Verify design compliance with ASHRAE standards, energy codes, and project requirements.',
    icon: ClipboardCheck,
    dataKey: 'compliance',
    toolPath: '/design/validation', // Phase 8: Fixed path
    primaryAction: 'Open Compliance Dashboard',
    renderData: (data) => {
      const d = data as WizardStageData['compliance'];
      if (!d) return <p className="text-sm text-muted-foreground">No compliance checks yet</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <DataCard label="Checks Passed" value={`${d.checksPassed}/${d.checksTotal}`} />
          <DataCard 
            label="Compliance" 
            value={`${d.compliancePercent}%`} 
            variant={d.compliancePercent >= 80 ? 'success' : d.compliancePercent >= 50 ? 'warning' : 'error'}
          />
        </div>
      );
    },
    getAutoPopulationInfo: () => [
      'Cross-validates all previous stage data',
      'Checks equipment vs load sizing',
      'Validates ventilation requirements',
    ],
  },
};

function DataCard({ 
  label, 
  value, 
  variant = 'default' 
}: { 
  label: string; 
  value: string; 
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${
        variant === 'success' ? 'text-green-600 dark:text-green-400' :
        variant === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
        variant === 'error' ? 'text-red-600 dark:text-red-400' :
        ''
      }`}>
        {value}
      </p>
    </div>
  );
}

export function WizardStageContent({
  stageId,
  projectId,
  stageData,
  selectedZoneIds,
  onOpenTool,
  onNext,
  onSkip,
  isLastStage,
}: WizardStageContentProps) {
  const config = STAGE_CONFIGS[stageId];
  const stage = DESIGN_WORKFLOW_STAGES.find(s => s.id === stageId);
  const Icon = config.icon;
  const currentData = stageData[config.dataKey];
  const autoPopInfo = config.getAutoPopulationInfo(stageData);

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-muted-foreground mt-1">{config.description}</p>
        </div>
      </div>

      {/* Auto-Population Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Auto-Populated Data
          </CardTitle>
          <CardDescription>
            The following data will be pre-filled from previous stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {autoPopInfo.map((info, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <Badge variant="outline" className="h-5 px-1.5">→</Badge>
                {info}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Current Stage Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Progress</CardTitle>
          <CardDescription>
            Data saved for this stage ({selectedZoneIds.length} zones selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.renderData(currentData)}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          size="lg" 
          onClick={() => onOpenTool(stageId)}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {config.primaryAction}
        </Button>
        
        {!isLastStage && (
          <>
            <Button 
              size="lg" 
              variant="outline"
              onClick={onNext}
              className="flex-1"
            >
              Continue to Next Stage
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {config.skipLabel && (
              <Button 
                size="lg" 
                variant="ghost"
                onClick={onSkip}
              >
                {config.skipLabel}
              </Button>
            )}
          </>
        )}

        {isLastStage && (
          <Button 
            size="lg" 
            variant="default"
            onClick={onNext}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Complete Design Workflow
          </Button>
        )}
      </div>
    </div>
  );
}
