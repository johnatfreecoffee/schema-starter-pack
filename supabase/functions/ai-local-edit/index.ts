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
    const { currentHtml, userPrompt, companyInfo, aiLocalEditInstructions, colors } = await req.json();

    console.log('Local AI Edit Request:', {
      htmlLength: currentHtml?.length,
      promptLength: userPrompt?.length,
      hasCompanyInfo: !!companyInfo,
      hasAiLocalEditInstructions: !!aiLocalEditInstructions,
      hasColors: !!colors
    });

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use instructions from frontend, with dynamic company info and colors
    const companyInfoText = companyInfo?.companyData ? `
- Business: ${companyInfo.companyData.business_name}
- Slogan: ${companyInfo.companyData.business_slogan}
- Phone: ${companyInfo.companyData.phone}
- Email: ${companyInfo.companyData.email}
- Address: ${companyInfo.companyData.address}
- Years Experience: ${companyInfo.companyData.years_experience}
` : '';

    const colorPaletteText = colors ? `
### Brand Colors:
- Primary: ${colors.primary_color}
- Secondary: ${colors.secondary_color}
- Accent: ${colors.accent_color}

### State Colors:
- Success: ${colors.success_color}
- Warning: ${colors.warning_color}
- Info: ${colors.info_color}
- Danger: ${colors.danger_color}

### Website Palette:
- BG Primary: ${colors.bg_primary_color || '#ffffff'}
- BG Secondary: ${colors.bg_secondary_color || '#f8f9fa'}
- BG Tertiary: ${colors.bg_tertiary_color || '#e9ecef'}
- Text Primary: ${colors.text_primary_color || '#212529'}
- Text Secondary: ${colors.text_secondary_color || '#6c757d'}
- Text Muted: ${colors.text_muted_color || '#adb5bd'}
- Border: ${colors.border_color || '#dee2e6'}
- Card BG: ${colors.card_bg_color || '#ffffff'}
- Feature: ${colors.feature_color || '#0d6efd'}
- CTA: ${colors.cta_color || '#198754'}
` : '';

    const systemPrompt = (aiLocalEditInstructions || '')
      .replace('{{COMPANY_INFO}}', companyInfoText)
      .replace('{{COLOR_PALETTE}}', colorPaletteText);

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
