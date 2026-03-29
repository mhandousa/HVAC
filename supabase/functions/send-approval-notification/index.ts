import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalNotificationRequest {
  approvalId: string;
  reviewerEmail: string;
  reviewerName: string;
  submitterName: string;
  projectName: string;
  entityType: string;
  entityName?: string;
  priority: string;
  dueDate?: string;
  notes?: string;
  approvalUrl: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      approvalId,
      reviewerEmail,
      reviewerName,
      submitterName,
      projectName,
      entityType,
      entityName,
      priority,
      dueDate,
      notes,
      approvalUrl,
    }: ApprovalNotificationRequest = await req.json();

    // Validate required fields
    if (!approvalId || !reviewerEmail || !projectName || !entityType || !approvalUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format priority badge
    const priorityColors: Record<string, string> = {
      urgent: "#dc2626",
      high: "#ea580c",
      normal: "#2563eb",
      low: "#6b7280",
    };
    const priorityColor = priorityColors[priority] || priorityColors.normal;

    // Format entity type for display
    const formatEntityType = (type: string): string => {
      return type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Design Approval Request</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #111827; margin: 0; font-size: 24px;">Design Approval Request</h1>
            </div>

            <!-- Priority Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: white; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                ${priority} Priority
              </span>
            </div>

            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Hi ${reviewerName || "there"},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>${submitterName || "A team member"}</strong> has submitted a design for your review.
            </p>

            <!-- Details Card -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Project</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${projectName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatEntityType(entityType)}</td>
                </tr>
                ${entityName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${entityName}</td>
                </tr>
                ` : ""}
                ${dueDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${new Date(dueDate).toLocaleDateString()}</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <!-- Notes -->
            ${notes ? `
            <div style="margin: 24px 0;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Notes from submitter:</p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">${notes}</p>
              </div>
            </div>
            ` : ""}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${approvalUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review Design
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This email was sent because you were assigned as a reviewer for a design approval.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HVAC Design Platform <noreply@updates.lovable.app>",
        to: [reviewerEmail],
        subject: `[${priority.toUpperCase()}] Design Review Required: ${formatEntityType(entityType)} - ${projectName}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Approval notification email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-approval-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
