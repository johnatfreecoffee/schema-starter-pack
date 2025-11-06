// Simplified AI Edit Page Edge Function - Make.com Only
// This version removes all direct AI provider integrations and only uses Make.com webhook

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

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
    const { command, context } = await req.json();
    
    console.log('🌐 AI Edit Page request received');
    console.log('Command:', command);
    console.log('Model:', command.model || 'makecom (default)');
    console.log('Context keys:', Object.keys(context || {}));

    const selectedModel = command.model || 'makecom';

    // Handle OpenRouter directly
    if (selectedModel === 'openrouter') {
      console.log('✅ Routing to OpenRouter');
      
      const OPENROUTER_API_KEY = Deno.env.get('OPEN_ROUTER');
      if (!OPENROUTER_API_KEY) {
        throw new Error('OPEN_ROUTER secret not configured. Please add your OpenRouter API key in project secrets.');
      }

      // Construct messages array exactly like Make.com subflow
      // Message 1: companyInfo + systemInstructions as system role
      // Message 2: userPrompt as user role
      const messages = [
        {
          role: 'system',
          content: JSON.stringify([context.companyInfo, context.siteSettings])
        },
        {
          role: 'user',
          content: command.text || command
        }
      ];

      console.log('📤 Sending request to OpenRouter...');
      
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Lovable AI Page Editor'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: messages,
          max_tokens: 100000,
          temperature: 1,
          top_p: 1,
          n: 1
        })
      });

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        console.error('❌ OpenRouter API failed:', openrouterResponse.status, errorText);
        throw new Error(`OpenRouter API failed: ${openrouterResponse.status} - ${errorText}`);
      }

      const openrouterResult = await openrouterResponse.json();
      console.log('✅ Received response from OpenRouter');

      // Extract the HTML content from the response
      const htmlContent = openrouterResult.choices?.[0]?.message?.content;
      
      if (!htmlContent) {
        throw new Error('No content received from OpenRouter');
      }

      // Return in the same format as Make.com
      return new Response(JSON.stringify({ 
        html: htmlContent,
        model: 'openrouter',
        usage: openrouterResult.usage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle Make.com (existing flow)
    console.log('✅ Routing to Make.com webhook');
    
    const MAKECOM_WEBHOOK = Deno.env.get('SEND_MAKECOM_WEBHOOK');
    if (!MAKECOM_WEBHOOK) {
      throw new Error('SEND_MAKECOM_WEBHOOK secret not configured. Please add the Make.com webhook URL in project secrets.');
    }

    // Forward the request to Make.com with proper nesting
    const webhookPayload = {
      userRequest: {
        companyInfo: {
          companyData: context.companyInfo?.companyData || context.companyInfo || {},
          socialMedia: context.companyInfo?.socialMedia || context.socialMedia || [],
          aiTraining: context.companyInfo?.aiTraining || context.aiTraining || {}
        },
        systemInstructions: context.siteSettings || {},
        userPrompt: command.text || command,
        supabaseData: {
          pageType: context.currentPage?.type,
          pageUrl: context.currentPage?.url,
          currentHtml: context.currentPage?.html,
          serviceInfo: context.serviceInfo,
          serviceAreas: context.serviceAreas
        }
      },
      mode: command.mode || 'build',
      timestamp: new Date().toISOString(),
      source: 'ai-edit-page'
    };

    console.log('📤 Sending payload to Make.com...');
    
    const webhookResponse = await fetch(MAKECOM_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('❌ Make.com webhook failed:', webhookResponse.status, errorText);
      throw new Error(`Make.com webhook failed: ${webhookResponse.status} - ${errorText}`);
    }

    const result = await webhookResponse.json();
    console.log('✅ Received response from Make.com');

    // Return the result from Make.com
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in ai-edit-page:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Make.com webhook processing failed. Check function logs for details.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
