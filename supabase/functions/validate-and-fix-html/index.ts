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
    const { html, pageType, pageTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Validating HTML for page: ${pageTitle} (${pageType})`);

    const systemPrompt = `You are an HTML validation assistant. Your ONLY job is to fix rendering issues in pre-built HTML.

DO NOT rewrite content. DO NOT change structure. ONLY fix these issues:

1. **Icons**: Ensure all icons use proper data-lucide attributes
   - Find: <i class="..."></i>, <span class="icon"></span>
   - Replace with: <i data-lucide="icon-name"></i>
   - Use context clues (nearby text, section purpose) to infer correct icon names

2. **Colors**: Replace hardcoded Tailwind colors with CSS variables
   - Find: bg-blue-500, text-red-600, border-gray-300, etc.
   - Replace with: CSS variables like hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--muted)), etc.

3. **Inline Styles**: Fix malformed inline styles
   - Fix: style="color:red font-size:16px" → style="color:red; font-size:16px;"
   - Remove empty style attributes

4. **Tags**: Close any unclosed HTML tags

Return ONLY the fixed HTML. No explanations, no markdown blocks, just the corrected HTML.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Fix this HTML:\n\n${html}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const fixedHtml = data.choices[0].message.content;

    console.log(`Validation complete for ${pageTitle}`);

    return new Response(
      JSON.stringify({ 
        fixedHtml,
        issuesFixed: ["Auto-validated HTML structure, icons, and styling"]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
