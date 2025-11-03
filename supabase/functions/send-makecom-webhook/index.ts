import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyData, systemInstructions, userPrompt, supabaseData } = await req.json();

    // Get webhook URL from environment
    const webhookUrl = Deno.env.get('MAKE_DOT_COM_HTML_PAGE_BUILDER');
    
    if (!webhookUrl) {
      console.error('MAKE_DOT_COM_HTML_PAGE_BUILDER secret not configured');
      return new Response(
        JSON.stringify({ error: 'Make.com webhook URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare webhook payload nested under userRequest
    const webhookPayload = {
      userRequest: {
        companyData,
        systemInstructions,
        userPrompt,
        supabaseData
      }
    };

    console.log('Sending webhook to Make.com:', {
      url: webhookUrl.substring(0, 50) + '...',
      hasCompanyData: !!companyData,
      hasSystemInstructions: !!systemInstructions,
      supabaseData
    });

    // Send to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook failed:', webhookResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Webhook failed with status ${webhookResponse.status}`,
          details: errorText 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await webhookResponse.json().catch(() => ({}));

    console.log('Webhook sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook sent to Make.com successfully',
        response: responseData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-makecom-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
