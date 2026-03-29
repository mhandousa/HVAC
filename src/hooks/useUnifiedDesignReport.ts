import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useProjects, Project } from './useProjects';
import { useLoadCalculations, LoadCalculation } from './useLoadCalculations';
import { useEquipmentSelections, EquipmentSelection } from './useEquipmentSelections';
import { useDuctSystems, DuctSystem } from './useDuctSystems';
import { usePipeSystems, PipeSystem } from './usePipeSystems';
import { useVRFSystems, VRFSystem } from './useVRFSystems';
import { useSavedVentilationCalcs, VentilationCalculationWithZones } from './useSavedVentilationCalcs';
import { useSavedERVSizing, ERVCalculationWithSimulations } from './useSavedERVSizing';
import { useChilledWaterPlants, ChilledWaterPlant } from './useChilledWaterPlants';
import { useHotWaterPlants, HotWaterPlant } from './useHotWaterPlants';
import { useSmokeControlCalculations, SmokeControlCalculation } from './useSmokeControlCalculations';
import { useThermalComfortAnalyses, ThermalComfortAnalysis } from './useThermalComfortAnalyses';
import { useSBCComplianceChecks, SBCComplianceCheck } from './useSBCComplianceChecks';
import { useCoilSelections, CoilSelection } from './useCoilSelections';
import { useFilterSelections, FilterSelection } from './useFilterSelections';
import { useCoolingTowerSelections, CoolingTowerSelection } from './useCoolingTowerSelections';
import { useTerminalUnitSelections, TerminalUnitSelection } from './useTerminalUnitSelections';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============ Types ============

export interface ProjectDesignSummary {
  totalCoolingLoadTons: number;
  totalCoolingLoadBtuh: number;
  totalHeatingLoadBtuh: number;
  totalAirflowCfm: number;
  totalWaterFlowGpm: number;
  totalOutdoorAirCfm: number;
  totalEnergySavingsKwh: number;
  zoneCount: number;
  equipmentSelectionsCount: number;
  ventilationCalculationsCount: number;
  ervCalculationsCount: number;
  chwPlantCount: number;
  hwPlantCount: number;
  smokeControlCount: number;
  thermalComfortCount: number;
  complianceCheckCount: number;
  designCompleteness: number;
}

export interface LoadCalculationSection {
  items: LoadCalculation[];
  totalCoolingTons: number;
  totalCoolingBtuh: number;
  totalHeatingBtuh: number;
  totalArea: number;
}

export interface EquipmentSection {
  items: EquipmentSelection[];
  totalSelections: number;
  approvedCount: number;
  pendingCount: number;
}

export interface DuctSystemSection {
  system: DuctSystem;
  totalAirflow: number;
  totalPressure: number;
  segmentCount: number;
}

export interface PipeSystemSection {
  system: PipeSystem;
  totalFlow: number;
  totalHead: number;
  segmentCount: number;
}

export interface VRFSystemSection {
  system: VRFSystem;
  indoorUnitCount: number;
  totalCapacity: number;
  capacityRatio: number;
}

export interface VentilationSection {
  items: VentilationCalculationWithZones[];
  totalOutdoorAirCfm: number;
  totalOccupancy: number;
  calculationCount: number;
}

export interface ERVSection {
  items: ERVCalculationWithSimulations[];
  totalEnergySavingsKwh: number;
  totalCostSavingsSar: number;
  calculationCount: number;
}

export interface ChilledWaterPlantSection {
  items: ChilledWaterPlant[];
  totalCapacityTons: number;
  plantCount: number;
}

export interface HotWaterPlantSection {
  items: HotWaterPlant[];
  totalCapacityBtuh: number;
  plantCount: number;
}

export interface SmokeControlSection {
  items: SmokeControlCalculation[];
  calculationCount: number;
}

export interface ThermalComfortSection {
  items: ThermalComfortAnalysis[];
  analysisCount: number;
}

export interface ComplianceSection {
  sbcChecks: SBCComplianceCheck[];
  avgComplianceScore: number;
  checkCount: number;
}

export interface AcousticAnalysisSection {
  items: {
    id: string;
    name: string;
    zone_name: string | null;
    calculation_type: string;
    calculated_nc: number | null;
    target_nc: number | null;
    meets_target: boolean | null;
    created_at: string;
  }[];
  zonesMeetingTarget: number;
  totalZonesWithAcoustics: number;
  averageNC: number | null;
  calculationsByType: {
    noise_path: number;
    room_acoustics: number;
    silencer_sizing: number;
    vibration: number;
  };
}

// New sections for 5 additional design tools
export interface CoilSelectionSection {
  items: CoilSelection[];
  totalCount: number;
  coolingCoilCount: number;
  heatingCoilCount: number;
  totalCoolingCapacityTons: number;
  totalHeatingCapacityMbh: number;
  totalAirflowCfm: number;
}

export interface FilterSelectionSection {
  items: FilterSelection[];
  totalCount: number;
  preFilterCount: number;
  finalFilterCount: number;
  averageMervRating: number;
  totalAnnualEnergyCostSar: number;
}

export interface TerminalUnitSection {
  items: TerminalUnitSelection[];
  totalCount: number;
  vavBoxCount: number;
  fcuCount: number;
  totalAirflowCfm: number;
  totalCoolingCapacityTons: number;
}

export interface CoolingTowerSection {
  items: CoolingTowerSelection[];
  totalCount: number;
  totalCapacityTons: number;
  totalMakeupWaterGpm: number;
  totalFanKw: number;
}

export interface UnifiedDesignReportData {
  project: Project;
  summary: ProjectDesignSummary;
  loadCalculations: LoadCalculationSection;
  equipmentSelections: EquipmentSection;
  ductSystems: DuctSystemSection[];
  pipeSystems: PipeSystemSection[];
  vrfSystems: VRFSystemSection[];
  ventilationCalculations: VentilationSection;
  ervSizing: ERVSection;
  chilledWaterPlants: ChilledWaterPlantSection;
  hotWaterPlants: HotWaterPlantSection;
  smokeControl: SmokeControlSection;
  thermalComfort: ThermalComfortSection;
  compliance: ComplianceSection;
  acousticAnalysis: AcousticAnalysisSection;
  coilSelections: CoilSelectionSection;
  filterSelections: FilterSelectionSection;
  terminalUnits: TerminalUnitSection;
  coolingTowers: CoolingTowerSection;
  generatedAt: string;
}

export interface ReportSectionConfig {
  coverPage: boolean;
  executiveSummary: boolean;
  loadCalculations: boolean;
  equipmentSelections: boolean;
  ductSystems: boolean;
  pipeSystems: boolean;
  vrfSystems: boolean;
  ventilationCalculations: boolean;
  ervSizing: boolean;
  chilledWaterPlants: boolean;
  hotWaterPlants: boolean;
  smokeControl: boolean;
  thermalComfort: boolean;
  complianceChecks: boolean;
  acousticAnalysis: boolean;
  coilSelections: boolean;
  filterSelections: boolean;
  terminalUnits: boolean;
  coolingTowers: boolean;
  detailedAppendix: boolean;
}

// ============ Hook ============

export function useUnifiedDesignReport(projectId?: string) {
  const { data: organization } = useOrganization();
  const { data: projects } = useProjects();
  const { data: loadCalcs } = useLoadCalculations(projectId);
  const { data: equipmentSelections } = useEquipmentSelections(projectId);
  const { data: ductSystems } = useDuctSystems(projectId);
  const { data: pipeSystems } = usePipeSystems(projectId);
  const { data: vrfSystems } = useVRFSystems(projectId);
  const { calculations: ventilationCalcs } = useSavedVentilationCalcs(projectId);
  const { calculations: ervCalcs } = useSavedERVSizing(projectId);
  const { data: chwPlants } = useChilledWaterPlants(projectId);
  const { data: hwPlants } = useHotWaterPlants(projectId);
  const { data: smokeCalcs } = useSmokeControlCalculations(projectId);
  const { data: thermalAnalyses } = useThermalComfortAnalyses(projectId);
  const { data: sbcChecks } = useSBCComplianceChecks(projectId);
  const { data: coilSelections } = useCoilSelections(projectId);
  const { data: filterSelections } = useFilterSelections(projectId);
  const { data: coolingTowers } = useCoolingTowerSelections(projectId);
  const { data: terminalUnits } = useTerminalUnitSelections(projectId);

  const project = projects?.find(p => p.id === projectId);

  const reportData = useQuery({
    queryKey: ['unified-design-report', projectId, organization?.id],
    queryFn: async (): Promise<UnifiedDesignReportData | null> => {
      if (!project || !projectId) return null;

      // Calculate load calculation totals
      const loadCalcSection: LoadCalculationSection = {
        items: loadCalcs || [],
        totalCoolingTons: (loadCalcs || []).reduce((sum, lc) => sum + (lc.cooling_load_tons || 0), 0),
        totalCoolingBtuh: (loadCalcs || []).reduce((sum, lc) => sum + (lc.cooling_load_btuh || 0), 0),
        totalHeatingBtuh: (loadCalcs || []).reduce((sum, lc) => sum + (lc.heating_load_btuh || 0), 0),
        totalArea: (loadCalcs || []).reduce((sum, lc) => sum + (lc.area_sqft || 0), 0),
      };

      // Calculate equipment selection totals
      const equipmentSection: EquipmentSection = {
        items: equipmentSelections || [],
        totalSelections: (equipmentSelections || []).length,
        approvedCount: (equipmentSelections || []).filter(e => e.status === 'approved').length,
        pendingCount: (equipmentSelections || []).filter(e => e.status !== 'approved').length,
      };

      // Calculate duct system sections
      const ductSystemSections: DuctSystemSection[] = (ductSystems || []).map(system => ({
        system,
        totalAirflow: system.total_airflow_cfm || 0,
        totalPressure: system.system_static_pressure_pa || 0,
        segmentCount: 0,
      }));

      // Calculate pipe system sections
      const pipeSystemSections: PipeSystemSection[] = (pipeSystems || []).map(system => ({
        system,
        totalFlow: system.total_flow_gpm || 0,
        totalHead: system.system_head_ft || 0,
        segmentCount: 0,
      }));

      // Calculate VRF system sections
      const vrfSystemSections: VRFSystemSection[] = (vrfSystems || []).map(system => ({
        system,
        indoorUnitCount: 0,
        totalCapacity: system.total_indoor_capacity_tons || 0,
        capacityRatio: system.capacity_ratio || 0,
      }));

      // Calculate ventilation section
      const ventilationSection: VentilationSection = {
        items: ventilationCalcs || [],
        totalOutdoorAirCfm: (ventilationCalcs || []).reduce((sum, vc) => sum + (vc.system_outdoor_air_cfm || 0), 0),
        totalOccupancy: (ventilationCalcs || []).reduce((sum, vc) => sum + (vc.total_occupancy || 0), 0),
        calculationCount: (ventilationCalcs || []).length,
      };

      // Calculate ERV section
      const ervSection: ERVSection = {
        items: ervCalcs || [],
        totalEnergySavingsKwh: (ervCalcs || []).reduce((sum, ec) => sum + (ec.annual_energy_savings_kwh || 0), 0),
        totalCostSavingsSar: (ervCalcs || []).reduce((sum, ec) => sum + (ec.annual_cost_savings_sar || 0), 0),
        calculationCount: (ervCalcs || []).length,
      };

      // Calculate CHW Plant section
      const chwPlantSection: ChilledWaterPlantSection = {
        items: chwPlants || [],
        totalCapacityTons: (chwPlants || []).reduce((sum, p) => sum + (p.total_installed_capacity_tons || 0), 0),
        plantCount: (chwPlants || []).length,
      };

      // Calculate HW Plant section
      const hwPlantSection: HotWaterPlantSection = {
        items: hwPlants || [],
        totalCapacityBtuh: (hwPlants || []).reduce((sum, p) => sum + (p.heating_load_btuh || 0), 0),
        plantCount: (hwPlants || []).length,
      };

      // Calculate Smoke Control section
      const smokeControlSection: SmokeControlSection = {
        items: smokeCalcs || [],
        calculationCount: (smokeCalcs || []).length,
      };

      // Calculate Thermal Comfort section
      const thermalComfortSection: ThermalComfortSection = {
        items: thermalAnalyses || [],
        analysisCount: (thermalAnalyses || []).length,
      };

      // Calculate Compliance section
      const complianceSection: ComplianceSection = {
        sbcChecks: sbcChecks || [],
        avgComplianceScore: (sbcChecks || []).length > 0
          ? (sbcChecks || []).reduce((sum, c) => sum + (c.compliance_score_percent || 0), 0) / (sbcChecks || []).length
          : 0,
        checkCount: (sbcChecks || []).length,
      };

      // Fetch acoustic calculations for the project
      const { data: acousticCalcs } = await supabase
        .from('acoustic_calculations')
        .select(`
          id, name, calculation_type, calculated_nc, target_nc, meets_target, created_at, zone_id,
          zones:zone_id (name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Calculate Acoustic Analysis section
      const acousticItems = (acousticCalcs || []).map((ac: any) => ({
        id: ac.id,
        name: ac.name,
        zone_name: ac.zones?.name || null,
        calculation_type: ac.calculation_type,
        calculated_nc: ac.calculated_nc,
        target_nc: ac.target_nc,
        meets_target: ac.meets_target,
        created_at: ac.created_at,
      }));

      const acousticSection: AcousticAnalysisSection = {
        items: acousticItems,
        zonesMeetingTarget: acousticItems.filter(a => a.meets_target === true).length,
        totalZonesWithAcoustics: new Set(acousticItems.filter(a => a.zone_name).map(a => a.zone_name)).size,
        averageNC: acousticItems.length > 0
          ? Math.round(acousticItems.filter(a => a.calculated_nc != null).reduce((sum, a) => sum + (a.calculated_nc || 0), 0) / 
              acousticItems.filter(a => a.calculated_nc != null).length) || null
          : null,
        calculationsByType: {
          noise_path: acousticItems.filter(a => a.calculation_type === 'noise_path').length,
          room_acoustics: acousticItems.filter(a => a.calculation_type === 'room_acoustics').length,
          silencer_sizing: acousticItems.filter(a => a.calculation_type === 'silencer_sizing').length,
          vibration: acousticItems.filter(a => a.calculation_type === 'vibration').length,
        },
      };

      // Calculate Coil Selection section
      const coilSection: CoilSelectionSection = {
        items: coilSelections || [],
        totalCount: (coilSelections || []).length,
        coolingCoilCount: (coilSelections || []).filter(c => c.coil_type === 'cooling').length,
        heatingCoilCount: (coilSelections || []).filter(c => c.coil_type === 'heating' || c.coil_type === 'preheat' || c.coil_type === 'reheat').length,
        totalCoolingCapacityTons: (coilSelections || []).filter(c => c.coil_type === 'cooling').reduce((sum, c) => sum + (c.capacity_tons || 0), 0),
        totalHeatingCapacityMbh: (coilSelections || []).filter(c => c.coil_type !== 'cooling').reduce((sum, c) => sum + (c.capacity_mbh || 0), 0),
        totalAirflowCfm: (coilSelections || []).reduce((sum, c) => sum + (c.design_cfm || 0), 0),
      };

      // Calculate Filter Selection section
      const filterSection: FilterSelectionSection = {
        items: filterSelections || [],
        totalCount: (filterSelections || []).length,
        preFilterCount: (filterSelections || []).filter(f => f.filter_position === 'pre-filter').length,
        finalFilterCount: (filterSelections || []).filter(f => f.filter_position === 'final-filter').length,
        averageMervRating: (filterSelections || []).length > 0
          ? (filterSelections || []).reduce((sum, f) => sum + (f.merv_rating || 0), 0) / (filterSelections || []).length
          : 0,
        totalAnnualEnergyCostSar: (filterSelections || []).reduce((sum, f) => sum + (f.annual_energy_cost_sar || 0), 0),
      };

      // Calculate Terminal Unit section (VAV + FCU combined)
      const terminalSection: TerminalUnitSection = {
        items: terminalUnits || [],
        totalCount: (terminalUnits || []).length,
        vavBoxCount: (terminalUnits || []).filter(t => t.unit_type?.toLowerCase().includes('vav')).length,
        fcuCount: (terminalUnits || []).filter(t => t.unit_type?.toLowerCase().includes('fcu')).length,
        totalAirflowCfm: (terminalUnits || []).reduce((sum, t) => sum + (t.max_cfm || 0), 0),
        totalCoolingCapacityTons: (terminalUnits || []).reduce((sum, t) => sum + (t.chw_coil_capacity_btuh || 0) / 12000, 0),
      };

      // Calculate Cooling Tower section
      const coolingTowerSection: CoolingTowerSection = {
        items: coolingTowers || [],
        totalCount: (coolingTowers || []).length,
        totalCapacityTons: (coolingTowers || []).reduce((sum, t) => sum + (t.total_capacity_tons || 0), 0),
        totalMakeupWaterGpm: (coolingTowers || []).reduce((sum, t) => sum + (t.makeup_water_gpm || 0), 0),
        totalFanKw: (coolingTowers || []).reduce((sum, t) => sum + (t.total_fan_kw || 0), 0),
      };

      // Calculate overall summary
      const totalAirflow = ductSystemSections.reduce((sum, ds) => sum + ds.totalAirflow, 0);
      const totalWaterFlow = pipeSystemSections.reduce((sum, ps) => sum + ps.totalFlow, 0);

      // Calculate design completeness with all stages (now 17 stages)
      let completedStages = 0;
      const totalStages = 17; // Core 7 + 5 specialized tools + acoustic + 4 new tools
      if ((loadCalcs || []).length > 0) completedStages++;
      if ((equipmentSelections || []).length > 0) completedStages++;
      if ((ductSystems || []).length > 0) completedStages++;
      if ((pipeSystems || []).length > 0) completedStages++;
      if ((vrfSystems || []).length > 0) completedStages++;
      if ((ventilationCalcs || []).length > 0) completedStages++;
      if ((ervCalcs || []).length > 0) completedStages++;
      if ((chwPlants || []).length > 0) completedStages++;
      if ((hwPlants || []).length > 0) completedStages++;
      if ((smokeCalcs || []).length > 0) completedStages++;
      if ((thermalAnalyses || []).length > 0) completedStages++;
      if ((sbcChecks || []).length > 0) completedStages++;
      if (acousticItems.length > 0) completedStages++;
      if ((coilSelections || []).length > 0) completedStages++;
      if ((filterSelections || []).length > 0) completedStages++;
      if ((terminalUnits || []).length > 0) completedStages++;
      if ((coolingTowers || []).length > 0) completedStages++;

      const summary: ProjectDesignSummary = {
        totalCoolingLoadTons: loadCalcSection.totalCoolingTons,
        totalCoolingLoadBtuh: loadCalcSection.totalCoolingBtuh,
        totalHeatingLoadBtuh: loadCalcSection.totalHeatingBtuh,
        totalAirflowCfm: totalAirflow,
        totalWaterFlowGpm: totalWaterFlow,
        totalOutdoorAirCfm: ventilationSection.totalOutdoorAirCfm,
        totalEnergySavingsKwh: ervSection.totalEnergySavingsKwh,
        zoneCount: (loadCalcs || []).length,
        equipmentSelectionsCount: equipmentSection.totalSelections,
        ventilationCalculationsCount: ventilationSection.calculationCount,
        ervCalculationsCount: ervSection.calculationCount,
        chwPlantCount: chwPlantSection.plantCount,
        hwPlantCount: hwPlantSection.plantCount,
        smokeControlCount: smokeControlSection.calculationCount,
        thermalComfortCount: thermalComfortSection.analysisCount,
        complianceCheckCount: complianceSection.checkCount,
        designCompleteness: Math.round((completedStages / totalStages) * 100),
      };

      return {
        project,
        summary,
        loadCalculations: loadCalcSection,
        equipmentSelections: equipmentSection,
        ductSystems: ductSystemSections,
        pipeSystems: pipeSystemSections,
        vrfSystems: vrfSystemSections,
        ventilationCalculations: ventilationSection,
        ervSizing: ervSection,
        chilledWaterPlants: chwPlantSection,
        hotWaterPlants: hwPlantSection,
        smokeControl: smokeControlSection,
        thermalComfort: thermalComfortSection,
        compliance: complianceSection,
        acousticAnalysis: acousticSection,
        coilSelections: coilSection,
        filterSelections: filterSection,
        terminalUnits: terminalSection,
        coolingTowers: coolingTowerSection,
        generatedAt: new Date().toISOString(),
      };
    },
    enabled: !!projectId && !!project,
  });

  // ============ Export Functions ============

  const exportToPDF = (data: UnifiedDesignReportData, config: ReportSectionConfig) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper to add page break if needed
    const checkPageBreak = (height: number) => {
      if (yPos + height > 280) {
        doc.addPage();
        yPos = 20;
      }
    };

    // ===== COVER PAGE =====
    if (config.coverPage) {
      doc.setFontSize(24);
      doc.setTextColor(30, 64, 175); // Primary blue
      doc.text('HVAC DESIGN REPORT', pageWidth / 2, 60, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(data.project.name, pageWidth / 2, 80, { align: 'center' });
      
      if (data.project.client_name) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Client: ${data.project.client_name}`, pageWidth / 2, 95, { align: 'center' });
      }
      
      if (data.project.location) {
        doc.text(`Location: ${data.project.location}`, pageWidth / 2, 105, { align: 'center' });
      }

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, pageWidth / 2, 130, { align: 'center' });
      
      doc.addPage();
      yPos = 20;
    }

    // ===== EXECUTIVE SUMMARY =====
    if (config.executiveSummary) {
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.text('Executive Summary', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const summaryData = [
        ['Total Cooling Load', `${data.summary.totalCoolingLoadTons.toFixed(1)} Tons (${(data.summary.totalCoolingLoadBtuh / 1000).toFixed(0)} kBTU/h)`],
        ['Total Heating Load', `${(data.summary.totalHeatingLoadBtuh / 1000).toFixed(1)} kBTU/h`],
        ['Total Airflow', `${data.summary.totalAirflowCfm.toLocaleString()} CFM`],
        ['Total Outdoor Air', `${data.summary.totalOutdoorAirCfm.toLocaleString()} CFM`],
        ['Total Water Flow', `${data.summary.totalWaterFlowGpm.toLocaleString()} GPM`],
        ['Zone Count', data.summary.zoneCount.toString()],
        ['Equipment Selections', data.summary.equipmentSelectionsCount.toString()],
        ['Ventilation Calculations', data.summary.ventilationCalculationsCount.toString()],
        ['ERV/HRV Calculations', data.summary.ervCalculationsCount.toString()],
        ['CHW Plants', data.summary.chwPlantCount.toString()],
        ['HW Plants', data.summary.hwPlantCount.toString()],
        ['Smoke Control Calculations', data.summary.smokeControlCount.toString()],
        ['Thermal Comfort Analyses', data.summary.thermalComfortCount.toString()],
        ['Compliance Checks', data.summary.complianceCheckCount.toString()],
        ['Annual Energy Savings (ERV)', `${data.summary.totalEnergySavingsKwh.toLocaleString()} kWh`],
        ['Design Completeness', `${data.summary.designCompleteness}%`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== LOAD CALCULATIONS =====
    if (config.loadCalculations && data.loadCalculations.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Load Calculations', 14, yPos);
      yPos += 8;

      const loadCalcData = data.loadCalculations.items.map(lc => [
        lc.calculation_name || 'Unnamed',
        (lc.cooling_load_tons || 0).toFixed(1),
        ((lc.cooling_load_btuh || 0) / 1000).toFixed(0),
        ((lc.heating_load_btuh || 0) / 1000).toFixed(0),
        (lc.area_sqft || 0).toLocaleString(),
      ]);

      // Add totals row
      loadCalcData.push([
        'TOTAL',
        data.loadCalculations.totalCoolingTons.toFixed(1),
        (data.loadCalculations.totalCoolingBtuh / 1000).toFixed(0),
        (data.loadCalculations.totalHeatingBtuh / 1000).toFixed(0),
        data.loadCalculations.totalArea.toLocaleString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Zone/Area', 'Cooling (Tons)', 'Cooling (kBTU/h)', 'Heating (kBTU/h)', 'Area (sq ft)']],
        body: loadCalcData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        foot: [],
        footStyles: { fontStyle: 'bold' },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== EQUIPMENT SELECTIONS =====
    if (config.equipmentSelections && data.equipmentSelections.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Equipment Selections', 14, yPos);
      yPos += 8;

      const equipmentData = data.equipmentSelections.items.map(eq => [
        eq.selection_name,
        eq.equipment_category || '-',
        eq.required_capacity_tons ? `${eq.required_capacity_tons.toFixed(1)} Tons` : '-',
        eq.status,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Selection Name', 'Category', 'Capacity', 'Status']],
        body: equipmentData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== DUCT SYSTEMS =====
    if (config.ductSystems && data.ductSystems.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Duct Systems', 14, yPos);
      yPos += 8;

      const ductData = data.ductSystems.map(ds => [
        ds.system.system_name,
        ds.system.system_type || '-',
        ds.totalAirflow.toLocaleString() + ' CFM',
        (ds.totalPressure || 0).toFixed(0) + ' Pa',
        ds.system.duct_material || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['System Name', 'Type', 'Total Airflow', 'Static Pressure', 'Material']],
        body: ductData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== PIPE SYSTEMS =====
    if (config.pipeSystems && data.pipeSystems.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Pipe Systems', 14, yPos);
      yPos += 8;

      const pipeData = data.pipeSystems.map(ps => [
        ps.system.system_name,
        ps.system.system_type || '-',
        ps.totalFlow.toLocaleString() + ' GPM',
        (ps.totalHead || 0).toFixed(1) + ' ft',
        ps.system.pipe_material || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['System Name', 'Type', 'Total Flow', 'System Head', 'Material']],
        body: pipeData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== VRF SYSTEMS =====
    if (config.vrfSystems && data.vrfSystems.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('VRF Systems', 14, yPos);
      yPos += 8;

      const vrfData = data.vrfSystems.map(vrf => [
        vrf.system.system_name,
        vrf.system.system_type || '-',
        vrf.system.outdoor_unit_capacity_tons ? `${vrf.system.outdoor_unit_capacity_tons.toFixed(1)} Tons` : '-',
        vrf.totalCapacity ? `${vrf.totalCapacity.toFixed(1)} Tons` : '-',
        vrf.capacityRatio ? `${(vrf.capacityRatio * 100).toFixed(0)}%` : '-',
        vrf.system.refrigerant_type || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['System Name', 'Type', 'ODU Capacity', 'IDU Capacity', 'Capacity Ratio', 'Refrigerant']],
        body: vrfData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== VENTILATION CALCULATIONS =====
    if (config.ventilationCalculations && data.ventilationCalculations.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Ventilation Calculations (ASHRAE 62.1)', 14, yPos);
      yPos += 8;

      const ventData = data.ventilationCalculations.items.map(vc => [
        vc.calculation_name || 'Unnamed',
        (vc.system_outdoor_air_cfm || 0).toLocaleString() + ' CFM',
        ((vc.system_efficiency || 0) * 100).toFixed(0) + '%',
        (vc.total_occupancy || 0).toString(),
        (vc.total_floor_area_sqft || 0).toLocaleString() + ' sq ft',
      ]);

      // Add totals row
      ventData.push([
        'TOTAL',
        data.ventilationCalculations.totalOutdoorAirCfm.toLocaleString() + ' CFM',
        '-',
        data.ventilationCalculations.totalOccupancy.toString(),
        '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Calculation Name', 'Outdoor Air', 'System Eff.', 'Occupancy', 'Floor Area']],
        body: ventData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== ERV/HRV SIZING =====
    if (config.ervSizing && data.ervSizing.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('ERV/HRV Sizing Calculations', 14, yPos);
      yPos += 8;

      const ervData = data.ervSizing.items.map(ec => [
        ec.calculation_name || 'Unnamed',
        ec.erv_type || '-',
        (ec.outdoor_air_cfm || 0).toLocaleString() + ' CFM',
        ((ec.total_recovery_btuh || 0) / 1000).toFixed(1) + ' kBTU/h',
        (ec.annual_energy_savings_kwh || 0).toLocaleString() + ' kWh',
        (ec.annual_cost_savings_sar || 0).toLocaleString() + ' SAR',
      ]);

      // Add totals row
      ervData.push([
        'TOTAL',
        '-',
        '-',
        '-',
        data.ervSizing.totalEnergySavingsKwh.toLocaleString() + ' kWh',
        data.ervSizing.totalCostSavingsSar.toLocaleString() + ' SAR',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Calculation Name', 'Type', 'OA Flow', 'Recovery', 'Annual Savings', 'Cost Savings']],
        body: ervData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });
    }

    // ===== CHILLED WATER PLANTS =====
    if (config.chilledWaterPlants && data.chilledWaterPlants.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Chilled Water Plants', 14, yPos);
      yPos += 8;

      const chwData = data.chilledWaterPlants.items.map(p => [
        p.plant_name || 'Unnamed',
        p.plant_tag || '-',
        (p.design_cooling_load_tons || 0).toFixed(0) + ' Tons',
        (p.total_installed_capacity_tons || 0).toFixed(0) + ' Tons',
        p.chiller_type || '-',
        p.pumping_config || '-',
        p.redundancy_mode || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Plant Name', 'Tag', 'Design Load', 'Installed Capacity', 'Chiller Type', 'Pumping', 'Redundancy']],
        body: chwData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== HOT WATER PLANTS =====
    if (config.hotWaterPlants && data.hotWaterPlants.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Hot Water Plants', 14, yPos);
      yPos += 8;

      const hwData = data.hotWaterPlants.items.map(p => [
        p.plant_name || 'Unnamed',
        p.plant_tag || '-',
        ((p.heating_load_btuh || 0) / 1000).toFixed(0) + ' kBTU/h',
        p.boiler_type || '-',
        (p.boiler_count || 0).toString(),
        p.pumping_config || '-',
        p.redundancy_mode || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Plant Name', 'Tag', 'Heating Load', 'Boiler Type', 'Boiler Count', 'Pumping', 'Redundancy']],
        body: hwData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== SMOKE CONTROL CALCULATIONS =====
    if (config.smokeControl && data.smokeControl.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Smoke Control Calculations (NFPA 92)', 14, yPos);
      yPos += 8;

      const smokeData = data.smokeControl.items.map(sc => [
        sc.calculation_name || 'Unnamed',
        sc.calculation_type || '-',
        sc.reference_standard || 'NFPA 92',
        (sc.target_pressure_in_wc || 0).toFixed(3) + ' in. w.c.',
        (sc.space_height_ft || 0).toFixed(0) + ' ft',
        sc.status || 'draft',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Calculation Name', 'Type', 'Standard', 'Target Pressure', 'Space Height', 'Status']],
        body: smokeData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== THERMAL COMFORT ANALYSES =====
    if (config.thermalComfort && data.thermalComfort.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Thermal Comfort Analyses (ASHRAE 55)', 14, yPos);
      yPos += 8;

      const thermalData = data.thermalComfort.items.map(tc => [
        tc.analysis_name || 'Unnamed',
        tc.analysis_type || '-',
        (tc.air_temp_c || 0).toFixed(1) + ' °C',
        (tc.relative_humidity_percent || 0).toFixed(0) + '%',
        (tc.metabolic_rate_met || 0).toFixed(1) + ' met',
        (tc.clothing_insulation_clo || 0).toFixed(2) + ' clo',
        tc.status || 'draft',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Analysis Name', 'Type', 'Air Temp', 'RH', 'Met Rate', 'Clothing', 'Status']],
        body: thermalData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== COMPLIANCE CHECKS =====
    if (config.complianceChecks && data.compliance.sbcChecks.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('SBC Compliance Checks', 14, yPos);
      yPos += 8;

      const complianceData = data.compliance.sbcChecks.map(c => [
        c.check_name || 'Unnamed',
        (c.total_requirements || 0).toString(),
        (c.passed_count || 0).toString(),
        (c.failed_count || 0).toString(),
        (c.compliance_score_percent || 0).toFixed(0) + '%',
        c.status || 'draft',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Check Name', 'Total Reqs', 'Passed', 'Failed', 'Score', 'Status']],
        body: complianceData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== ACOUSTIC ANALYSIS =====
    if (config.acousticAnalysis && data.acousticAnalysis.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Acoustic Analysis', 14, yPos);
      yPos += 8;

      const acousticData = data.acousticAnalysis.items.map(ac => [
        ac.name,
        ac.zone_name || 'Project-level',
        ac.calculation_type.replace(/_/g, ' ').toUpperCase(),
        ac.target_nc?.toString() || '-',
        ac.calculated_nc?.toString() || '-',
        ac.meets_target === true ? 'PASS' : ac.meets_target === false ? 'FAIL' : '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Calculation', 'Zone', 'Type', 'Target NC', 'Calculated NC', 'Status']],
        body: acousticData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== COIL SELECTIONS =====
    if (config.coilSelections && data.coilSelections.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Coil Selections', 14, yPos);
      yPos += 8;

      const coilData = data.coilSelections.items.map(c => [
        c.name || 'Unnamed',
        c.coil_type || '-',
        (c.design_cfm || 0).toLocaleString() + ' CFM',
        c.coil_type === 'cooling' 
          ? (c.capacity_tons || 0).toFixed(1) + ' Tons'
          : (c.capacity_mbh || 0).toFixed(1) + ' MBH',
        (c.water_flow_gpm || 0).toFixed(1) + ' GPM',
        (c.air_pressure_drop_in || 0).toFixed(3) + ' in. w.c.',
        c.manufacturer || '-',
        c.model_number || '-',
      ]);

      // Add totals row
      coilData.push([
        'TOTAL',
        `${data.coilSelections.coolingCoilCount} Cool / ${data.coilSelections.heatingCoilCount} Heat`,
        data.coilSelections.totalAirflowCfm.toLocaleString() + ' CFM',
        data.coilSelections.totalCoolingCapacityTons.toFixed(1) + ' Tons cooling',
        '-',
        '-',
        '-',
        '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Selection', 'Type', 'CFM', 'Capacity', 'Water Flow', 'Air PD', 'Mfr', 'Model']],
        body: coilData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== FILTER SELECTIONS =====
    if (config.filterSelections && data.filterSelections.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Filter Selections', 14, yPos);
      yPos += 8;

      const filterData = data.filterSelections.items.map(f => [
        f.name || 'Unnamed',
        f.filter_position || '-',
        'MERV ' + (f.merv_rating || '-'),
        (f.design_cfm || 0).toLocaleString() + ' CFM',
        (f.quantity || 1).toString(),
        (f.clean_pressure_drop_in || 0).toFixed(3) + ' in. w.c.',
        (f.annual_energy_cost_sar || 0).toLocaleString() + ' SAR',
        f.manufacturer || '-',
      ]);

      // Add totals row
      filterData.push([
        'TOTAL',
        `${data.filterSelections.preFilterCount} Pre / ${data.filterSelections.finalFilterCount} Final`,
        'Avg MERV ' + data.filterSelections.averageMervRating.toFixed(0),
        '-',
        data.filterSelections.totalCount.toString(),
        '-',
        data.filterSelections.totalAnnualEnergyCostSar.toLocaleString() + ' SAR',
        '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Selection', 'Position', 'MERV', 'CFM', 'Qty', 'Press Drop', 'Annual Cost', 'Mfr']],
        body: filterData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== TERMINAL UNITS =====
    if (config.terminalUnits && data.terminalUnits.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Terminal Units (VAV/FCU)', 14, yPos);
      yPos += 8;

      const terminalData = data.terminalUnits.items.map(t => [
        t.unit_tag || 'Unnamed',
        t.unit_type || '-',
        (t.min_cfm || 0) + ' - ' + (t.max_cfm || 0) + ' CFM',
        t.chw_coil_capacity_btuh ? ((t.chw_coil_capacity_btuh / 12000).toFixed(1) + ' Tons') : '-',
        t.hw_coil_capacity_btuh ? ((t.hw_coil_capacity_btuh / 1000).toFixed(1) + ' MBH') : '-',
        t.inlet_size_in ? (t.inlet_size_in + '"') : '-',
        t.manufacturer || '-',
        t.model_number || '-',
      ]);

      // Add totals row
      terminalData.push([
        'TOTAL',
        `${data.terminalUnits.vavBoxCount} VAV / ${data.terminalUnits.fcuCount} FCU`,
        data.terminalUnits.totalAirflowCfm.toLocaleString() + ' CFM',
        data.terminalUnits.totalCoolingCapacityTons.toFixed(1) + ' Tons',
        '-',
        '-',
        '-',
        '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Selection', 'Type', 'CFM Range', 'Cooling', 'Heating', 'Inlet', 'Mfr', 'Model']],
        body: terminalData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== COOLING TOWERS =====
    if (config.coolingTowers && data.coolingTowers.items.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Cooling Towers', 14, yPos);
      yPos += 8;

      const towerData = data.coolingTowers.items.map(t => [
        t.name || 'Unnamed',
        t.tower_type || '-',
        (t.total_capacity_tons || 0).toFixed(0) + ' Tons',
        (t.cw_flow_gpm || 0).toLocaleString() + ' GPM',
        (t.approach_f || 0).toFixed(1) + '°F',
        (t.range_f || 0).toFixed(1) + '°F',
        (t.makeup_water_gpm || 0).toFixed(1) + ' GPM',
        (t.total_fan_kw || 0).toFixed(1) + ' kW',
      ]);

      // Add totals row
      towerData.push([
        'TOTAL',
        data.coolingTowers.totalCount + ' towers',
        data.coolingTowers.totalCapacityTons.toFixed(0) + ' Tons',
        '-',
        '-',
        '-',
        data.coolingTowers.totalMakeupWaterGpm.toFixed(1) + ' GPM',
        data.coolingTowers.totalFanKw.toFixed(1) + ' kW',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Selection', 'Type', 'Capacity', 'Flow', 'Approach', 'Range', 'Makeup', 'Fan Power']],
        body: towerData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `${data.project.name} - HVAC Design Report`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    // Save the PDF
    const fileName = `${data.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Design_Report.pdf`;
    doc.save(fileName);
  };

  const exportToExcel = (data: UnifiedDesignReportData, config: ReportSectionConfig) => {
    const workbook = XLSX.utils.book_new();

    // ===== SUMMARY SHEET =====
    if (config.executiveSummary) {
      const summaryData = [
        ['Project Name', data.project.name],
        ['Client', data.project.client_name || '-'],
        ['Location', data.project.location || '-'],
        ['Generated Date', new Date(data.generatedAt).toLocaleDateString()],
        [''],
        ['DESIGN SUMMARY'],
        ['Total Cooling Load (Tons)', data.summary.totalCoolingLoadTons],
        ['Total Cooling Load (BTU/h)', data.summary.totalCoolingLoadBtuh],
        ['Total Heating Load (BTU/h)', data.summary.totalHeatingLoadBtuh],
        ['Total Airflow (CFM)', data.summary.totalAirflowCfm],
        ['Total Outdoor Air (CFM)', data.summary.totalOutdoorAirCfm],
        ['Total Water Flow (GPM)', data.summary.totalWaterFlowGpm],
        ['Zone Count', data.summary.zoneCount],
        ['Equipment Selections', data.summary.equipmentSelectionsCount],
        ['Ventilation Calculations', data.summary.ventilationCalculationsCount],
        ['ERV/HRV Calculations', data.summary.ervCalculationsCount],
        ['CHW Plants', data.summary.chwPlantCount],
        ['HW Plants', data.summary.hwPlantCount],
        ['Smoke Control Calculations', data.summary.smokeControlCount],
        ['Thermal Comfort Analyses', data.summary.thermalComfortCount],
        ['Compliance Checks', data.summary.complianceCheckCount],
        ['Annual Energy Savings (kWh)', data.summary.totalEnergySavingsKwh],
        ['Design Completeness (%)', data.summary.designCompleteness],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // ===== LOAD CALCULATIONS SHEET =====
    if (config.loadCalculations && data.loadCalculations.items.length > 0) {
      const loadCalcRows = data.loadCalculations.items.map(lc => ({
        'Zone/Area': lc.calculation_name || 'Unnamed',
        'Cooling Load (Tons)': lc.cooling_load_tons || 0,
        'Cooling Load (BTU/h)': lc.cooling_load_btuh || 0,
        'Heating Load (BTU/h)': lc.heating_load_btuh || 0,
        'Area (sq ft)': lc.area_sqft || 0,
        'Status': lc.status || 'draft',
      }));
      
      // Add totals row
      loadCalcRows.push({
        'Zone/Area': 'TOTAL',
        'Cooling Load (Tons)': data.loadCalculations.totalCoolingTons,
        'Cooling Load (BTU/h)': data.loadCalculations.totalCoolingBtuh,
        'Heating Load (BTU/h)': data.loadCalculations.totalHeatingBtuh,
        'Area (sq ft)': data.loadCalculations.totalArea,
        'Status': '',
      });

      const loadCalcSheet = XLSX.utils.json_to_sheet(loadCalcRows);
      XLSX.utils.book_append_sheet(workbook, loadCalcSheet, 'Load Calculations');
    }

    // ===== EQUIPMENT SELECTIONS SHEET =====
    if (config.equipmentSelections && data.equipmentSelections.items.length > 0) {
      const equipmentRows = data.equipmentSelections.items.map(eq => ({
        'Selection Name': eq.selection_name,
        'Category': eq.equipment_category || '-',
        'Required Capacity (Tons)': eq.required_capacity_tons || '-',
        'Required Capacity (kW)': eq.required_capacity_kw || '-',
        'Status': eq.status,
        'Approved By': eq.approved_by || '-',
        'Approved At': eq.approved_at ? new Date(eq.approved_at).toLocaleDateString() : '-',
      }));
      const equipmentSheet = XLSX.utils.json_to_sheet(equipmentRows);
      XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment Selections');
    }

    // ===== DUCT SYSTEMS SHEET =====
    if (config.ductSystems && data.ductSystems.length > 0) {
      const ductRows = data.ductSystems.map(ds => ({
        'System Name': ds.system.system_name,
        'System Type': ds.system.system_type || '-',
        'Design Method': ds.system.design_method || '-',
        'Total Airflow (CFM)': ds.totalAirflow,
        'Static Pressure (Pa)': ds.totalPressure,
        'Material': ds.system.duct_material || '-',
        'Fan Type': ds.system.fan_type || '-',
        'Fan Power (kW)': ds.system.fan_power_kw || '-',
        'Status': ds.system.status || 'draft',
      }));
      const ductSheet = XLSX.utils.json_to_sheet(ductRows);
      XLSX.utils.book_append_sheet(workbook, ductSheet, 'Duct Systems');
    }

    // ===== PIPE SYSTEMS SHEET =====
    if (config.pipeSystems && data.pipeSystems.length > 0) {
      const pipeRows = data.pipeSystems.map(ps => ({
        'System Name': ps.system.system_name,
        'System Type': ps.system.system_type || '-',
        'Design Method': ps.system.design_method || '-',
        'Total Flow (GPM)': ps.totalFlow,
        'System Head (ft)': ps.totalHead,
        'Material': ps.system.pipe_material || '-',
        'Fluid Type': ps.system.fluid_type || '-',
        'Pump Power (HP)': ps.system.pump_power_hp || '-',
        'Status': ps.system.status || 'draft',
      }));
      const pipeSheet = XLSX.utils.json_to_sheet(pipeRows);
      XLSX.utils.book_append_sheet(workbook, pipeSheet, 'Pipe Systems');
    }

    // ===== VRF SYSTEMS SHEET =====
    if (config.vrfSystems && data.vrfSystems.length > 0) {
      const vrfRows = data.vrfSystems.map(vrf => ({
        'System Name': vrf.system.system_name,
        'System Tag': vrf.system.system_tag || '-',
        'System Type': vrf.system.system_type || '-',
        'ODU Capacity (Tons)': vrf.system.outdoor_unit_capacity_tons || '-',
        'ODU Manufacturer': vrf.system.outdoor_unit_manufacturer || '-',
        'ODU Model': vrf.system.outdoor_unit_model || '-',
        'Total IDU Capacity (Tons)': vrf.totalCapacity || '-',
        'Capacity Ratio (%)': vrf.capacityRatio ? (vrf.capacityRatio * 100).toFixed(0) : '-',
        'Refrigerant': vrf.system.refrigerant_type || '-',
        'Max Piping Length (ft)': vrf.system.max_piping_length_ft || '-',
        'Oil Return Verified': vrf.system.oil_return_verified ? 'Yes' : 'No',
        'Status': vrf.system.status || 'draft',
      }));
      const vrfSheet = XLSX.utils.json_to_sheet(vrfRows);
      XLSX.utils.book_append_sheet(workbook, vrfSheet, 'VRF Systems');
    }

    // ===== VENTILATION CALCULATIONS SHEET =====
    if (config.ventilationCalculations && data.ventilationCalculations.items.length > 0) {
      const ventRows = data.ventilationCalculations.items.map(vc => ({
        'Calculation Name': vc.calculation_name || 'Unnamed',
        'Outdoor Air (CFM)': vc.system_outdoor_air_cfm || 0,
        'System Efficiency (%)': ((vc.system_efficiency || 0) * 100).toFixed(0),
        'Total Occupancy': vc.total_occupancy || 0,
        'Total Floor Area (sq ft)': vc.total_floor_area_sqft || 0,
        'Diversity Factor': vc.diversity_factor || '-',
        'Status': vc.status || 'calculated',
        'Zone Count': vc.ventilation_zone_results?.length || 0,
      }));

      // Add totals row
      ventRows.push({
        'Calculation Name': 'TOTAL',
        'Outdoor Air (CFM)': data.ventilationCalculations.totalOutdoorAirCfm,
        'System Efficiency (%)': '-',
        'Total Occupancy': data.ventilationCalculations.totalOccupancy,
        'Total Floor Area (sq ft)': '-',
        'Diversity Factor': '-',
        'Status': '',
        'Zone Count': data.ventilationCalculations.calculationCount,
      } as any);

      const ventSheet = XLSX.utils.json_to_sheet(ventRows);
      XLSX.utils.book_append_sheet(workbook, ventSheet, 'Ventilation Calcs');
    }

    // ===== ERV/HRV SIZING SHEET =====
    if (config.ervSizing && data.ervSizing.items.length > 0) {
      const ervRows = data.ervSizing.items.map(ec => ({
        'Calculation Name': ec.calculation_name || 'Unnamed',
        'ERV Type': ec.erv_type || '-',
        'Outdoor Air (CFM)': ec.outdoor_air_cfm || 0,
        'Sensible Efficiency (%)': ec.sensible_efficiency_percent || 0,
        'Latent Efficiency (%)': ec.latent_efficiency_percent || 0,
        'Total Recovery (BTU/h)': ec.total_recovery_btuh || 0,
        'Annual Energy Savings (kWh)': ec.annual_energy_savings_kwh || 0,
        'Annual Cost Savings (SAR)': ec.annual_cost_savings_sar || 0,
        'Status': ec.status || 'calculated',
      }));

      // Add totals row
      ervRows.push({
        'Calculation Name': 'TOTAL',
        'ERV Type': '-',
        'Outdoor Air (CFM)': '-',
        'Sensible Efficiency (%)': '-',
        'Latent Efficiency (%)': '-',
        'Total Recovery (BTU/h)': '-',
        'Annual Energy Savings (kWh)': data.ervSizing.totalEnergySavingsKwh,
        'Annual Cost Savings (SAR)': data.ervSizing.totalCostSavingsSar,
        'Status': '',
      } as any);

      const ervSheet = XLSX.utils.json_to_sheet(ervRows);
      XLSX.utils.book_append_sheet(workbook, ervSheet, 'ERV-HRV Sizing');
    }

    // ===== CHW PLANTS SHEET =====
    if (config.chilledWaterPlants && data.chilledWaterPlants.items.length > 0) {
      const chwRows = data.chilledWaterPlants.items.map(p => ({
        'Plant Name': p.plant_name || 'Unnamed',
        'Plant Tag': p.plant_tag || '-',
        'Design Load (Tons)': p.design_cooling_load_tons || 0,
        'Installed Capacity (Tons)': p.total_installed_capacity_tons || 0,
        'Diversity Factor': p.diversity_factor || '-',
        'Future Expansion (%)': p.future_expansion_percent || '-',
        'CHW Supply (°F)': p.chw_supply_temp_f || '-',
        'CHW Return (°F)': p.chw_return_temp_f || '-',
        'Chiller Type': p.chiller_type || '-',
        'Pumping Config': p.pumping_config || '-',
        'Redundancy': p.redundancy_mode || '-',
        'Primary Flow (GPM)': p.total_primary_flow_gpm || '-',
        'Secondary Flow (GPM)': p.total_secondary_flow_gpm || '-',
        'Status': p.status || 'draft',
      }));
      const chwSheet = XLSX.utils.json_to_sheet(chwRows);
      XLSX.utils.book_append_sheet(workbook, chwSheet, 'CHW Plants');
    }

    // ===== HW PLANTS SHEET =====
    if (config.hotWaterPlants && data.hotWaterPlants.items.length > 0) {
      const hwRows = data.hotWaterPlants.items.map(p => ({
        'Plant Name': p.plant_name || 'Unnamed',
        'Plant Tag': p.plant_tag || '-',
        'Heating Load (BTU/h)': p.heating_load_btuh || 0,
        'Supply Temp (°F)': p.supply_temp_f || '-',
        'Return Temp (°F)': p.return_temp_f || '-',
        'Boiler Type': p.boiler_type || '-',
        'Boiler Count': p.boiler_count || '-',
        'Pumping Config': p.pumping_config || '-',
        'Redundancy': p.redundancy_mode || '-',
        'System Volume (gal)': p.system_volume_gal || '-',
        'Diversity Factor': p.diversity_factor || '-',
        'Status': p.status || 'draft',
      }));
      const hwSheet = XLSX.utils.json_to_sheet(hwRows);
      XLSX.utils.book_append_sheet(workbook, hwSheet, 'HW Plants');
    }

    // ===== SMOKE CONTROL SHEET =====
    if (config.smokeControl && data.smokeControl.items.length > 0) {
      const smokeRows = data.smokeControl.items.map(sc => ({
        'Calculation Name': sc.calculation_name || 'Unnamed',
        'Type': sc.calculation_type || '-',
        'Reference Standard': sc.reference_standard || 'NFPA 92',
        'Space Height (ft)': sc.space_height_ft || '-',
        'Space Area (sq ft)': sc.space_area_sqft || '-',
        'Number of Doors': sc.number_of_doors || '-',
        'Target Pressure (in. w.c.)': sc.target_pressure_in_wc || '-',
        'Fire Size (BTU/s)': sc.fire_size_btu_s || '-',
        'Smoke Layer Height (ft)': sc.smoke_layer_height_ft || '-',
        'Ambient Temp (°F)': sc.ambient_temp_f || '-',
        'Status': sc.status || 'draft',
      }));
      const smokeSheet = XLSX.utils.json_to_sheet(smokeRows);
      XLSX.utils.book_append_sheet(workbook, smokeSheet, 'Smoke Control');
    }

    // ===== THERMAL COMFORT SHEET =====
    if (config.thermalComfort && data.thermalComfort.items.length > 0) {
      const thermalRows = data.thermalComfort.items.map(tc => ({
        'Analysis Name': tc.analysis_name || 'Unnamed',
        'Analysis Type': tc.analysis_type || '-',
        'Air Temp (°C)': tc.air_temp_c || '-',
        'Mean Radiant Temp (°C)': tc.mean_radiant_temp_c || '-',
        'Relative Humidity (%)': tc.relative_humidity_percent || '-',
        'Air Velocity (m/s)': tc.air_velocity_m_s || '-',
        'Metabolic Rate (met)': tc.metabolic_rate_met || '-',
        'Clothing Insulation (clo)': tc.clothing_insulation_clo || '-',
        'Acceptability Class': tc.acceptability_class || '-',
        'Status': tc.status || 'draft',
      }));
      const thermalSheet = XLSX.utils.json_to_sheet(thermalRows);
      XLSX.utils.book_append_sheet(workbook, thermalSheet, 'Thermal Comfort');
    }

    // ===== COMPLIANCE CHECKS SHEET =====
    if (config.complianceChecks && data.compliance.sbcChecks.length > 0) {
      const complianceRows = data.compliance.sbcChecks.map(c => ({
        'Check Name': c.check_name || 'Unnamed',
        'Climate Zone': c.climate_zone_id || '-',
        'Total Requirements': c.total_requirements || 0,
        'Passed': c.passed_count || 0,
        'Failed': c.failed_count || 0,
        'Pending': c.pending_count || 0,
        'Compliance Score (%)': c.compliance_score_percent || 0,
        'Status': c.status || 'draft',
      }));
      const complianceSheet = XLSX.utils.json_to_sheet(complianceRows);
      XLSX.utils.book_append_sheet(workbook, complianceSheet, 'SBC Compliance');
    }

    // ===== ACOUSTIC ANALYSIS SHEET =====
    if (config.acousticAnalysis && data.acousticAnalysis.items.length > 0) {
      const acousticRows = data.acousticAnalysis.items.map(ac => ({
        'Calculation Name': ac.name,
        'Zone': ac.zone_name || 'Project-level',
        'Calculation Type': ac.calculation_type.replace(/_/g, ' '),
        'Target NC': ac.target_nc ?? '-',
        'Calculated NC': ac.calculated_nc ?? '-',
        'Meets Target': ac.meets_target === true ? 'Yes' : ac.meets_target === false ? 'No' : '-',
        'Created Date': new Date(ac.created_at).toLocaleDateString(),
      }));

      // Add summary row
      acousticRows.push({
        'Calculation Name': 'SUMMARY',
        'Zone': `${data.acousticAnalysis.totalZonesWithAcoustics} zones analyzed`,
        'Calculation Type': '-',
        'Target NC': '-',
        'Calculated NC': data.acousticAnalysis.averageNC?.toString() ?? '-',
        'Meets Target': `${data.acousticAnalysis.zonesMeetingTarget} passing`,
        'Created Date': '',
      } as any);

      const acousticSheet = XLSX.utils.json_to_sheet(acousticRows);
      XLSX.utils.book_append_sheet(workbook, acousticSheet, 'Acoustic Analysis');
    }

    // ===== COIL SELECTIONS SHEET =====
    if (config.coilSelections && data.coilSelections.items.length > 0) {
      const coilRows = data.coilSelections.items.map(c => ({
        'Selection Name': c.name || 'Unnamed',
        'Coil Type': c.coil_type || '-',
        'Design CFM': c.design_cfm || 0,
        'Capacity (Tons)': c.capacity_tons || 0,
        'Capacity (MBH)': c.capacity_mbh || 0,
        'Water Flow (GPM)': c.water_flow_gpm || 0,
        'Air PD (in. w.c.)': c.air_pressure_drop_in || 0,
        'Water PD (ft)': c.water_pressure_drop_ft || 0,
        'Rows': c.rows || '-',
        'FPI': c.fins_per_inch || '-',
        'Face Velocity (FPM)': c.face_velocity_fpm || '-',
        'Manufacturer': c.manufacturer || '-',
        'Model': c.model_number || '-',
      }));

      // Add totals row
      coilRows.push({
        'Selection Name': 'TOTAL',
        'Coil Type': `${data.coilSelections.coolingCoilCount} Cool / ${data.coilSelections.heatingCoilCount} Heat`,
        'Design CFM': data.coilSelections.totalAirflowCfm,
        'Capacity (Tons)': data.coilSelections.totalCoolingCapacityTons,
        'Capacity (MBH)': data.coilSelections.totalHeatingCapacityMbh,
        'Water Flow (GPM)': '-',
        'Air PD (in. w.c.)': '-',
        'Water PD (ft)': '-',
        'Rows': '-',
        'FPI': '-',
        'Face Velocity (FPM)': '-',
        'Manufacturer': '-',
        'Model': '-',
      } as any);

      const coilSheet = XLSX.utils.json_to_sheet(coilRows);
      XLSX.utils.book_append_sheet(workbook, coilSheet, 'Coil Selections');
    }

    // ===== FILTER SELECTIONS SHEET =====
    if (config.filterSelections && data.filterSelections.items.length > 0) {
      const filterRows = data.filterSelections.items.map(f => ({
        'Selection Name': f.name || 'Unnamed',
        'Filter Position': f.filter_position || '-',
        'MERV Rating': f.merv_rating || '-',
        'Filter Type': f.filter_type || '-',
        'Design CFM': f.design_cfm || 0,
        'Quantity': f.quantity || 1,
        'Face Velocity (FPM)': f.face_velocity_fpm || '-',
        'Clean PD (in. w.c.)': f.clean_pressure_drop_in || 0,
        'Final PD (in. w.c.)': f.final_pressure_drop_in || 0,
        'Annual Energy Cost (SAR)': f.annual_energy_cost_sar || 0,
        'Annual Replace Cost (SAR)': f.replacement_cost_sar || 0,
        'Manufacturer': f.manufacturer || '-',
        'Model': f.model_number || '-',
      }));

      // Add totals row
      filterRows.push({
        'Selection Name': 'TOTAL',
        'Filter Position': `${data.filterSelections.preFilterCount} Pre / ${data.filterSelections.finalFilterCount} Final`,
        'MERV Rating': 'Avg ' + data.filterSelections.averageMervRating.toFixed(0),
        'Filter Type': '-',
        'Design CFM': '-',
        'Quantity': data.filterSelections.totalCount,
        'Face Velocity (FPM)': '-',
        'Clean PD (in. w.c.)': '-',
        'Final PD (in. w.c.)': '-',
        'Annual Energy Cost (SAR)': data.filterSelections.totalAnnualEnergyCostSar,
        'Annual Replace Cost (SAR)': '-',
        'Manufacturer': '-',
        'Model': '-',
      } as any);

      const filterSheet = XLSX.utils.json_to_sheet(filterRows);
      XLSX.utils.book_append_sheet(workbook, filterSheet, 'Filter Selections');
    }

    // ===== TERMINAL UNITS SHEET =====
    if (config.terminalUnits && data.terminalUnits.items.length > 0) {
      const terminalRows = data.terminalUnits.items.map(t => ({
        'Unit Tag': t.unit_tag || 'Unnamed',
        'Unit Type': t.unit_type || '-',
        'Location': t.location_description || '-',
        'Min CFM': t.min_cfm || 0,
        'Max CFM': t.max_cfm || 0,
        'Inlet Size (in)': t.inlet_size_in || '-',
        'CHW Capacity (BTU/h)': t.chw_coil_capacity_btuh || '-',
        'HW Capacity (BTU/h)': t.hw_coil_capacity_btuh || '-',
        'Reheat Type': t.reheat_type || '-',
        'Sound Level (NC)': t.noise_nc || '-',
        'Manufacturer': t.manufacturer || '-',
        'Model': t.model_number || '-',
      }));

      // Add totals row
      terminalRows.push({
        'Unit Tag': 'TOTAL',
        'Unit Type': `${data.terminalUnits.vavBoxCount} VAV / ${data.terminalUnits.fcuCount} FCU`,
        'Location': '-',
        'Min CFM': '-',
        'Max CFM': data.terminalUnits.totalAirflowCfm,
        'Inlet Size (in)': '-',
        'CHW Capacity (BTU/h)': (data.terminalUnits.totalCoolingCapacityTons * 12000).toFixed(0),
        'HW Capacity (BTU/h)': '-',
        'Reheat Type': '-',
        'Sound Level (NC)': '-',
        'Manufacturer': '-',
        'Model': '-',
      } as any);

      const terminalSheet = XLSX.utils.json_to_sheet(terminalRows);
      XLSX.utils.book_append_sheet(workbook, terminalSheet, 'Terminal Units');
    }

    // ===== COOLING TOWERS SHEET =====
    if (config.coolingTowers && data.coolingTowers.items.length > 0) {
      const towerRows = data.coolingTowers.items.map(t => ({
        'Selection Name': t.name || 'Unnamed',
        'Tower Type': t.tower_type || '-',
        'Fill Type': t.fill_type || '-',
        'Cell Count': t.number_of_cells || 1,
        'Capacity per Cell (Tons)': t.capacity_per_cell_tons || '-',
        'Total Capacity (Tons)': t.total_capacity_tons || 0,
        'Design Flow (GPM)': t.cw_flow_gpm || 0,
        'Approach (°F)': t.approach_f || '-',
        'Range (°F)': t.range_f || '-',
        'Wet Bulb (°F)': t.design_wet_bulb_f || '-',
        'Makeup Water (GPM)': t.makeup_water_gpm || 0,
        'Blowdown (GPM)': t.blowdown_gpm || '-',
        'Fan Power (kW)': t.total_fan_kw || 0,
        'Sound Level (dBA)': t.sound_level_db || '-',
        'Manufacturer': t.manufacturer || '-',
        'Model': t.model_number || '-',
      }));

      // Add totals row
      towerRows.push({
        'Selection Name': 'TOTAL',
        'Tower Type': '-',
        'Fill Type': '-',
        'Cell Count': data.coolingTowers.totalCount,
        'Capacity per Cell (Tons)': '-',
        'Total Capacity (Tons)': data.coolingTowers.totalCapacityTons,
        'Design Flow (GPM)': '-',
        'Approach (°F)': '-',
        'Range (°F)': '-',
        'Wet Bulb (°F)': '-',
        'Makeup Water (GPM)': data.coolingTowers.totalMakeupWaterGpm,
        'Blowdown (GPM)': '-',
        'Fan Power (kW)': data.coolingTowers.totalFanKw,
        'Sound Level (dBA)': '-',
        'Manufacturer': '-',
        'Model': '-',
      } as any);

      const towerSheet = XLSX.utils.json_to_sheet(towerRows);
      XLSX.utils.book_append_sheet(workbook, towerSheet, 'Cooling Towers');
    }

    // Save the Excel file
    const fileName = `${data.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Design_Report.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return {
    data: reportData.data,
    isLoading: reportData.isLoading,
    error: reportData.error,
    exportToPDF,
    exportToExcel,
  };
}

export const DEFAULT_REPORT_CONFIG: ReportSectionConfig = {
  coverPage: true,
  executiveSummary: true,
  loadCalculations: true,
  equipmentSelections: true,
  ductSystems: true,
  pipeSystems: true,
  vrfSystems: true,
  ventilationCalculations: true,
  ervSizing: true,
  chilledWaterPlants: true,
  hotWaterPlants: true,
  smokeControl: true,
  thermalComfort: true,
  complianceChecks: true,
  acousticAnalysis: true,
  coilSelections: true,
  filterSelections: true,
  terminalUnits: true,
  coolingTowers: true,
  detailedAppendix: false,
};
