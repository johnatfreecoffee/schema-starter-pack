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

1. OUTPUT FORMAT
   - Return ONLY raw HTML, no Markdown, no code fences, no explanations
   - Must start with <!DOCTYPE html>
   - NO \`\`\`html or \`\`\` at start/end
   - NO <script> tags except inline onclick for lead capture
   - NO external stylesheets, fonts, or CDN links
   - Must include exactly ONE <style> block with all CSS

2. CSS SCOPING & DESIGN TOKENS
   - ALL CSS variables and rules MUST be defined under :root { ... }
   - This will be automatically scoped to a wrapper ID by the renderer
   - Define these CSS variables with EXPLICIT HSL values (no placeholders):
   
   :root {
     /* Primary color palette - USE REAL HSL VALUES */
     --color-primary: hsl(212 100% 45%);
     --color-accent: hsl(45 100% 55%);
     --color-success: hsl(142 71% 45%);
     --color-text: hsl(0 0% 13%);
     --color-text-light: hsl(0 0% 40%);
     --color-bg: hsl(0 0% 100%);
     
     /* CTA sizing */
     --cta-font-size: 1rem;
     --cta-icon-size: 20px;
     --radius-button: 0.5rem;
   }
   
   .cta {
     display: inline-flex;
     align-items: center;
     gap: 0.5rem;
     padding: 0.75rem 1.5rem;
     font-size: var(--cta-font-size);
     font-weight: 600;
     color: white;
     background: var(--color-primary);
     border-radius: var(--radius-button);
     text-decoration: none;
     box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
     transition: all 0.2s;
   }
   
   .cta:hover {
     opacity: 0.9;
     box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
   }
   
   .cta--phone {
     background: var(--color-success);
   }
   
   .cta-icon {
     width: var(--cta-icon-size);
     height: var(--cta-icon-size);
     flex-shrink: 0;
   }

3. NO TAILWIND ASSUMPTIONS
   - DO NOT include <script src="https://cdn.tailwindcss.com"></script>
   - You may use simple class names but their CSS MUST be in the <style> block
   - NO reliance on external frameworks

4. LEAD CAPTURE POLICY - ABSOLUTE RULE
   - NEVER create <form>, <input>, <select>, <textarea>, or <label> elements
   - Replace ANY form request with a single CTA button:
   
   <a href="#" 
      onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get My Free Estimate'); return false;"
      class="cta">
     <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
       <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
     </svg>
     Get My Free Estimate
   </a>
   
   - Allowed button labels:
     * "Get My Free Estimate"
     * "Get Emergency Repair Quote"
     * "Free Insurance Claim Assessment"

5. CANONICAL CTA BUTTON PATTERN
   ALL CTA buttons MUST follow this pattern:
   
   <a href="#" 
      onclick="if(window.openLeadFormModal) window.openLeadFormModal('Label'); return false;"
      class="cta">
     <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
       <path stroke-linecap="round" stroke-linejoin="round" d="[ICON PATH]"/>
     </svg>
     Label Text
   </a>
   
   MANDATORY RULES:
   - MUST use class="cta" (defined in <style>)
   - MUST include inline SVG icon as first child with class="cta-icon"
   - SVG MUST have stroke-width="2"
   - Text size controlled by --cta-font-size (never use inline large text styles)

6. ICON MAPPING
   Use these inline SVG icons (with complete path data):
   
   Primary CTA (lightning/bolt):
   <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
     <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
   </svg>
   
   Insurance CTA (shield-check):
   <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
     <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
   </svg>
   
   Phone CTA (phone):
   <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
     <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
   </svg>

7. PHONE NUMBER HANDLING - CRITICAL
   ANY phone number MUST be rendered as a canonical CTA button:
   
   <a href="tel:{{phone}}" class="cta cta--phone">
     <svg class="cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
       <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
     </svg>
     {{phone}}
   </a>
   
   ❌ NEVER: <p>Call: {{phone}}</p>
   ❌ NEVER: <a href="tel:{{phone}}">{{phone}}</a> (without button styling and icon)

8. TYPOGRAPHY & CONSISTENCY
   - All CTA text MUST use --cta-font-size (1rem)
   - NO oversized button typography (no text-2xl, text-xl, etc.)
   - Emphasis through padding/color, NOT text size

✅ PRE-OUTPUT CHECKLIST
Before returning HTML, verify:
[ ] NO <script src="..."> except inline onclick
[ ] NO <form>, <input>, <select>, <textarea>, <label>
[ ] ALL phone numbers are CTA buttons with phone icon
[ ] ALL CTA buttons have class="cta" with inline SVG icon
[ ] ALL CTA text uses --cta-font-size
[ ] CSS variables use EXPLICIT HSL values (no {{placeholders}})
[ ] Single <style> block with :root scoping
[ ] NO Tailwind CDN link
[ ] NO markdown code fences (\`\`\`html)
[ ] Allowed CTA labels only

If ANY item fails, FIX before returning.
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
