import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive input validation schema
const LeadSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number').max(20),
  service_needed: z.string().trim().min(1, 'Service is required').max(200, 'Service description too long'),
  street_address: z.string().trim().min(1, 'Street address is required').max(200, 'Address too long'),
  unit: z.string().trim().max(20, 'Unit too long').optional(),
  city: z.string().trim().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().trim().length(2, 'State must be 2 characters').regex(/^[A-Z]{2}$/, 'State must be uppercase letters'),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  project_details: z.string().trim().max(2000, 'Project details too long').optional(),
  is_emergency: z.boolean(),
  service_id: z.string().uuid('Invalid service ID').optional(),
  originating_url: z.string().url('Invalid URL').max(500, 'URL too long').optional(),
  lead_source: z.string().max(50, 'Lead source too long').optional()
});

type LeadData = z.infer<typeof LeadSchema>;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // RATE LIMITING: Get client IP address
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check rate limit (10 submissions per IP per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .from('lead_submission_rate_limit')
      .select('*')
      .eq('ip_address', clientIp)
      .single();

    if (rateLimitData) {
      // Check if IP is currently blocked
      if (rateLimitData.blocked_until && new Date(rateLimitData.blocked_until) > new Date()) {
        console.warn(`Blocked submission attempt from IP: ${clientIp}`);
        return new Response(
          JSON.stringify({ 
            error: 'Too many submissions. Please try again later.',
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          },
        );
      }

      // Check if within rate limit window
      const firstSubmission = new Date(rateLimitData.first_submission_at);
      const hoursSinceFirst = (Date.now() - firstSubmission.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceFirst < 1 && rateLimitData.submission_count >= 10) {
        // Block for 1 hour
        const blockUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('lead_submission_rate_limit')
          .update({ 
            blocked_until: blockUntil,
            submission_count: rateLimitData.submission_count + 1,
            last_submission_at: new Date().toISOString()
          })
          .eq('id', rateLimitData.id);
        
        console.warn(`IP ${clientIp} exceeded rate limit. Blocked until ${blockUntil}`);
        return new Response(
          JSON.stringify({ 
            error: 'Too many submissions. Please try again in 1 hour.',
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          },
        );
      }

      // Reset counter if more than 1 hour has passed
      if (hoursSinceFirst >= 1) {
        await supabaseAdmin
          .from('lead_submission_rate_limit')
          .update({
            submission_count: 1,
            first_submission_at: new Date().toISOString(),
            last_submission_at: new Date().toISOString(),
            blocked_until: null
          })
          .eq('id', rateLimitData.id);
      } else {
        // Increment counter
        await supabaseAdmin
          .from('lead_submission_rate_limit')
          .update({
            submission_count: rateLimitData.submission_count + 1,
            last_submission_at: new Date().toISOString()
          })
          .eq('id', rateLimitData.id);
      }
    } else {
      // First submission from this IP
      await supabaseAdmin
        .from('lead_submission_rate_limit')
        .insert({
          ip_address: clientIp,
          submission_count: 1,
          first_submission_at: new Date().toISOString(),
          last_submission_at: new Date().toISOString()
        });
    }

    // Parse and validate input data
    const rawData = await req.json();
    
    let leadData: LeadData;
    try {
      leadData = LeadSchema.parse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid input data',
            success: false,
            details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      throw error;
    }
    
    console.log('Received validated lead submission:', leadData.email);

    // 1. Create lead record
    const { data: lead, error: leadError } = await supabaseAdmin
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
        service_id: leadData.service_id || null,
        originating_url: leadData.originating_url || null,
        lead_source: leadData.lead_source || 'web_form',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    console.log('Lead created successfully:', lead.id);

    // 2. Generate temporary password (SECURITY: Never log this!)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    // 3. Create user account (using service role already initialized above)

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

      // Get customer role ID first
      const { data: customerRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'customer')
        .single();

      if (customerRole) {
        // Assign customer role using role_id
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role_id: customerRole.id,
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        } else {
          console.log('✅ Customer role assigned successfully');
        }
      } else {
        console.error('❌ Customer role not found in roles table');
      }
    }

    // 4. Get company settings for email
    const { data: companySettings } = await supabaseClient
      .from('company_settings')
      .select('*')
      .single();

    // 5. Send confirmation email to customer
    console.log('📧 Attempting to send confirmation email...');
    try {
      const { data: emailTemplate } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('name', 'lead-submission-confirmation')
        .eq('is_active', true)
        .single();

      if (emailTemplate) {
        console.log('✅ Email template found:', emailTemplate.name);
        // Replace variables in template
        const replaceVariables = (text: string) => {
          return text
            .replace(/\{\{customer_name\}\}/g, `${leadData.first_name} ${leadData.last_name}`)
            .replace(/\{\{customer_email\}\}/g, leadData.email)
            .replace(/\{\{customer_phone\}\}/g, leadData.phone)
            .replace(/\{\{service_name\}\}/g, leadData.service_needed)
            .replace(/\{\{lead_message\}\}/g, leadData.project_details || 'No additional details provided')
            .replace(/\{\{company_name\}\}/g, companySettings?.business_name || 'Your Company')
            .replace(/\{\{company_phone\}\}/g, companySettings?.phone || '')
            .replace(/\{\{company_email\}\}/g, companySettings?.email || '')
            .replace(/\{\{company_address\}\}/g, companySettings?.address || '')
            .replace(/\{\{company_icon_url\}\}/g, companySettings?.icon_url || companySettings?.logo_url || '')
            .replace(/\{\{company_logo_url\}\}/g, companySettings?.logo_url || '')
            .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString())
            .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());
        };

        const subject = replaceVariables(emailTemplate.subject);
        const body = replaceVariables(emailTemplate.body);

        console.log('✅ Calling send-email function...');
        // Call send-email edge function
        const emailResponse = await supabaseClient.functions.invoke('send-email', {
          body: {
            to: leadData.email,
            subject,
            html: body,
            from: companySettings?.email || 'noreply@yourdomain.com'
          }
        });

        if (emailResponse.error) {
          console.error('❌ Send-email function error:', emailResponse.error);
        } else {
          console.log('✅ Send-email function completed successfully');
        }

        // Log email to queue
        await supabaseAdmin
          .from('email_queue')
          .insert({
            to_email: leadData.email,
            subject,
            body,
            template_id: emailTemplate.id,
            entity_type: 'lead',
            entity_id: lead.id,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        console.log('✅ Confirmation email sent to:', leadData.email);
      } else {
        console.error('❌ Email template not found: lead-submission-confirmation');
      }
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail the whole request if email fails
    }

    // 6. Create activity log
    const { error: logError } = await supabaseAdmin
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
        error: 'An error occurred processing your submission',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
