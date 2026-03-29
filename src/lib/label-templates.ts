// Label size definitions and print configurations

export type LabelSize = 'small' | 'medium' | 'large' | 'badge';
export type PaperSize = 'letter' | 'a4';
export type ColorScheme = 'standard' | 'high-contrast' | 'minimal';
export type BorderStyle = 'solid' | 'dashed' | 'none';
export type LabelTemplateMode = 'custom' | 'avery';

export interface LabelDimensions {
  width: number;  // in mm
  height: number; // in mm
  qrSize: number; // in mm
}

export interface LabelSizeConfig {
  name: string;
  description: string;
  dimensions: LabelDimensions;
  showInstructions: boolean;
  layout: 'horizontal' | 'vertical';
}

export interface PaperConfig {
  name: string;
  width: number;  // in mm
  height: number; // in mm
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Avery template configuration
export interface AveryTemplateConfig {
  id: string;
  name: string;
  description: string;
  labelWidth: number;  // mm
  labelHeight: number; // mm
  columns: number;
  rows: number;
  topMargin: number;   // mm
  leftMargin: number;  // mm
  horizontalGap: number; // mm
  verticalGap: number;   // mm
  pageWidth: number;   // mm (Letter = 215.9)
  pageHeight: number;  // mm (Letter = 279.4)
  qrSize: number;      // mm - optimized for label size
}

// Avery templates registry with precise specifications
export const AVERY_TEMPLATES: Record<string, AveryTemplateConfig> = {
  '5160': {
    id: '5160',
    name: 'Avery 5160',
    description: 'Address Labels - 30/sheet (1" × 2⅝")',
    labelWidth: 66.7,
    labelHeight: 25.4,
    columns: 3,
    rows: 10,
    topMargin: 12.7,
    leftMargin: 4.8,
    horizontalGap: 3.2,
    verticalGap: 0,
    pageWidth: 215.9,
    pageHeight: 279.4,
    qrSize: 18,
  },
  '5163': {
    id: '5163',
    name: 'Avery 5163',
    description: 'Shipping Labels - 10/sheet (2" × 4")',
    labelWidth: 101.6,
    labelHeight: 50.8,
    columns: 2,
    rows: 5,
    topMargin: 12.7,
    leftMargin: 4.0,
    horizontalGap: 6.4,
    verticalGap: 0,
    pageWidth: 215.9,
    pageHeight: 279.4,
    qrSize: 35,
  },
  '5167': {
    id: '5167',
    name: 'Avery 5167',
    description: 'Return Address - 80/sheet (½" × 1¾")',
    labelWidth: 44.5,
    labelHeight: 12.7,
    columns: 4,
    rows: 20,
    topMargin: 12.7,
    leftMargin: 8.5,
    horizontalGap: 7.9,
    verticalGap: 0,
    pageWidth: 215.9,
    pageHeight: 279.4,
    qrSize: 10,
  },
};

export interface LabelGeneratorConfig {
  // Template mode
  templateMode: LabelTemplateMode;
  averyTemplate: string; // '5160' | '5163' | '5167'
  
  // Starting position for Avery templates (1-indexed)
  startPosition: number;
  useStartPosition: boolean;
  
  // Custom label settings
  labelSize: LabelSize;
  paperSize: PaperSize;
  showQRCode: boolean;
  showZoneName: boolean;
  showTargetNC: boolean;
  showFloorName: boolean;
  showSpaceType: boolean;
  showBuildingName: boolean;
  showInstructions: boolean;
  borderStyle: BorderStyle;
  showCutGuides: boolean;
  colorScheme: ColorScheme;
}

export const LABEL_SIZES: Record<LabelSize, LabelSizeConfig> = {
  small: {
    name: 'Small',
    description: 'Equipment stickers, diffuser labels (50×25mm)',
    dimensions: { width: 50, height: 25, qrSize: 18 },
    showInstructions: false,
    layout: 'horizontal',
  },
  medium: {
    name: 'Medium',
    description: 'Wall signs, door labels (75×50mm)',
    dimensions: { width: 75, height: 50, qrSize: 30 },
    showInstructions: false,
    layout: 'vertical',
  },
  large: {
    name: 'Large',
    description: 'Zone markers, training areas (100×75mm)',
    dimensions: { width: 100, height: 75, qrSize: 40 },
    showInstructions: true,
    layout: 'vertical',
  },
  badge: {
    name: 'Badge',
    description: 'Laminated reference cards (85×55mm)',
    dimensions: { width: 85, height: 55, qrSize: 35 },
    showInstructions: true,
    layout: 'horizontal',
  },
};

export const PAPER_SIZES: Record<PaperSize, PaperConfig> = {
  letter: {
    name: 'Letter (8.5" × 11")',
    width: 216,
    height: 279,
    margins: { top: 12, right: 12, bottom: 12, left: 12 },
  },
  a4: {
    name: 'A4 (210mm × 297mm)',
    width: 210,
    height: 297,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
  },
};

export const DEFAULT_CONFIG: LabelGeneratorConfig = {
  templateMode: 'custom',
  averyTemplate: '5163',
  startPosition: 1,
  useStartPosition: false,
  labelSize: 'medium',
  paperSize: 'letter',
  showQRCode: true,
  showZoneName: true,
  showTargetNC: true,
  showFloorName: true,
  showSpaceType: true,
  showBuildingName: false,
  showInstructions: true,
  borderStyle: 'dashed',
  showCutGuides: true,
  colorScheme: 'standard',
};

export function calculateLabelsPerPage(
  labelSize: LabelSize,
  paperSize: PaperSize,
  gapMm: number = 5
): { columns: number; rows: number; total: number } {
  const label = LABEL_SIZES[labelSize].dimensions;
  const paper = PAPER_SIZES[paperSize];
  
  const availableWidth = paper.width - paper.margins.left - paper.margins.right;
  const availableHeight = paper.height - paper.margins.top - paper.margins.bottom;
  
  const columns = Math.floor((availableWidth + gapMm) / (label.width + gapMm));
  const rows = Math.floor((availableHeight + gapMm) / (label.height + gapMm));
  
  return { columns, rows, total: columns * rows };
}

// Helper function to get Avery layout info
export function getAveryLayoutInfo(templateId: string): {
  columns: number;
  rows: number;
  total: number;
  dimensions: { width: number; height: number; qrSize: number };
} {
  const template = AVERY_TEMPLATES[templateId];
  if (!template) {
    return { columns: 3, rows: 10, total: 30, dimensions: { width: 66.7, height: 25.4, qrSize: 18 } };
  }
  return {
    columns: template.columns,
    rows: template.rows,
    total: template.columns * template.rows,
    dimensions: {
      width: template.labelWidth,
      height: template.labelHeight,
      qrSize: template.qrSize,
    },
  };
}

// Calculate exact position for an Avery label
export function getAveryLabelPosition(index: number, templateId: string): { left: number; top: number } {
  const template = AVERY_TEMPLATES[templateId];
  if (!template) return { left: 0, top: 0 };
  
  const col = index % template.columns;
  const row = Math.floor(index / template.columns);
  
  return {
    left: template.leftMargin + (col * (template.labelWidth + template.horizontalGap)),
    top: template.topMargin + (row * (template.labelHeight + template.verticalGap)),
  };
}

export function mmToPixels(mm: number, dpi: number = 96): number {
  return (mm / 25.4) * dpi;
}

export function getColorSchemeClasses(scheme: ColorScheme): {
  background: string;
  text: string;
  border: string;
  accent: string;
} {
  switch (scheme) {
    case 'high-contrast':
      return {
        background: 'bg-white',
        text: 'text-black',
        border: 'border-black',
        accent: 'text-black font-bold',
      };
    case 'minimal':
      return {
        background: 'bg-white',
        text: 'text-gray-700',
        border: 'border-gray-300',
        accent: 'text-gray-900',
      };
    default:
      return {
        background: 'bg-white',
        text: 'text-gray-800',
        border: 'border-gray-400',
        accent: 'text-primary',
      };
  }
}
