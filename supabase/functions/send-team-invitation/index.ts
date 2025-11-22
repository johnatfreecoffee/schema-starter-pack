import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { wrapEmailContent } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  full_name: string;
  role: 'admin' | 'crm_user';
  job_title?: string;
  resend?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { email, full_name, role, job_title, resend }: InvitationRequest = await req.json();

    // Get the inviter's information
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: inviter } } = await supabase.auth.getUser(token);

    if (!inviter) {
      throw new Error('Unauthorized');
    }

    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', inviter.id)
      .single();

    // Get company settings
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('business_name, icon_url, logo_url')
      .single();

    const companyName = companySettings?.business_name || 'Your Company';
    const inviterName = inviterProfile?.full_name || inviter.email;

    let inviteToken: string;
    let inviteExpiresAt: string;

    if (resend) {
      // Get existing invitation
      const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('invite_token, invite_expires_at')
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (!existingInvite) {
        throw new Error('No pending invitation found');
      }

      inviteToken = existingInvite.invite_token;
      inviteExpiresAt = existingInvite.invite_expires_at;
    } else {
      // Generate new invite token
      inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      inviteExpiresAt = expiresAt.toISOString();

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          email,
          full_name,
          role,
          job_title,
          invite_token: inviteToken,
          invite_expires_at: inviteExpiresAt,
          invited_by: inviter.id,
          status: 'pending',
        });

      if (inviteError) throw inviteError;
    }

    // Build invitation link
    const inviteUrl = `${supabaseUrl.replace('https://', 'https://').split('.')[0]}.lovable.app/accept-invite?token=${inviteToken}`;

    // Build email content
    const emailContent = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 10px;">You're Invited! 🎉</h1>
      </div>
      
      <h2 style="color: #1f2937;">Hi ${full_name},</h2>
      <p>${inviterName} has invited you to join <strong>${companyName}'s</strong> team.</p>
      
      <p style="margin-top: 20px;">You've been assigned the role of:</p>
      <div style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1e40af; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 10px 0;">
        ${role === 'admin' ? 'Administrator' : 'CRM User'}
      </div>
      
      <p style="margin-top: 25px;">Click the button below to accept your invitation and set up your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
      </p>
      
      <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">⏰ This invitation expires in 7 days</p>
      </div>
      
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        If you have any questions, please contact ${inviterName} at ${inviter.email}
      </p>
      <p style="color: #6b7280; font-size: 12px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    `;

    // Wrap content with header and footer
    const html = wrapEmailContent(emailContent, {
      companyName,
      logoUrl: companySettings?.logo_url,
      iconUrl: companySettings?.icon_url,
    });

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Team Invitations <onboarding@resend.dev>',
        to: [email],
        subject: `You've been invited to join ${companyName}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error('Failed to send invitation email');
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-team-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
