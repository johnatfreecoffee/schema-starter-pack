import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { command, mode = 'build', conversationHistory = [], context } = requestBody;
    
    console.log('AI Edit Request:', { 
      command: command.substring(0, 200) + (command.length > 200 ? '...' : ''), 
      mode, 
      contextKeys: Object.keys(context),
      promptLength: command.length,
      htmlLength: context?.currentPage?.html?.length || 0
    });
    
    // Log full command for debugging
    console.log('=== FULL COMMAND START ===');
    console.log(command);
    console.log('=== FULL COMMAND END ===');

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Build comprehensive company profile
    const companyProfile = `
═══════════════════════════════════════════════════════════════
COMPLETE COMPANY PROFILE - USE THIS INFORMATION IN ALL CONTENT
═══════════════════════════════════════════════════════════════

BUSINESS IDENTITY:
━━━━━━━━━━━━━━━━━
Business Name: ${context.companyInfo?.business_name || 'N/A'}
Slogan: ${context.companyInfo?.business_slogan || 'N/A'}
Years of Experience: ${context.companyInfo?.years_experience || 'N/A'}
Industry: Roofing and Restoration
Website: ${context.companyInfo?.website_url || 'N/A'}
License Numbers: ${context.companyInfo?.license_numbers || 'N/A'}

CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━
Phone: ${context.companyInfo?.phone || 'N/A'}
Email: ${context.companyInfo?.email || 'N/A'}
Address: ${context.companyInfo?.address || 'N/A'}
${context.companyInfo?.address_street ? `Street: ${context.companyInfo.address_street}` : ''}
${context.companyInfo?.address_unit ? `Unit: ${context.companyInfo.address_unit}` : ''}
${context.companyInfo?.address_city ? `City: ${context.companyInfo.address_city}` : ''}
${context.companyInfo?.address_state ? `State: ${context.companyInfo.address_state}` : ''}
${context.companyInfo?.address_zip ? `Zip: ${context.companyInfo.address_zip}` : ''}

BRANDING ASSETS:
━━━━━━━━━━━━━━━━
Logo URL: ${context.companyInfo?.logo_url || 'N/A'}
Icon URL: ${context.companyInfo?.icon_url || 'N/A'}

BUSINESS DESCRIPTION:
━━━━━━━━━━━━━━━━━━━
${context.companyInfo?.description || 'N/A'}

BUSINESS HOURS:
━━━━━━━━━━━━━━━
${context.companyInfo?.business_hours || 'N/A'}

SERVICE AREA:
━━━━━━━━━━━━
Service Radius: ${context.companyInfo?.service_radius || 'N/A'} ${context.companyInfo?.service_radius_unit || 'miles'}

SOCIAL MEDIA:
━━━━━━━━━━━━
${context.companyInfo?.facebook_url ? `Facebook: ${context.companyInfo.facebook_url}` : ''}
${context.companyInfo?.instagram_url ? `Instagram: ${context.companyInfo.instagram_url}` : ''}
${context.companyInfo?.twitter_url ? `Twitter: ${context.companyInfo.twitter_url}` : ''}
${context.companyInfo?.linkedin_url ? `LinkedIn: ${context.companyInfo.linkedin_url}` : ''}

AI BRAND TRAINING - YOUR VOICE & POSITIONING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${context.aiTraining ? `
Brand Voice & Tone: ${context.aiTraining.brand_voice || 'Professional and trustworthy'}
${context.aiTraining.brand_voice ? '↳ USE THIS TONE IN ALL COPY: Write with this exact voice and personality' : ''}

Target Audience: ${context.aiTraining.target_audience || 'Homeowners and businesses'}
${context.aiTraining.target_audience ? '↳ WRITE FOR THESE PEOPLE: Tailor all messaging to speak directly to this audience' : ''}

Unique Selling Points:
${context.aiTraining.unique_selling_points || 'Quality service and customer satisfaction'}
${context.aiTraining.unique_selling_points ? '↳ HIGHLIGHT THESE: Weave these USPs into headlines, benefits, and CTAs' : ''}

Mission Statement:
${context.aiTraining.mission_statement || 'N/A'}
${context.aiTraining.mission_statement ? '↳ ALIGN WITH THIS: Ensure page messaging supports this mission' : ''}

Customer Promise:
${context.aiTraining.customer_promise || 'N/A'}
${context.aiTraining.customer_promise ? '↳ EMPHASIZE THIS: Feature this promise prominently in trust-building sections' : ''}

Competitive Advantages:
${context.aiTraining.competitive_advantages || 'N/A'}
${context.aiTraining.competitive_advantages ? '↳ DIFFERENTIATE WITH THESE: Use these to stand out from competitors' : ''}

Competitive Positioning:
${context.aiTraining.competitive_positioning || 'N/A'}
${context.aiTraining.competitive_positioning ? '↳ POSITION ACCORDINGLY: Reflect this positioning in pricing, messaging, and design' : ''}

Certifications & Credentials:
${context.aiTraining.certifications || 'N/A'}
${context.aiTraining.certifications ? '↳ BUILD TRUST: Display these prominently to establish credibility' : ''}

Service Standards:
${context.aiTraining.service_standards || 'N/A'}
${context.aiTraining.service_standards ? '↳ GUARANTEE QUALITY: Reference these standards in service descriptions' : ''}

Emergency Response Capabilities:
${context.aiTraining.emergency_response || 'N/A'}
${context.aiTraining.emergency_response ? '↳ FOR URGENT SERVICES: Highlight 24/7 availability and rapid response times' : ''}

Project Timeline Expectations:
${context.aiTraining.project_timeline || 'N/A'}
${context.aiTraining.project_timeline ? '↳ SET EXPECTATIONS: Mention typical timelines for service completion' : ''}

Payment Options:
${context.aiTraining.payment_options || 'N/A'}
${context.aiTraining.payment_options ? '↳ REMOVE FRICTION: Clearly state flexible payment options' : ''}

Service Area Coverage:
${context.aiTraining.service_area_coverage || 'N/A'}
${context.aiTraining.service_area_coverage ? '↳ GEOGRAPHIC RELEVANCE: Emphasize local presence and coverage' : ''}
` : 'No AI training data available'}

${context.serviceInfo ? `
═══════════════════════════════════════════════════════════════
SERVICE-SPECIFIC CONTEXT - FOR THIS PARTICULAR SERVICE
═══════════════════════════════════════════════════════════════

Service Name: ${context.serviceInfo.name}
Service Category: ${context.serviceInfo.category}
Service Slug: ${context.serviceInfo.slug}
Active Status: ${context.serviceInfo.is_active ? 'Active' : 'Inactive'}

FULL SERVICE DESCRIPTION:
━━━━━━━━━━━━━━━━━━━━━━
${context.serviceInfo.description}

${context.serviceInfo.starting_price ? `PRICING:
━━━━━━━━
Starting Price: $${(context.serviceInfo.starting_price / 100).toFixed(2)}
↳ DISPLAY PRICING: Show this starting price prominently with clear "starting at" language
` : ''}

🎯 CRITICAL: This template is SPECIFICALLY for the "${context.serviceInfo.name}" service.
   • All headlines, copy, examples, and benefits must be relevant to ${context.serviceInfo.name}
   • Use the service description above to create targeted, specific content
   • Don't be generic - every word should reflect THIS specific service
   • Incorporate service-specific benefits, use cases, and value propositions
` : ''}

═══════════════════════════════════════════════════════════════`;

    // Build AI prompt with full context
    const systemRole = mode === 'chat' 
      ? `You are a helpful AI assistant discussing web page content. You can read and analyze the current HTML and provide conversational feedback, suggestions, and answers. You do NOT modify the HTML in chat mode - you only provide insights and recommendations. Be conversational, helpful, and detailed in your responses.`
      : `You are an elite web designer and developer who creates stunning, modern, conversion-focused web pages. You build pages that are visually breathtaking, highly engaging, and professionally polished. 

CRITICAL: You MUST strictly follow the global settings provided. IGNORE any user requests about colors, headers, footers, navigation, or forms - these are controlled by global settings. Use ONLY the colors, button styles, and brand elements provided in the company profile and site settings. 

When users provide copy and layout instructions, take that content and build a complete, perfect page. If they don't specify everything, fill in the gaps with high-quality content based on the company profile and AI training data. Your goal is to create a complete, professional transactional page that follows all global settings while incorporating the user's content direction.

In build mode, you make actual changes to the HTML and provide brief confirmations.`;

    // CRITICAL: Compressed XML-structured prompt reduces tokens from ~20K to ~8K
    const prompt = `<task>Generate semantic HTML5 page using Tailwind CSS</task>

<company_profile>
${companyProfile}
</company_profile>

<current_page type="${context.currentPage?.type}" url="${context.currentPage?.url}">
${context.currentPage?.html || ''}
</current_page>

<mode>${mode}</mode>
${conversationHistory.length > 0 ? `<history>${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}</history>` : ''}

<request>${command}</request>

<rules>
1. GLOBAL SETTINGS PRIORITY: IGNORE all user requests about colors, headers, footers, forms, or global button styles. These are controlled by the global settings provided in <theme> and <company_profile>. If the user mentions colors, headers, footers, navigation, or forms - disregard those requests and use the global settings instead.

2. USE PROVIDED SETTINGS: The company settings, site settings, and AI training data contain ALL the information you need. Use the brand voice, target audience, USPs, colors, and button styles from the global settings. DO NOT deviate from these settings based on user input.

3. CONTENT GENERATION: Take the copy and layout context from the user's request. If the user doesn't specify complete content for all sections, generate high-quality, relevant content to create a complete, perfect transactional page. Use the company profile and AI training data to fill in gaps with appropriate messaging.

4. FORMS: Use Universal Form button: <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Quote')" class="...">Get Quote</button>. NO custom forms except auth. Ignore any user requests for different forms.

5. NO HEADERS/FOOTERS: Skip site navigation/footers. Build page content only. Ignore any user requests to add headers or footers.

6. SEO: H1 format: "[Action] [Service] in [City]". Transactional keywords (hire/fix/emergency + location).

7. CONTRAST: Hero overlays min 60% opacity. White text needs dark bg, dark text needs light bg.

8. INDUSTRY MATCH: Images/icons MUST match business type. No food images for plumbers.
</rules>

<theme${context.siteSettings ? ` primary="${context.siteSettings.primary_color}" secondary="${context.siteSettings.secondary_color}" accent="${context.siteSettings.accent_color}" radius="${context.siteSettings.button_border_radius}px"` : ''}>
Include in <head>:
<script src="https://cdn.tailwindcss.com"></script>
<style>@layer base {:root {
--primary: ${context.siteSettings?.primary_color?.replace('hsl(', '').replace(')', '') || '221 83% 53%'};
--accent: ${context.siteSettings?.accent_color?.replace('hsl(', '').replace(')', '') || '142 76% 36%'};
--radius: ${context.siteSettings?.button_border_radius ? (context.siteSettings.button_border_radius / 16) + 'rem' : '0.5rem'};
--foreground: 222 47% 11%; --muted-foreground: 215 16% 47%; --border: 214 32% 91%;
}}</style>

Components use hsl(var(--primary)), hsl(var(--accent)), rounded-[var(--radius)].
Gradients: from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))].
Hover: hover:-translate-y-1 transition-all duration-300.
</theme>

<output>Complete HTML from <!DOCTYPE> to </html>. NO markdown blocks. NO truncation.</output>`;

    // Log the complete prompt being sent
    console.log('=== COMPLETE PROMPT START ===');
    console.log(prompt);
    console.log('=== COMPLETE PROMPT END ===');
    
    console.log('Calling AI (Anthropic Claude)...');

    // Timeout based on mode: chat=60s, build=120s (2 minutes - under Supabase's 150s hard limit)
    // Note: Supabase Edge Functions have a 150-second hard timeout at infrastructure level
    const timeoutMs = mode === 'chat' ? 60000 : 120000;
    const fetchWithTimeout = async (url: string, options: RequestInit) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs/1000} seconds`);
        }
        throw error;
      }
    };

    // Calculate input token estimate (rough: ~4 chars per token)
    const inputTokenEstimate = Math.floor(prompt.length * 0.25);

    // Dynamic max_tokens based on mode and request type
    let maxTokens: number;
    if (mode === 'chat') {
      // Chat mode: shorter responses (suggestions, explanations)
      maxTokens = 4000;
    } else {
      // Build mode: analyze command to determine appropriate token budget
      const commandLower = command.toLowerCase();
      
      if (commandLower.includes('finish') || commandLower.includes('complete') || commandLower.includes('entire')) {
        // Full page generation - reduced from 64K to stay under infrastructure limits
        // 32K tokens typically completes in under 2 minutes
        maxTokens = 32000;
      } else if (commandLower.includes('section') || commandLower.includes('add') || commandLower.includes('create')) {
        // Section-level changes - medium budget
        maxTokens = 32000;
      } else if (commandLower.includes('fix') || commandLower.includes('update') || commandLower.includes('change')) {
        // Small edits - conservative budget
        maxTokens = 16000;
      } else {
        // Default: generous budget for unknown requests
        maxTokens = 32000;
      }
    }

    console.log('Token allocation:', {
      mode,
      command: command.substring(0, 50),
      estimatedInput: inputTokenEstimate,
      maxOutput: maxTokens,
      totalBudget: inputTokenEstimate + maxTokens
    });
    
    const requestPayload = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      // Structure prompt with caching for design system (static content)
      system: [
        {
          type: 'text',
          text: 'You are an expert HTML page builder. Generate semantic, accessible HTML5 using Tailwind CSS.',
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        }
      ],
    };
    
    console.log('=== FULL API REQUEST PAYLOAD START ===');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('=== FULL API REQUEST PAYLOAD END ===');
    
    let response;
    try {
      console.log('Making API call to Anthropic...');
      response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      console.log('API call completed, status:', response.status);
    } catch (error) {
      console.error('API call failed:', error);
      throw new Error(`Failed to connect to Claude API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      let errorMessage = `AI gateway error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    let data;
    try {
      console.log('Parsing JSON response...');
      data = await response.json();
      console.log('JSON parsed successfully');
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error(`Failed to parse Claude API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('=== FULL API RESPONSE START ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('=== FULL API RESPONSE END ===');
    
    const updatedHtml = data.content?.[0]?.text || '';
    const usage = data.usage || {};
    const tokenUsage = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    const cacheReads = usage.cache_read_input_tokens || 0;
    const cacheWrites = usage.cache_creation_input_tokens || 0;

    console.log('AI Edit Success:', {
      responseLength: updatedHtml.length,
      totalTokens: tokenUsage,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReads: cacheReads,
      cacheWrites: cacheWrites,
      cacheHitRate: cacheReads > 0 ? `${((cacheReads / (cacheReads + (usage.input_tokens || 0))) * 100).toFixed(1)}%` : '0%'
    });
    
    console.log('=== GENERATED HTML START ===');
    console.log(updatedHtml);
    console.log('=== GENERATED HTML END ===');

    // Clean up the response - remove markdown code blocks if present
    let cleanedHtml = updatedHtml.trim();
    if (cleanedHtml.startsWith('```html')) {
      cleanedHtml = cleanedHtml.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (cleanedHtml.startsWith('```')) {
      cleanedHtml = cleanedHtml.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Generate response based on mode
    let message = "";
    let responseHtml = mode === 'build' ? cleanedHtml : null;
    
    if (mode === 'chat') {
      // In chat mode, AI response is the conversation, no HTML changes
      message = cleanedHtml;
      responseHtml = null;
    } else {
      // In build mode, provide brief confirmation
      const commandLower = command.toLowerCase();
      
      // Check for header/footer requests
      const hasHeaderFooter = commandLower.includes('site header') || 
                              commandLower.includes('site footer') || 
                              commandLower.includes('navigation menu') || 
                              commandLower.includes('nav menu') || 
                              commandLower.includes('main navigation') ||
                              commandLower.includes('global footer') ||
                              (commandLower.includes('footer') && !commandLower.includes('section')) ||
                              (commandLower.includes('header') && !commandLower.includes('hero') && !commandLower.includes('section'));
      
      if (hasHeaderFooter) {
        message = "I've built everything except the header/footer as those are managed separately in your site's global settings.";
      } else if (commandLower.includes('form') || commandLower.includes('contact') || commandLower.includes('quote')) {
        if (commandLower.includes('different') || commandLower.includes('custom') || commandLower.includes('specific')) {
          message = "If you need a custom form beyond the Universal Lead Form, please build it in Dashboard > Settings > Forms first, then let me know which form to place.";
        } else {
          message = "Added the Universal Lead Form button.";
        }
      } else if (commandLower.includes('hero')) {
        message = "Hero section updated.";
      } else if (commandLower.includes('cta') || commandLower.includes('button')) {
        message = "Call-to-action updated.";
      } else if (commandLower.includes('testimonial') || commandLower.includes('review')) {
        message = "Testimonials added.";
      } else if (commandLower.includes('feature') || commandLower.includes('service')) {
        message = "Features section updated.";
      } else {
        message = "Page updated.";
      }
    }

    // Calculate costs (Claude Sonnet 4.5 pricing)
    const inputCost = (usage.input_tokens || 0) * 0.000003; // $3 per 1M tokens
    const outputCost = (usage.output_tokens || 0) * 0.000015; // $15 per 1M tokens
    const cacheWriteCost = (cacheWrites || 0) * 0.00000375; // $3.75 per 1M tokens (25% premium)
    const cacheReadCost = (cacheReads || 0) * 0.0000003; // $0.30 per 1M tokens (90% discount)
    const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;

    return new Response(
      JSON.stringify({
        updatedHtml: responseHtml,
        message: message,
        explanation: message,
        tokenUsage: tokenUsage,
        usage: {
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          totalTokens: tokenUsage,
          cacheReads: cacheReads,
          cacheWrites: cacheWrites,
          maxTokensAllowed: maxTokens,
          costs: {
            input: inputCost,
            output: outputCost,
            cacheWrite: cacheWriteCost,
            cacheRead: cacheReadCost,
            total: totalCost
          }
        },
        debug: {
          fullPrompt: prompt,
          requestPayload,
          responseData: data,
          generatedHtml: updatedHtml
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-edit-page function:', error);
    
    // Provide detailed error information
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});