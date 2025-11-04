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
    const { type, companyContext, excludedColors = [] } = await req.json();
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

    // Build exclusion string
    let exclusionString = '';
    if (excludedColors && excludedColors.length > 0) {
      exclusionString = `\n\nCRITICAL COLOR EXCLUSIONS: DO NOT use any shades, tints, or variations of these color families: ${excludedColors.join(', ')}. This means:
- NO ${excludedColors.map((c: string) => c.toUpperCase()).join(', ')} hues in Primary, Secondary, Accent, Feature, or CTA colors
- Avoid these color families completely in brand colors
- You may use neutral backgrounds (white, gray, black) for backgrounds and text
- Focus on the remaining color families to create bold, contrasting palettes
- If a state color (Success, Warning, Info, Danger) must use an excluded color by convention (e.g., red for Danger), use a different bold color that conveys the same meaning`;
    }

    let prompt = '';
    
    if (type === 'professional') {
      prompt = `Generate a professional color palette with 17 colors in hex format. CRITICAL: Ensure high contrast (WCAG AAA) between text and backgrounds. Include: 1) Primary (trustworthy bold blue like #0066CC), 2) Secondary (complementary teal like #008B8B), 3) Accent (vibrant orange like #FF6B35), 4) Success (rich green #059669), 5) Warning (bold amber #F59E0B), 6) Info (strong blue #0284C7), 7) Danger (vivid red #DC2626), 8) Background Primary (pure white #FFFFFF), 9) Background Secondary (cool light #F1F5F9), 10) Background Tertiary (subtle blue-gray #E2E8F0), 11) Text Primary (deep charcoal #1E293B), 12) Text Secondary (medium slate #475569), 13) Text Muted (light slate #94A3B8), 14) Border (slate #CBD5E1), 15) Card Background (white #FFFFFF), 16) Feature (deep blue #1E40AF), 17) CTA (action green #16A34A). All colors must be bold, saturated, and have excellent contrast.${contextString}${exclusionString}`;
    } else if (type === 'creative') {
      prompt = `Generate a creative color palette with 17 colors in hex format. CRITICAL: Use bold, saturated colors with high contrast (WCAG AAA). Include: 1) Primary (vibrant magenta like #E91E63), 2) Secondary (electric cyan like #00BCD4), 3) Accent (golden yellow like #FFC107), 4) Success (lime green #84CC16), 5) Warning (hot orange #FB923C), 6) Info (purple #A855F7), 7) Danger (crimson #EF4444), 8) Background Primary (off-white #FAFAFA), 9) Background Secondary (warm cream #FEF3C7), 10) Background Tertiary (soft lavender #F3E8FF), 11) Text Primary (rich black #0F172A), 12) Text Secondary (dark gray #334155), 13) Text Muted (medium gray #64748B), 14) Border (cool gray #D1D5DB), 15) Card Background (white #FFFFFF), 16) Feature (royal purple #7C3AED), 17) CTA (vibrant coral #F43F5E). All colors must pop with energy and excellent readability.${contextString}${exclusionString}`;
    } else if (type === 'minimal') {
      prompt = `Generate a minimal color palette with 17 colors in hex format. CRITICAL: Clean and refined BUT with bold brand colors and high contrast (WCAG AAA). Include: 1) Primary (bold charcoal like #2C3E50), 2) Secondary (deep slate like #34495E), 3) Accent (vibrant teal like #14B8A6 - NO GRAY), 4) Success (fresh emerald #10B981), 5) Warning (bright gold #FBBF24), 6) Info (strong sky blue #0EA5E9), 7) Danger (clear red #EF4444), 8) Background Primary (pure white #FFFFFF), 9) Background Secondary (whisper gray #F9FAFB), 10) Background Tertiary (light cool gray #F3F4F6), 11) Text Primary (true black #111827), 12) Text Secondary (charcoal #374151), 13) Text Muted (medium gray #6B7280), 14) Border (soft gray #E5E7EB), 15) Card Background (white #FFFFFF), 16) Feature (midnight blue #1E3A8A), 17) CTA (bold emerald #059669). Use clean neutrals for backgrounds but BOLD colors for accents/actions.${contextString}${exclusionString}`;
    } else if (type === 'modern') {
      prompt = `Generate a modern tech color palette with 17 colors in hex format. CRITICAL: Sleek, high-tech with excellent contrast. Include: 1) Primary (electric blue #3B82F6), 2) Secondary (cyber purple #8B5CF6), 3) Accent (neon cyan #06B6D4), 4) Success (tech green #22C55E), 5) Warning (amber #F59E0B), 6) Info (bright blue #0EA5E9), 7) Danger (alert red #EF4444), 8) Background Primary (off-black #0F172A), 9) Background Secondary (dark slate #1E293B), 10) Background Tertiary (deep gray #334155), 11) Text Primary (bright white #F8FAFC), 12) Text Secondary (cool white #E2E8F0), 13) Text Muted (light gray #94A3B8), 14) Border (subtle slate #475569), 15) Card Background (dark card #1E293B), 16) Feature (vibrant blue #2563EB), 17) CTA (electric green #10B981). Dark mode optimized with glowing accent colors.${contextString}${exclusionString}`;
    } else if (type === 'vibrant') {
      prompt = `Generate a vibrant energetic color palette with 17 colors in hex format. CRITICAL: Maximum energy with perfect contrast. Include: 1) Primary (hot pink #EC4899), 2) Secondary (electric purple #A855F7), 3) Accent (sunshine yellow #FACC15), 4) Success (spring green #22C55E), 5) Warning (tangerine #FB923C), 6) Info (azure #3B82F6), 7) Danger (ruby #DC2626), 8) Background Primary (bright white #FFFFFF), 9) Background Secondary (light gradient #FEF3C7), 10) Background Tertiary (soft peach #FED7AA), 11) Text Primary (deep navy #0F172A), 12) Text Secondary (dark slate #334155), 13) Text Muted (gray #64748B), 14) Border (warm gray #D1D5DB), 15) Card Background (white #FFFFFF), 16) Feature (indigo #6366F1), 17) CTA (energy red #F43F5E). All colors at maximum saturation with high impact.${contextString}${exclusionString}`;
    } else if (type === 'elegant') {
      prompt = `Generate an elegant sophisticated color palette with 17 colors in hex format. CRITICAL: Luxurious with strong contrast. Include: 1) Primary (deep burgundy #881337), 2) Secondary (rich navy #1E3A8A), 3) Accent (gold #D97706), 4) Success (forest green #15803D), 5) Warning (bronze #EA580C), 6) Info (sapphire #1D4ED8), 7) Danger (wine red #B91C1C), 8) Background Primary (ivory #FAFAF9), 9) Background Secondary (warm beige #F5F5F4), 10) Background Tertiary (soft taupe #E7E5E4), 11) Text Primary (charcoal #1C1917), 12) Text Secondary (stone #44403C), 13) Text Muted (warm gray #78716C), 14) Border (stone #D6D3D1), 15) Card Background (white #FFFFFF), 16) Feature (royal purple #7C3AED), 17) CTA (emerald #047857). Rich, deep colors with premium feel.${contextString}${exclusionString}`;
    } else if (type === 'warm') {
      prompt = `Generate a warm inviting color palette with 17 colors in hex format. CRITICAL: Cozy and welcoming with excellent contrast. Include: 1) Primary (terracotta #DC2626), 2) Secondary (burnt orange #EA580C), 3) Accent (golden #F59E0B), 4) Success (olive green #65A30D), 5) Warning (amber #F59E0B), 6) Info (warm blue #0284C7), 7) Danger (brick red #B91C1C), 8) Background Primary (cream #FFFBEB), 9) Background Secondary (soft peach #FEF3C7), 10) Background Tertiary (warm beige #FDE68A), 11) Text Primary (brown #451A03), 12) Text Secondary (warm brown #78350F), 13) Text Muted (tan #A16207), 14) Border (sand #FDE047), 15) Card Background (ivory #FFFBEB), 16) Feature (rust #C2410C), 17) CTA (warm green #84CC16). Earth tones with warmth and energy.${contextString}${exclusionString}`;
    } else if (type === 'cool') {
      prompt = `Generate a cool calming color palette with 17 colors in hex format. CRITICAL: Serene but bold with high contrast. Include: 1) Primary (ocean blue #0369A1), 2) Secondary (teal #0D9488), 3) Accent (mint #14B8A6), 4) Success (sea green #059669), 5) Warning (sky amber #FBBF24), 6) Info (azure #0EA5E9), 7) Danger (coral #EF4444), 8) Background Primary (ice white #F0FDFA), 9) Background Secondary (cool mist #CCFBF1), 10) Background Tertiary (aqua light #99F6E4), 11) Text Primary (deep ocean #083344), 12) Text Secondary (teal dark #115E59), 13) Text Muted (cyan gray #5EEAD4), 14) Border (aqua #5EEAD4), 15) Card Background (frost #ECFEFF), 16) Feature (deep teal #0F766E), 17) CTA (turquoise #06B6D4). Cool tones with clarity and calm energy.${contextString}${exclusionString}`;
    } else {
      // random
      prompt = `Generate a completely random, bold, aesthetically pleasing color palette with 17 colors in hex format. CRITICAL: Ensure all colors are saturated, bold, and have excellent contrast (WCAG AAA between text and backgrounds). NO washed out or gray accents. Include: Primary (bold main), Secondary (strong complement), Accent (vibrant pop), Success (clear green), Warning (strong orange/amber), Info (clear blue), Danger (strong red), Background Primary (light), Background Secondary (subtle), Background Tertiary (soft), Text Primary (very dark with high contrast), Text Secondary (medium dark), Text Muted (medium), Border (subtle), Card Background (clean), Feature (standout), CTA (action-oriented). All brand/accent colors must be bold and saturated.${contextString}${exclusionString}`;
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
            content: `You are an expert color palette generator with deep knowledge of color theory, accessibility, and contrast ratios.

CRITICAL RULES:
1. All text colors must have WCAG AAA contrast (7:1 minimum) against their backgrounds
2. Brand colors (Primary, Secondary, Accent, Feature, CTA) must be BOLD and SATURATED (avoid grays, avoid muted tones)
3. State colors (Success, Warning, Info, Danger) must be instantly recognizable and vibrant
4. Background colors should be light/neutral but NOT wash out the design
5. Consider color harmony: use complementary, triadic, or analogous color schemes
6. Test mental contrast: Text Primary on BG Primary, Text Secondary on BG Secondary, etc.
7. Accent and CTA colors must POP and draw attention
8. Avoid using gray as an accent color unless specifically requested for "minimal" theme
9. For dark themes, ensure text is bright enough (near white) for readability

Always respond with exactly 17 hex colors in the specified order. No other text or explanation.
Order: Primary, Secondary, Accent, Success, Warning, Info, Danger, BG Primary, BG Secondary, BG Tertiary, Text Primary, Text Secondary, Text Muted, Border, Card BG, Feature, CTA.`
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
