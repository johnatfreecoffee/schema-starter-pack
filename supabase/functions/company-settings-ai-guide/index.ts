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
    const { prompt, currentTab, currentSettings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Define tools for extracting structured data for each tab
    const tools = [{
      type: "function",
      function: {
        name: "update_company_settings",
        description: "Update company settings based on user input",
        parameters: {
          type: "object",
          properties: {
            business_name: { type: "string", description: "Company business name" },
            business_slogan: { type: "string", description: "Company slogan or tagline" },
            description: { type: "string", description: "Company description" },
            years_experience: { type: "number", description: "Years in business" },
            website_url: { type: "string", description: "Company website URL" },
            phone: { type: "string", description: "Phone number (10 digits)" },
            email: { type: "string", description: "Email address" },
            address_street: { type: "string", description: "Street address" },
            address_unit: { type: "string", description: "Unit or suite number" },
            address_city: { type: "string", description: "City" },
            address_state: { type: "string", description: "State abbreviation (e.g., LA, TX)" },
            address_zip: { type: "string", description: "ZIP code" },
            service_radius: { type: "number", description: "Service radius number" },
            service_radius_unit: { type: "string", enum: ["miles", "kilometers"] },
            license_numbers: { type: "string", description: "License numbers (one per line)" },
            business_hours: { type: "string", description: "Business hours formatted nicely" },
            facebook_url: { type: "string", description: "Facebook URL" },
            instagram_url: { type: "string", description: "Instagram URL" },
            twitter_url: { type: "string", description: "Twitter URL" },
            linkedin_url: { type: "string", description: "LinkedIn URL" },
            guidance: { type: "string", description: "Friendly guidance message to show the user" }
          },
          required: ["guidance"],
          additionalProperties: false
        }
      }
    }];

    const systemPrompt = `You are a proactive AI assistant helping business owners set up their company profile. Act like a friendly human interviewer going through a checklist.

Current tab: ${currentTab}
Current settings: ${JSON.stringify(currentSettings || {}, null, 2)}

Your role:
1. BE PROACTIVE - Don't wait for the user to ask. Tell them what you need next.
2. Ask for ONE specific thing at a time in a conversational way
3. Check what's already filled and what's missing
4. Guide them through EVERY field systematically
5. Extract data from their responses and ask for the next item
6. Use clear, directive language: "Great! Now I need...", "Perfect. Next up...", "Alright, give me..."

Tab-specific fields to collect:
- basic: business_name, business_slogan, description, years_experience, website_url
- contact: phone, email, address_street, address_unit, address_city, address_state, address_zip, service_radius, service_radius_unit
- business: license_numbers, business_hours
- social: facebook_url, instagram_url, twitter_url, linkedin_url
- documents: (guidance only about uploading logos and documents)

CRITICAL BEHAVIOR:
- After each response, identify what's STILL MISSING and ask for it specifically
- Don't ask "what else?" - tell them what you need: "Now I need your company description", "Give me your phone number", etc.
- Be conversational but directive: act like a helpful human form assistant
- When a tab is complete, acknowledge it and suggest moving to the next tab

Always include a "guidance" field that asks for the NEXT specific piece of information.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "update_company_settings" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call returned');
    }

    const updates = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(updates),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in company-settings-ai-guide:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
