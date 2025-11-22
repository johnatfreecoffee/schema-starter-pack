import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get token from request
    const { token } = await req.json();
    
    if (!token) {
      throw new Error('Token is required');
    }

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Invalid or expired token');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      throw new Error('Token has expired');
    }

    // Update the user's email using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email: tokenData.new_email }
    );

    if (updateError) {
      console.error('Error updating user email:', updateError);
      throw new Error('Failed to update email');
    }

    // Update user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ email: tokenData.new_email })
      .eq('id', tokenData.user_id);

    if (profileError) {
      console.error('Error updating profile email:', profileError);
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    console.log('Email successfully updated for user:', tokenData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email updated successfully',
        newEmail: tokenData.new_email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in verify-email-change:', error);
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
