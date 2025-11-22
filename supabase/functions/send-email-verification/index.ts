import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { wrapEmailContent } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get the new email from request
    const { newEmail } = await req.json();
    
    if (!newEmail) {
      throw new Error('New email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error('Invalid email format');
    }

    // Check if email is already in use
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', newEmail)
      .single();
      
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Generate secure token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const verificationToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store token in database (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing unused tokens for this user
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null);

    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        new_email: newEmail,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Token insert error:', tokenError);
      throw new Error('Failed to create verification token');
    }

    // Get company settings for branding
    const { data: company } = await supabase
      .from('company_settings')
      .select('business_name, icon_url, logo_url')
      .single();

    const businessName = company?.business_name || 'Our Company';
    const verificationUrl = `https://clearhome.pro/verify-email?token=${verificationToken}`;

    // Build email content
    const emailContent = `
      <h1 style="color: #1f2937; margin-bottom: 20px;">Verify Your New Email Address</h1>
      <p>Hello,</p>
      <p>You recently requested to change your email address to <strong>${newEmail}</strong>.</p>
      <p>To complete this change, please click the button below to verify your new email address:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
      </p>
      <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">⏰ This link will expire in 24 hours.</p>
      </div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        If you didn't request this change, you can safely ignore this email. Your current email address will remain unchanged.
      </p>
    `;

    // Wrap content with header and footer
    const html = wrapEmailContent(emailContent, {
      companyName: businessName,
      logoUrl: company?.logo_url,
      iconUrl: company?.icon_url,
    });

    // Send verification email using Resend
    const { error: emailError } = await resend.emails.send({
      from: `${businessName} <onboarding@resend.dev>`,
      to: [newEmail],
      subject: 'Verify Your New Email Address',
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully to:', newEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in send-email-verification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
