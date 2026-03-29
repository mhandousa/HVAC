import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'fault-detection' | 'energy-analysis' | 'maintenance-prediction' | 'general';
  data: Record<string, unknown>;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, context } = await req.json() as AnalysisRequest;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'fault-detection':
        systemPrompt = `You are an expert HVAC fault detection and diagnostics (FDD) system. Analyze sensor data and equipment readings to identify potential faults, their severity, and recommended actions. Be concise and actionable. Format your response as JSON with the following structure:
{
  "faults": [
    {
      "equipment": "equipment tag",
      "fault": "fault description",
      "severity": "low|medium|high|critical",
      "probable_cause": "likely cause",
      "recommended_action": "what to do"
    }
  ],
  "summary": "brief overall assessment"
}`;
        userPrompt = `Analyze this HVAC sensor data for faults:\n${JSON.stringify(data, null, 2)}${context ? `\n\nAdditional context: ${context}` : ''}`;
        break;

      case 'energy-analysis':
        systemPrompt = `You are an HVAC energy efficiency expert. Analyze equipment performance data to identify energy waste and optimization opportunities. Provide specific, actionable recommendations. Format your response as JSON:
{
  "efficiency_score": number (0-100),
  "findings": [
    {
      "issue": "description",
      "impact": "energy/cost impact",
      "recommendation": "specific action"
    }
  ],
  "estimated_savings": "potential savings description",
  "summary": "brief assessment"
}`;
        userPrompt = `Analyze this HVAC energy data:\n${JSON.stringify(data, null, 2)}${context ? `\n\nAdditional context: ${context}` : ''}`;
        break;

      case 'maintenance-prediction':
        systemPrompt = `You are a predictive maintenance AI for HVAC systems. Based on equipment data, runtime hours, and sensor trends, predict when maintenance will be needed. Format your response as JSON:
{
  "predictions": [
    {
      "equipment": "equipment tag",
      "component": "component needing attention",
      "predicted_issue": "what might fail",
      "confidence": "low|medium|high",
      "timeframe": "when it might occur",
      "recommended_action": "preventive action"
    }
  ],
  "maintenance_priorities": ["ordered list of maintenance priorities"],
  "summary": "brief assessment"
}`;
        userPrompt = `Predict maintenance needs for this HVAC equipment:\n${JSON.stringify(data, null, 2)}${context ? `\n\nAdditional context: ${context}` : ''}`;
        break;

      default:
        systemPrompt = `You are an expert HVAC consultant with deep knowledge of HVAC design, operations, troubleshooting, and best practices. Provide helpful, accurate, and practical advice. Be concise.`;
        userPrompt = typeof data === 'string' ? data : JSON.stringify(data);
    }

    console.log(`Processing ${type} analysis request`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    // Try to parse as JSON if it's a structured response
    let parsedContent = content;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[1].trim());
      } else if (content.trim().startsWith('{')) {
        parsedContent = JSON.parse(content);
      }
    } catch {
      // Keep as string if not valid JSON
      parsedContent = content;
    }

    console.log(`Successfully processed ${type} analysis`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        type,
        result: parsedContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('HVAC AI analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
