import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UnifiedDesignReportDialog } from '@/components/design/UnifiedDesignReportDialog';
import { DesignWorkflowQuickStart } from '@/components/design/DesignWorkflowQuickStart';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { useZoneContext } from '@/hooks/useZoneContext';
import {
  Calculator,
  Wind,
  Thermometer,
  Ruler,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Droplets,
  Gauge,
  Package,
  Scale,
  Snowflake,
  Volume2,
  ShieldCheck,
  RefreshCw,
  ClipboardList,
  Factory,
  Network,
  FileText,
  CheckSquare,
  Flame,
  CloudCog,
  ThermometerSun,
  Building2,
  BarChart3,
  Waves,
  Activity,
  Layers,
  Users,
  FileCheck,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ToolStatus = 'available' | 'coming-soon';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: typeof Calculator;
  status: ToolStatus;
  href?: string;
}

interface ToolCategory {
  name: string;
  description: string;
  tools: Tool[];
}

export default function Design() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { projectId } = useZoneContext();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toolCategories: ToolCategory[] = [
    {
      name: 'Core Calculations',
      description: 'Fundamental load and air analysis tools',
      tools: [
        {
          id: 'load-calc',
          name: 'Load Calculation',
          description: 'Calculate heating and cooling loads using ASHRAE methodology',
          icon: Calculator,
          status: 'available',
          href: '/design/load-calculation',
        },
        {
          id: 'ventilation-calculator',
          name: 'Ventilation Calculator',
          description: 'ASHRAE 62.1 outdoor air calculations with DCV (Demand-Controlled Ventilation) mode',
          icon: Wind,
          status: 'available',
          href: '/design/ventilation-calculator',
        },
        {
          id: 'psychrometric',
          name: 'Psychrometric Chart',
          description: 'Interactive psychrometric analysis and coil sizing',
          icon: Thermometer,
          status: 'available',
          href: '/design/psychrometric',
        },
        {
          id: 'erv-sizing',
          name: 'ERV/HRV Sizing',
          description: 'Energy recovery ventilator sizing with heat recovery and annual savings calculations',
          icon: RefreshCw,
          status: 'available',
          href: '/design/erv-sizing',
        },
      ],
    },
    {
      name: 'Equipment',
      description: 'Equipment selection and scheduling',
      tools: [
        {
          id: 'equipment-catalog',
          name: 'Equipment Catalog',
          description: 'Browse HVAC equipment from major manufacturers with Saudi certifications',
          icon: Package,
          status: 'available',
          href: '/design/equipment-catalog',
        },
        {
          id: 'equipment-selection',
          name: 'Equipment Selection Wizard',
          description: 'Select equipment based on calculated loads with lifecycle cost analysis',
          icon: FileSpreadsheet,
          status: 'available',
          href: '/design/equipment-selection',
        },
        {
          id: 'terminal-unit-sizing',
          name: 'VAV/FCU Terminal Sizing',
          description: 'Size VAV boxes and fan coil units with automatic load import and reheat calculations',
          icon: Wind,
          status: 'available',
          href: '/design/terminal-unit-sizing',
        },
        {
          id: 'ahu-configuration',
          name: 'AHU Configuration',
          description: 'Configure air handling units with coils, fans, dampers, and control sequences',
          icon: Factory,
          status: 'available',
          href: '/design/ahu-configuration',
        },
        {
          id: 'coil-selection',
          name: 'Coil Selection',
          description: 'Select and size cooling/heating coils with performance analysis',
          icon: Snowflake,
          status: 'available',
          href: '/design/coil-selection',
        },
        {
          id: 'filter-selection',
          name: 'Filter Selection',
          description: 'Select air filters with MERV ratings and Saudi dust load factors',
          icon: Wind,
          status: 'available',
          href: '/design/filter-selection',
        },
        {
          id: 'vav-box-selection',
          name: 'VAV Box Selection',
          description: 'Size VAV boxes with inlet velocity and NC rating analysis',
          icon: Wind,
          status: 'available',
          href: '/design/vav-box-selection',
        },
        {
          id: 'fcu-selection',
          name: 'FCU Selection',
          description: 'Fan coil unit selection with coil sizing and water flow calculations',
          icon: Droplets,
          status: 'available',
          href: '/design/fcu-selection',
        },
        {
          id: 'equipment-schedule',
          name: 'Equipment Schedule',
          description: 'Generate formatted equipment schedules with tags, specs, and locations for construction documents',
          icon: ClipboardList,
          status: 'available',
          href: '/design/equipment-schedule',
        },
      ],
    },
    {
      name: 'Air Distribution',
      description: 'Duct system design and analysis',
      tools: [
        {
          id: 'duct-sizing',
          name: 'Duct Sizing',
          description: 'Size ducts using equal friction or static regain methods',
          icon: Wind,
          status: 'available',
          href: '/design/duct-sizing',
        },
        {
          id: 'duct-designer',
          name: 'Duct System Designer',
          description: 'Visual duct layout with tree view, critical path analysis, and ASHRAE fittings library',
          icon: Ruler,
          status: 'available',
          href: '/design/duct-designer',
        },
        {
          id: 'duct-comparison',
          name: 'Duct System Comparison',
          description: 'Compare multiple duct system designs side-by-side with charts and recommendations',
          icon: Scale,
          status: 'available',
          href: '/design/duct-comparison',
        },
        {
          id: 'diffuser-selection',
          name: 'Diffuser/Grille Selection',
          description: 'Size and select supply diffusers and return grilles with throw pattern and NC rating analysis',
          icon: Wind,
          status: 'available',
          href: '/design/diffuser-selection',
        },
        {
          id: 'fan-selection',
          name: 'Fan Selection Wizard',
          description: 'Select and compare fans with curve analysis and operating point verification',
          icon: Wind,
          status: 'available',
          href: '/design/fan-selection',
        },
        {
          id: 'silencer-sizing',
          name: 'Silencer Sizing Calculator',
          description: 'Calculate optimal silencer dimensions based on airflow, pressure, and attenuation requirements',
          icon: Volume2,
          status: 'available',
          href: '/design/silencer-sizing',
        },
        {
          id: 'economizer-sizing',
          name: 'Economizer Sizing',
          description: 'Size air-side economizers per ASHRAE 90.1 with climate zone compliance and energy savings',
          icon: Wind,
          status: 'available',
          href: '/design/economizer-sizing',
        },
      ],
    },
    {
      name: 'Water Distribution',
      description: 'Pipe system design and analysis',
      tools: [
        {
          id: 'pipe-sizing',
          name: 'Pipe Sizing',
          description: 'Calculate pipe sizes for chilled water and hot water systems',
          icon: Droplets,
          status: 'available',
          href: '/design/pipe-sizing',
        },
        {
          id: 'pipe-designer',
          name: 'Pipe System Designer',
          description: 'Visual pipe layout with tree view, hydraulic analysis, and K-factor fittings library',
          icon: Ruler,
          status: 'available',
          href: '/design/pipe-designer',
        },
        {
          id: 'pipe-comparison',
          name: 'Pipe System Comparison',
          description: 'Compare multiple pipe system designs side-by-side with charts and recommendations',
          icon: Scale,
          status: 'available',
          href: '/design/pipe-comparison',
        },
        {
          id: 'pump-selection',
          name: 'Pump Selection Wizard',
          description: 'Select and compare pumps with curve analysis and NPSH verification',
          icon: Gauge,
          status: 'available',
          href: '/design/pump-selection',
        },
        {
          id: 'control-valve-sizing',
          name: 'Control Valve Sizing',
          description: 'Size 2-way and 3-way control valves with Cv calculation and valve authority analysis',
          icon: Gauge,
          status: 'available',
          href: '/design/control-valve-sizing',
        },
      ],
    },
    {
      name: 'VRF Systems',
      description: 'Variable refrigerant flow design',
      tools: [
        {
          id: 'vrf-designer',
          name: 'VRF System Designer',
          description: 'Design VRF systems with refrigerant piping sizing, oil return verification, and branch selector configuration',
          icon: Snowflake,
          status: 'available',
          href: '/design/vrf-designer',
        },
      ],
    },
    {
      name: 'Plant Design',
      description: 'Central plant sizing tools',
      tools: [
        {
          id: 'chw-plant',
          name: 'Chilled Water Plant Sizing',
          description: 'Size central chilled water plants including chillers, pumps, and cooling towers',
          icon: Factory,
          status: 'available',
          href: '/design/chw-plant',
        },
        {
          id: 'chiller-selection',
          name: 'Chiller Selection',
          description: 'Select chillers with AHRI performance data, EER/IPLV comparisons, and part-load analysis',
          icon: Snowflake,
          status: 'available',
          href: '/design/chiller-selection',
        },
        {
          id: 'hw-plant',
          name: 'Hot Water Plant Sizing',
          description: 'Size boilers, pumps, expansion tanks, and piping for heating systems',
          icon: Flame,
          status: 'available',
          href: '/design/hw-plant',
        },
        {
          id: 'boiler-selection',
          name: 'Boiler Selection',
          description: 'Select boilers with AHRI efficiency data, AFUE comparisons, and fuel type analysis',
          icon: Flame,
          status: 'available',
          href: '/design/boiler-selection',
        },
        {
          id: 'cooling-tower-sizing',
          name: 'Cooling Tower Sizing',
          description: 'Size cooling towers with Saudi wet bulb conditions and water treatment',
          icon: Droplets,
          status: 'available',
          href: '/design/cooling-tower-sizing',
        },
        {
          id: 'expansion-tank-sizing',
          name: 'Expansion Tank Sizing',
          description: 'Size diaphragm and bladder tanks for CHW, HHW, and condenser water systems',
          icon: Gauge,
          status: 'available',
          href: '/design/expansion-tank-sizing',
        },
      ],
    },
    {
      name: 'Analysis & Compliance',
      description: 'System analysis and code verification',
      tools: [
        {
          id: 'pressure-drop',
          name: 'Pressure Drop Calculator',
          description: 'Calculate pressure drops for ducts, pipes, and fittings',
          icon: Gauge,
          status: 'available',
          href: '/design/pressure-drop',
        },
        {
          id: 'insulation-calc',
          name: 'Insulation Calculator',
          description: 'Calculate pipe and duct insulation thickness for condensation prevention in Saudi climate',
          icon: Snowflake,
          status: 'available',
          href: '/design/insulation-calculator',
        },
        {
          id: 'acoustic-calc',
          name: 'Acoustic Calculator',
          description: 'Analyze noise levels and NC ratings for duct/pipe systems per Saudi indoor standards',
          icon: Volume2,
          status: 'available',
          href: '/design/acoustic-calculator',
        },
        {
          id: 'acoustic-floor-plan',
          name: 'Acoustic Floor Plan',
          description: 'Visualize NC levels across zones and identify acoustic hotspots from terminal units',
          icon: Volume2,
          status: 'available',
          href: '/design/acoustic-floor-plan',
        },
        {
          id: 'noise-path-analysis',
          name: 'Noise Path Analysis',
          description: 'Trace sound from equipment through ductwork to occupied spaces with element-by-element attenuation',
          icon: Volume2,
          status: 'available',
          href: '/design/noise-path-analysis',
        },
        {
          id: 'room-acoustics',
          name: 'Room Acoustics Calculator',
          description: 'Convert sound power to pressure with room absorption, distance, and directivity corrections',
          icon: Waves,
          status: 'available',
          href: '/design/room-acoustics',
        },
        {
          id: 'vibration-isolation',
          name: 'Vibration Isolation Calculator',
          description: 'Select vibration isolators based on equipment weight, speed, and floor construction',
          icon: Activity,
          status: 'available',
          href: '/design/vibration-isolation',
        },
        {
          id: 'duct-lining',
          name: 'Duct Lining Optimizer',
          description: 'Calculate required duct lining length and type to achieve target NC reduction',
          icon: Layers,
          status: 'available',
          href: '/design/duct-lining',
        },
        {
          id: 'acoustic-dashboard',
          name: 'Acoustic Dashboard',
          description: 'Project-wide NC compliance overview with zone heatmap and remediation quick links',
          icon: BarChart3,
          status: 'available',
          href: '/design/acoustic-dashboard',
        },
        {
          id: 'acoustic-cost-estimator',
          name: 'Acoustic Cost Estimator',
          description: 'Calculate material and installation costs for silencers, duct lining, and vibration isolators',
          icon: Calculator,
          status: 'available',
          href: '/design/acoustic-cost-estimator',
        },
        {
          id: 'thermal-comfort',
          name: 'Thermal Comfort Analysis',
          description: 'ASHRAE 55 PMV/PPD calculations and adaptive comfort analysis',
          icon: ThermometerSun,
          status: 'available',
          href: '/design/thermal-comfort',
        },
        {
          id: 'smoke-control',
          name: 'Smoke Control Calculator',
          description: 'Stairwell pressurization and atrium exhaust calculations per NFPA 92',
          icon: CloudCog,
          status: 'available',
          href: '/design/smoke-control',
        },
        {
          id: 'ashrae-compliance',
          name: 'ASHRAE 90.1 Compliance',
          description: 'Verify HVAC designs meet energy code requirements for Saudi Arabia projects',
          icon: ShieldCheck,
          status: 'available',
          href: '/design/ashrae-compliance',
        },
        {
          id: 'sbc-compliance',
          name: 'SBC Compliance Checker',
          description: 'Verify HVAC designs meet Saudi Building Code requirements',
          icon: Building2,
          status: 'available',
          href: '/design/sbc-compliance',
        },
        {
          id: 'design-validation',
          name: 'Design Validation Report',
          description: 'Cross-check loads, equipment, and systems for end-to-end design consistency',
          icon: ShieldCheck,
          status: 'available',
          href: '/design/validation',
        },
      ],
    },
    {
      name: 'Documentation & Tracking',
      description: 'Output generation and progress tracking',
      tools: [
        {
          id: 'bas-points',
          name: 'BAS Points List Generator',
          description: 'Generate BACnet/Modbus point schedules with Saudi naming conventions',
          icon: Network,
          status: 'available',
          href: '/design/bas-points',
        },
        {
          id: 'sequence-of-operations',
          name: 'Sequence of Operations',
          description: 'Generate control sequences for AHU, chiller plants, VRF, FCU and more',
          icon: FileSpreadsheet,
          status: 'available',
          href: '/design/sequence-of-operations',
        },
        {
          id: 'material-takeoff',
          name: 'Material Takeoff / BOQ',
          description: 'Generate bill of quantities for ducts, pipes, fittings, and insulation from saved designs',
          icon: FileSpreadsheet,
          status: 'available',
          href: '/design/material-takeoff',
        },
        {
          id: 'design-completeness',
          name: 'Design Completeness Dashboard',
          description: 'Track which zones need load calculations, equipment selections, or distribution systems',
          icon: CheckSquare,
          status: 'available',
          href: '/design/completeness',
        },
        {
          id: 'specialized-tools-comparison',
          name: 'Specialized Tools Dashboard',
          description: 'Cross-project comparison of specialized design tool completion status',
          icon: BarChart3,
          status: 'available',
          href: '/design/specialized-tools-comparison',
        },
        {
          id: 'air-balance-report',
          name: 'Air Balance Report',
          description: 'Generate TAB contractor air balance reports from duct systems',
          icon: FileSpreadsheet,
          status: 'available',
          href: '/design/air-balance-report',
        },
        {
          id: 'water-balance-report',
          name: 'Water Balance Report',
          description: 'Generate TAB contractor hydronic balance reports from pipe systems',
          icon: FileSpreadsheet,
          status: 'available',
          href: '/design/water-balance-report',
        },
        {
          id: 'design-audit',
          name: 'Design Audit Dashboard',
          description: 'View all cross-tool validation alerts and data synchronization status in one place',
          icon: ShieldCheck,
          status: 'available',
          href: '/design/audit',
        },
        {
          id: 'design-health',
          name: 'Design Health Dashboard',
          description: 'Unified view of completeness, cross-tool sync, validation rules, and specialized tools',
          icon: Activity,
          status: 'available',
          href: '/design/health',
        },
        {
          id: 'collaboration-dashboard',
          name: 'Team Collaboration',
          description: 'Real-time visibility into team activity, active editors, and design conflicts',
          icon: Users,
          status: 'available',
          href: '/design/collaboration',
        },
        {
          id: 'design-approvals',
          name: 'Design Approvals',
          description: 'Submit designs for review, track approval status, and manage quality gates',
          icon: FileCheck,
          status: 'available',
          href: '/design/approvals',
        },
        {
          id: 'design-system-coverage',
          name: 'Design System Coverage',
          description: 'Track integration status for PreSaveValidation, DataFlow, and CrossTool coverage',
          icon: FileCode,
          status: 'available',
          href: '/design/coverage',
        },
        {
          id: 'design-documentation',
          name: 'HVAC Design Documentation',
          description: 'Reference guide for 55+ tools, workflow stages, and industry standards',
          icon: BookOpen,
          status: 'available',
          href: '/design/documentation',
        },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Design Tools</h1>
            <p className="text-muted-foreground">
              Engineering calculations and design utilities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/design/collaboration">
                <Users className="h-4 w-4 mr-2" />
                Team Activity
              </Link>
            </Button>
            <Button onClick={() => setShowReportDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Design Report
            </Button>
          </div>
        </div>

        <UnifiedDesignReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />

        {/* Workflow Progress Bar */}
        {projectId && (
          <Card className="p-4">
            <DesignWorkflowProgressBar 
              projectId={projectId} 
              variant="full"
            />
          </Card>
        )}

        {/* Categorized Tools */}
        {toolCategories.map((category) => (
          <div key={category.name} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {category.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {category.description}
              </span>
            </div>
            <Separator />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <Card
                  key={tool.id}
                  className={`group transition-all ${
                    tool.status === 'available'
                      ? 'hover:shadow-md hover:border-primary/20 cursor-pointer'
                      : 'opacity-60'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                        <tool.icon className="w-6 h-6 text-primary" />
                      </div>
                      {tool.status === 'coming-soon' && (
                        <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={tool.status === 'available' ? 'default' : 'secondary'}
                      className="w-full gap-2"
                      disabled={tool.status !== 'available'}
                      onClick={() => tool.href && navigate(tool.href)}
                    >
                      {tool.status === 'available' ? (
                        <>
                          Open Tool
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        'Coming Soon'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Interactive Workflow Dashboard */}
        <DesignWorkflowQuickStart />
      </div>
    </DashboardLayout>
  );
}