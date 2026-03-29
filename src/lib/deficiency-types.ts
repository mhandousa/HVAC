// Deficiency category and type definitions for commissioning photo tagging

export interface DeficiencyTag {
  id: string;
  label: string;
  labelAr?: string;
}

export interface DeficiencyCategory {
  id: string;
  label: string;
  labelAr?: string;
  tags: DeficiencyTag[];
}

export const DEFICIENCY_CATEGORIES: DeficiencyCategory[] = [
  {
    id: 'installation',
    label: 'Installation Errors',
    labelAr: 'أخطاء التركيب',
    tags: [
      { id: 'wrong_orientation', label: 'Wrong Orientation', labelAr: 'اتجاه خاطئ' },
      { id: 'incorrect_mounting', label: 'Incorrect Mounting', labelAr: 'تركيب غير صحيح' },
      { id: 'improper_connection', label: 'Improper Connection', labelAr: 'اتصال غير صحيح' },
      { id: 'missing_sealant', label: 'Missing Sealant', labelAr: 'مانع تسرب مفقود' },
      { id: 'wrong_slope', label: 'Wrong Slope/Pitch', labelAr: 'ميل خاطئ' },
      { id: 'inadequate_clearance', label: 'Inadequate Clearance', labelAr: 'مسافة غير كافية' },
    ],
  },
  {
    id: 'missing_component',
    label: 'Missing Components',
    labelAr: 'مكونات مفقودة',
    tags: [
      { id: 'missing_insulation', label: 'Missing Insulation', labelAr: 'عزل مفقود' },
      { id: 'missing_support', label: 'Missing Support/Hanger', labelAr: 'دعامة مفقودة' },
      { id: 'missing_label', label: 'Missing Label/Tag', labelAr: 'ملصق مفقود' },
      { id: 'missing_accessory', label: 'Missing Accessory', labelAr: 'ملحق مفقود' },
      { id: 'missing_damper', label: 'Missing Damper', labelAr: 'مخمد مفقود' },
      { id: 'missing_valve', label: 'Missing Valve', labelAr: 'صمام مفقود' },
    ],
  },
  {
    id: 'damage',
    label: 'Damage',
    labelAr: 'تلف',
    tags: [
      { id: 'physical_damage', label: 'Physical Damage', labelAr: 'تلف مادي' },
      { id: 'corrosion', label: 'Corrosion/Rust', labelAr: 'صدأ/تآكل' },
      { id: 'water_damage', label: 'Water Damage', labelAr: 'تلف بالماء' },
      { id: 'contamination', label: 'Contamination', labelAr: 'تلوث' },
      { id: 'dent_scratch', label: 'Dent/Scratch', labelAr: 'انبعاج/خدش' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance Issues',
    labelAr: 'مشاكل الأداء',
    tags: [
      { id: 'out_of_spec', label: 'Out of Specification', labelAr: 'خارج المواصفات' },
      { id: 'noise_vibration', label: 'Excessive Noise/Vibration', labelAr: 'ضوضاء/اهتزاز مفرط' },
      { id: 'leakage', label: 'Leakage', labelAr: 'تسريب' },
      { id: 'calibration', label: 'Calibration Issue', labelAr: 'مشكلة معايرة' },
      { id: 'airflow_issue', label: 'Airflow Issue', labelAr: 'مشكلة تدفق هواء' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation Issues',
    labelAr: 'مشاكل التوثيق',
    tags: [
      { id: 'wrong_model', label: 'Wrong Model/Part', labelAr: 'موديل/قطعة خاطئة' },
      { id: 'not_per_drawing', label: 'Not Per Drawing', labelAr: 'غير مطابق للرسم' },
      { id: 'incomplete_work', label: 'Incomplete Work', labelAr: 'عمل غير مكتمل' },
      { id: 'missing_submittal', label: 'Missing Submittal', labelAr: 'مستند مفقود' },
    ],
  },
];

export type DeficiencySeverity = 'minor' | 'major' | 'critical';

export interface SeverityInfo {
  id: DeficiencySeverity;
  label: string;
  labelAr: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SEVERITY_LEVELS: SeverityInfo[] = [
  {
    id: 'minor',
    label: 'Minor',
    labelAr: 'بسيط',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
  },
  {
    id: 'major',
    label: 'Major',
    labelAr: 'رئيسي',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
  },
  {
    id: 'critical',
    label: 'Critical',
    labelAr: 'حرج',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
  },
];

export function getTagLabel(tagId: string): string {
  for (const category of DEFICIENCY_CATEGORIES) {
    const tag = category.tags.find((t) => t.id === tagId);
    if (tag) return tag.label;
  }
  return tagId;
}

export function getSeverityInfo(severity: DeficiencySeverity): SeverityInfo {
  return SEVERITY_LEVELS.find((s) => s.id === severity) || SEVERITY_LEVELS[0];
}

export function getCategoryForTag(tagId: string): DeficiencyCategory | undefined {
  return DEFICIENCY_CATEGORIES.find((cat) => cat.tags.some((t) => t.id === tagId));
}
