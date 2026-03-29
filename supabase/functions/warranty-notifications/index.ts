import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get equipment with warranties expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = thirtyDaysFromNow.toISOString().split('T')[0];

    const { data: expiringEquipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        id,
        name,
        tag,
        warranty_expiry,
        manufacturer,
        model,
        organization_id,
        project_id,
        projects(name)
      `)
      .gte('warranty_expiry', today)
      .lte('warranty_expiry', futureDate)
      .order('warranty_expiry', { ascending: true });

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      throw equipmentError;
    }

    console.log(`Found ${expiringEquipment?.length || 0} equipment items with expiring warranties`);

    if (!expiringEquipment || expiringEquipment.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No equipment with expiring warranties found',
        count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by organization for batch notifications
    const byOrganization: Record<string, typeof expiringEquipment> = {};
    for (const equip of expiringEquipment) {
      if (!byOrganization[equip.organization_id]) {
        byOrganization[equip.organization_id] = [];
      }
      byOrganization[equip.organization_id].push(equip);
    }

    const notifications = [];

    for (const [orgId, equipment] of Object.entries(byOrganization)) {
      // Get organization admins/users to notify
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, full_name, role')
        .eq('organization_id', orgId)
        .in('role', ['admin', 'manager']);

      if (profilesError) {
        console.error(`Error fetching profiles for org ${orgId}:`, profilesError);
        continue;
      }

      if (!profiles || profiles.length === 0) {
        console.log(`No admin/manager profiles found for org ${orgId}`);
        continue;
      }

      // Build notification content
      const equipmentList = equipment.map(e => {
        const daysUntil = Math.ceil(
          (new Date(e.warranty_expiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          name: e.name,
          tag: e.tag,
          manufacturer: e.manufacturer,
          model: e.model,
          warrantyExpiry: e.warranty_expiry,
          daysUntilExpiry: daysUntil,
          project: (e.projects as any)?.name || 'Unassigned'
        };
      });

      for (const profile of profiles) {
        const notification = {
          recipientEmail: profile.email,
          recipientName: profile.full_name || profile.email,
          equipmentCount: equipment.length,
          equipment: equipmentList
        };

        notifications.push(notification);

        // Send email if Resend is configured
        if (resendApiKey) {
          try {
            const emailHtml = generateEmailHtml(notification);
            
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'HVAC System <notifications@yourdomain.com>',
                to: [profile.email],
                subject: `⚠️ ${equipment.length} Equipment Warranty${equipment.length > 1 ? 'ies' : 'y'} Expiring Soon`,
                html: emailHtml,
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error(`Failed to send email to ${profile.email}:`, errorText);
            } else {
              console.log(`Email sent successfully to ${profile.email}`);
            }
          } catch (emailError) {
            console.error(`Error sending email to ${profile.email}:`, emailError);
          }
        } else {
          console.log(`RESEND_API_KEY not configured. Would notify ${profile.email} about ${equipment.length} expiring warranties`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Warranty notifications processed',
      notificationCount: notifications.length,
      resendConfigured: !!resendApiKey,
      notifications: notifications.map(n => ({
        email: n.recipientEmail,
        equipmentCount: n.equipmentCount
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in warranty-notifications function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateEmailHtml(notification: {
  recipientName: string;
  equipmentCount: number;
  equipment: Array<{
    name: string;
    tag: string;
    manufacturer: string | null;
    model: string | null;
    warrantyExpiry: string;
    daysUntilExpiry: number;
    project: string;
  }>;
}): string {
  const equipmentRows = notification.equipment.map(e => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${e.name}</td>
      <td style="padding: 12px; color: #6b7280;">${e.tag}</td>
      <td style="padding: 12px;">${e.manufacturer || '-'} ${e.model || ''}</td>
      <td style="padding: 12px;">${e.project}</td>
      <td style="padding: 12px;">
        <span style="
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          ${e.daysUntilExpiry <= 7 
            ? 'background-color: #fef2f2; color: #dc2626;' 
            : 'background-color: #fefce8; color: #ca8a04;'}
        ">
          ${e.daysUntilExpiry} days
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #f59e0b; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Warranty Expiration Alert</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hi ${notification.recipientName},
          </p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            The following <strong>${notification.equipmentCount}</strong> equipment item${notification.equipmentCount > 1 ? 's have' : ' has'} 
            warranties expiring within the next 30 days:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Equipment</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Tag</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Make/Model</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Project</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Expires In</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
            </tbody>
          </table>
          <p style="color: #6b7280; font-size: 14px;">
            Consider contacting manufacturers about warranty extensions or planning for potential repairs/replacements.
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            HVAC Management System • Automated Notification
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
