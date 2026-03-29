import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  Trash2, 
  Building2, 
  Layers,
  Server,
} from 'lucide-react';
import { EquipmentForPoints } from '@/hooks/useBASPointsGenerator';
import { EQUIPMENT_POINT_TEMPLATES } from '@/lib/bas-point-templates';
import { useTranslation } from 'react-i18next';

interface EquipmentSelectorProps {
  selectedEquipment: EquipmentForPoints[];
  onAddEquipment: (equipment: EquipmentForPoints | EquipmentForPoints[]) => void;
  onRemoveEquipment: (equipmentId: string) => void;
  onClearAll: () => void;
}

export function EquipmentSelector({
  selectedEquipment,
  onAddEquipment,
  onRemoveEquipment,
  onClearAll,
}: EquipmentSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualEquipment, setManualEquipment] = useState({
    tag: '',
    name: '',
    type: 'AHU',
    building: 'B01',
    floor: '1',
    zone: '01',
  });

  const equipmentTypes = EQUIPMENT_POINT_TEMPLATES.map(t => ({
    type: t.equipmentType,
    typeAr: t.equipmentTypeAr,
    category: t.category,
    pointCount: t.points.filter(p => p.defaultIncluded).length,
  }));

  const handleAddManual = () => {
    if (!manualEquipment.tag || !manualEquipment.name) return;
    
    onAddEquipment({
      id: `manual-${Date.now()}`,
      tag: manualEquipment.tag,
      name: manualEquipment.name,
      type: manualEquipment.type,
      building: manualEquipment.building,
      floor: manualEquipment.floor,
      zone: manualEquipment.zone,
    });

    setManualEquipment({
      tag: '',
      name: '',
      type: 'AHU',
      building: 'B01',
      floor: '1',
      zone: '01',
    });
  };

  const addSampleEquipment = (type: string) => {
    const count = selectedEquipment.filter(e => e.type === type).length + 1;
    const tag = `${type.toUpperCase().replace(/\s+/g, '')}${count.toString().padStart(2, '0')}`;
    
    onAddEquipment({
      id: `sample-${type}-${Date.now()}`,
      tag,
      name: `${type} ${count}`,
      type,
      building: 'B01',
      floor: '1',
      zone: '01',
    });
  };

  const filteredTypes = equipmentTypes.filter(t =>
    t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByCategory = filteredTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof filteredTypes>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Equipment Type Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            {t('Add Equipment by Type', 'إضافة معدات حسب النوع')}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search equipment types...', 'البحث عن أنواع المعدات...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {Object.entries(groupedByCategory).map(([category, types]) => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                <div className="space-y-1">
                  {types.map(({ type, pointCount }) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{type}</span>
                        <Badge variant="outline" className="text-xs">
                          {pointCount} pts
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addSampleEquipment(type)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Equipment List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('Selected Equipment', 'المعدات المحددة')} ({selectedEquipment.length})
            </CardTitle>
            {selectedEquipment.length > 0 && (
              <Button size="sm" variant="ghost" onClick={onClearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('Clear All', 'مسح الكل')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('No equipment selected', 'لم يتم تحديد معدات')}</p>
              <p className="text-xs">{t('Add equipment from the list or manually', 'أضف معدات من القائمة أو يدوياً')}</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {selectedEquipment.map((equipment) => (
                  <div
                    key={equipment.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{equipment.tag}</span>
                        <Badge variant="secondary" className="text-xs">
                          {equipment.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Building2 className="h-3 w-3" />
                        <span>{equipment.building || 'B01'}</span>
                        <span>•</span>
                        <span>Floor {equipment.floor || '1'}</span>
                        <span>•</span>
                        <span>Zone {equipment.zone || '01'}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveEquipment(equipment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Manual Add Form */}
          <div className="mt-4 pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              className="w-full mb-3"
              onClick={() => setShowAddManual(!showAddManual)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('Add Equipment Manually', 'إضافة معدات يدوياً')}
            </Button>

            {showAddManual && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Tag (e.g., AHU01)"
                    value={manualEquipment.tag}
                    onChange={(e) => setManualEquipment(prev => ({ ...prev, tag: e.target.value }))}
                  />
                  <Input
                    placeholder="Name"
                    value={manualEquipment.name}
                    onChange={(e) => setManualEquipment(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={manualEquipment.type}
                    onChange={(e) => setManualEquipment(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {equipmentTypes.map(({ type }) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Building"
                    value={manualEquipment.building}
                    onChange={(e) => setManualEquipment(prev => ({ ...prev, building: e.target.value }))}
                  />
                  <Input
                    placeholder="Floor"
                    value={manualEquipment.floor}
                    onChange={(e) => setManualEquipment(prev => ({ ...prev, floor: e.target.value }))}
                  />
                </div>
                <Button size="sm" className="w-full" onClick={handleAddManual}>
                  {t('Add', 'إضافة')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
