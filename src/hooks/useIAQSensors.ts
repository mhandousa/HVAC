import { useMemo } from 'react';
import { useIoTDevices } from './useIoTDevices';
import { useSensorReadings } from './useSensorReadings';

export type IAQParameterType = 'co2' | 'pm25' | 'voc' | 'temperature' | 'humidity';

export interface IAQThreshold {
  good: number;
  moderate: number;
  unhealthy: number;
  hazardous: number;
}

export interface IAQStandard {
  ashrae: number;
  who?: number;
  saso?: number;
}

export interface IAQParameterConfig {
  id: IAQParameterType;
  name: string;
  nameAr: string;
  unit: string;
  thresholds: IAQThreshold;
  standards: IAQStandard;
  description: string;
  isHigherBetter: boolean; // false for pollutants, true for ventilation rate
}

// ASHRAE 62.1 and WHO guidelines
export const IAQ_PARAMETERS: IAQParameterConfig[] = [
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    nameAr: 'ثاني أكسيد الكربون',
    unit: 'ppm',
    thresholds: { good: 800, moderate: 1000, unhealthy: 1500, hazardous: 2000 },
    standards: { ashrae: 1000, who: 1000, saso: 1000 },
    description: 'Indicator of ventilation adequacy per ASHRAE 62.1',
    isHigherBetter: false,
  },
  {
    id: 'pm25',
    name: 'PM2.5',
    nameAr: 'جسيمات دقيقة 2.5',
    unit: 'µg/m³',
    thresholds: { good: 12, moderate: 35, unhealthy: 55, hazardous: 150 },
    standards: { ashrae: 35, who: 15, saso: 35 },
    description: 'Fine particulate matter harmful to respiratory health',
    isHigherBetter: false,
  },
  {
    id: 'voc',
    name: 'Total VOCs',
    nameAr: 'مركبات عضوية متطايرة',
    unit: 'ppb',
    thresholds: { good: 250, moderate: 500, unhealthy: 1000, hazardous: 2000 },
    standards: { ashrae: 500, who: 300 },
    description: 'Volatile organic compounds from materials and furnishings',
    isHigherBetter: false,
  },
  {
    id: 'temperature',
    name: 'Temperature',
    nameAr: 'درجة الحرارة',
    unit: '°C',
    thresholds: { good: 24, moderate: 26, unhealthy: 28, hazardous: 32 },
    standards: { ashrae: 26, saso: 24 },
    description: 'Thermal comfort per ASHRAE 55',
    isHigherBetter: false, // relative to setpoint
  },
  {
    id: 'humidity',
    name: 'Relative Humidity',
    nameAr: 'الرطوبة النسبية',
    unit: '%',
    thresholds: { good: 50, moderate: 60, unhealthy: 70, hazardous: 80 },
    standards: { ashrae: 60, saso: 55 },
    description: 'Optimal range 30-60% per ASHRAE 62.1',
    isHigherBetter: false, // relative to range
  },
];

export interface IAQReading {
  parameterId: IAQParameterType;
  value: number;
  status: 'good' | 'moderate' | 'unhealthy' | 'hazardous';
  score: number; // 0-100
  deviceId: string;
  deviceName: string;
  timestamp: string;
}

export interface ZoneIAQStatus {
  zoneId: string;
  zoneName: string;
  readings: IAQReading[];
  overallScore: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  ashrae62Compliant: boolean;
  recommendations: string[];
  lastUpdated: string;
}

export interface IAQDashboardData {
  zones: ZoneIAQStatus[];
  systemScore: number;
  systemCompliance: 'compliant' | 'warning' | 'non-compliant';
  parameterAverages: Record<IAQParameterType, number>;
  alertCount: number;
  sensorCount: number;
}

/**
 * Calculate IAQ score for a parameter value (0-100)
 */
export function calculateParameterScore(
  parameterId: IAQParameterType,
  value: number
): { score: number; status: 'good' | 'moderate' | 'unhealthy' | 'hazardous' } {
  const config = IAQ_PARAMETERS.find(p => p.id === parameterId);
  if (!config) return { score: 0, status: 'hazardous' };
  
  const { thresholds } = config;
  
  // Special handling for humidity (range-based)
  if (parameterId === 'humidity') {
    if (value >= 30 && value <= 50) return { score: 100, status: 'good' };
    if (value >= 25 && value <= 60) return { score: 80, status: 'moderate' };
    if (value >= 20 && value <= 70) return { score: 50, status: 'unhealthy' };
    return { score: 20, status: 'hazardous' };
  }
  
  // Special handling for temperature (range-based)
  if (parameterId === 'temperature') {
    if (value >= 22 && value <= 24) return { score: 100, status: 'good' };
    if (value >= 20 && value <= 26) return { score: 80, status: 'moderate' };
    if (value >= 18 && value <= 28) return { score: 50, status: 'unhealthy' };
    return { score: 20, status: 'hazardous' };
  }
  
  // Pollutant-based scoring (lower is better)
  if (value <= thresholds.good) {
    const score = 100 - (value / thresholds.good) * 20;
    return { score: Math.round(score), status: 'good' };
  }
  if (value <= thresholds.moderate) {
    const score = 80 - ((value - thresholds.good) / (thresholds.moderate - thresholds.good)) * 20;
    return { score: Math.round(score), status: 'moderate' };
  }
  if (value <= thresholds.unhealthy) {
    const score = 60 - ((value - thresholds.moderate) / (thresholds.unhealthy - thresholds.moderate)) * 30;
    return { score: Math.round(score), status: 'unhealthy' };
  }
  
  const score = Math.max(0, 30 - ((value - thresholds.unhealthy) / thresholds.unhealthy) * 30);
  return { score: Math.round(score), status: 'hazardous' };
}

/**
 * Calculate weighted overall IAQ score
 */
export function calculateOverallIAQScore(readings: IAQReading[]): number {
  const weights: Record<IAQParameterType, number> = {
    co2: 0.30,
    pm25: 0.25,
    voc: 0.20,
    temperature: 0.15,
    humidity: 0.10,
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const reading of readings) {
    const weight = weights[reading.parameterId] || 0.1;
    weightedSum += reading.score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Generate IAQ recommendations based on readings
 */
export function generateIAQRecommendations(readings: IAQReading[]): string[] {
  const recommendations: string[] = [];
  
  for (const reading of readings) {
    if (reading.status === 'good') continue;
    
    switch (reading.parameterId) {
      case 'co2':
        if (reading.value > 1000) {
          recommendations.push('Increase outdoor air supply to reduce CO₂ levels below 1000 ppm');
        }
        if (reading.value > 1500) {
          recommendations.push('Consider demand-controlled ventilation (DCV) with CO₂ sensors');
        }
        break;
      case 'pm25':
        if (reading.value > 35) {
          recommendations.push('Check air filtration - upgrade to MERV-13 or higher filters');
        }
        if (reading.value > 55) {
          recommendations.push('Inspect for sources of particulate matter (construction, outdoor pollution)');
        }
        break;
      case 'voc':
        if (reading.value > 500) {
          recommendations.push('Increase ventilation and identify VOC sources (cleaning products, materials)');
        }
        break;
      case 'temperature':
        if (reading.value > 26) {
          recommendations.push('Adjust cooling setpoint or check HVAC capacity');
        }
        if (reading.value < 20) {
          recommendations.push('Adjust heating setpoint or check heating system');
        }
        break;
      case 'humidity':
        if (reading.value > 60) {
          recommendations.push('Increase dehumidification - check ERV or dedicated dehumidifier');
        }
        if (reading.value < 30) {
          recommendations.push('Add humidification to improve thermal comfort');
        }
        break;
    }
  }
  
  return [...new Set(recommendations)]; // Remove duplicates
}

/**
 * Hook to get IAQ sensors and aggregate data
 */
export function useIAQSensors(projectId?: string) {
  const { data: devices = [], isLoading } = useIoTDevices();
  
  // Filter to IAQ-related device types
  const iaqDevices = useMemo(() => {
    const iaqTypes = ['co2', 'pm25', 'voc', 'temperature', 'humidity'];
    return devices.filter(d => iaqTypes.includes(d.device_type));
  }, [devices]);
  
  // Group by zone
  const devicesByZone = useMemo(() => {
    const grouped: Record<string, typeof iaqDevices> = {};
    for (const device of iaqDevices) {
      const zoneId = device.zone_id || 'unassigned';
      if (!grouped[zoneId]) grouped[zoneId] = [];
      grouped[zoneId].push(device);
    }
    return grouped;
  }, [iaqDevices]);
  
  // Generate mock readings for now (would come from real sensors)
  const zoneStatuses = useMemo((): ZoneIAQStatus[] => {
    return Object.entries(devicesByZone).map(([zoneId, zoneDevices]) => {
      const readings: IAQReading[] = zoneDevices.map(device => {
        // Use last reading or generate demo value
        const value = device.last_reading_value ?? getDefaultValue(device.device_type as IAQParameterType);
        const { score, status } = calculateParameterScore(device.device_type as IAQParameterType, value);
        
        return {
          parameterId: device.device_type as IAQParameterType,
          value,
          score,
          status,
          deviceId: device.id,
          deviceName: device.name,
          timestamp: device.last_reading_at || new Date().toISOString(),
        };
      });
      
      const overallScore = calculateOverallIAQScore(readings);
      const recommendations = generateIAQRecommendations(readings);
      
      const hasNonCompliant = readings.some(r => r.status === 'unhealthy' || r.status === 'hazardous');
      const hasWarning = readings.some(r => r.status === 'moderate');
      
      return {
        zoneId,
        zoneName: zoneId === 'unassigned' ? 'Unassigned' : `Zone ${zoneId.slice(0, 8)}`,
        readings,
        overallScore,
        complianceStatus: hasNonCompliant ? 'non-compliant' : hasWarning ? 'warning' : 'compliant',
        ashrae62Compliant: !hasNonCompliant,
        recommendations,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [devicesByZone]);
  
  // System-wide aggregation
  const dashboardData = useMemo((): IAQDashboardData => {
    const allReadings = zoneStatuses.flatMap(z => z.readings);
    
    // Calculate parameter averages
    const parameterAverages: Record<IAQParameterType, number> = {
      co2: 0,
      pm25: 0,
      voc: 0,
      temperature: 0,
      humidity: 0,
    };
    
    const counts: Record<string, number> = {};
    for (const reading of allReadings) {
      parameterAverages[reading.parameterId] = (parameterAverages[reading.parameterId] || 0) + reading.value;
      counts[reading.parameterId] = (counts[reading.parameterId] || 0) + 1;
    }
    
    for (const key of Object.keys(parameterAverages) as IAQParameterType[]) {
      if (counts[key]) {
        parameterAverages[key] = Math.round(parameterAverages[key] / counts[key]);
      }
    }
    
    const systemScore = zoneStatuses.length > 0
      ? Math.round(zoneStatuses.reduce((sum, z) => sum + z.overallScore, 0) / zoneStatuses.length)
      : 0;
    
    const hasNonCompliant = zoneStatuses.some(z => z.complianceStatus === 'non-compliant');
    const hasWarning = zoneStatuses.some(z => z.complianceStatus === 'warning');
    
    const alertCount = allReadings.filter(r => r.status === 'unhealthy' || r.status === 'hazardous').length;
    
    return {
      zones: zoneStatuses,
      systemScore,
      systemCompliance: hasNonCompliant ? 'non-compliant' : hasWarning ? 'warning' : 'compliant',
      parameterAverages,
      alertCount,
      sensorCount: iaqDevices.length,
    };
  }, [zoneStatuses, iaqDevices]);
  
  return {
    iaqDevices,
    devicesByZone,
    zoneStatuses,
    dashboardData,
    isLoading,
    IAQ_PARAMETERS,
  };
}

function getDefaultValue(type: IAQParameterType): number {
  switch (type) {
    case 'co2': return 650 + Math.random() * 200;
    case 'pm25': return 8 + Math.random() * 15;
    case 'voc': return 150 + Math.random() * 150;
    case 'temperature': return 22 + Math.random() * 4;
    case 'humidity': return 45 + Math.random() * 15;
    default: return 0;
  }
}
