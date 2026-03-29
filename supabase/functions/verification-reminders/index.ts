import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingZone {
  zoneId: string;
  zoneName: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  remediationId: string;
  treatmentType: string;
  appliedDate: string;
  daysPending: number;
  notificationType: 'initial' | 'overdue' | 'urgent';
}

interface Recipient {
  email: string;
  full_name: string | null;
  role: string | null;
}

function getNotificationType(daysPending: number): 'initial' | 'overdue' | 'urgent' | null {
  if (daysPending >= 14) return 'urgent';
  if (daysPending >= 7) return 'overdue';
  if (daysPending >= 3) return 'initial';
  return null;
}

function getEmailTemplate(zones: PendingZone[], notificationType: string, recipientName: string): { subject: string; html: string } {
  const urgencyColors = {
    initial: { header: '#3b82f6', bg: '#eff6ff', text: 'Reminder' },
    overdue: { header: '#f59e0b', bg: '#fffbeb', text: 'Overdue' },
    urgent: { header: '#ef4444', bg: '#fef2f2', text: 'Urgent Action Required' },
  };

  const style = urgencyColors[notificationType as keyof typeof urgencyColors] || urgencyColors.initial;
  
  const zoneRows = zones.map(zone => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${zone.zoneName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${zone.projectName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${zone.treatmentType}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${zone.daysPending} days</td>
    </tr>
  `).join('');

  const subject = notificationType === 'urgent' 
    ? `🚨 URGENT: ${zones.length} Acoustic Zone${zones.length > 1 ? 's' : ''} Require Immediate Verification`
    : notificationType === 'overdue'
    ? `⚠️ Overdue: ${zones.length} Acoustic Zone${zones.length > 1 ? 's' : ''} Pending Verification`
    : `📋 Reminder: ${zones.length} Acoustic Zone${zones.length > 1 ? 's' : ''} Awaiting Verification`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${style.header}; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${style.text}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Acoustic Zone Verification</p>
        </div>
        
        <div style="background-color: white; padding: 24px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName || 'Team Member'},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            The following acoustic zone${zones.length > 1 ? 's have' : ' has'} remediation treatments applied and ${zones.length > 1 ? 'are' : 'is'} awaiting verification measurements:
          </p>
          
          <div style="background-color: ${style.bg}; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: rgba(0,0,0,0.05);">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Zone</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Project</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Treatment</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Waiting</th>
                </tr>
              </thead>
              <tbody>
                ${zoneRows}
              </tbody>
            </table>
          </div>
          
          ${notificationType === 'urgent' ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: 600;">
                ⚠️ These zones have been pending for over 14 days. Immediate verification is required to ensure treatment effectiveness.
              </p>
            </div>
          ` : ''}
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Please schedule verification measurements for ${zones.length > 1 ? 'these zones' : 'this zone'} at your earliest convenience to confirm the remediation treatments are effective.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Best regards,<br>
            HVAC Design System
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

async function getPendingZones(supabase: any): Promise<PendingZone[]> {
  const pendingZones: PendingZone[] = [];

  // Get all commissioning checklists with installed_data
  const { data: checklists, error } = await supabase
    .from('commissioning_checklists')
    .select(`
      id,
      equipment_tag,
      installed_data,
      commissioning_projects!inner (
        id,
        name,
        organization_id,
        project_id,
        projects (
          id,
          name
        )
      )
    `)
    .not('installed_data', 'is', null);

  if (error) {
    console.error('Error fetching checklists:', error);
    return [];
  }

  const now = new Date();

  for (const checklist of checklists || []) {
    const installedData = checklist.installed_data as any;
    const remediationHistory = installedData?.remediationHistory || [];

    for (const record of remediationHistory) {
      if (record.status === 'pending-verification' && record.appliedDate) {
        const appliedDate = new Date(record.appliedDate);
        const daysPending = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
        const notificationType = getNotificationType(daysPending);

        if (notificationType) {
          pendingZones.push({
            zoneId: record.id || `${checklist.id}-${record.appliedDate}`,
            zoneName: checklist.equipment_tag || 'Unknown Zone',
            projectId: checklist.commissioning_projects?.project_id || '',
            projectName: checklist.commissioning_projects?.projects?.name || 'Unknown Project',
            organizationId: checklist.commissioning_projects?.organization_id,
            remediationId: record.id || `${checklist.id}-${record.appliedDate}`,
            treatmentType: record.treatmentType || 'Acoustic Treatment',
            appliedDate: record.appliedDate,
            daysPending,
            notificationType,
          });
        }
      }
    }
  }

  return pendingZones;
}

async function getRecipients(supabase: any, organizationId: string, notificationType: string): Promise<Recipient[]> {
  const roles = notificationType === 'urgent'
    ? ['admin', 'manager', 'engineer', 'technician']
    : notificationType === 'overdue'
    ? ['manager', 'engineer']
    : ['engineer', 'technician'];

  const { data: recipients, error } = await supabase
    .from('profiles')
    .select('email, full_name, role')
    .eq('organization_id', organizationId)
    .not('email', 'is', null);

  if (error) {
    console.error('Error fetching recipients:', error);
    return [];
  }

  // Filter by roles if role field exists, otherwise return all with emails
  return (recipients || []).filter((r: Recipient) => 
    r.email && (
      !r.role || 
      roles.includes(r.role.toLowerCase()) ||
      notificationType === 'urgent' // Include everyone for urgent
    )
  );
}

async function hasRecentNotification(
  supabase: any, 
  zoneId: string, 
  notificationType: string, 
  recipientEmail: string
): Promise<boolean> {
  // Check if we've sent this type of notification in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('verification_notification_logs')
    .select('id')
    .eq('zone_id', zoneId)
    .eq('notification_type', notificationType)
    .eq('recipient_email', recipientEmail)
    .gte('sent_at', oneDayAgo)
    .limit(1);

  if (error) {
    console.error('Error checking recent notifications:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional filters from request body
    let filters: { projectId?: string; organizationId?: string; forceResend?: boolean } = {};
    try {
      const body = await req.json();
      filters = body || {};
    } catch {
      // No body provided, use defaults
    }

    console.log('Starting verification reminders process with filters:', filters);

    // Get all pending zones
    let pendingZones = await getPendingZones(supabase);
    console.log(`Found ${pendingZones.length} pending zones`);

    // Apply filters if provided
    if (filters.projectId) {
      pendingZones = pendingZones.filter(z => z.projectId === filters.projectId);
    }
    if (filters.organizationId) {
      pendingZones = pendingZones.filter(z => z.organizationId === filters.organizationId);
    }

    // Group zones by organization and notification type
    const groupedZones = new Map<string, PendingZone[]>();
    for (const zone of pendingZones) {
      const key = `${zone.organizationId}|${zone.notificationType}`;
      if (!groupedZones.has(key)) {
        groupedZones.set(key, []);
      }
      groupedZones.get(key)!.push(zone);
    }

    const results: { sent: number; skipped: number; errors: string[] } = {
      sent: 0,
      skipped: 0,
      errors: [],
    };

    // Process each group
    for (const [key, zones] of groupedZones) {
      const [organizationId, notificationType] = key.split('|');
      
      // Get recipients for this org and notification level
      const recipients = await getRecipients(supabase, organizationId, notificationType);
      
      if (recipients.length === 0) {
        console.log(`No recipients found for org ${organizationId}`);
        continue;
      }

      // Send to each recipient
      for (const recipient of recipients) {
        // Check if we've already sent this notification recently
        const alreadySent = !filters.forceResend && await hasRecentNotification(
          supabase,
          zones.map(z => z.zoneId).join(','),
          notificationType,
          recipient.email
        );

        if (alreadySent) {
          results.skipped++;
          continue;
        }

        try {
          const { subject, html } = getEmailTemplate(zones, notificationType, recipient.full_name || 'Team Member');

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "HVAC Design System <onboarding@resend.dev>",
              to: [recipient.email],
              subject,
              html,
            }),
          });

          const emailResult = await emailResponse.json();

          console.log(`Email sent to ${recipient.email}:`, emailResult);

          // Log each zone notification
          for (const zone of zones) {
            await supabase.from('verification_notification_logs').insert({
              organization_id: organizationId,
              project_id: zone.projectId || null,
              zone_id: zone.zoneId,
              zone_name: zone.zoneName,
              remediation_record_id: zone.remediationId,
              notification_type: notificationType,
              recipient_email: recipient.email,
              recipient_name: recipient.full_name,
              days_pending: zone.daysPending,
            });
          }

          results.sent++;
        } catch (emailError: any) {
          console.error(`Error sending email to ${recipient.email}:`, emailError);
          results.errors.push(`Failed to send to ${recipient.email}: ${emailError.message}`);
        }
      }
    }

    console.log('Verification reminders complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${results.sent} notifications, skipped ${results.skipped} (already sent recently)`,
        ...results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verification-reminders function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
