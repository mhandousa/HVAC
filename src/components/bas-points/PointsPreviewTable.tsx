import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  List,
  SortAsc,
  SortDesc,
  Filter,
} from 'lucide-react';
import { GeneratedPointsList, GeneratedPoint } from '@/hooks/useBASPointsGenerator';
import { useTranslation } from 'react-i18next';

interface PointsPreviewTableProps {
  pointsList: GeneratedPointsList;
  protocol: 'bacnet' | 'modbus' | 'both';
}

type SortField = 'pointName' | 'equipmentTag' | 'pointType' | 'equipmentType';
type SortDirection = 'asc' | 'desc';

export function PointsPreviewTable({ pointsList, protocol }: PointsPreviewTableProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('pointName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const pointTypes = ['AI', 'AO', 'BI', 'BO', 'AV', 'BV', 'MSV'];
  const equipmentTypes = [...new Set(pointsList.allPoints.map(p => p.equipmentType))];

  const filteredAndSortedPoints = useMemo(() => {
    let points = [...pointsList.allPoints];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      points = points.filter(p =>
        p.pointName.toLowerCase().includes(term) ||
        p.equipmentTag.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    // Filter by point type
    if (filterType !== 'all') {
      points = points.filter(p => p.pointType === filterType);
    }

    // Filter by equipment type
    if (filterEquipment !== 'all') {
      points = points.filter(p => p.equipmentType === filterEquipment);
    }

    // Sort
    points.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'pointName':
          comparison = a.pointName.localeCompare(b.pointName);
          break;
        case 'equipmentTag':
          comparison = a.equipmentTag.localeCompare(b.equipmentTag);
          break;
        case 'pointType':
          comparison = a.pointType.localeCompare(b.pointType);
          break;
        case 'equipmentType':
          comparison = a.equipmentType.localeCompare(b.equipmentType);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return points;
  }, [pointsList.allPoints, searchTerm, filterType, filterEquipment, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-3 w-3 ml-1" /> : 
      <SortDesc className="h-3 w-3 ml-1" />;
  };

  const getPointTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'AI': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'AO': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'BI': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'BO': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'AV': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'BV': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'MSV': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (pointsList.totalPoints === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <List className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('No points generated yet', 'لم يتم إنشاء نقاط بعد')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('Add equipment and configure point types to see the preview', 'أضف معدات وقم بتكوين أنواع النقاط لرؤية المعاينة')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <List className="h-4 w-4" />
            {t('Points Preview', 'معاينة النقاط')} ({filteredAndSortedPoints.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Point Type Summary */}
            <div className="flex items-center gap-1">
              {pointTypes.map(type => {
                const count = pointsList.allPoints.filter(p => p.pointType === type).length;
                if (count === 0) return null;
                return (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className={`text-xs ${getPointTypeBadgeColor(type)}`}
                  >
                    {type}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search points...', 'البحث عن النقاط...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Point Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Types', 'كل الأنواع')}</SelectItem>
              {pointTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEquipment} onValueChange={setFilterEquipment}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Equipment', 'كل المعدات')}</SelectItem>
              {equipmentTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort('pointName')}
                >
                  <div className="flex items-center">
                    {t('Point Name', 'اسم النقطة')}
                    <SortIcon field="pointName" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort('equipmentTag')}
                >
                  <div className="flex items-center">
                    {t('Tag', 'العلامة')}
                    <SortIcon field="equipmentTag" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort('pointType')}
                >
                  <div className="flex items-center">
                    {t('Type', 'النوع')}
                    <SortIcon field="pointType" />
                  </div>
                </TableHead>
                <TableHead>{t('Description', 'الوصف')}</TableHead>
                <TableHead>{t('Unit', 'الوحدة')}</TableHead>
                {protocol !== 'modbus' && (
                  <TableHead>{t('BACnet', 'باكنت')}</TableHead>
                )}
                {protocol !== 'bacnet' && (
                  <TableHead>{t('Modbus', 'مودباس')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPoints.map((point, index) => (
                <TableRow key={`${point.pointName}-${index}`}>
                  <TableCell className="font-mono text-xs">
                    {point.pointName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {point.equipmentTag}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPointTypeBadgeColor(point.pointType)}`}
                    >
                      {point.pointType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {point.description}
                  </TableCell>
                  <TableCell className="text-xs">{point.unit}</TableCell>
                  {protocol !== 'modbus' && (
                    <TableCell className="text-xs">
                      <span className="text-muted-foreground">{point.bacnetObjectType}</span>
                      <span className="ml-1 font-mono">#{point.bacnetInstance}</span>
                    </TableCell>
                  )}
                  {protocol !== 'bacnet' && (
                    <TableCell className="text-xs font-mono">
                      {point.modbusAddress !== undefined && (
                        <>
                          {point.modbusAddress}
                          <span className="ml-1 text-muted-foreground">({point.modbusDataType})</span>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
