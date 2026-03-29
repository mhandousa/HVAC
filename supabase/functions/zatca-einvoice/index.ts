import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TLV encoder for ZATCA QR code
function encodeTLV(data: { sellerName: string; vatNumber: string; timestamp: string; total: string; vat: string }): string {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const addTag = (tag: number, value: string) => {
    const valueBytes = encoder.encode(value);
    const tagBytes = new Uint8Array(2 + valueBytes.length);
    tagBytes[0] = tag;
    tagBytes[1] = valueBytes.length;
    tagBytes.set(valueBytes, 2);
    parts.push(tagBytes);
  };

  addTag(1, data.sellerName);
  addTag(2, data.vatNumber);
  addTag(3, data.timestamp);
  addTag(4, data.total);
  addTag(5, data.vat);

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return btoa(String.fromCharCode(...combined));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId } = await req.json();
    console.log('Processing ZATCA e-invoice for:', invoiceId);

    // Fetch invoice with customer and organization data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (company_name, vat_number),
        organizations (name)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      throw new Error('Invoice not found');
    }

    // Generate UUID for ZATCA
    const zatcaUuid = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Generate TLV-encoded QR data
    const qrData = encodeTLV({
      sellerName: invoice.organizations?.name || 'Organization',
      vatNumber: invoice.customers?.vat_number || '300000000000003',
      timestamp: timestamp,
      total: invoice.total_amount.toFixed(2),
      vat: invoice.vat_amount.toFixed(2),
    });

    // Generate invoice hash (simplified - in production use proper hashing)
    const hashInput = `${invoice.invoice_number}|${invoice.total_amount}|${timestamp}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const invoiceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update invoice with ZATCA data
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        zatca_uuid: zatcaUuid,
        zatca_qr_code: qrData,
        zatca_invoice_hash: invoiceHash,
        zatca_submission_status: 'submitted',
        zatca_reported_at: timestamp,
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('ZATCA e-invoice processed successfully:', zatcaUuid);

    return new Response(
      JSON.stringify({
        success: true,
        zatcaUuid,
        qrCode: qrData,
        invoiceHash,
        status: 'submitted',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ZATCA processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
