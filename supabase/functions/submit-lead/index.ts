import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_needed: string;
  street_address: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  project_details?: string;
  is_emergency: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const leadData: LeadData = await req.json();
    
    console.log('Received lead submission:', leadData.email);

    // 1. Create lead record
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .insert({
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone,
        service_needed: leadData.service_needed,
        street_address: leadData.street_address,
        unit: leadData.unit,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        project_details: leadData.project_details,
        is_emergency: leadData.is_emergency,
        status: 'new',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    console.log('Lead created successfully:', lead.id);

    // 2. Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    // 3. Create user account (using service role to bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: leadData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: leadData.first_name,
        last_name: leadData.last_name,
      },
    });

    if (authError) {
      console.error('Error creating user account:', authError);
      // Don't fail the whole request if user creation fails
    } else {
      console.log('User account created:', authUser.user.id);

      // Assign customer role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'customer',
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
    }

    // 4. Get company settings for email
    const { data: companySettings } = await supabaseClient
      .from('company_settings')
      .select('*')
      .single();

    // 5. TODO: Send welcome email
    // This would integrate with your email service (Resend, etc.)
    // For now, we'll log the email details
    console.log('Would send welcome email to:', leadData.email);
    console.log('Temporary password:', tempPassword);
    console.log('Company:', companySettings?.business_name);

    // 6. Create activity log
    const { error: logError } = await supabaseClient
      .from('activity_logs')
      .insert({
        action: 'created',
        entity_type: 'lead',
        entity_id: lead.id,
        parent_entity_type: null,
        parent_entity_id: null,
      });

    if (logError) {
      console.error('Error creating activity log:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: lead.id,
        message: 'Lead submitted successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in submit-lead function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
