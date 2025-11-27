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
    const { html, pageType, pageTitle, htmlValidationInstructions } = await req.json();
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

    const systemPrompt = htmlValidationInstructions || '';

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
