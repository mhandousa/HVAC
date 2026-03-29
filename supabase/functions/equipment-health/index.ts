import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthAnalysisRequest {
  equipment_id: string;
  include_ai_analysis?: boolean;
}

interface SensorReading {
  device_id: string;
  value: number;
  quality: string;
  recorded_at: string;
}

interface IoTDevice {
  id: string;
  name: string;
  device_type: string;
  unit: string;
  setpoint: number | null;
  min_threshold: number | null;
  max_threshold: number | null;
  last_reading_value: number | null;
  last_reading_at: string | null;
}

interface AlertData {
  id: string;
  severity: string;
  alert_type: string;
  is_active: boolean;
  triggered_at: string;
  resolved_at: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { equipment_id, include_ai_analysis = true } = await req.json() as HealthAnalysisRequest;

    if (!equipment_id) {
      throw new Error('equipment_id is required');
    }

    console.log(`Analyzing health for equipment: ${equipment_id}`);

    // Fetch equipment data
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipment_id)
      .single();

    if (equipmentError || !equipment) {
      throw new Error(`Equipment not found: ${equipment_id}`);
    }

    // Fetch IoT devices linked to this equipment
    const { data: devices, error: devicesError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('equipment_id', equipment_id)
      .eq('is_active', true);

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
    }

    const iotDevices = (devices || []) as IoTDevice[];

    // Fetch recent sensor readings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let allReadings: SensorReading[] = [];
    if (iotDevices.length > 0) {
      const deviceIds = iotDevices.map(d => d.id);
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('device_id', deviceIds)
        .gte('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (readingsError) {
        console.error('Error fetching readings:', readingsError);
      }
      allReadings = (readings || []) as SensorReading[];
    }

    // Fetch recent alerts for this equipment
    const { data: alerts, error: alertsError } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .eq('equipment_id', equipment_id)
      .gte('triggered_at', sevenDaysAgo.toISOString())
      .order('triggered_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
    }

    const alertData = (alerts || []) as AlertData[];

    // Calculate health scores based on sensor data analysis
    const healthScores = calculateHealthScores(equipment, iotDevices, allReadings, alertData);

    // Get AI-powered recommendations if requested
    let aiAnalysis = null;
    if (include_ai_analysis && allReadings.length > 0) {
      aiAnalysis = await getAIAnalysis(equipment, iotDevices, allReadings, alertData);
    }

    // Merge AI recommendations with calculated scores
    const finalScores = {
      ...healthScores,
      recommendations: aiAnalysis?.recommendations || healthScores.recommendations,
      analysis_factors: {
        ...healthScores.analysis_factors,
        ai_insights: aiAnalysis?.insights || null,
      },
    };

    // Upsert health scores to database
    const { error: upsertError } = await supabase
      .from('equipment_health_scores')
      .upsert({
        equipment_id,
        organization_id: equipment.organization_id,
        ...finalScores,
        last_analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'equipment_id',
      });

    if (upsertError) {
      console.error('Error upserting health scores:', upsertError);
      throw upsertError;
    }

    // Auto-create maintenance work order if health is critical
    let workOrderCreated = null;
    if (finalScores.risk_level === 'critical' || finalScores.overall_score < 40) {
      workOrderCreated = await createMaintenanceWorkOrder(
        supabase,
        equipment,
        finalScores
      );
    }

    console.log(`Health analysis complete for equipment: ${equipment_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        equipment_id,
        equipment_tag: equipment.tag,
        equipment_name: equipment.name,
        work_order_created: workOrderCreated,
        ...finalScores,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Equipment health analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateHealthScores(
  equipment: Record<string, unknown>,
  devices: IoTDevice[],
  readings: SensorReading[],
  alerts: AlertData[]
) {
  // Initialize scores
  let performanceScore = 100;
  let reliabilityScore = 100;
  let efficiencyScore = 100;
  let conditionScore = 100;

  const factors: Record<string, unknown> = {
    sensor_count: devices.length,
    reading_count: readings.length,
    alert_count: alerts.length,
    active_alerts: alerts.filter(a => a.is_active).length,
  };

  const recommendations: string[] = [];

  // === Performance Score ===
  // Based on how well readings stay within thresholds
  if (devices.length > 0) {
    let thresholdViolations = 0;
    let totalChecks = 0;

    for (const device of devices) {
      const deviceReadings = readings.filter(r => r.device_id === device.id);
      
      for (const reading of deviceReadings) {
        totalChecks++;
        if (device.max_threshold && reading.value > device.max_threshold) {
          thresholdViolations++;
        }
        if (device.min_threshold && reading.value < device.min_threshold) {
          thresholdViolations++;
        }
      }

      // Check setpoint deviation
      if (device.setpoint && deviceReadings.length > 0) {
        const avgValue = deviceReadings.reduce((sum, r) => sum + r.value, 0) / deviceReadings.length;
        const deviation = Math.abs(avgValue - device.setpoint);
        const deviationPercent = (deviation / device.setpoint) * 100;
        
        if (deviationPercent > 20) {
          performanceScore -= 15;
          recommendations.push(`${device.name} is operating ${deviation.toFixed(1)}${device.unit} from setpoint`);
        } else if (deviationPercent > 10) {
          performanceScore -= 5;
        }
      }
    }

    if (totalChecks > 0) {
      const violationRate = thresholdViolations / totalChecks;
      performanceScore -= Math.round(violationRate * 50);
      factors.threshold_violation_rate = violationRate;
    }
  } else {
    // No sensors = unknown performance
    performanceScore = 70;
    recommendations.push('Add IoT sensors to monitor equipment performance');
  }

  // === Reliability Score ===
  // Based on alert frequency and severity
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  reliabilityScore -= activeAlerts.length * 10;
  reliabilityScore -= criticalAlerts.length * 15;
  reliabilityScore -= warningAlerts.length * 5;

  if (criticalAlerts.length > 0) {
    recommendations.push(`Address ${criticalAlerts.length} critical alert(s) immediately`);
  }

  // Check reading quality
  const badQualityReadings = readings.filter(r => r.quality === 'bad' || r.quality === 'uncertain');
  if (badQualityReadings.length > readings.length * 0.1) {
    reliabilityScore -= 10;
    factors.poor_quality_readings = badQualityReadings.length;
    recommendations.push('Check sensor connections - many readings have poor quality');
  }

  // === Efficiency Score ===
  // Analyze trends and patterns
  if (readings.length >= 10) {
    const tempDevices = devices.filter(d => d.device_type === 'temperature');
    const powerDevices = devices.filter(d => d.device_type === 'power' || d.device_type === 'energy');

    // Check for temperature fluctuations (inefficient cycling)
    for (const device of tempDevices) {
      const deviceReadings = readings
        .filter(r => r.device_id === device.id)
        .map(r => r.value);

      if (deviceReadings.length >= 10) {
        const variance = calculateVariance(deviceReadings);
        if (variance > 5) {
          efficiencyScore -= 10;
          factors.high_temp_variance = variance;
          recommendations.push(`${device.name} shows high temperature fluctuation - possible cycling issue`);
        }
      }
    }

    // Check power consumption patterns
    for (const device of powerDevices) {
      const deviceReadings = readings
        .filter(r => r.device_id === device.id)
        .map(r => r.value);

      if (deviceReadings.length >= 10) {
        const maxPower = Math.max(...deviceReadings);
        const avgPower = deviceReadings.reduce((a, b) => a + b, 0) / deviceReadings.length;
        
        if (maxPower > avgPower * 1.5) {
          efficiencyScore -= 5;
          factors.power_spike_ratio = maxPower / avgPower;
          recommendations.push('Power consumption shows spikes - check for inefficient operation');
        }
      }
    }
  }

  // === Condition Score ===
  // Based on equipment age and warranty status
  const installDate = equipment.install_date as string | null;
  if (installDate) {
    const ageYears = (Date.now() - new Date(installDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    factors.age_years = ageYears;

    if (ageYears > 15) {
      conditionScore -= 30;
      recommendations.push('Equipment is over 15 years old - plan for replacement');
    } else if (ageYears > 10) {
      conditionScore -= 15;
      recommendations.push('Equipment is aging - increase PM frequency');
    } else if (ageYears > 5) {
      conditionScore -= 5;
    }
  }

  const warrantyExpiry = equipment.warranty_expiry as string | null;
  if (warrantyExpiry) {
    const warrantyEnd = new Date(warrantyExpiry);
    const now = new Date();
    
    if (warrantyEnd < now) {
      factors.warranty_expired = true;
    } else {
      const daysRemaining = (warrantyEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      if (daysRemaining < 90) {
        recommendations.push(`Warranty expires in ${Math.round(daysRemaining)} days`);
      }
    }
  }

  // Equipment status impact
  if (equipment.status === 'offline' || equipment.status === 'critical') {
    conditionScore -= 30;
  } else if (equipment.status === 'maintenance') {
    conditionScore -= 10;
  }

  // Clamp scores between 0 and 100
  performanceScore = Math.max(0, Math.min(100, performanceScore));
  reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
  efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));
  conditionScore = Math.max(0, Math.min(100, conditionScore));

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    performanceScore * 0.3 +
    reliabilityScore * 0.25 +
    efficiencyScore * 0.25 +
    conditionScore * 0.2
  );

  // Determine trend based on recent alerts
  const recentAlerts = alerts.filter(a => {
    const alertDate = new Date(a.triggered_at);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return alertDate > twoDaysAgo;
  });

  const olderAlerts = alerts.filter(a => {
    const alertDate = new Date(a.triggered_at);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return alertDate <= twoDaysAgo && alertDate > sevenDaysAgo;
  });

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentAlerts.length > olderAlerts.length * 1.5) {
    trend = 'declining';
  } else if (recentAlerts.length < olderAlerts.length * 0.5 && olderAlerts.length > 0) {
    trend = 'improving';
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (overallScore < 40 || activeAlerts.filter(a => a.severity === 'critical').length > 0) {
    riskLevel = 'critical';
  } else if (overallScore < 60 || activeAlerts.length > 2) {
    riskLevel = 'high';
  } else if (overallScore < 80 || activeAlerts.length > 0) {
    riskLevel = 'medium';
  }

  // Determine maintenance urgency
  let maintenanceUrgency: 'none' | 'routine' | 'soon' | 'urgent' | 'immediate' = 'routine';
  if (riskLevel === 'critical') {
    maintenanceUrgency = 'immediate';
  } else if (riskLevel === 'high') {
    maintenanceUrgency = 'urgent';
  } else if (riskLevel === 'medium') {
    maintenanceUrgency = 'soon';
  } else if (overallScore > 90) {
    maintenanceUrgency = 'none';
  }

  // Predict maintenance date
  let predictedMaintenanceDate = null;
  if (maintenanceUrgency === 'immediate') {
    predictedMaintenanceDate = new Date().toISOString().split('T')[0];
  } else if (maintenanceUrgency === 'urgent') {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    predictedMaintenanceDate = date.toISOString().split('T')[0];
  } else if (maintenanceUrgency === 'soon') {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    predictedMaintenanceDate = date.toISOString().split('T')[0];
  } else if (maintenanceUrgency === 'routine') {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    predictedMaintenanceDate = date.toISOString().split('T')[0];
  }

  // Sensor data summary
  const sensorDataSummary: Record<string, unknown> = {};
  for (const device of devices) {
    const deviceReadings = readings.filter(r => r.device_id === device.id).map(r => r.value);
    if (deviceReadings.length > 0) {
      sensorDataSummary[device.name] = {
        device_type: device.device_type,
        unit: device.unit,
        min: Math.min(...deviceReadings),
        max: Math.max(...deviceReadings),
        avg: deviceReadings.reduce((a, b) => a + b, 0) / deviceReadings.length,
        latest: deviceReadings[deviceReadings.length - 1],
        reading_count: deviceReadings.length,
      };
    }
  }

  return {
    overall_score: overallScore,
    performance_score: performanceScore,
    reliability_score: reliabilityScore,
    efficiency_score: efficiencyScore,
    condition_score: conditionScore,
    trend,
    risk_level: riskLevel,
    predicted_maintenance_date: predictedMaintenanceDate,
    maintenance_urgency: maintenanceUrgency,
    analysis_factors: factors,
    recommendations,
    sensor_data_summary: sensorDataSummary,
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

async function getAIAnalysis(
  equipment: Record<string, unknown>,
  devices: IoTDevice[],
  readings: SensorReading[],
  alerts: AlertData[]
) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not configured, skipping AI analysis');
    return null;
  }

  try {
    // Prepare summarized data for AI
    const sensorSummary = devices.map(device => {
      const deviceReadings = readings.filter(r => r.device_id === device.id).map(r => r.value);
      return {
        name: device.name,
        type: device.device_type,
        unit: device.unit,
        setpoint: device.setpoint,
        min_threshold: device.min_threshold,
        max_threshold: device.max_threshold,
        reading_count: deviceReadings.length,
        min_value: deviceReadings.length > 0 ? Math.min(...deviceReadings) : null,
        max_value: deviceReadings.length > 0 ? Math.max(...deviceReadings) : null,
        avg_value: deviceReadings.length > 0 ? deviceReadings.reduce((a, b) => a + b, 0) / deviceReadings.length : null,
      };
    });

    const alertSummary = {
      total: alerts.length,
      active: alerts.filter(a => a.is_active).length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      recent_types: [...new Set(alerts.slice(0, 10).map(a => a.alert_type))],
    };

    const analysisData = {
      equipment: {
        tag: equipment.tag,
        name: equipment.name,
        type: equipment.equipment_type,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        status: equipment.status,
        install_date: equipment.install_date,
        warranty_expiry: equipment.warranty_expiry,
      },
      sensors: sensorSummary,
      alerts: alertSummary,
      analysis_period: '7 days',
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert HVAC predictive maintenance AI. Analyze equipment sensor data and provide actionable maintenance recommendations. Focus on:
1. Identifying patterns that indicate potential failures
2. Prioritizing maintenance actions by urgency
3. Estimating time until potential issues become critical
4. Suggesting specific preventive actions

Return your analysis as JSON with this structure:
{
  "insights": "Brief summary of equipment condition and key findings",
  "recommendations": ["Array of specific, actionable maintenance recommendations"],
  "predicted_issues": [
    {
      "issue": "What might fail",
      "probability": "low|medium|high",
      "timeframe": "When it might occur",
      "prevention": "How to prevent it"
    }
  ]
}`,
          },
          {
            role: 'user',
            content: `Analyze this HVAC equipment health data and provide maintenance predictions:\n${JSON.stringify(analysisData, null, 2)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    // Parse JSON response
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      if (content.trim().startsWith('{')) {
        return JSON.parse(content);
      }
    } catch {
      console.error('Failed to parse AI response as JSON');
    }

    return { insights: content, recommendations: [] };
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

// Create maintenance work order for critical health equipment
// deno-lint-ignore no-explicit-any
async function createMaintenanceWorkOrder(
  supabase: any,
  equipment: Record<string, unknown>,
  healthScores: {
    overall_score: number;
    risk_level: string;
    maintenance_urgency: string;
    recommendations: string[];
    predicted_maintenance_date: string | null;
  }
): Promise<{ id: string; title: string } | null> {
  const equipmentId = equipment.id as string;
  const organizationId = equipment.organization_id as string;
  const equipmentTag = equipment.tag as string;
  const equipmentName = equipment.name as string;

  // Check if there's already an open work order for this equipment from health monitoring
  const { data: existingWorkOrders, error: checkError } = await supabase
    .from('work_orders')
    .select('id, title, status')
    .eq('equipment_id', equipmentId)
    .eq('organization_id', organizationId)
    .in('status', ['open', 'in_progress'])
    .ilike('title', '%Health Alert%')
    .limit(1);

  if (checkError) {
    console.error('Error checking existing work orders:', checkError);
    return null;
  }

  if (existingWorkOrders && existingWorkOrders.length > 0) {
    console.log(`Work order already exists for equipment ${equipmentId}: ${existingWorkOrders[0].id}`);
    return { id: existingWorkOrders[0].id, title: existingWorkOrders[0].title };
  }

  // Determine priority based on risk level
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (healthScores.risk_level === 'critical') {
    priority = 'urgent';
  } else if (healthScores.risk_level === 'high') {
    priority = 'high';
  }

  // Build description from health data
  const descriptionLines = [
    `**Auto-generated from Equipment Health Monitoring**`,
    ``,
    `**Health Score:** ${healthScores.overall_score}/100`,
    `**Risk Level:** ${healthScores.risk_level.toUpperCase()}`,
    `**Maintenance Urgency:** ${healthScores.maintenance_urgency}`,
    ``,
    `**Predicted Maintenance Date:** ${healthScores.predicted_maintenance_date || 'Immediate attention required'}`,
    ``,
    `**Recommended Actions:**`,
    ...healthScores.recommendations.map(r => `- ${r}`),
  ];

  const title = `⚠️ Health Alert: ${equipmentName} (${equipmentTag}) - Score ${healthScores.overall_score}/100`;
  
  // Calculate due date based on urgency
  const dueDate = new Date();
  if (healthScores.maintenance_urgency === 'immediate') {
    // Due today
  } else if (healthScores.maintenance_urgency === 'urgent') {
    dueDate.setDate(dueDate.getDate() + 3);
  } else if (healthScores.maintenance_urgency === 'soon') {
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    dueDate.setDate(dueDate.getDate() + 14);
  }

  const { data: newWorkOrder, error: insertError } = await supabase
    .from('work_orders')
    .insert({
      organization_id: organizationId,
      equipment_id: equipmentId,
      equipment_tag: equipmentTag,
      zone_id: equipment.zone_id || null,
      title,
      description: descriptionLines.join('\n'),
      priority,
      status: 'open',
      due_date: dueDate.toISOString().split('T')[0],
    })
    .select('id, title')
    .single();

  if (insertError) {
    console.error('Error creating work order:', insertError);
    return null;
  }

  console.log(`Created maintenance work order for equipment ${equipmentId}: ${newWorkOrder.id}`);
  return newWorkOrder;
}
