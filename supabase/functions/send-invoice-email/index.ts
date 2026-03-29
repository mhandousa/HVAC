import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  pdfBase64: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendKey);

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify token using getUser
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      invoiceId, 
      recipientEmail, 
      recipientName, 
      subject, 
      message, 
      pdfBase64 
    }: SendInvoiceRequest = await req.json();

    // Validate required fields
    if (!invoiceId || !recipientEmail || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: invoiceId, recipientEmail, pdfBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice to get invoice number and organization
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        total_amount,
        due_date,
        organization_id,
        organizations:organization_id(name)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizationName = (invoice.organizations as any)?.name || 'Our Company';

    // Convert message to HTML
    const htmlMessage = message.replace(/\n/g, '<br>');

    // Send email via Resend
    console.log('Sending invoice email to:', recipientEmail);
    
    const emailResponse = await resend.emails.send({
      from: `${organizationName} <onboarding@resend.dev>`, // Use your verified domain in production
      to: [recipientEmail],
      subject: subject || `Invoice #${invoice.invoice_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${organizationName}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin-top: 0;">Dear ${recipientName},</p>
            
            <div style="margin: 20px 0;">
              ${htmlMessage}
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">#${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">SAR ${invoice.total_amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Please find the invoice PDF attached to this email.
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Thank you for your business!</p>
            <p style="margin: 5px 0 0 0;">${organizationName}</p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log('Email sent successfully:', emailResponse);

    // Update invoice status to 'sent' if it was draft
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceRoleClient
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId)
      .eq('status', 'draft');

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: 'Invoice sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-invoice-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
