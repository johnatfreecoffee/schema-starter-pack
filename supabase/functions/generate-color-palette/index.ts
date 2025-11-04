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
    const { type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    
    if (type === 'professional') {
      prompt = 'Generate a professional, corporate color palette with 7 colors in hex format. Include: primary (trustworthy blue or corporate color), secondary (complementary neutral), accent (vibrant but professional), success (green), warning (orange/amber), info (blue), danger (red). Return only the 7 hex colors as a JSON array, no explanation.';
    } else if (type === 'creative') {
      prompt = 'Generate a creative, vibrant color palette with 7 colors in hex format. Include: primary (bold and eye-catching), secondary (complementary creative color), accent (unique highlight), success (fresh green), warning (warm orange), info (cool blue), danger (striking red). Return only the 7 hex colors as a JSON array, no explanation.';
    } else if (type === 'minimal') {
      prompt = 'Generate a minimal, modern color palette with 7 colors in hex format. Include: primary (subtle elegant color), secondary (refined neutral), accent (minimal pop of color), success (muted green), warning (soft amber), info (gentle blue), danger (refined red). Return only the 7 hex colors as a JSON array, no explanation.';
    } else {
      // random
      prompt = 'Generate a completely random, aesthetically pleasing color palette with 7 colors in hex format. Include: primary, secondary, accent, success, warning, info, danger. Ensure colors work well together. Return only the 7 hex colors as a JSON array, no explanation.';
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
            content: 'You are a color palette generator. Always respond with exactly 7 hex colors in a JSON array format like ["#123456", "#abcdef", ...]. No other text or explanation.'
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
                  description: 'Array of 7 hex color codes'
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
      
      if (colors.length === 7) {
        return new Response(
          JSON.stringify({ 
            palette: {
              primary: colors[0],
              secondary: colors[1],
              accent: colors[2],
              success: colors[3],
              warning: colors[4],
              info: colors[5],
              danger: colors[6]
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
