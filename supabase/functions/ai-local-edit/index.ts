import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { currentHtml, userPrompt, companyInfo, systemInstructions, colors } = await req.json();

    console.log('Local AI Edit Request:', {
      htmlLength: currentHtml?.length,
      promptLength: userPrompt?.length,
      hasCompanyInfo: !!companyInfo,
      hasSystemInstructions: !!systemInstructions,
      hasColors: !!colors
    });

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build comprehensive system prompt for editing
    const systemPrompt = `You are an expert HTML editor specializing in making precise, targeted changes to existing pages.

## CRITICAL RULES:
- Make ONLY the specific changes requested
- Preserve all existing structure and content unless explicitly asked to change
- Maintain all Handlebars variables ({{business_name}}, {{phone}}, etc.)
- Preserve all CSS custom properties (var(--color-primary), etc.)
- Keep all onclick handlers and lead form integrations
- Maintain responsive design and accessibility
- DO NOT rebuild the entire page - edit only what's needed

## COMPANY INFORMATION:
${companyInfo?.companyData ? `
- Business: ${companyInfo.companyData.business_name}
- Slogan: ${companyInfo.companyData.business_slogan}
- Phone: ${companyInfo.companyData.phone}
- Email: ${companyInfo.companyData.email}
- Address: ${companyInfo.companyData.address}
- Years Experience: ${companyInfo.companyData.years_experience}
` : ''}

## COLOR SYSTEM (must be preserved):
${colors ? `
- Primary: ${colors.primary_color}
- Secondary: ${colors.secondary_color}
- Accent: ${colors.accent_color}
- Success: ${colors.success_color}
- Warning: ${colors.warning_color}
- Info: ${colors.info_color}
- Danger: ${colors.danger_color}
` : ''}

## DESIGN TOKENS (must use these):
- Use var(--color-primary) for brand colors
- Use var(--color-secondary) for secondary elements
- Use var(--color-accent) for CTAs
- Use var(--radius-button) for button border radius
- Use var(--radius-card) for card border radius

## OUTPUT REQUIREMENTS:
- Return complete, valid HTML document
- Include all original DOCTYPE, head, and body tags
- Preserve all CSS custom property definitions
- Keep all Handlebars variable syntax intact
- Ensure all tags are properly closed`;

    // Build the messages for Gemini
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Current HTML page:\n\n${currentHtml}\n\n---\n\nEdit Request: ${userPrompt}\n\nPlease make ONLY the requested changes and return the complete updated HTML.`
      }
    ];

    console.log('Calling Lovable AI Gateway...');

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3, // Lower temperature for more focused edits
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            statusCode: 429
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI usage limit reached. Please add credits to your Lovable workspace.',
            statusCode: 402
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received:', {
      hasChoices: !!data.choices,
      contentLength: data.choices?.[0]?.message?.content?.length
    });

    const updatedHtml = data.choices?.[0]?.message?.content;

    if (!updatedHtml) {
      throw new Error('No content returned from AI');
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedHtml,
        explanation: 'Local edit completed successfully',
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Local AI edit error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
