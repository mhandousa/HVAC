import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'assignment' | 'reminder' | 'overdue';
  assignmentId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured - skipping email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Email notifications not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, assignmentId } = await req.json() as NotificationRequest;

    // Fetch assignment details with relations
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('deficiency_assignments')
      .select(`
        *,
        assignee:assigned_to (
          id,
          full_name,
          email
        ),
        assigner:assigned_by (
          id,
          full_name
        ),
        photo_metadata:photo_metadata_id (
          id,
          photo_url,
          deficiency_tags,
          deficiency_severity,
          description,
          test:test_id (
            test_name,
            checklist:checklist_id (
              equipment_tag,
              commissioning_project:commissioning_project_id (
                name,
                project:project_id (
                  name
                )
              )
            )
          )
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error(`Assignment not found: ${assignmentError?.message}`);
    }

    const assignee = assignment.assignee;
    const assigner = assignment.assigner;
    const metadata = assignment.photo_metadata;
    const test = metadata?.test;
    const checklist = test?.checklist;
    const commProject = checklist?.commissioning_project;
    const project = commProject?.project;

    if (!assignee?.email) {
      throw new Error('Assignee email not found');
    }

    const equipmentTag = checklist?.equipment_tag || 'Unknown Equipment';
    const projectName = project?.name || commProject?.name || 'Unknown Project';
    const severity = metadata?.deficiency_severity || 'Unknown';
    const dueDateStr = assignment.due_date
      ? new Date(assignment.due_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not set';

    let subject = '';
    let heading = '';
    let message = '';

    switch (type) {
      case 'assignment':
        subject = `🔧 Deficiency Assigned: ${equipmentTag} - ${severity}`;
        heading = 'New Deficiency Assignment';
        message = `You have been assigned a deficiency to resolve.`;
        break;
      case 'reminder':
        subject = `⏰ Reminder: Deficiency Due Tomorrow - ${equipmentTag}`;
        heading = 'Due Date Reminder';
        message = `This deficiency is due tomorrow. Please complete it on time.`;
        break;
      case 'overdue':
        subject = `⚠️ Overdue: Deficiency Past Due Date - ${equipmentTag}`;
        heading = 'Deficiency Overdue';
        message = `This deficiency is now past its due date. Please address it immediately.`;
        break;
    }

    const priorityColors: Record<string, string> = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };

    const severityColors: Record<string, string> = {
      minor: '#22c55e',
      major: '#f59e0b',
      critical: '#ef4444',
    };

    const priorityBadgeColor = priorityColors[assignment.priority] || '#3b82f6';
    const severityBadgeColor = severityColors[severity.toLowerCase()] || '#6b7280';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${heading}</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0; font-size: 16px;">Hi ${assignee.full_name || 'there'},</p>
            <p style="font-size: 16px;">${message}</p>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 120px;">📍 Equipment:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-family: monospace;">${equipmentTag}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">🏢 Project:</td>
                  <td style="padding: 8px 0;">${projectName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">⚠️ Severity:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${severityBadgeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">
                      ${severity}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">📅 Due Date:</td>
                  <td style="padding: 8px 0; ${type === 'overdue' ? 'color: #ef4444; font-weight: 600;' : ''}">${dueDateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">🎯 Priority:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${priorityBadgeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">
                      ${assignment.priority}
                    </span>
                  </td>
                </tr>
              </table>
              
              ${metadata?.deficiency_tags?.length > 0 ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Issue Tags:</p>
                  <div>
                    ${metadata.deficiency_tags.map((tag: string) => 
                      `<span style="display: inline-block; background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; margin: 2px 4px 2px 0;">${tag.replace(/_/g, ' ')}</span>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${assignment.notes ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Notes from ${assigner?.full_name || 'manager'}:</p>
                  <p style="margin: 0; padding: 12px; background: #f1f5f9; border-radius: 6px; font-style: italic;">"${assignment.notes}"</p>
                </div>
              ` : ''}
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
              — HVAC Management System
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              This is an automated notification from your HVAC Management System.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HVAC System <notifications@resend.dev>',
        to: [assignee.email],
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    // Update notification_sent_at
    const updateField = type === 'reminder' ? 'reminder_sent_at' : 'notification_sent_at';
    await supabaseClient
      .from('deficiency_assignments')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', assignmentId);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
