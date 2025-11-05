// Simplified AI Edit Page Edge Function - Make.com Only
// This version removes all direct AI provider integrations and only uses Make.com webhook

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Guardrail instructions sent to the content generator (Make.com)
// These are explicit rules the AI must follow to keep output consistent with our app
const SYSTEM_INSTRUCTIONS = `
🚨 CRITICAL OUTPUT FORMAT - READ FIRST
- Return ONLY plain HTML starting with <!DOCTYPE html>
- NO MARKDOWN code fences (no \`\`\`html or \`\`\` at start/end)
- NO explanatory text, ONLY the HTML document
- If you accidentally add code fences, DELETE them before returning

📋 FORM POLICY - ABSOLUTE RULE
- NEVER create <form>, <input>, <select>, <textarea>, or <label> elements
- Replace ANY form request with a button that calls: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Label')"
- Button labels: "Get My Free Estimate", "Get Emergency Repair Quote", or "Free Insurance Claim Assessment"
- This applies EVEN IF the user explicitly asks for a form with fields

🎯 BUTTON REQUIREMENTS - MANDATORY FOR ALL BUTTONS
Every button MUST follow this EXACT pattern:

<button
  onclick="if(window.openLeadFormModal) window.openLeadFormModal('Label Here')"
  style="background: var(--color-primary); border-radius: var(--radius-button);"
  class="inline-flex items-center gap-2 px-6 py-3 text-white text-base font-semibold shadow-lg hover:opacity-90 transition-all">
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="[COMPLETE PATH DATA HERE]"/>
  </svg>
  Label Here
</button>

BUTTON RULES - NO EXCEPTIONS:
1. ✅ MUST use "text-base" for font size - NEVER text-lg, text-xl, text-2xl, or larger
2. ✅ MUST include inline SVG icon with COMPLETE <path d="..."> as first child
3. ✅ MUST use "inline-flex items-center gap-2" for layout
4. ✅ MUST use "px-6 py-3" or "px-8 py-4" for padding (never change text size for emphasis)
5. ✅ MUST use CSS variables for colors (var(--color-primary), var(--color-accent))

📞 PHONE NUMBERS - MUST ALWAYS BE BUTTONS
EVERY occurrence of {{phone}} MUST be a button with phone icon, NEVER plain text:

<a href="tel:{{phone}}"
   style="background: var(--color-success); border-radius: var(--radius-button); text-decoration: none;"
   class="inline-flex items-center gap-2 px-6 py-3 text-white text-base font-semibold shadow-lg hover:opacity-90 transition-all">
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
  {{phone}}
</a>

❌ WRONG: <a href="tel:{{phone}}" class="text-4xl font-bold">{{phone}}</a>
❌ WRONG: <p>Call: {{phone}}</p>

🎨 ICON REQUIREMENTS
- ALL buttons and CTAs MUST have an inline SVG icon as the FIRST child
- Icons MUST include complete <path d="..."> with the full path data
- Use stroke-width="2" for all icons
- Icon sizes: 20px for buttons, 24px for hero buttons
- Icon mapping:
  * Phone buttons: phone icon (path provided above)
  * Primary CTAs: arrow-right or zap icon
  * Assessment CTAs: shield-check icon
- NO external icon libraries, NO empty SVGs, NO data-lucide placeholders

✅ PRE-OUTPUT CHECKLIST - VERIFY BEFORE RETURNING
Before you return the HTML, check:
1. [ ] NO <form>, <input>, <select>, <textarea>, <label> tags exist
2. [ ] ALL buttons use "text-base" (no text-lg, text-xl, text-2xl)
3. [ ] ALL buttons have inline SVG icon with complete <path d="...">
4. [ ] ALL phone numbers ({{phone}}) are rendered as buttons with phone icon
5. [ ] NO markdown code fences (\`\`\`html) at start or end
6. [ ] ALL buttons use "inline-flex items-center gap-2" layout
7. [ ] ALL colors use CSS variables: var(--color-primary), var(--color-accent), etc.

If ANY checklist item fails, FIX IT before returning the HTML.

COMMON ICONS WITH COMPLETE PATH DATA:
Phone: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>

Arrow Right: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>

Shield Check: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
`;


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, context } = await req.json();
    
    console.log('🌐 AI Edit Page request received');
    console.log('Command:', command);
    console.log('Context keys:', Object.keys(context || {}));

    // Get Make.com webhook URL from secrets
    const MAKECOM_WEBHOOK = Deno.env.get('SEND_MAKECOM_WEBHOOK');
    if (!MAKECOM_WEBHOOK) {
      throw new Error('SEND_MAKECOM_WEBHOOK secret not configured. Please add the Make.com webhook URL in project secrets.');
    }

    // Validate that model is makecom
    if (command.model && command.model !== 'makecom') {
      throw new Error('Only Make.com is supported for page generation. Please configure your editor to use Make.com.');
    }

    console.log('✅ Routing to Make.com webhook');

// Forward the request to Make.com with proper nesting
const webhookPayload = {
  userRequest: {
    companyInfo: {
      companyData: context.companyInfo?.companyData || context.companyInfo || {},
      socialMedia: context.companyInfo?.socialMedia || context.socialMedia || [],
      aiTraining: context.companyInfo?.aiTraining || context.aiTraining || {}
    },
    systemInstructions: SYSTEM_INSTRUCTIONS,
    siteSettings: context.siteSettings || {},
    userPrompt: command.text || command,
    supabaseData: {
      pageType: context.currentPage?.type,
      pageUrl: context.currentPage?.url,
      currentHtml: context.currentPage?.html,
      serviceInfo: context.serviceInfo,
      serviceAreas: context.serviceAreas
    }
  },
  mode: command.mode || 'build',
  timestamp: new Date().toISOString(),
  source: 'ai-edit-page'
};

    console.log('📤 Sending payload to Make.com...');
    
    const webhookResponse = await fetch(MAKECOM_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('❌ Make.com webhook failed:', webhookResponse.status, errorText);
      throw new Error(`Make.com webhook failed: ${webhookResponse.status} - ${errorText}`);
    }

    const result = await webhookResponse.json();
    console.log('✅ Received response from Make.com');

    // Return the result from Make.com
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in ai-edit-page:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Make.com webhook processing failed. Check function logs for details.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
