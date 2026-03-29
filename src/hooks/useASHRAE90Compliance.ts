import { useMemo } from 'react';
import {
  SAUDI_CITIES,
  SAUDI_CLIMATE_ZONES,
  EFFICIENCY_REQUIREMENTS,
  ECONOMIZER_REQUIREMENTS,
  FAN_POWER_LIMITS,
  PUMP_POWER_LIMITS,
  MANDATORY_REQUIREMENTS,
  getCityClimateZone,
  getEfficiencyRequirement,
  getSECRating,
  type ClimateZone,
  type EfficiencyRequirement,
} from '@/lib/ashrae-90-1-data';

export interface EquipmentForCompliance {
  id: string;
  name: string;
  tag: string;
  category: string;
  capacityKw?: number;
  capacityTons?: number;
  capacityKbtuh?: number;
  cop?: number;
  eer?: number;
  seer?: number;
  iplv?: number;
  ieer?: number;
  hasEconomizer?: boolean;
  manufacturer?: string;
  model?: string;
}

export interface SystemForCompliance {
  id: string;
  name: string;
  systemType: 'vav' | 'cav' | 'doas' | 'fcu' | 'vrf';
  totalCfm?: number;
  fanBhp?: number;
  hasEconomizer?: boolean;
  outdoorAirCfm?: number;
  hasEnergyRecovery?: boolean;
  hasVariableSpeed?: boolean;
}

export interface PumpForCompliance {
  id: string;
  name: string;
  systemType: 'chw' | 'hw' | 'cw';
  flowGpm: number;
  powerKw: number;
  isVariableFlow: boolean;
}

export interface ComplianceCheckResult {
  id: string;
  checkType: 'equipment' | 'system' | 'pump' | 'mandatory';
  itemId: string;
  itemName: string;
  requirement: string;
  requiredValue: string;
  actualValue: string;
  status: 'pass' | 'fail' | 'warning' | 'exempt' | 'unknown';
  notes?: string;
  recommendation?: string;
  reference?: string;
}

export interface ComplianceReport {
  projectName: string;
  cityId: string;
  cityName: string;
  climateZone: ClimateZone;
  codeVersion: string;
  generatedAt: string;
  overallCompliance: 'compliant' | 'non-compliant' | 'partial';
  complianceScore: number;
  summary: {
    totalChecks: number;
    passCount: number;
    failCount: number;
    warningCount: number;
    exemptCount: number;
    unknownCount: number;
  };
  equipmentChecks: ComplianceCheckResult[];
  systemChecks: ComplianceCheckResult[];
  pumpChecks: ComplianceCheckResult[];
  mandatoryChecks: ComplianceCheckResult[];
  recommendations: string[];
}

interface UseASHRAE90ComplianceProps {
  projectName: string;
  cityId: string;
  equipment: EquipmentForCompliance[];
  systems: SystemForCompliance[];
  pumps: PumpForCompliance[];
  mandatoryFeatures?: Record<string, boolean>;
}

export function useASHRAE90Compliance({
  projectName,
  cityId,
  equipment,
  systems,
  pumps,
  mandatoryFeatures = {},
}: UseASHRAE90ComplianceProps) {
  const climateZone = useMemo(() => getCityClimateZone(cityId), [cityId]);
  const city = useMemo(() => SAUDI_CITIES.find(c => c.id === cityId), [cityId]);

  const equipmentChecks = useMemo((): ComplianceCheckResult[] => {
    if (!climateZone) return [];

    const checks: ComplianceCheckResult[] = [];

    equipment.forEach(equip => {
      // Determine category and capacity
      let category = equip.category;
      let capacityValue = equip.capacityTons || equip.capacityKbtuh || (equip.capacityKw ? equip.capacityKw * 3.412 : 0);
      let capacityUnit: 'tons' | 'kBtu/h' | 'kW' = equip.capacityTons ? 'tons' : 'kBtu/h';

      // Map equipment category to ASHRAE categories
      const categoryMap: Record<string, string> = {
        'chiller': 'chiller',
        'air_cooled_chiller': 'chiller',
        'water_cooled_chiller': 'chiller',
        'package_unit': 'package_unit',
        'rooftop_unit': 'package_unit',
        'rtu': 'package_unit',
        'split_system': 'split_system',
        'split': 'split_system',
        'vrf': 'vrf',
        'vrv': 'vrf',
      };

      const normalizedCategory = categoryMap[category.toLowerCase()] || category;

      // Find applicable requirement
      const requirement = EFFICIENCY_REQUIREMENTS.find(req => {
        if (req.category !== normalizedCategory) return false;
        
        const minOk = req.minCapacity === undefined || capacityValue >= req.minCapacity;
        const maxOk = req.maxCapacity === undefined || capacityValue < req.maxCapacity;
        
        return minOk && maxOk;
      });

      if (!requirement) {
        checks.push({
          id: `equip-${equip.id}-unknown`,
          checkType: 'equipment',
          itemId: equip.id,
          itemName: `${equip.name} (${equip.tag})`,
          requirement: 'Minimum Efficiency',
          requiredValue: 'N/A',
          actualValue: 'Unknown category',
          status: 'unknown',
          notes: `Equipment category "${equip.category}" not found in ASHRAE 90.1 tables`,
        });
        return;
      }

      // Check each efficiency metric
      requirement.requirements.forEach(req => {
        let actualValue: number | undefined;
        let hasValue = false;

        switch (req.metric) {
          case 'cop':
            actualValue = equip.cop;
            hasValue = actualValue !== undefined;
            break;
          case 'eer':
            actualValue = equip.eer;
            hasValue = actualValue !== undefined;
            break;
          case 'seer':
            actualValue = equip.seer;
            hasValue = actualValue !== undefined;
            break;
          case 'iplv':
            actualValue = equip.iplv;
            hasValue = actualValue !== undefined;
            break;
          case 'ieer':
            actualValue = equip.ieer;
            hasValue = actualValue !== undefined;
            break;
        }

        const status = !hasValue ? 'unknown' : 
          (actualValue! >= req.minValue ? 'pass' : 'fail');

        const recommendation = status === 'fail' 
          ? `Select equipment with ${req.metric.toUpperCase()} ≥ ${req.minValue}`
          : undefined;

        checks.push({
          id: `equip-${equip.id}-${req.metric}`,
          checkType: 'equipment',
          itemId: equip.id,
          itemName: `${equip.name} (${equip.tag})`,
          requirement: `Minimum ${req.metric.toUpperCase()} (${req.path})`,
          requiredValue: `≥ ${req.minValue}`,
          actualValue: hasValue ? actualValue!.toFixed(2) : 'Not specified',
          status,
          notes: `ASHRAE 90.1-2022 Table 6.8.1`,
          recommendation,
          reference: 'Section 6.4.1',
        });
      });

      // Check SEC rating for Saudi compliance
      const secRating = getSECRating(equip.seer, equip.eer);
      if (secRating > 0) {
        checks.push({
          id: `equip-${equip.id}-sec`,
          checkType: 'equipment',
          itemId: equip.id,
          itemName: `${equip.name} (${equip.tag})`,
          requirement: 'SEC Energy Rating (Saudi)',
          requiredValue: '≥ 1 Star',
          actualValue: `${secRating} Star${secRating > 1 ? 's' : ''}`,
          status: secRating >= 1 ? 'pass' : 'fail',
          notes: 'Saudi Energy Efficiency Labeling Program',
        });
      }
    });

    return checks;
  }, [equipment, climateZone]);

  const systemChecks = useMemo((): ComplianceCheckResult[] => {
    if (!climateZone) return [];

    const checks: ComplianceCheckResult[] = [];
    const economizerReq = ECONOMIZER_REQUIREMENTS.find(e => e.climateZone === climateZone.ashraeZone);

    systems.forEach(system => {
      // Economizer check
      if (economizerReq) {
        const capacityBtuh = (system.totalCfm || 0) * 1.08 * 20; // Rough capacity estimate
        
        if (economizerReq.required && capacityBtuh >= economizerReq.minCapacityBtuh) {
          checks.push({
            id: `system-${system.id}-economizer`,
            checkType: 'system',
            itemId: system.id,
            itemName: system.name,
            requirement: 'Air Economizer',
            requiredValue: 'Required',
            actualValue: system.hasEconomizer ? 'Yes' : 'No',
            status: system.hasEconomizer ? 'pass' : 'fail',
            notes: economizerReq.notes,
            recommendation: !system.hasEconomizer 
              ? `Add economizer with ${economizerReq.controlType} control (switchpoint: ${economizerReq.dryBulbSwitchpointF}°F)`
              : undefined,
            reference: 'Section 6.5.1',
          });
        } else if (!economizerReq.required) {
          checks.push({
            id: `system-${system.id}-economizer`,
            checkType: 'system',
            itemId: system.id,
            itemName: system.name,
            requirement: 'Air Economizer',
            requiredValue: 'Not Required',
            actualValue: system.hasEconomizer ? 'Provided (voluntary)' : 'Not provided',
            status: 'exempt',
            notes: `Climate Zone ${climateZone.ashraeZone} - economizer not required`,
            reference: 'Section 6.5.1',
          });
        }
      }

      // Fan power check
      const fanLimit = FAN_POWER_LIMITS.find(f => f.systemType === system.systemType);
      if (fanLimit && system.totalCfm && system.fanBhp) {
        const bhpPer1000Cfm = (system.fanBhp / system.totalCfm) * 1000;
        const status = bhpPer1000Cfm <= fanLimit.maxBhpPer1000Cfm ? 'pass' : 'fail';

        checks.push({
          id: `system-${system.id}-fan-power`,
          checkType: 'system',
          itemId: system.id,
          itemName: system.name,
          requirement: 'Fan Power Limit',
          requiredValue: `≤ ${fanLimit.maxBhpPer1000Cfm} bhp/1000 CFM`,
          actualValue: `${bhpPer1000Cfm.toFixed(3)} bhp/1000 CFM`,
          status,
          notes: `${system.systemType.toUpperCase()} system baseline`,
          recommendation: status === 'fail' 
            ? 'Consider higher efficiency fans or pressure drop reduction'
            : undefined,
          reference: 'Section 6.5.3.1',
        });
      }

      // Energy recovery check
      if (system.outdoorAirCfm && system.outdoorAirCfm >= 5000) {
        const oaFraction = system.totalCfm ? system.outdoorAirCfm / system.totalCfm : 0;
        const ervRequired = oaFraction >= 0.7; // Simplified check

        if (ervRequired) {
          checks.push({
            id: `system-${system.id}-erv`,
            checkType: 'system',
            itemId: system.id,
            itemName: system.name,
            requirement: 'Energy Recovery',
            requiredValue: 'Required (OA ≥ 5000 CFM, fraction ≥ 70%)',
            actualValue: system.hasEnergyRecovery ? 'Yes' : 'No',
            status: system.hasEnergyRecovery ? 'pass' : 'fail',
            notes: `OA = ${system.outdoorAirCfm} CFM, ${(oaFraction * 100).toFixed(0)}% of supply`,
            recommendation: !system.hasEnergyRecovery 
              ? 'Add ERV/HRV with ≥50% effectiveness'
              : undefined,
            reference: 'Section 6.5.6.1',
          });
        }
      }

      // Variable speed requirement for large systems
      if (system.systemType === 'vav' && system.totalCfm && system.totalCfm >= 5000) {
        checks.push({
          id: `system-${system.id}-vsd`,
          checkType: 'system',
          itemId: system.id,
          itemName: system.name,
          requirement: 'Variable Speed Drive',
          requiredValue: 'Required for VAV ≥ 5000 CFM',
          actualValue: system.hasVariableSpeed ? 'Yes' : 'No/Unknown',
          status: system.hasVariableSpeed ? 'pass' : (system.hasVariableSpeed === false ? 'fail' : 'unknown'),
          reference: 'Section 6.5.3.2',
        });
      }
    });

    return checks;
  }, [systems, climateZone]);

  const pumpChecks = useMemo((): ComplianceCheckResult[] => {
    const checks: ComplianceCheckResult[] = [];

    pumps.forEach(pump => {
      const flowType = pump.isVariableFlow ? 'variable' : 'constant';
      const limit = PUMP_POWER_LIMITS.find(
        p => p.systemType === pump.systemType && p.flowType === flowType
      );

      if (limit && pump.flowGpm > 0) {
        const wPerGpm = (pump.powerKw * 1000) / pump.flowGpm;
        const status = wPerGpm <= limit.maxWPerGpm ? 'pass' : 'fail';

        checks.push({
          id: `pump-${pump.id}`,
          checkType: 'pump',
          itemId: pump.id,
          itemName: pump.name,
          requirement: 'Pump Power Limit',
          requiredValue: `≤ ${limit.maxWPerGpm} W/GPM`,
          actualValue: `${wPerGpm.toFixed(1)} W/GPM`,
          status,
          notes: `${pump.systemType.toUpperCase()} ${flowType} flow system`,
          recommendation: status === 'fail'
            ? 'Consider higher efficiency pump or reducing system head'
            : undefined,
          reference: 'Section 6.5.4.2',
        });
      }

      // Variable flow requirement check
      if (pump.systemType === 'chw' && pump.flowGpm >= 50) { // ~300,000 Btu/h at 10°F ΔT
        checks.push({
          id: `pump-${pump.id}-variable`,
          checkType: 'pump',
          itemId: pump.id,
          itemName: pump.name,
          requirement: 'Variable Flow',
          requiredValue: 'Required for CHW > 300,000 Btu/h',
          actualValue: pump.isVariableFlow ? 'Yes' : 'No',
          status: pump.isVariableFlow ? 'pass' : 'fail',
          notes: 'Variable speed pumping required for larger systems',
          reference: 'Section 6.5.4.2',
        });
      }
    });

    return checks;
  }, [pumps]);

  const mandatoryChecks = useMemo((): ComplianceCheckResult[] => {
    return MANDATORY_REQUIREMENTS.map(req => {
      const isCompliant = mandatoryFeatures[req.id];
      
      return {
        id: `mandatory-${req.id}`,
        checkType: 'mandatory',
        itemId: req.id,
        itemName: req.title,
        requirement: req.description,
        requiredValue: 'Required',
        actualValue: isCompliant === true ? 'Yes' : (isCompliant === false ? 'No' : 'Not verified'),
        status: isCompliant === true ? 'pass' : (isCompliant === false ? 'fail' : 'unknown'),
        notes: req.category,
        reference: req.reference,
      };
    });
  }, [mandatoryFeatures]);

  const report = useMemo((): ComplianceReport | null => {
    if (!climateZone || !city) return null;

    const allChecks = [...equipmentChecks, ...systemChecks, ...pumpChecks, ...mandatoryChecks];
    
    const summary = {
      totalChecks: allChecks.length,
      passCount: allChecks.filter(c => c.status === 'pass').length,
      failCount: allChecks.filter(c => c.status === 'fail').length,
      warningCount: allChecks.filter(c => c.status === 'warning').length,
      exemptCount: allChecks.filter(c => c.status === 'exempt').length,
      unknownCount: allChecks.filter(c => c.status === 'unknown').length,
    };

    const complianceScore = summary.totalChecks > 0
      ? Math.round(((summary.passCount + summary.exemptCount) / summary.totalChecks) * 100)
      : 0;

    const overallCompliance: 'compliant' | 'non-compliant' | 'partial' = 
      summary.failCount === 0 ? 'compliant' :
      summary.passCount === 0 ? 'non-compliant' : 'partial';

    const recommendations = allChecks
      .filter(c => c.recommendation)
      .map(c => `${c.itemName}: ${c.recommendation}`);

    return {
      projectName,
      cityId,
      cityName: city.nameEn,
      climateZone,
      codeVersion: 'ASHRAE 90.1-2022',
      generatedAt: new Date().toISOString(),
      overallCompliance,
      complianceScore,
      summary,
      equipmentChecks,
      systemChecks,
      pumpChecks,
      mandatoryChecks,
      recommendations,
    };
  }, [projectName, city, climateZone, equipmentChecks, systemChecks, pumpChecks, mandatoryChecks]);

  return {
    climateZone,
    city,
    equipmentChecks,
    systemChecks,
    pumpChecks,
    mandatoryChecks,
    report,
    cities: SAUDI_CITIES,
    climateZones: SAUDI_CLIMATE_ZONES,
  };
}
