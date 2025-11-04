import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, companyContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build company context string
    let contextString = '';
    if (companyContext?.businessName || companyContext?.description) {
      contextString = '\n\nCompany Context:';
      if (companyContext.businessName) contextString += `\nBusiness: ${companyContext.businessName}`;
      if (companyContext.slogan) contextString += `\nSlogan: ${companyContext.slogan}`;
      if (companyContext.description) contextString += `\nDescription: ${companyContext.description}`;
      contextString += '\n\nConsider this company information when selecting colors that match their brand personality and industry.';
    }

    let prompt = '';
    
    if (type === 'professional') {
      prompt = `Generate a professional color palette with 17 colors in hex format for a corporate website. Include: 1) Primary (trustworthy blue), 2) Secondary (neutral), 3) Accent (professional vibrant), 4) Success (green), 5) Warning (orange), 6) Info (blue), 7) Danger (red), 8) Background Primary (clean white), 9) Background Secondary (light gray), 10) Background Tertiary (subtle gray), 11) Text Primary (dark), 12) Text Secondary (medium gray), 13) Text Muted (light gray), 14) Border (subtle gray), 15) Card Background (white), 16) Feature (professional blue), 17) CTA (action green).${contextString}`;
    } else if (type === 'creative') {
      prompt = `Generate a creative color palette with 17 colors in hex format for a bold website. Include: 1) Primary (bold eye-catching), 2) Secondary (creative complementary), 3) Accent (unique vibrant), 4) Success (fresh green), 5) Warning (warm orange), 6) Info (cool blue), 7) Danger (striking red), 8) Background Primary (bright), 9) Background Secondary (vibrant light), 10) Background Tertiary (creative subtle), 11) Text Primary (strong), 12) Text Secondary (interesting), 13) Text Muted (soft), 14) Border (tasteful), 15) Card Background (clean), 16) Feature (standout), 17) CTA (bold action).${contextString}`;
    } else if (type === 'minimal') {
      prompt = `Generate a minimal color palette with 17 colors in hex format for a clean website. Include: 1) Primary (elegant subtle), 2) Secondary (refined neutral), 3) Accent (minimal pop), 4) Success (muted green), 5) Warning (soft amber), 6) Info (gentle blue), 7) Danger (refined red), 8) Background Primary (pure white), 9) Background Secondary (whisper gray), 10) Background Tertiary (soft gray), 11) Text Primary (charcoal), 12) Text Secondary (gray), 13) Text Muted (light gray), 14) Border (delicate), 15) Card Background (white), 16) Feature (subtle), 17) CTA (understated action).${contextString}`;
    } else {
      // random
      prompt = `Generate a completely random, aesthetically pleasing color palette with 17 colors in hex format for a website. Ensure all colors work well together. Include: Primary, Secondary, Accent, Success, Warning, Info, Danger, Background Primary, Background Secondary, Background Tertiary, Text Primary, Text Secondary, Text Muted, Border, Card Background, Feature, and CTA colors.${contextString}`;
    }

    console.log('Generating palette with type:', type);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a color palette generator. Always respond with exactly 17 hex colors in a JSON array format like ["#123456", "#abcdef", ...]. No other text or explanation. The order must be: Primary, Secondary, Accent, Success, Warning, Info, Danger, BG Primary, BG Secondary, BG Tertiary, Text Primary, Text Secondary, Text Muted, Border, Card BG, Feature, CTA.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_palette',
            description: 'Generate a color palette',
            parameters: {
              type: 'object',
              properties: {
                colors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of 17 hex color codes in order: Primary, Secondary, Accent, Success, Warning, Info, Danger, BG Primary, BG Secondary, BG Tertiary, Text Primary, Text Secondary, Text Muted, Border, Card BG, Feature, CTA'
                }
              },
              required: ['colors']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_palette' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract colors from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const colors = args.colors || [];
      
      if (colors.length === 17) {
        return new Response(
          JSON.stringify({ 
            palette: {
              primary: colors[0],
              secondary: colors[1],
              accent: colors[2],
              success: colors[3],
              warning: colors[4],
              info: colors[5],
              danger: colors[6],
              bgPrimary: colors[7],
              bgSecondary: colors[8],
              bgTertiary: colors[9],
              textPrimary: colors[10],
              textSecondary: colors[11],
              textMuted: colors[12],
              border: colors[13],
              cardBg: colors[14],
              feature: colors[15],
              cta: colors[16]
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error('Invalid color palette generated');

  } catch (error) {
    console.error('Error in generate-color-palette:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
