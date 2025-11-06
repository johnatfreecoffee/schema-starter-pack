// Simplified AI Edit Page Edge Function - Make.com Only
// This version removes all direct AI provider integrations and only uses Make.com webhook

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Timeout helper function (15 minutes = 900000ms)
const OPENROUTER_TIMEOUT = 900000; // 15 minutes

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
}

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
      // Message 1: companyInfo + systemInstructions as system role (as JSON array)
      // Message 2: userPrompt as user role
      const messages = [
        {
          role: 'system',
          content: JSON.stringify([context.companyInfo, context.systemInstructions])
        },
        {
          role: 'user',
          content: command.text || command
        }
      ];

      console.log('📤 Sending request to OpenRouter with 15-minute timeout...');
      console.log('📋 Request payload:', {
        model: 'anthropic/claude-sonnet-4.5',
        messagesCount: messages.length,
        maxTokens: 100000
      });
      
      let openrouterResponse;
      try {
        console.log('🔄 Initiating fetch to OpenRouter...');
        openrouterResponse = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
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
          },
          OPENROUTER_TIMEOUT
        );
        console.log('✅ Fetch completed, status:', openrouterResponse.status);
      } catch (fetchError) {
        console.error('❌ OpenRouter fetch failed:', fetchError);
        console.error('❌ Error name:', fetchError instanceof Error ? fetchError.name : 'Unknown');
        console.error('❌ Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
        console.error('❌ Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack');
        throw new Error(`OpenRouter network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      if (!openrouterResponse.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await openrouterResponse.text();
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
        console.error('❌ OpenRouter API failed:', openrouterResponse.status, errorText);
        throw new Error(`OpenRouter API failed: ${openrouterResponse.status} - ${errorText}`);
      }

      // Safely handle the response with comprehensive error handling
      let responseText: string;
      let htmlContent: string | undefined;
      
      try {
        console.log('📊 Response status:', openrouterResponse.status);
        console.log('📊 Content-Type:', openrouterResponse.headers.get('content-type'));
        
        // Read response text with timeout protection (15 minutes to match overall timeout)
        const textPromise = openrouterResponse.text();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Response read timeout')), OPENROUTER_TIMEOUT)
        );
        
        responseText = await Promise.race([textPromise, timeoutPromise]);
        console.log('📝 Received response text, length:', responseText.length);
        
        if (!responseText || responseText.trim().length === 0) {
          console.error('❌ Empty response body from OpenRouter');
          return new Response(
            JSON.stringify({ 
              error: 'OpenRouter returned an empty response. Please try again.' 
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try to parse as JSON
        let openrouterResult;
        try {
          openrouterResult = JSON.parse(responseText);
          console.log('✅ Successfully parsed JSON response');
        } catch (parseError) {
          console.error('❌ JSON parse failed:', parseError);
          console.error('Response preview:', responseText.substring(0, 500));
          
          // If it looks like HTML, maybe OpenRouter returned HTML directly
          if (responseText.trim().startsWith('<')) {
            console.log('📄 Response appears to be HTML, returning directly');
            htmlContent = responseText;
          } else {
            return new Response(
              JSON.stringify({ 
                error: 'OpenRouter returned invalid JSON. Please try again or contact support.' 
              }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Extract content from JSON structure if we parsed it
        if (openrouterResult && !htmlContent) {
          htmlContent = openrouterResult.choices?.[0]?.message?.content;
          
          if (!htmlContent) {
            console.error('❌ No content in expected JSON structure');
            console.error('Response structure:', JSON.stringify(openrouterResult, null, 2).substring(0, 1000));
            return new Response(
              JSON.stringify({ 
                error: 'OpenRouter response missing expected content. Please try again.' 
              }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Validate HTML content
        if (!htmlContent || htmlContent.trim().length === 0) {
          console.error('❌ HTML content is empty');
          return new Response(
            JSON.stringify({ 
              error: 'OpenRouter returned empty content. Please try again with a different prompt.' 
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Successfully extracted HTML content, length:', htmlContent.length);
        console.log('📄 Content preview:', htmlContent.substring(0, 200));
        
        // Return in the same format as Make.com
        return new Response(JSON.stringify({ 
          html: htmlContent,
          model: 'openrouter',
          usage: openrouterResult?.usage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error('❌ Fatal error processing OpenRouter response:', error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to process OpenRouter response' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
          companyData: {
            ...(context.companyInfo?.companyData || context.companyInfo || {}),
            siteSettings: context.siteSettings || {}
          },
          socialMedia: context.companyInfo?.socialMedia || context.socialMedia || [],
          aiTraining: context.companyInfo?.aiTraining || context.aiTraining || {}
        },
        systemInstructions: context.systemInstructions || '',
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
