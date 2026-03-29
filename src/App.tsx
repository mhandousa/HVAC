import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SandboxProvider } from "@/contexts/SandboxContext";
import { CommandPalette } from "@/components/shortcuts/CommandPalette";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Equipment from "./pages/Equipment";
import EquipmentCatalog from "./pages/EquipmentCatalog";
import EquipmentSelection from "./pages/EquipmentSelection";
import Customers from "./pages/Customers";
import Monitoring from "./pages/Monitoring";
import Design from "./pages/Design";
import PressureDropCalculator from "./pages/PressureDropCalculator";
import InsulationCalculator from "./pages/InsulationCalculator";
import MaterialTakeoff from "./pages/MaterialTakeoff";
import AcousticCalculator from "./pages/AcousticCalculator";
import DesignValidation from "./pages/DesignValidation";
import VentilationCalculator from "./pages/VentilationCalculator";
import LoadCalculation from "./pages/LoadCalculation";
import PsychrometricChart from "./pages/PsychrometricChart";
import DuctSizing from "./pages/DuctSizing";
import DuctDesigner from "./pages/DuctDesigner";
import PipeSizing from "./pages/PipeSizing";
import PipeDesigner from "./pages/PipeDesigner";
import PipeComparison from "./pages/PipeComparison";
import DuctComparison from "./pages/DuctComparison";
import Service from "./pages/Service";
import ServiceContracts from "./pages/ServiceContracts";
import DispatchBoard from "./pages/DispatchBoard";
import Invoicing from "./pages/Invoicing";
import Maintenance from "./pages/Maintenance";
import EnergyAnalytics from "./pages/EnergyAnalytics";
import EnergyMeters from "./pages/EnergyMeters";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import ZoneReports from "./pages/ZoneReports";
import DataAudit from "./pages/DataAudit";
import ERVSizing from "./pages/ERVSizing";
import SequenceOfOperations from "./pages/SequenceOfOperations";
import EquipmentSchedule from "./pages/EquipmentSchedule";
import ChilledWaterPlant from "./pages/ChilledWaterPlant";
import HWPlant from "./pages/HWPlant";
import SmokeControl from "./pages/SmokeControl";
import ThermalComfort from "./pages/ThermalComfort";
import SBCCompliance from "./pages/SBCCompliance";
import ASHRAE90Compliance from "./pages/ASHRAE90Compliance";
import BASPointsList from "./pages/BASPointsList";
import Commissioning from "./pages/Commissioning";
import DeficiencyDashboard from "./pages/DeficiencyDashboard";
import TechnicianWorkload from "./pages/TechnicianWorkload";
import VRFDesigner from "./pages/VRFDesigner";
import DesignCompleteness from "./pages/DesignCompleteness";
import SpecializedToolsComparison from "./pages/SpecializedToolsComparison";
import DiffuserSelection from "./pages/DiffuserSelection";
import TerminalUnitSizing from "./pages/TerminalUnitSizing";
import TerminalUnitSchedule from "./pages/TerminalUnitSchedule";
import AcousticFloorPlan from "./pages/AcousticFloorPlan";
import AcousticMeasurement from "./pages/AcousticMeasurement";
import FanSelection from "./pages/FanSelection";
import PumpSelection from "./pages/PumpSelection";
import AirBalanceReport from "./pages/AirBalanceReport";
import WaterBalanceReport from "./pages/WaterBalanceReport";
import SilencerSelectionTool from "./pages/SilencerSelectionTool";
import SilencerSizingTool from "./pages/SilencerSizingTool";
import NoisePathAnalysis from "./pages/NoisePathAnalysis";
import RoomAcousticsCalculator from "./pages/RoomAcousticsCalculator";
import VibrationIsolationTool from "./pages/VibrationIsolationTool";
import DuctLiningOptimizer from "./pages/DuctLiningOptimizer";
import AcousticDashboard from "./pages/AcousticDashboard";
import AcousticCostEstimatorPage from "./pages/AcousticCostEstimatorPage";
import ZoneAcousticSettings from "./pages/ZoneAcousticSettings";
import AcousticComparison from "./pages/AcousticComparison";
import LifecycleCostAnalyzerPage from "./pages/LifecycleCostAnalyzerPage";
import AcousticROICalculatorPage from "./pages/AcousticROICalculatorPage";
import TreatmentComparisonPage from "./pages/TreatmentComparisonPage";
import TreatmentWizardPage from "./pages/TreatmentWizardPage";
import AHUConfiguration from "./pages/AHUConfiguration";
import DesignWorkflowWizardPage from "./pages/DesignWorkflowWizardPage";
import DesignAuditDashboard from "./pages/DesignAuditDashboard";
import DesignHealthDashboard from "./pages/DesignHealthDashboard";
import CoilSelection from "./pages/CoilSelection";
import FilterSelection from "./pages/FilterSelection";
import VAVBoxSelection from "./pages/VAVBoxSelection";
import FCUSelection from "./pages/FCUSelection";
import CoolingTowerSizing from "./pages/CoolingTowerSizing";
import ChillerSelection from "./pages/ChillerSelection";
import BoilerSelection from "./pages/BoilerSelection";
import EquipmentCatalogAdmin from "./pages/EquipmentCatalogAdmin";
import DesignDocumentation from "./pages/DesignDocumentation";
import DesignWorkflowDiagram from "./pages/DesignWorkflowDiagram";
import ProjectTimeline from "./pages/ProjectTimeline";
import EconomizerSizing from "./pages/EconomizerSizing";
import ExpansionTankSizing from "./pages/ExpansionTankSizing";
import ControlValveSizing from "./pages/ControlValveSizing";
import DesignApprovalsDashboard from "./pages/DesignApprovalsDashboard";
import CollaborationDashboard from "./pages/CollaborationDashboard";
import DesignSystemCoverage from "./pages/DesignSystemCoverage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <SandboxProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandPalette />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/timeline" element={<ProjectTimeline />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/design" element={<Design />} />
              <Route path="/design/load-calculation" element={<LoadCalculation />} />
              <Route path="/design/equipment-catalog" element={<EquipmentCatalog />} />
              <Route path="/design/equipment-selection" element={<EquipmentSelection />} />
              <Route path="/design/psychrometric" element={<PsychrometricChart />} />
              <Route path="/design/duct-sizing" element={<DuctSizing />} />
              <Route path="/design/duct-designer" element={<DuctDesigner />} />
              <Route path="/design/pipe-sizing" element={<PipeSizing />} />
              <Route path="/design/pipe-designer" element={<PipeDesigner />} />
              <Route path="/design/pipe-comparison" element={<PipeComparison />} />
              <Route path="/design/duct-comparison" element={<DuctComparison />} />
              <Route path="/design/pressure-drop" element={<PressureDropCalculator />} />
              <Route path="/design/ventilation-calculator" element={<VentilationCalculator />} />
              <Route path="/design/insulation-calculator" element={<InsulationCalculator />} />
              <Route path="/design/material-takeoff" element={<MaterialTakeoff />} />
              <Route path="/design/acoustic-calculator" element={<AcousticCalculator />} />
              <Route path="/design/acoustic-floor-plan" element={<AcousticFloorPlan />} />
              <Route path="/design/validation" element={<DesignValidation />} />
              <Route path="/design/erv-sizing" element={<ERVSizing />} />
              <Route path="/design/sequence-of-operations" element={<SequenceOfOperations />} />
              <Route path="/design/equipment-schedule" element={<EquipmentSchedule />} />
            <Route path="/design/chw-plant" element={<ChilledWaterPlant />} />
            <Route path="/design/hw-plant" element={<HWPlant />} />
            <Route path="/design/smoke-control" element={<SmokeControl />} />
            <Route path="/design/thermal-comfort" element={<ThermalComfort />} />
            <Route path="/design/sbc-compliance" element={<SBCCompliance />} />
            <Route path="/design/ashrae-compliance" element={<ASHRAE90Compliance />} />
            <Route path="/design/bas-points" element={<BASPointsList />} />
            <Route path="/design/vrf-designer" element={<VRFDesigner />} />
            <Route path="/design/completeness" element={<DesignCompleteness />} />
            <Route path="/design/specialized-tools-comparison" element={<SpecializedToolsComparison />} />
            <Route path="/design/diffuser-selection" element={<DiffuserSelection />} />
            <Route path="/design/terminal-unit-sizing" element={<TerminalUnitSizing />} />
            <Route path="/design/terminal-unit-schedule" element={<TerminalUnitSchedule />} />
            <Route path="/design/fan-selection" element={<FanSelection />} />
            <Route path="/design/pump-selection" element={<PumpSelection />} />
            <Route path="/design/air-balance-report" element={<AirBalanceReport />} />
            <Route path="/design/water-balance-report" element={<WaterBalanceReport />} />
            <Route path="/design/silencer-selection" element={<SilencerSelectionTool />} />
            <Route path="/design/silencer-sizing" element={<SilencerSizingTool />} />
            <Route path="/design/noise-path-analysis" element={<NoisePathAnalysis />} />
            <Route path="/design/room-acoustics" element={<RoomAcousticsCalculator />} />
            <Route path="/design/vibration-isolation" element={<VibrationIsolationTool />} />
            <Route path="/design/duct-lining" element={<DuctLiningOptimizer />} />
            <Route path="/design/acoustic-dashboard" element={<AcousticDashboard />} />
            <Route path="/design/acoustic-cost-estimator" element={<AcousticCostEstimatorPage />} />
            <Route path="/design/acoustic-settings" element={<ZoneAcousticSettings />} />
            <Route path="/design/acoustic-comparison" element={<AcousticComparison />} />
            <Route path="/design/lifecycle-cost-analyzer" element={<LifecycleCostAnalyzerPage />} />
            <Route path="/design/acoustic-roi" element={<AcousticROICalculatorPage />} />
            <Route path="/design/treatment-comparison" element={<TreatmentComparisonPage />} />
            <Route path="/design/treatment-wizard" element={<TreatmentWizardPage />} />
            <Route path="/design/ahu-configuration" element={<AHUConfiguration />} />
            <Route path="/design/wizard" element={<DesignWorkflowWizardPage />} />
            <Route path="/design/audit" element={<DesignAuditDashboard />} />
            <Route path="/design/health" element={<DesignHealthDashboard />} />
            <Route path="/design/coil-selection" element={<CoilSelection />} />
            <Route path="/design/filter-selection" element={<FilterSelection />} />
            <Route path="/design/vav-box-selection" element={<VAVBoxSelection />} />
            <Route path="/design/fcu-selection" element={<FCUSelection />} />
            <Route path="/design/cooling-tower-sizing" element={<CoolingTowerSizing />} />
            <Route path="/design/chiller-selection" element={<ChillerSelection />} />
            <Route path="/design/boiler-selection" element={<BoilerSelection />} />
            <Route path="/design/documentation" element={<DesignDocumentation />} />
            <Route path="/design/workflow-diagram" element={<DesignWorkflowDiagram />} />
            <Route path="/design/economizer-sizing" element={<EconomizerSizing />} />
            <Route path="/design/expansion-tank-sizing" element={<ExpansionTankSizing />} />
            <Route path="/design/control-valve-sizing" element={<ControlValveSizing />} />
            <Route path="/design/approvals" element={<DesignApprovalsDashboard />} />
            <Route path="/design/collaboration" element={<CollaborationDashboard />} />
            <Route path="/design/coverage" element={<DesignSystemCoverage />} />
            <Route path="/admin/equipment-catalog" element={<EquipmentCatalogAdmin />} />
              <Route path="/commissioning" element={<Commissioning />} />
              <Route path="/commissioning/acoustic-measurement" element={<AcousticMeasurement />} />
              <Route path="/deficiencies" element={<DeficiencyDashboard />} />
              <Route path="/technician-workload" element={<TechnicianWorkload />} />
              <Route path="/service" element={<Service />} />
              <Route path="/service/contracts" element={<ServiceContracts />} />
              <Route path="/service/dispatch" element={<DispatchBoard />} />
              <Route path="/invoicing" element={<Invoicing />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/energy" element={<EnergyAnalytics />} />
              <Route path="/monitoring/meters" element={<EnergyMeters />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/zones" element={<ZoneReports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/data-audit" element={<DataAudit />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </SandboxProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
