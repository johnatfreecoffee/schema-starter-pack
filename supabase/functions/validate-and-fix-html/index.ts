import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Post-processing function to replace Google Drive URLs with placeholder filenames
function replaceGoogleDriveUrls(html: string): string {
  let counter = 1;
  
  // Replace Google Drive preview URLs with placeholder filenames
  const processedHtml = html.replace(
    /src=["']https:\/\/drive\.google\.com\/file\/d\/[^\/]+\/preview["']/g,
    () => `src="placeholder-image-${counter++}.jpg"`
  );
  
  // Also handle other Google Drive URL formats
  return processedHtml.replace(
    /src=["']https:\/\/drive\.google\.com\/[^"']+["']/g,
    () => `src="placeholder-image-${counter++}.jpg"`
  );
}

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
    
    // Pre-process HTML to replace Google Drive URLs with placeholders
    const preprocessedHtml = replaceGoogleDriveUrls(html);
    
    if (preprocessedHtml !== html) {
      console.log(`Replaced Google Drive URLs with placeholder filenames for ${pageTitle}`);
    }

    const systemPrompt = `You are an HTML validation and design enhancement assistant. Your job is to fix rendering issues and ensure professional, modern design standards.

CRITICAL RULES:
- DO NOT rewrite content or change structure
- ONLY fix technical issues and enforce design standards
- Preserve all text content exactly as written

REQUIRED FIXES:

1. **Icons - FIX EMPTY SVG TAGS AND CONVERT ICON LIBRARIES**: 
   - 🚨 CRITICAL: Find ALL <svg> tags that are EMPTY or missing <path> elements
   - Empty SVG tags are INVISIBLE - they MUST be replaced with complete SVG icons from Heroicons
   - Example of BROKEN icon: <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
   - Example of FIXED icon: <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
   - Based on surrounding context (text, class names, section purpose), select appropriate icon:
     * Emergency/Shield/Protection → shield-check icon
     * Phone/Call → phone icon  
     * Home/House → home icon
     * Tool/Repair/Wrench → wrench/cog icon
     * Check/Success → check-circle icon
     * Dollar/Money → currency-dollar icon
     * Calendar → calendar icon
   - PRESERVE all existing SVG icons that already have <path> elements
   - ONLY convert Font Awesome (<i class="fa...">), Material Icons, or other icon libraries to inline SVG
   - NO icon libraries requiring JavaScript - ONLY complete inline SVG with path data
   - NO emojis as icons

2. **Colors - CSS Variables ONLY**:
   - Replace ALL hardcoded colors with semantic CSS variables
   - Find: bg-blue-500, text-red-600, border-gray-300, bg-white, text-black, #hexcodes, rgb(), etc.
   - Replace with:
     * Primary actions: bg-primary, text-primary, border-primary
     * Secondary elements: bg-secondary, text-secondary
     * Accent/highlights: bg-accent, text-accent
     * Muted/subtle: bg-muted, text-muted, border-muted
     * Cards/surfaces: bg-card, text-card-foreground
     * Backgrounds: bg-background, text-foreground
     * Destructive: bg-destructive, text-destructive
   - Use Tailwind format: bg-[hsl(var(--primary))], text-[hsl(var(--accent))]
   - NEVER use: text-white, bg-black, text-gray-500, bg-blue-600, etc.

3. **Professional Design Standards**:
   - Ensure proper spacing: p-4, p-6, p-8, py-12, py-16, py-24 for sections
   - Add proper shadows: shadow-sm, shadow-md, shadow-lg for depth
   - Ensure rounded corners: rounded-lg, rounded-xl for modern feel
   - Proper typography hierarchy: text-4xl, text-3xl, text-2xl, text-xl, text-lg, text-base
   - Add hover states: hover:bg-primary/90, hover:shadow-lg, hover:scale-105
   - Ensure responsive design: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

4. **Inline Styles**: 
   - Fix malformed inline styles: style="color:red font-size:16px" → style="color:red; font-size:16px;"
   - Remove empty style attributes
   - Convert inline styles to Tailwind classes where possible

5. **Tags**: Close any unclosed HTML tags

6. **Accessibility**:
   - Ensure all icons have aria-hidden="true" if decorative
   - Add proper alt text suggestions in comments if images lack them

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
          { role: "user", content: `Fix this HTML:\n\n${preprocessedHtml}` }
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
