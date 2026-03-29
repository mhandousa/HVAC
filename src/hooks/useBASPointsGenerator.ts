import { useState, useMemo, useCallback } from 'react';
import { 
  EQUIPMENT_POINT_TEMPLATES, 
  PointTemplate, 
  BASPoint,
  getPointTemplatesByEquipmentType 
} from '@/lib/bas-point-templates';
import { 
  NamingConfig, 
  NamingConvention,
  generatePointName,
  NameComponents,
  allocateModbusAddress,
  getModbusRegisterSize,
  ModbusAddressConfig,
  DEFAULT_MODBUS_CONFIG,
  BACnetInstanceConfig,
  DEFAULT_BACNET_INSTANCE_CONFIG,
} from '@/lib/bas-naming-conventions';

export interface EquipmentForPoints {
  id: string;
  tag: string;
  name: string;
  type: string;
  building?: string;
  floor?: string | number;
  zone?: string;
  location?: string;
}

export interface PointTypeConfig {
  equipmentType: string;
  enabledPoints: string[];
}

export interface GeneratedPoint extends BASPoint {
  equipmentId: string;
  equipmentTag: string;
  equipmentName: string;
  equipmentType: string;
  bacnetInstance?: number;
  building?: string;
  floor?: string;
  zone?: string;
}

export interface EquipmentPoints {
  equipment: EquipmentForPoints;
  points: GeneratedPoint[];
}

export interface PointsSummary {
  aiCount: number;
  aoCount: number;
  biCount: number;
  boCount: number;
  avCount: number;
  bvCount: number;
  msvCount: number;
  totalPoints: number;
}

export interface GeneratedPointsList {
  projectName: string;
  generatedAt: string;
  namingConvention: string;
  totalPoints: number;
  totalEquipment: number;
  pointsByEquipment: EquipmentPoints[];
  allPoints: GeneratedPoint[];
  summary: PointsSummary;
}

export interface UseBASPointsGeneratorOptions {
  projectName?: string;
  namingConfig: NamingConfig;
  protocol: 'bacnet' | 'modbus' | 'both';
  modbusConfig?: ModbusAddressConfig;
  bacnetConfig?: BACnetInstanceConfig;
}

export function useBASPointsGenerator(options: UseBASPointsGeneratorOptions) {
  const {
    projectName = 'BAS Points List',
    namingConfig,
    protocol,
    modbusConfig = DEFAULT_MODBUS_CONFIG,
    bacnetConfig = DEFAULT_BACNET_INSTANCE_CONFIG,
  } = options;

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentForPoints[]>([]);
  const [pointTypeConfigs, setPointTypeConfigs] = useState<Map<string, Set<string>>>(new Map());

  // Initialize point type configs with defaults
  const initializePointConfig = useCallback((equipmentType: string) => {
    const templates = getPointTemplatesByEquipmentType(equipmentType);
    const defaultEnabled = templates
      .filter(t => t.defaultIncluded)
      .map(t => t.id);
    
    setPointTypeConfigs(prev => {
      const next = new Map(prev);
      if (!next.has(equipmentType)) {
        next.set(equipmentType, new Set(defaultEnabled));
      }
      return next;
    });
  }, []);

  // Toggle a specific point type for an equipment type
  const togglePointType = useCallback((equipmentType: string, pointId: string) => {
    setPointTypeConfigs(prev => {
      const next = new Map(prev);
      const current = next.get(equipmentType) || new Set();
      const updated = new Set(current);
      
      if (updated.has(pointId)) {
        updated.delete(pointId);
      } else {
        updated.add(pointId);
      }
      
      next.set(equipmentType, updated);
      return next;
    });
  }, []);

  // Enable all points for an equipment type
  const enableAllPoints = useCallback((equipmentType: string) => {
    const templates = getPointTemplatesByEquipmentType(equipmentType);
    setPointTypeConfigs(prev => {
      const next = new Map(prev);
      next.set(equipmentType, new Set(templates.map(t => t.id)));
      return next;
    });
  }, []);

  // Disable all points for an equipment type
  const disableAllPoints = useCallback((equipmentType: string) => {
    setPointTypeConfigs(prev => {
      const next = new Map(prev);
      next.set(equipmentType, new Set());
      return next;
    });
  }, []);

  // Reset to default points for an equipment type
  const resetToDefaults = useCallback((equipmentType: string) => {
    const templates = getPointTemplatesByEquipmentType(equipmentType);
    const defaultEnabled = templates
      .filter(t => t.defaultIncluded)
      .map(t => t.id);
    
    setPointTypeConfigs(prev => {
      const next = new Map(prev);
      next.set(equipmentType, new Set(defaultEnabled));
      return next;
    });
  }, []);

  // Add equipment
  const addEquipment = useCallback((equipment: EquipmentForPoints | EquipmentForPoints[]) => {
    const items = Array.isArray(equipment) ? equipment : [equipment];
    
    items.forEach(item => {
      if (item.type) {
        initializePointConfig(item.type);
      }
    });
    
    setSelectedEquipment(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newItems = items.filter(e => !existingIds.has(e.id));
      return [...prev, ...newItems];
    });
  }, [initializePointConfig]);

  // Remove equipment
  const removeEquipment = useCallback((equipmentId: string) => {
    setSelectedEquipment(prev => prev.filter(e => e.id !== equipmentId));
  }, []);

  // Clear all equipment
  const clearEquipment = useCallback(() => {
    setSelectedEquipment([]);
  }, []);

  // Generate the points list
  const generatedPointsList = useMemo((): GeneratedPointsList => {
    const pointsByEquipment: EquipmentPoints[] = [];
    const allPoints: GeneratedPoint[] = [];
    
    // Track BACnet instances per object type
    const bacnetInstances = {
      AI: bacnetConfig.startAI,
      AO: bacnetConfig.startAO,
      BI: bacnetConfig.startBI,
      BO: bacnetConfig.startBO,
      AV: bacnetConfig.startAV,
      BV: bacnetConfig.startBV,
      MSV: bacnetConfig.startMSV,
    };

    selectedEquipment.forEach((equipment, equipmentIndex) => {
      const templates = getPointTemplatesByEquipmentType(equipment.type);
      const enabledPoints = pointTypeConfigs.get(equipment.type) || new Set();
      
      const equipmentPoints: GeneratedPoint[] = [];
      let modbusOffset = 0;

      templates.forEach((template, pointIndex) => {
        if (!enabledPoints.has(template.id)) return;
        if (protocol === 'bacnet' && template.protocol === 'modbus') return;
        if (protocol === 'modbus' && template.protocol === 'bacnet') return;

        const components: NameComponents = {
          site: namingConfig.cityCode || namingConfig.sitePrefix || 'SITE',
          building: equipment.building || namingConfig.buildingCode || 'B01',
          floor: equipment.floor?.toString() || '01',
          zone: equipment.zone || '01',
          equipmentTag: equipment.tag,
          pointId: template.id,
        };

        const pointName = generatePointName(components, namingConfig);
        
        // Allocate BACnet instance
        const bacnetInstance = bacnetInstances[template.type as keyof typeof bacnetInstances]++;
        
        // Allocate Modbus address
        const modbusAddress = protocol !== 'bacnet' 
          ? allocateModbusAddress(equipmentIndex, modbusOffset, template.modbusDataType, modbusConfig)
          : undefined;
        
        if (protocol !== 'bacnet') {
          modbusOffset += getModbusRegisterSize(template.modbusDataType);
        }

        const point: GeneratedPoint = {
          pointName,
          pointType: template.type,
          description: template.description,
          descriptionAr: template.descriptionAr,
          unit: template.unit,
          range: template.range,
          alarmLimits: template.alarmLimits,
          protocol: template.protocol,
          bacnetObjectType: template.bacnetObjectType,
          modbusDataType: template.modbusDataType,
          cov: template.cov,
          equipmentId: equipment.id,
          equipmentTag: equipment.tag,
          equipmentName: equipment.name,
          equipmentType: equipment.type,
          bacnetInstance,
          modbusAddress,
          building: equipment.building,
          floor: equipment.floor?.toString(),
          zone: equipment.zone,
        };

        equipmentPoints.push(point);
        allPoints.push(point);
      });

      if (equipmentPoints.length > 0) {
        pointsByEquipment.push({
          equipment,
          points: equipmentPoints,
        });
      }
    });

    // Calculate summary
    const summary: PointsSummary = {
      aiCount: allPoints.filter(p => p.pointType === 'AI').length,
      aoCount: allPoints.filter(p => p.pointType === 'AO').length,
      biCount: allPoints.filter(p => p.pointType === 'BI').length,
      boCount: allPoints.filter(p => p.pointType === 'BO').length,
      avCount: allPoints.filter(p => p.pointType === 'AV').length,
      bvCount: allPoints.filter(p => p.pointType === 'BV').length,
      msvCount: allPoints.filter(p => p.pointType === 'MSV').length,
      totalPoints: allPoints.length,
    };

    return {
      projectName,
      generatedAt: new Date().toISOString(),
      namingConvention: namingConfig.convention,
      totalPoints: allPoints.length,
      totalEquipment: pointsByEquipment.length,
      pointsByEquipment,
      allPoints,
      summary,
    };
  }, [
    selectedEquipment,
    pointTypeConfigs,
    namingConfig,
    protocol,
    modbusConfig,
    bacnetConfig,
    projectName,
  ]);

  // Get enabled points for an equipment type
  const getEnabledPoints = useCallback((equipmentType: string): Set<string> => {
    return pointTypeConfigs.get(equipmentType) || new Set();
  }, [pointTypeConfigs]);

  // Check if a point is enabled
  const isPointEnabled = useCallback((equipmentType: string, pointId: string): boolean => {
    const config = pointTypeConfigs.get(equipmentType);
    return config?.has(pointId) || false;
  }, [pointTypeConfigs]);

  // Get unique equipment types from selected equipment
  const uniqueEquipmentTypes = useMemo(() => {
    return [...new Set(selectedEquipment.map(e => e.type))];
  }, [selectedEquipment]);

  return {
    // State
    selectedEquipment,
    generatedPointsList,
    uniqueEquipmentTypes,
    
    // Equipment management
    addEquipment,
    removeEquipment,
    clearEquipment,
    setSelectedEquipment,
    
    // Point type configuration
    togglePointType,
    enableAllPoints,
    disableAllPoints,
    resetToDefaults,
    getEnabledPoints,
    isPointEnabled,
    
    // Templates
    getPointTemplates: getPointTemplatesByEquipmentType,
    allTemplates: EQUIPMENT_POINT_TEMPLATES,
  };
}
