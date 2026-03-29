import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  FileText, 
  FileType,
  Download,
  Building2,
} from 'lucide-react';
import { GeneratedPointsList } from '@/hooks/useBASPointsGenerator';
import { ExportFormat, ExportOptions, useBASPointsExport } from '@/hooks/useBASPointsExport';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface BASExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsList: GeneratedPointsList;
}

export function BASExportDialog({ open, onOpenChange, pointsList }: BASExportDialogProps) {
  const { t } = useTranslation();
  const { exportPoints } = useBASPointsExport();
  
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [options, setOptions] = useState<Omit<ExportOptions, 'format'>>({
    includeArabic: true,
    includeModbus: true,
    includeBACnet: true,
    groupByEquipment: true,
    includeAlarms: true,
  });

  const handleExport = () => {
    try {
      exportPoints(pointsList, { format, ...options });
      toast.success(t('Points list exported successfully', 'تم تصدير قائمة النقاط بنجاح'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('Failed to export points list', 'فشل تصدير قائمة النقاط'));
    }
  };

  const formatOptions: { id: ExportFormat; name: string; nameAr: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'excel',
      name: 'Excel (.xlsx)',
      nameAr: 'إكسل',
      description: 'Full point list with multiple sheets for BACnet, Modbus, and alarms',
      icon: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
    },
    {
      id: 'csv',
      name: 'CSV',
      nameAr: 'ملف CSV',
      description: 'Simple comma-separated values for general import',
      icon: <FileText className="h-5 w-5 text-blue-500" />,
    },
    {
      id: 'pdf',
      name: 'PDF',
      nameAr: 'ملف PDF',
      description: 'Formatted document for construction documents and submittals',
      icon: <FileType className="h-5 w-5 text-red-500" />,
    },
    {
      id: 'niagara',
      name: 'Niagara N4',
      nameAr: 'نياجارا N4',
      description: 'Tridium Niagara import format',
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
    },
    {
      id: 'metasys',
      name: 'Johnson Controls Metasys',
      nameAr: 'جونسون كونترولز',
      description: 'Metasys import format',
      icon: <Building2 className="h-5 w-5 text-orange-500" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('Export BAS Points List', 'تصدير قائمة نقاط BAS')}
          </DialogTitle>
          <DialogDescription>
            {t('Choose an export format and options', 'اختر صيغة التصدير والخيارات')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{t('Total Points', 'إجمالي النقاط')}</span>
            <Badge variant="secondary" className="text-lg">
              {pointsList.totalPoints}
            </Badge>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>{t('Export Format', 'صيغة التصدير')}</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="space-y-2"
            >
              {formatOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    format === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormat(opt.id)}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  {opt.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={opt.id} className="font-medium cursor-pointer">
                        {opt.name}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {opt.nameAr}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Options (only for Excel) */}
          {format === 'excel' && (
            <div className="space-y-3">
              <Label>{t('Export Options', 'خيارات التصدير')}</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="arabic" className="text-sm">
                    {t('Include Arabic descriptions', 'تضمين الوصف بالعربية')}
                  </Label>
                  <Switch
                    id="arabic"
                    checked={options.includeArabic}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeArabic: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bacnet" className="text-sm">
                    {t('Include BACnet sheet', 'تضمين ورقة BACnet')}
                  </Label>
                  <Switch
                    id="bacnet"
                    checked={options.includeBACnet}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeBACnet: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="modbus" className="text-sm">
                    {t('Include Modbus sheet', 'تضمين ورقة Modbus')}
                  </Label>
                  <Switch
                    id="modbus"
                    checked={options.includeModbus}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeModbus: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="alarms" className="text-sm">
                    {t('Include alarm points sheet', 'تضمين ورقة نقاط الإنذار')}
                  </Label>
                  <Switch
                    id="alarms"
                    checked={options.includeAlarms}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeAlarms: checked }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button onClick={handleExport} disabled={pointsList.totalPoints === 0}>
            <Download className="h-4 w-4 mr-2" />
            {t('Export', 'تصدير')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
