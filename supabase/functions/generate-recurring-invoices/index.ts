import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringInvoice {
  id: string;
  organization_id: string;
  customer_id: string;
  template_name: string;
  frequency_type: string;
  frequency_value: number;
  next_invoice_date: string;
  end_date: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  payment_terms_days: number;
  notes: string | null;
  invoices_generated: number;
}

function calculateNextInvoiceDate(
  currentDate: string,
  frequencyType: string,
  frequencyValue: number
): string {
  const date = new Date(currentDate);
  
  switch (frequencyType) {
    case 'daily':
      date.setDate(date.getDate() + frequencyValue);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (frequencyValue * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + frequencyValue);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + (frequencyValue * 3));
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + frequencyValue);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString().split('T')[0];
}

function generateInvoiceNumber(prefix: string = 'INV'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString().split('T')[0];
    
    // Get all active recurring invoices due for generation
    const { data: dueInvoices, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('is_active', true)
      .lte('next_invoice_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (fetchError) {
      console.error('Error fetching recurring invoices:', fetchError);
      throw fetchError;
    }

    if (!dueInvoices || dueInvoices.length === 0) {
      console.log('No recurring invoices due for generation');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No invoices due for generation',
          generated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${dueInvoices.length} recurring invoices to process`);

    const generatedInvoices: string[] = [];
    const errors: string[] = [];

    for (const recurring of dueInvoices as RecurringInvoice[]) {
      try {
        // Calculate due date based on payment terms
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + (recurring.payment_terms_days || 30));

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber('INV');

        // Create the invoice
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({
            organization_id: recurring.organization_id,
            customer_id: recurring.customer_id,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'draft',
            subtotal: recurring.subtotal,
            vat_amount: recurring.vat_amount,
            total_amount: recurring.total_amount,
            amount_paid: 0,
            notes: recurring.notes,
            recurring_invoice_id: recurring.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating invoice for recurring ${recurring.id}:`, insertError);
          errors.push(`Failed to create invoice for ${recurring.template_name}: ${insertError.message}`);
          continue;
        }

        // Create line items
        if (recurring.line_items && recurring.line_items.length > 0) {
          const lineItemsToInsert = recurring.line_items.map((item, index) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            line_total: item.quantity * item.unit_price * (1 + item.vat_rate / 100),
            sort_order: index,
          }));

          const { error: lineItemError } = await supabase
            .from('invoice_line_items')
            .insert(lineItemsToInsert);

          if (lineItemError) {
            console.error(`Error creating line items for invoice ${newInvoice.id}:`, lineItemError);
          }
        }

        // Calculate next invoice date
        const nextDate = calculateNextInvoiceDate(
          recurring.next_invoice_date,
          recurring.frequency_type,
          recurring.frequency_value
        );

        // Update the recurring invoice
        const { error: updateError } = await supabase
          .from('recurring_invoices')
          .update({
            next_invoice_date: nextDate,
            last_generated_at: new Date().toISOString(),
            invoices_generated: recurring.invoices_generated + 1,
          })
          .eq('id', recurring.id);

        if (updateError) {
          console.error(`Error updating recurring invoice ${recurring.id}:`, updateError);
          errors.push(`Failed to update recurring schedule for ${recurring.template_name}`);
        }

        generatedInvoices.push(newInvoice.invoice_number);
        console.log(`Generated invoice ${newInvoice.invoice_number} from recurring ${recurring.template_name}`);

      } catch (itemError) {
        console.error(`Error processing recurring invoice ${recurring.id}:`, itemError);
        errors.push(`Error processing ${recurring.template_name}: ${itemError}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${generatedInvoices.length} invoice(s)`,
        generated: generatedInvoices.length,
        invoiceNumbers: generatedInvoices,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recurring-invoices:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
