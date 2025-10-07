import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, context } = await req.json();
    
    console.log('AI Edit Request:', { command, contextKeys: Object.keys(context) });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build AI prompt with full context
    const prompt = `You are an expert web developer and content strategist helping edit a webpage.

COMPANY CONTEXT:
Company Name: ${context.companyInfo?.business_name || 'N/A'}
Industry: Roofing and Restoration
Brand Voice: ${context.aiTraining?.brand_voice || 'Professional and trustworthy'}
Target Audience: ${context.aiTraining?.target_audience || 'Homeowners and businesses'}
Unique Selling Points: ${context.aiTraining?.unique_selling_points || 'Quality service and customer satisfaction'}

CURRENT PAGE:
Type: ${context.currentPage?.type || 'unknown'}
URL: ${context.currentPage?.url || 'N/A'}
Current HTML:
${context.currentPage?.html || ''}

USER REQUEST:
${command}

CRITICAL INSTRUCTIONS:
1. Make the requested changes to the HTML
2. Maintain the overall structure and any Handlebars variables like {{service_name}}, {{city_name}}, {{company_phone}}, etc.
3. Ensure changes align with the brand voice and messaging
4. Return ONLY the updated HTML, no explanations or markdown
5. Preserve all important elements like headers, footers, forms
6. Keep all Handlebars variables intact - they are required for dynamic content
7. Do not wrap response in code blocks or add any extra text
8. Maintain semantic HTML structure

Return the complete updated HTML now.`;

    console.log('Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const updatedHtml = data.choices?.[0]?.message?.content || '';

    console.log('AI Edit Success, response length:', updatedHtml.length);

    // Clean up the response - remove markdown code blocks if present
    let cleanedHtml = updatedHtml.trim();
    if (cleanedHtml.startsWith('```html')) {
      cleanedHtml = cleanedHtml.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (cleanedHtml.startsWith('```')) {
      cleanedHtml = cleanedHtml.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return new Response(
      JSON.stringify({
        updatedHtml: cleanedHtml,
        explanation: 'AI processed your request and updated the page'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-edit-page function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});