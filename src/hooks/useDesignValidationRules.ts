import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  VALIDATION_RULES, 
  ValidationRule, 
  ValidationCheck,
  ValidationCategory,
  ValidationSeverity,
  getEnabledRules,
  calculateValidationScore,
  groupChecksByCategory,
  getCategoryInfo,
  getSeverityInfo
} from '@/lib/design-validation-rules';

// Helper to fetch table data with type-breaking to avoid TS2589
async function fetchTableData(tableName: string, projectId?: string): Promise<any[]> {
  const query = (supabase as any).from(tableName).select('*');
  const result = projectId ? await query.eq('project_id', projectId) : await query;
  return result.data || [];
}

export interface ValidationContext {
  projectId: string;
  loadCalculations: any[];
  equipmentSelections: any[];
  ductSystems: any[];
  ductSegments: any[];
  pipeSystems: any[];
  pipeSegments: any[];
  terminalUnits: any[];
  ahuConfigurations: any[];
  diffuserGrilles: any[];
  acousticCalculations: any[];
  ventilationCalculations: any[];
  zones: any[];
  // HW System additions
  boilerSelections: any[];
  hotWaterPlants: any[];
  pumpSelections: any[];
  // Cooling system additions
  chillerSelections: any[];
  coolingTowerSelections: any[];
  ervSizingCalculations: any[];
}

export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  status: 'executed' | 'skipped' | 'error';
  skipReason?: string;
  checks: ValidationCheck[];
  executionTimeMs: number;
}

export interface ValidationRulesResult {
  totalRules: number;
  executedRules: number;
  skippedRules: number;
  errorRules: number;
  ruleResults: RuleExecutionResult[];
  allChecks: ValidationCheck[];
  score: ReturnType<typeof calculateValidationScore>;
  checksByCategory: Record<ValidationCategory, ValidationCheck[]>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// Rule executor functions - map each rule ID to its implementation
const RULE_EXECUTORS: Record<string, (ctx: ValidationContext) => ValidationCheck[]> = {
  
  // ===== AIRFLOW RULES =====
  checkSupplyAirflowVsLoad: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.loadCalculations.forEach(calc => {
      const zone = ctx.zones.find(z => z.id === calc.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const requiredCfm = calc.supply_airflow_cfm || 0;
      
      // Find duct segments serving this zone
      const servingSegments = ctx.ductSegments.filter(seg => seg.zone_id === calc.zone_id);
      const actualCfm = servingSegments.reduce((sum, seg) => sum + (seg.cfm || 0), 0);
      
      if (requiredCfm > 0) {
        const variance = Math.abs(actualCfm - requiredCfm) / requiredCfm * 100;
        checks.push({
          id: `supply-airflow-${calc.id}`,
          ruleId: 'checkSupplyAirflowVsLoad',
          category: 'airflow',
          name: `Supply Airflow - ${zoneName}`,
          description: 'Verify supply airflow matches load calculation requirements',
          severity: variance > 15 ? 'critical' : variance > 10 ? 'warning' : 'info',
          status: variance <= 10 ? 'pass' : variance <= 15 ? 'warning' : 'fail',
          measured: actualCfm,
          expected: requiredCfm,
          tolerance: '±10%',
          recommendation: variance > 10 ? `Adjust duct sizing for ${zoneName} to deliver ${requiredCfm} CFM` : undefined,
          affectedItems: [zoneName]
        });
      }
    });
    return checks;
  },

  checkReturnAirflowBalance: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ahuConfigurations.forEach(ahu => {
      const supplyCfm = ahu.design_cfm || 0;
      const returnCfm = ahu.return_air_cfm || 0;
      const outdoorCfm = ahu.outdoor_air_cfm || 0;
      const expectedReturn = supplyCfm - outdoorCfm;
      
      if (supplyCfm > 0 && returnCfm > 0) {
        const variance = Math.abs(returnCfm - expectedReturn) / expectedReturn * 100;
        checks.push({
          id: `return-balance-${ahu.id}`,
          ruleId: 'checkReturnAirflowBalance',
          category: 'airflow',
          name: `Return Air Balance - ${ahu.ahu_tag}`,
          description: 'Verify return airflow balances with supply minus outdoor air',
          severity: variance > 10 ? 'warning' : 'info',
          status: variance <= 5 ? 'pass' : variance <= 10 ? 'warning' : 'fail',
          measured: returnCfm,
          expected: expectedReturn,
          tolerance: '±5%',
          affectedItems: [ahu.ahu_tag]
        });
      }
    });
    return checks;
  },

  checkOutdoorAirMinimum: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ahuConfigurations.forEach(ahu => {
      const supplyCfm = ahu.design_cfm || 0;
      const outdoorCfm = ahu.outdoor_air_cfm || 0;
      const minOaPercent = ahu.min_oa_percent || 0;
      
      if (supplyCfm > 0) {
        const actualOaPercent = (outdoorCfm / supplyCfm) * 100;
        const requiredMinOa = minOaPercent > 0 ? minOaPercent : 15; // Default 15% minimum
        
        checks.push({
          id: `outdoor-air-${ahu.id}`,
          ruleId: 'checkOutdoorAirMinimum',
          category: 'ventilation',
          name: `Outdoor Air Minimum - ${ahu.ahu_tag}`,
          description: 'Verify outdoor air meets minimum ventilation requirements per ASHRAE 62.1',
          severity: actualOaPercent < requiredMinOa ? 'critical' : 'info',
          status: actualOaPercent >= requiredMinOa ? 'pass' : 'fail',
          measured: `${actualOaPercent.toFixed(1)}%`,
          expected: `≥${requiredMinOa}%`,
          codeReference: 'ASHRAE 62.1',
          recommendation: actualOaPercent < requiredMinOa ? 
            `Increase outdoor air from ${outdoorCfm} CFM to at least ${Math.ceil(supplyCfm * requiredMinOa / 100)} CFM` : undefined,
          affectedItems: [ahu.ahu_tag]
        });
      }
    });
    return checks;
  },

  checkDuctVelocityLimits: (ctx) => {
    const checks: ValidationCheck[] = [];
    const maxVelocities: Record<string, number> = {
      main: 2000,
      branch: 1500,
      runout: 800
    };
    
    ctx.ductSegments.forEach(seg => {
      const velocity = seg.velocity_fpm || 0;
      const segType = seg.segment_name?.toLowerCase().includes('main') ? 'main' :
                      seg.segment_name?.toLowerCase().includes('branch') ? 'branch' : 'runout';
      const maxVel = maxVelocities[segType];
      
      if (velocity > 0) {
        checks.push({
          id: `duct-velocity-${seg.id}`,
          ruleId: 'checkDuctVelocityLimits',
          category: 'airflow',
          name: `Duct Velocity - ${seg.segment_name}`,
          description: 'Verify duct velocity within acceptable limits for noise control',
          severity: velocity > maxVel * 1.2 ? 'critical' : velocity > maxVel ? 'warning' : 'info',
          status: velocity <= maxVel ? 'pass' : velocity <= maxVel * 1.1 ? 'warning' : 'fail',
          measured: `${velocity} FPM`,
          expected: `≤${maxVel} FPM`,
          codeReference: 'ASHRAE Fundamentals',
          affectedItems: [seg.segment_name]
        });
      }
    });
    return checks;
  },

  // ===== CAPACITY RULES =====
  checkCoolingCapacityMatch: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.loadCalculations.forEach(calc => {
      const zone = ctx.zones.find(z => z.id === calc.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const requiredTons = (calc.total_cooling_load_btu || 0) / 12000;
      
      // Find equipment serving this zone
      const equipment = ctx.equipmentSelections.find(eq => eq.zone_id === calc.zone_id);
      const installedTons = equipment?.cooling_capacity_tons || 0;
      
      if (requiredTons > 0) {
        const oversizing = ((installedTons - requiredTons) / requiredTons) * 100;
        checks.push({
          id: `cooling-capacity-${calc.id}`,
          ruleId: 'checkCoolingCapacityMatch',
          category: 'capacity',
          name: `Cooling Capacity - ${zoneName}`,
          description: 'Verify installed cooling capacity matches load requirements',
          severity: oversizing > 25 || oversizing < -5 ? 'warning' : 'info',
          status: oversizing >= -5 && oversizing <= 15 ? 'pass' : 
                  oversizing >= -5 && oversizing <= 25 ? 'warning' : 'fail',
          measured: `${installedTons.toFixed(1)} tons`,
          expected: `${requiredTons.toFixed(1)} tons`,
          tolerance: '-5% to +15%',
          recommendation: oversizing > 25 ? 'Equipment oversized - consider downsizing for efficiency' :
                         oversizing < -5 ? 'Equipment undersized - may not meet peak loads' : undefined,
          affectedItems: [zoneName]
        });
      }
    });
    return checks;
  },

  checkHeatingCapacityMatch: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.loadCalculations.forEach(calc => {
      const zone = ctx.zones.find(z => z.id === calc.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const requiredMbh = (calc.total_heating_load_btu || 0) / 1000;
      
      const equipment = ctx.equipmentSelections.find(eq => eq.zone_id === calc.zone_id);
      const installedMbh = equipment?.heating_capacity_mbh || 0;
      
      if (requiredMbh > 0 && installedMbh > 0) {
        const oversizing = ((installedMbh - requiredMbh) / requiredMbh) * 100;
        checks.push({
          id: `heating-capacity-${calc.id}`,
          ruleId: 'checkHeatingCapacityMatch',
          category: 'capacity',
          name: `Heating Capacity - ${zoneName}`,
          description: 'Verify installed heating capacity matches load requirements',
          severity: oversizing > 30 || oversizing < -5 ? 'warning' : 'info',
          status: oversizing >= -5 && oversizing <= 20 ? 'pass' : 
                  oversizing >= -5 && oversizing <= 30 ? 'warning' : 'fail',
          measured: `${installedMbh.toFixed(1)} MBH`,
          expected: `${requiredMbh.toFixed(1)} MBH`,
          tolerance: '-5% to +20%',
          affectedItems: [zoneName]
        });
      }
    });
    return checks;
  },

  // ===== EQUIPMENT RULES =====
  checkFanStaticPressure: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ductSystems.forEach(system => {
      const criticalPathPressure = system.critical_path_pressure_pa || 0;
      const systemStaticPressure = system.system_static_pressure_pa || 0;
      
      if (criticalPathPressure > 0) {
        const safetyFactor = 1.1; // 10% safety margin
        const requiredPressure = criticalPathPressure * safetyFactor;
        
        checks.push({
          id: `fan-static-${system.id}`,
          ruleId: 'checkFanStaticPressure',
          category: 'equipment',
          name: `Fan Static Pressure - ${system.system_name}`,
          description: 'Verify fan can overcome system pressure drop with safety margin',
          severity: systemStaticPressure < requiredPressure ? 'warning' : 'info',
          status: systemStaticPressure >= requiredPressure ? 'pass' : 'fail',
          measured: `${systemStaticPressure.toFixed(0)} Pa`,
          expected: `≥${requiredPressure.toFixed(0)} Pa`,
          tolerance: '+10% safety',
          affectedItems: [system.system_name]
        });
      }
    });
    return checks;
  },

  checkPumpHead: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.pipeSystems.forEach(system => {
      const criticalPathHead = system.critical_path_head_m || 0;
      const pumpHead = system.pump_head_m || 0;
      
      if (criticalPathHead > 0 && pumpHead > 0) {
        const safetyFactor = 1.15;
        const requiredHead = criticalPathHead * safetyFactor;
        
        checks.push({
          id: `pump-head-${system.id}`,
          ruleId: 'checkPumpHead',
          category: 'hydronic',
          name: `Pump Head - ${system.system_name}`,
          description: 'Verify pump head exceeds system pressure drop',
          severity: pumpHead < requiredHead ? 'warning' : 'info',
          status: pumpHead >= requiredHead ? 'pass' : 'fail',
          measured: `${pumpHead.toFixed(1)} m`,
          expected: `≥${requiredHead.toFixed(1)} m`,
          tolerance: '+15% safety',
          affectedItems: [system.system_name]
        });
      }
    });
    return checks;
  },

  // ===== ACOUSTIC RULES =====
  checkNCRating: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.acousticCalculations.forEach(calc => {
      const zone = ctx.zones.find(z => z.id === calc.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const calculatedNc = calc.calculated_nc || 0;
      const targetNc = calc.target_nc || 35;
      
      checks.push({
        id: `nc-rating-${calc.id}`,
        ruleId: 'checkNCRating',
        category: 'acoustic',
        name: `NC Rating - ${zoneName}`,
        description: 'Verify calculated NC meets target for space type',
        severity: calculatedNc > targetNc + 5 ? 'critical' : calculatedNc > targetNc ? 'warning' : 'info',
        status: calc.meets_target ? 'pass' : calculatedNc <= targetNc + 5 ? 'warning' : 'fail',
        measured: `NC-${calculatedNc}`,
        expected: `≤NC-${targetNc}`,
        codeReference: 'ASHRAE Applications Ch. 48',
        affectedItems: [zoneName]
      });
    });
    return checks;
  },

  checkDiffuserNoise: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.diffuserGrilles.forEach(diff => {
      const zone = ctx.zones.find(z => z.id === diff.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const noiseNc = diff.noise_nc || 0;
      const targetNc = 35; // Default target
      
      if (noiseNc > 0) {
        checks.push({
          id: `diffuser-noise-${diff.id}`,
          ruleId: 'checkDiffuserNoise',
          category: 'acoustic',
          name: `Diffuser Noise - ${diff.model || diff.terminal_type}`,
          description: 'Verify diffuser noise contribution within acceptable limits',
          severity: noiseNc > targetNc ? 'warning' : 'info',
          status: noiseNc <= targetNc - 5 ? 'pass' : noiseNc <= targetNc ? 'warning' : 'fail',
          measured: `NC-${noiseNc}`,
          expected: `≤NC-${targetNc - 5}`,
          affectedItems: [zoneName, diff.model || 'Diffuser']
        });
      }
    });
    return checks;
  },

  // ===== SIZING RULES =====
  checkTerminalUnitSizing: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.terminalUnits.forEach(tu => {
      const zone = ctx.zones.find(z => z.id === tu.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const loadCalc = ctx.loadCalculations.find(lc => lc.zone_id === tu.zone_id);
      
      if (loadCalc) {
        const requiredCfm = loadCalc.supply_airflow_cfm || 0;
        const tuMaxCfm = tu.max_airflow_cfm || 0;
        const tuMinCfm = tu.min_airflow_cfm || 0;
        
        if (requiredCfm > 0 && tuMaxCfm > 0) {
          const isProperlySize = requiredCfm <= tuMaxCfm && requiredCfm >= tuMinCfm * 1.2;
          checks.push({
            id: `terminal-sizing-${tu.id}`,
            ruleId: 'checkTerminalUnitSizing',
            category: 'sizing',
            name: `Terminal Unit - ${tu.tag || zoneName}`,
            description: 'Verify terminal unit airflow range covers zone requirements',
            severity: !isProperlySize ? 'warning' : 'info',
            status: isProperlySize ? 'pass' : 'fail',
            measured: `${tuMinCfm}-${tuMaxCfm} CFM`,
            expected: `Range including ${requiredCfm} CFM`,
            affectedItems: [tu.tag || zoneName]
          });
        }
      }
    });
    return checks;
  },

  checkDuctSizing: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ductSegments.forEach(seg => {
      const velocity = seg.velocity_fpm || 0;
      const cfm = seg.cfm || 0;
      
      // Check if friction rate is within acceptable limits
      const frictionRate = seg.friction_loss_per_100ft || 0;
      const maxFriction = 0.1; // in. w.g. per 100 ft
      
      if (frictionRate > 0) {
        checks.push({
          id: `duct-sizing-${seg.id}`,
          ruleId: 'checkDuctSizing',
          category: 'sizing',
          name: `Duct Sizing - ${seg.segment_name}`,
          description: 'Verify duct sized for acceptable friction rate',
          severity: frictionRate > maxFriction * 1.5 ? 'warning' : 'info',
          status: frictionRate <= maxFriction ? 'pass' : 
                  frictionRate <= maxFriction * 1.25 ? 'warning' : 'fail',
          measured: `${frictionRate.toFixed(3)} in/100ft`,
          expected: `≤${maxFriction} in/100ft`,
          codeReference: 'ASHRAE Fundamentals',
          affectedItems: [seg.segment_name]
        });
      }
    });
    return checks;
  },

  // ===== LINKAGE RULES =====
  checkZoneEquipmentLinkage: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.zones.forEach(zone => {
      const hasLoadCalc = ctx.loadCalculations.some(lc => lc.zone_id === zone.id);
      const hasEquipment = ctx.equipmentSelections.some(eq => eq.zone_id === zone.id);
      
      if (hasLoadCalc && !hasEquipment) {
        checks.push({
          id: `zone-equip-link-${zone.id}`,
          ruleId: 'checkZoneEquipmentLinkage',
          category: 'linkage',
          name: `Equipment Linkage - ${zone.name}`,
          description: 'Zone has load calculation but no equipment selected',
          severity: 'warning',
          status: 'fail',
          recommendation: 'Select equipment for this zone based on load calculation',
          affectedItems: [zone.name]
        });
      }
    });
    return checks;
  },

  checkAHUZoneLinkage: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ahuConfigurations.forEach(ahu => {
      // Check if AHU has zones linked via duct systems
      const linkedZones = ctx.ductSystems
        .filter(ds => ds.ahu_configuration_id === ahu.id)
        .flatMap(ds => ctx.ductSegments.filter(seg => seg.duct_system_id === ds.id))
        .map(seg => seg.zone_id)
        .filter(Boolean);
      
      const uniqueZones = [...new Set(linkedZones)];
      
      checks.push({
        id: `ahu-zone-link-${ahu.id}`,
        ruleId: 'checkAHUZoneLinkage',
        category: 'linkage',
        name: `AHU Zone Linkage - ${ahu.ahu_tag}`,
        description: 'Verify AHU is properly linked to zones via duct distribution',
        severity: uniqueZones.length === 0 ? 'warning' : 'info',
        status: uniqueZones.length > 0 ? 'pass' : 'fail',
        measured: `${uniqueZones.length} zones`,
        recommendation: uniqueZones.length === 0 ? 
          'Create duct system and link to zones' : undefined,
        affectedItems: [ahu.ahu_tag]
      });
    });
    return checks;
  },

  // ===== CODE COMPLIANCE RULES =====
  checkASHRAE901Compliance: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ahuConfigurations.forEach(ahu => {
      const isCompliant = ahu.ashrae_90_1_compliant === true;
      
      checks.push({
        id: `ashrae-901-${ahu.id}`,
        ruleId: 'checkASHRAE901Compliance',
        category: 'code_compliance',
        name: `ASHRAE 90.1 - ${ahu.ahu_tag}`,
        description: 'Verify AHU configuration meets energy efficiency requirements',
        severity: !isCompliant ? 'warning' : 'info',
        status: isCompliant ? 'pass' : 'warning',
        codeReference: 'ASHRAE 90.1-2019',
        recommendation: !isCompliant ? 
          'Review economizer, fan power, and control requirements' : undefined,
        affectedItems: [ahu.ahu_tag]
      });
    });
    return checks;
  },

  checkASHRAE621Compliance: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ahuConfigurations.forEach(ahu => {
      const isCompliant = ahu.ashrae_62_1_compliant === true;
      
      checks.push({
        id: `ashrae-621-${ahu.id}`,
        ruleId: 'checkASHRAE621Compliance',
        category: 'code_compliance',
        name: `ASHRAE 62.1 - ${ahu.ahu_tag}`,
        description: 'Verify ventilation rates meet minimum requirements',
        severity: !isCompliant ? 'critical' : 'info',
        status: isCompliant ? 'pass' : 'fail',
        codeReference: 'ASHRAE 62.1-2019',
        recommendation: !isCompliant ? 
          'Verify outdoor air rates for all served zones' : undefined,
        affectedItems: [ahu.ahu_tag]
      });
    });
    return checks;
  },

  // ===== HYDRONIC RULES =====
  checkPipeVelocityLimits: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.pipeSegments?.forEach(seg => {
      const velocity = seg.velocity_fps || 0;
      const maxVelocity = seg.pipe_material === 'copper' ? 8 : 10; // fps
      
      if (velocity > 0) {
        checks.push({
          id: `pipe-velocity-${seg.id}`,
          ruleId: 'checkPipeVelocityLimits',
          category: 'hydronic',
          name: `Pipe Velocity - ${seg.segment_name}`,
          description: 'Verify pipe velocity within erosion limits',
          severity: velocity > maxVelocity ? 'warning' : 'info',
          status: velocity <= maxVelocity ? 'pass' : 'fail',
          measured: `${velocity.toFixed(1)} fps`,
          expected: `≤${maxVelocity} fps`,
          affectedItems: [seg.segment_name]
        });
      }
    });
    return checks;
  },

  checkWaterFlowBalance: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.pipeSystems.forEach(system => {
      const designFlow = system.design_flow_gpm || 0;
      const actualFlow = system.total_flow_gpm || 0;
      
      if (designFlow > 0 && actualFlow > 0) {
        const variance = Math.abs(actualFlow - designFlow) / designFlow * 100;
        checks.push({
          id: `water-balance-${system.id}`,
          ruleId: 'checkWaterFlowBalance',
          category: 'hydronic',
          name: `Water Flow Balance - ${system.system_name}`,
          description: 'Verify hydronic system flow matches design',
          severity: variance > 10 ? 'warning' : 'info',
          status: variance <= 5 ? 'pass' : variance <= 10 ? 'warning' : 'fail',
          measured: `${actualFlow.toFixed(1)} GPM`,
          expected: `${designFlow.toFixed(1)} GPM`,
          tolerance: '±5%',
          affectedItems: [system.system_name]
        });
      }
    });
    return checks;
  },

  // Valve Authority Check - NEW
  checkValveAuthority: (ctx) => {
    const checks: ValidationCheck[] = [];
    // Check pump selections for valve authority data
    ctx.pumpSelections?.forEach((pump: any) => {
      const valveAuthority = pump.valve_authority || pump.authority || 0;
      if (valveAuthority > 0) {
        const authorityPercent = valveAuthority * 100;
        checks.push({
          id: `valve-authority-${pump.id}`,
          ruleId: 'checkValveAuthority',
          category: 'hydronic',
          name: `Valve Authority - ${pump.pump_tag || pump.name || 'Pump'}`,
          description: 'Control valve authority should be ≥50% for stable modulation',
          severity: valveAuthority < 0.3 ? 'critical' : valveAuthority < 0.5 ? 'warning' : 'info',
          status: valveAuthority >= 0.5 ? 'pass' : valveAuthority >= 0.3 ? 'warning' : 'fail',
          measured: `${authorityPercent.toFixed(0)}%`,
          expected: '≥50%',
          codeReference: 'ASHRAE Fundamentals',
          recommendation: valveAuthority < 0.5 ? 
            'Low valve authority causes hunting - consider sizing valve for higher ΔP or increasing system resistance' : undefined,
          affectedItems: [pump.pump_tag || pump.name || 'Pump']
        });
      }
    });
    return checks;
  },

  // Boiler Efficiency Check - NEW
  checkBoilerEfficiency: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.boilerSelections?.forEach((boiler: any) => {
      const afue = boiler.afue || boiler.thermal_efficiency || 0;
      const minAFUE = 80; // ASHRAE 90.1 minimum for commercial boilers
      
      if (afue > 0) {
        checks.push({
          id: `boiler-efficiency-${boiler.id}`,
          ruleId: 'checkBoilerEfficiency',
          category: 'hydronic',
          name: `Boiler Efficiency - ${boiler.boiler_tag || boiler.selection_name}`,
          description: 'Verify boiler meets minimum efficiency requirements per ASHRAE 90.1',
          severity: afue < minAFUE ? 'critical' : afue < 85 ? 'warning' : 'info',
          status: afue >= minAFUE ? 'pass' : 'fail',
          measured: `${afue.toFixed(1)}% AFUE`,
          expected: `≥${minAFUE}% AFUE`,
          codeReference: 'ASHRAE 90.1-2019 Table 6.8.1-6',
          affectedItems: [boiler.boiler_tag || boiler.selection_name]
        });
      }
    });
    return checks;
  },

  // Heat Rejection Balance Check - NEW
  checkHeatRejectionBalance: (ctx) => {
    const checks: ValidationCheck[] = [];
    
    // Sum chiller capacities
    const totalChillerTons = ctx.chillerSelections?.reduce(
      (sum: number, c: any) => sum + (c.rated_capacity_tons || 0), 0
    ) || 0;
    
    // Sum cooling tower capacities
    const totalTowerTons = ctx.coolingTowerSelections?.reduce(
      (sum: number, t: any) => sum + (t.total_capacity_tons || 0), 0
    ) || 0;
    
    if (totalChillerTons > 0 && totalTowerTons > 0) {
      // Cooling tower should be ~115% of chiller capacity for heat rejection
      const requiredTowerTons = totalChillerTons * 1.15;
      const ratio = totalTowerTons / requiredTowerTons;
      
      checks.push({
        id: 'heat-rejection-balance',
        ruleId: 'checkHeatRejectionBalance',
        category: 'hydronic',
        name: 'Heat Rejection Balance',
        description: 'Verify cooling tower capacity covers chiller heat rejection (chiller load + compressor heat)',
        severity: ratio < 0.95 ? 'critical' : ratio < 1.0 ? 'warning' : 'info',
        status: ratio >= 1.0 ? 'pass' : ratio >= 0.95 ? 'warning' : 'fail',
        measured: `${totalTowerTons.toFixed(0)} tons tower capacity`,
        expected: `≥${requiredTowerTons.toFixed(0)} tons (115% of ${totalChillerTons.toFixed(0)} tons chiller)`,
        recommendation: ratio < 1.0 ? 
          'Cooling tower undersized for heat rejection - add capacity or verify chiller selection' : undefined,
        affectedItems: ['CHW Plant', 'Cooling Tower']
      });
    }
    
    return checks;
  },

  // ERV Effectiveness Check - NEW
  checkERVEffectiveness: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ervSizingCalculations?.forEach((erv: any) => {
      const sensibleEff = erv.sensible_effectiveness || erv.sensible_recovery_efficiency || 0;
      const minEffectiveness = 0.50; // 50% minimum for energy recovery
      
      if (sensibleEff > 0) {
        checks.push({
          id: `erv-effectiveness-${erv.id}`,
          ruleId: 'checkERVEffectiveness',
          category: 'ventilation',
          name: `ERV Effectiveness - ${erv.name || 'ERV'}`,
          description: 'Verify energy recovery ventilator meets minimum effectiveness',
          severity: sensibleEff < minEffectiveness ? 'warning' : 'info',
          status: sensibleEff >= minEffectiveness ? 'pass' : 'warning',
          measured: `${(sensibleEff * 100).toFixed(0)}% sensible effectiveness`,
          expected: `≥${minEffectiveness * 100}%`,
          codeReference: 'ASHRAE 90.1-2019 Section 6.5.6',
          affectedItems: [erv.name || 'ERV']
        });
      }
    });
    return checks;
  },

  // ===== VENTILATION RULES =====
  checkVentilationEffectiveness: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.ventilationCalculations?.forEach(calc => {
      const zone = ctx.zones.find(z => z.id === calc.zone_id);
      const zoneName = zone?.name || 'Unknown Zone';
      const effectiveness = calc.ventilation_effectiveness || 1.0;
      
      checks.push({
        id: `vent-effectiveness-${calc.id}`,
        ruleId: 'checkVentilationEffectiveness',
        category: 'ventilation',
        name: `Ventilation Effectiveness - ${zoneName}`,
        description: 'Verify zone ventilation effectiveness factor is appropriate',
        severity: effectiveness < 0.8 ? 'warning' : 'info',
        status: effectiveness >= 0.8 ? 'pass' : 'warning',
        measured: effectiveness.toFixed(2),
        expected: '≥0.8',
        codeReference: 'ASHRAE 62.1',
        affectedItems: [zoneName]
      });
    });
    return checks;
  },

  checkExhaustBalance: (ctx) => {
    const checks: ValidationCheck[] = [];
    ctx.zones.forEach(zone => {
      const loadCalc = ctx.loadCalculations.find(lc => lc.zone_id === zone.id);
      if (loadCalc) {
        const supplyCfm = loadCalc.supply_airflow_cfm || 0;
        const exhaustCfm = loadCalc.exhaust_airflow_cfm || 0;
        
        if (exhaustCfm > 0) {
          const pressurization = supplyCfm - exhaustCfm;
          checks.push({
            id: `exhaust-balance-${zone.id}`,
            ruleId: 'checkExhaustBalance',
            category: 'ventilation',
            name: `Exhaust Balance - ${zone.name}`,
            description: 'Verify zone pressurization is appropriate',
            severity: pressurization < 0 ? 'warning' : 'info',
            status: pressurization >= 0 ? 'pass' : 'warning',
            measured: `${pressurization} CFM (${pressurization >= 0 ? 'positive' : 'negative'})`,
            expected: 'Positive pressurization',
            recommendation: pressurization < 0 ? 
              'Zone is negatively pressurized - may cause infiltration issues' : undefined,
            affectedItems: [zone.name]
          });
        }
      }
    });
    return checks;
  }
};

// Execute a single rule
function executeRule(rule: ValidationRule, context: ValidationContext): RuleExecutionResult {
  const startTime = performance.now();
  const executor = RULE_EXECUTORS[rule.checkFunction];
  
  if (!executor) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      status: 'skipped',
      skipReason: 'No executor implemented',
      checks: [],
      executionTimeMs: 0
    };
  }

  try {
    const checks = executor(context);
    const executionTimeMs = performance.now() - startTime;
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      status: checks.length > 0 ? 'executed' : 'skipped',
      skipReason: checks.length === 0 ? 'No applicable data' : undefined,
      checks,
      executionTimeMs
    };
  } catch (error) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      status: 'error',
      skipReason: error instanceof Error ? error.message : 'Unknown error',
      checks: [],
      executionTimeMs: performance.now() - startTime
    };
  }
}

export function useDesignValidationRules(projectId: string | null): ValidationRulesResult {
  const { data: organization } = useOrganization();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['design-validation-rules', projectId, organization?.id],
    queryFn: async () => {
      if (!projectId) {
        return null;
      }

      // Fetch data using helper to avoid TypeScript recursion limits
      const [
        loadCalculations,
        equipmentSelections,
        ductSystems,
        ductSegments,
        pipeSystems,
        ahuConfigurations,
        diffuserGrilles,
        acousticCalculations,
        ventilationCalculations,
        zones,
        boilerSelections,
        hotWaterPlants,
        pumpSelections,
        chillerSelections,
        coolingTowerSelections,
        ervSizingCalculations,
      ] = await Promise.all([
        fetchTableData('load_calculations', projectId),
        fetchTableData('equipment_selections', projectId),
        fetchTableData('duct_systems', projectId),
        fetchTableData('duct_segments'),
        fetchTableData('pipe_systems', projectId),
        fetchTableData('ahu_configurations', projectId),
        fetchTableData('diffuser_grilles'),
        fetchTableData('acoustic_calculations', projectId),
        fetchTableData('ventilation_calculations', projectId),
        fetchTableData('zones', projectId),
        fetchTableData('boiler_selections', projectId),
        fetchTableData('hot_water_plants', projectId),
        fetchTableData('pump_selections', projectId),
        fetchTableData('chiller_selections', projectId),
        fetchTableData('cooling_tower_selections', projectId),
        fetchTableData('erv_sizing_calculations', projectId),
      ]);

      const context: ValidationContext = {
        projectId,
        loadCalculations,
        equipmentSelections,
        ductSystems,
        ductSegments,
        pipeSystems,
        pipeSegments: [],
        terminalUnits: [],
        ahuConfigurations,
        diffuserGrilles,
        acousticCalculations,
        ventilationCalculations,
        zones,
        boilerSelections,
        hotWaterPlants,
        pumpSelections,
        chillerSelections,
        coolingTowerSelections,
        ervSizingCalculations,
      };

      // Execute all enabled rules
      const enabledRules = getEnabledRules();
      const ruleResults: RuleExecutionResult[] = enabledRules.map(rule => executeRule(rule, context));

      // Aggregate all checks
      const allChecks = ruleResults.flatMap(r => r.checks);

      return {
        ruleResults,
        allChecks,
        score: calculateValidationScore(allChecks),
        checksByCategory: groupChecksByCategory(allChecks)
      };
    },
    enabled: !!projectId && !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const enabledRules = getEnabledRules();
  const ruleResults = data?.ruleResults || [];
  
  return {
    totalRules: enabledRules.length,
    executedRules: ruleResults.filter(r => r.status === 'executed').length,
    skippedRules: ruleResults.filter(r => r.status === 'skipped').length,
    errorRules: ruleResults.filter(r => r.status === 'error').length,
    ruleResults,
    allChecks: data?.allChecks || [],
    score: data?.score || { score: 0, passCount: 0, failCount: 0, warningCount: 0, criticalFailures: [] },
    checksByCategory: data?.checksByCategory || {} as Record<ValidationCategory, ValidationCheck[]>,
    isLoading,
    isError,
    refetch
  };
}

// Export utilities for external use
export { VALIDATION_RULES, getCategoryInfo, getSeverityInfo, getEnabledRules };
