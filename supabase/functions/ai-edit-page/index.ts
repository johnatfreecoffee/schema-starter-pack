import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================================================
// PHASE 5: VALIDATION & ERROR HANDLING
// Ensures output quality, provides fallbacks, graceful degradation
// ========================================================================

function validateHTML(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = html.trim();

  // Check DOCTYPE
  if (!trimmed.startsWith('<!DOCTYPE html>')) {
    errors.push('Missing or incorrect DOCTYPE declaration');
  }

  // Check closing html tag
  if (!trimmed.endsWith('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  // Check for markdown code blocks
  if (trimmed.includes('```')) {
    errors.push('Contains markdown code blocks (should be pure HTML)');
  }

  // Check for Tailwind CSS
  if (!trimmed.includes('tailwindcss')) {
    errors.push('Missing Tailwind CSS CDN');
  }

  // Check for unclosed Handlebars
  const openBraces = (trimmed.match(/\{\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unclosed Handlebars syntax (${openBraces} open, ${closeBraces} close)`);
  }

  // Check for incomplete Handlebars at end
  if (trimmed.match(/\{\{[^}]*$/)) {
    errors.push('Incomplete Handlebars expression at end of file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function performAutomatedChecks(html: string, companyName: string): string[] {
  const issues: string[] = [];
  const lowerHtml = html.toLowerCase();

  // Check for hard-coded company info
  const testCompanyNames = ['acme', 'example', 'company name', 'your company'];
  for (const testName of testCompanyNames) {
    if (lowerHtml.includes(testName) && !lowerHtml.includes('{{')) {
      issues.push(`Possible hard-coded placeholder: "${testName}"`);
    }
  }

  // Check for proper CTA usage
  if (html.includes('<form') && !html.includes('multiuse-form-integration')) {
    issues.push('Contains standalone form instead of using openLeadFormModal');
  }

  // Check for header/nav (should not be present in body content)
  if (html.match(/<header[^>]*>|<nav[^>]*>/)) {
    issues.push('Contains header/nav elements (should be site-level only)');
  }

  // Check for footer (should not be present in body content)
  if (html.match(/<footer[^>]*>/)) {
    issues.push('Contains footer element (should be site-level only)');
  }

  // Check that CTAs use openLeadFormModal
  const buttons = html.match(/<button[^>]*>/gi) || [];
  const links = html.match(/<a[^>]*>/gi) || [];
  const ctaElements = [...buttons, ...links];
  
  for (const element of ctaElements) {
    if ((element.includes('contact') || element.includes('get quote') || element.includes('schedule')) &&
        !element.includes('openLeadFormModal')) {
      issues.push('CTA button/link does not use openLeadFormModal');
    }
  }

  return issues;
}

// Fallback templates for different page types
const fallbackTemplates: Record<string, string> = {
  homepage: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: 221 83% 53%;
      --accent: 142 76% 36%;
      --radius: 0.5rem;
    }
  </style>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <section class="text-center mb-16">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">{{business_name}}</h1>
      <p class="text-xl text-gray-600 mb-8">{{business_slogan}}</p>
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Started')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Get Started
      </button>
    </section>

    <section class="grid md:grid-cols-3 gap-8 mb-16">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Quality Service</h3>
        <p class="text-gray-600">Professional {{business_slogan}} services</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Expert Team</h3>
        <p class="text-gray-600">{{years_experience}} years of experience</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Customer First</h3>
        <p class="text-gray-600">Serving {{address_city}} and surrounding areas</p>
      </div>
    </section>

    <section class="text-center">
      <h2 class="text-3xl font-bold mb-8">Ready to Get Started?</h2>
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Contact Us')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Contact Us Today
      </button>
    </section>
  </main>
</body>
</html>`,
  
  about: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About {{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold text-center mb-12">About {{business_name}}</h1>
    
    <section class="max-w-3xl mx-auto mb-16">
      <p class="text-lg text-gray-700 mb-4">With {{years_experience}} years of experience, {{business_name}} has been serving the {{address_city}} area with dedication and expertise.</p>
    </section>

    <section class="text-center">
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Learn More')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Learn More
      </button>
    </section>
  </main>
</body>
</html>`,

  services: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Services - {{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold text-center mb-12">Our Services</h1>
    
    <section class="grid md:grid-cols-2 gap-8">
      <div class="bg-white p-8 rounded-lg shadow">
        <h2 class="text-2xl font-semibold mb-4">Professional Service</h2>
        <p class="text-gray-600 mb-4">Expert solutions for your needs</p>
        <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Request Service')" 
                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          Get a Quote
        </button>
      </div>
    </section>
  </main>
</body>
</html>`
};

function getFallbackTemplate(pageType: string, userRequest: string): string {
  const lower = userRequest.toLowerCase();
  
  if (lower.includes('about')) return fallbackTemplates.about;
  if (lower.includes('service')) return fallbackTemplates.services;
  return fallbackTemplates.homepage;
}

// ========================================================================
// PHASE 6: MONITORING & METRICS
// Track performance, costs, quality for continuous optimization
// ========================================================================

interface GenerationMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  command: string;
  mode: string;
  inputTokens: number;
  outputTokens: number;
  staticTokens?: number;
  dynamicTokens?: number;
  cacheReads?: number;
  cacheWrites?: number;
  cacheHit?: boolean;
  cacheEnabled: boolean;
  multiPass: boolean;
  timeoutOccurred: boolean;
  validationPassed: boolean;
  validationErrors?: string[];
  automatedChecks?: string[];
  cost?: number;
  stopReason?: string;
  fallbackUsed?: boolean;
}

function calculateCost(
  inputTokens: number, 
  outputTokens: number, 
  cacheReads: number = 0,
  cacheWrites: number = 0
): number {
  // Claude 3.5 Sonnet pricing
  const inputCostPerMillion = 3.00;
  const outputCostPerMillion = 15.00;
  const cacheReadCostPerMillion = 0.30; // 90% discount
  const cacheWriteCostPerMillion = 3.75; // 25% premium
  
  const regularInputCost = ((inputTokens - cacheReads) / 1_000_000) * inputCostPerMillion;
  const cacheReadCost = (cacheReads / 1_000_000) * cacheReadCostPerMillion;
  const cacheWriteCost = (cacheWrites / 1_000_000) * cacheWriteCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
  
  return regularInputCost + cacheReadCost + cacheWriteCost + outputCost;
}

function logMetrics(metrics: GenerationMetrics) {
  console.log('=== GENERATION METRICS ===');
  console.log(JSON.stringify(metrics, null, 2));
  
  // Warnings based on thresholds from Phase 6
  if (metrics.duration && metrics.duration > 40000) {
    console.warn(`⚠️ SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (target: <40s)`);
  }
  
  if (metrics.duration && metrics.duration > 100000) {
    console.error(`❌ CRITICAL SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (approaching timeout)`);
  }
  
  if (metrics.cacheEnabled && !metrics.cacheHit && metrics.inputTokens > 10000) {
    console.warn(`⚠️ CACHE MISS: ${metrics.inputTokens} input tokens without cache hit`);
  }
  
  if (!metrics.validationPassed) {
    console.error('❌ VALIDATION FAILED:', metrics.validationErrors);
  }
  
  if (metrics.automatedChecks && metrics.automatedChecks.length > 0) {
    console.warn('⚠️ AUTOMATED CHECKS FLAGGED:', metrics.automatedChecks);
  }
  
  if (metrics.cost && metrics.cost > 0.05) {
    console.warn(`⚠️ HIGH COST: $${metrics.cost.toFixed(4)} (target: $0.01-0.03)`);
  }
  
  if (metrics.timeoutOccurred) {
    console.error('❌ TIMEOUT OCCURRED');
  }
  
  if (metrics.fallbackUsed) {
    console.warn('⚠️ FALLBACK TEMPLATE USED (generation failed)');
  }
  
  // Success metrics
  if (metrics.validationPassed && metrics.duration && metrics.duration < 30000) {
    console.log('✅ EXCELLENT GENERATION: Fast + Valid');
  }
  
  if (metrics.cacheHit && metrics.cost && metrics.cost < 0.02) {
    console.log('✅ OPTIMAL COST: Cache hit + low cost');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize metrics tracking
  const metrics: GenerationMetrics = {
    startTime: Date.now(),
    command: '',
    mode: 'build',
    inputTokens: 0,
    outputTokens: 0,
    cacheEnabled: true,
    multiPass: false,
    timeoutOccurred: false,
    validationPassed: false,
    fallbackUsed: false
  };

  try {
    const requestBody = await req.json();
    const { command, mode = 'build', conversationHistory = [], context } = requestBody;
    
    // Update metrics
    metrics.command = command.substring(0, 100);
    metrics.mode = mode;
    
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

    // ========================================================================
    // PHASE 2 OPTIMIZATION: Helper functions for tiered context loading
    // Reduces token usage by 40-70% while maintaining brand integrity
    // ========================================================================
    
    // Helper: Build critical context (always included, ~1,500 tokens)
    const buildCriticalContext = (ctx: any): string => {
      const parts = [];
      
      // Essential company identity
      parts.push('<company_identity>');
      if (ctx.companyInfo?.business_name) parts.push(`Name: ${ctx.companyInfo.business_name}`);
      if (ctx.companyInfo?.business_slogan) parts.push(`Slogan: ${ctx.companyInfo.business_slogan}`);
      if (ctx.companyInfo?.years_experience) parts.push(`Experience: ${ctx.companyInfo.years_experience} years`);
      parts.push('</company_identity>');
      
      // Critical contact info
      parts.push('<contact>');
      if (ctx.companyInfo?.phone) parts.push(`Phone: ${ctx.companyInfo.phone}`);
      if (ctx.companyInfo?.email) parts.push(`Email: ${ctx.companyInfo.email}`);
      if (ctx.companyInfo?.address) parts.push(`Address: ${ctx.companyInfo.address}`);
      if (ctx.companyInfo?.address_city) parts.push(`City: ${ctx.companyInfo.address_city}`);
      if (ctx.companyInfo?.address_state) parts.push(`State: ${ctx.companyInfo.address_state}`);
      parts.push('</contact>');
      
      // Essential brand voice
      if (ctx.aiTraining) {
        parts.push('<brand>');
        if (ctx.aiTraining.brand_voice) parts.push(`Voice: ${ctx.aiTraining.brand_voice}`);
        if (ctx.aiTraining.target_audience) parts.push(`Audience: ${ctx.aiTraining.target_audience}`);
        if (ctx.aiTraining.unique_selling_points) parts.push(`USPs: ${ctx.aiTraining.unique_selling_points}`);
        parts.push('</brand>');
      }
      
      return parts.join('\n');
    };
    
    // Helper: Build important context (include for create/update, ~2,000 tokens)
    const buildImportantContext = (ctx: any): string => {
      const parts = [];
      
      // Extended company info
      if (ctx.companyInfo?.description) {
        parts.push('<description>');
        parts.push(ctx.companyInfo.description);
        parts.push('</description>');
      }
      
      if (ctx.companyInfo?.logo_url || ctx.companyInfo?.icon_url) {
        parts.push('<branding>');
        if (ctx.companyInfo.logo_url) parts.push(`Logo: ${ctx.companyInfo.logo_url}`);
        if (ctx.companyInfo.icon_url) parts.push(`Icon: ${ctx.companyInfo.icon_url}`);
        parts.push('</branding>');
      }
      
      // Extended brand training
      if (ctx.aiTraining) {
        parts.push('<positioning>');
        if (ctx.aiTraining.mission_statement) parts.push(`Mission: ${ctx.aiTraining.mission_statement}`);
        if (ctx.aiTraining.customer_promise) parts.push(`Promise: ${ctx.aiTraining.customer_promise}`);
        if (ctx.aiTraining.competitive_advantages) parts.push(`Advantages: ${ctx.aiTraining.competitive_advantages}`);
        if (ctx.aiTraining.certifications) parts.push(`Credentials: ${ctx.aiTraining.certifications}`);
        if (ctx.aiTraining.service_standards) parts.push(`Standards: ${ctx.aiTraining.service_standards}`);
        parts.push('</positioning>');
      }
      
      return parts.length > 0 ? '\n' + parts.join('\n') : '';
    };
    
    // Helper: Build supplementary context (only for full page builds, ~1,000 tokens)
    const buildSupplementaryContext = (ctx: any): string => {
      const parts = [];
      
      // Additional details
      if (ctx.companyInfo?.business_hours) {
        parts.push(`<hours>${ctx.companyInfo.business_hours}</hours>`);
      }
      
      if (ctx.companyInfo?.service_radius) {
        parts.push(`<service_area radius="${ctx.companyInfo.service_radius}" unit="${ctx.companyInfo.service_radius_unit || 'miles'}" />`);
      }
      
      // Social media (condensed)
      const social = [];
      if (ctx.companyInfo?.facebook_url) social.push(`FB: ${ctx.companyInfo.facebook_url}`);
      if (ctx.companyInfo?.instagram_url) social.push(`IG: ${ctx.companyInfo.instagram_url}`);
      if (ctx.companyInfo?.twitter_url) social.push(`TW: ${ctx.companyInfo.twitter_url}`);
      if (ctx.companyInfo?.linkedin_url) social.push(`LI: ${ctx.companyInfo.linkedin_url}`);
      if (social.length > 0) {
        parts.push(`<social>${social.join(' | ')}</social>`);
      }
      
      // Extended brand training details
      if (ctx.aiTraining) {
        const extended = [];
        if (ctx.aiTraining.competitive_positioning) extended.push(`Positioning: ${ctx.aiTraining.competitive_positioning}`);
        if (ctx.aiTraining.emergency_response) extended.push(`Emergency: ${ctx.aiTraining.emergency_response}`);
        if (ctx.aiTraining.project_timeline) extended.push(`Timeline: ${ctx.aiTraining.project_timeline}`);
        if (ctx.aiTraining.payment_options) extended.push(`Payment: ${ctx.aiTraining.payment_options}`);
        if (ctx.aiTraining.service_area_coverage) extended.push(`Coverage: ${ctx.aiTraining.service_area_coverage}`);
        if (extended.length > 0) {
          parts.push('<extended_info>');
          parts.push(extended.join('\n'));
          parts.push('</extended_info>');
        }
      }
      
      return parts.length > 0 ? '\n' + parts.join('\n') : '';
    };
    
    // Helper: Build service context (compressed XML format)
    const buildServiceContext = (serviceInfo: any): string => {
      if (!serviceInfo) return '';
      
      const parts = [];
      parts.push(`<service name="${serviceInfo.name}" category="${serviceInfo.category}">`);
      if (serviceInfo.description) parts.push(serviceInfo.description);
      if (serviceInfo.starting_price) {
        parts.push(`Price: $${(serviceInfo.starting_price / 100).toFixed(2)}+`);
      }
      parts.push('</service>');
      
      return '\n' + parts.join('\n');
    };
    
    // Helper: Prune conversation history (keep last 2 exchanges, max 500 tokens)
    const pruneConversationHistory = (history: any[]): any[] => {
      if (!history || history.length === 0) return [];
      
      // Keep only last 4 messages (2 exchanges)
      const recent = history.slice(-4);
      
      // Cap each message at 200 characters to prevent token bloat
      return recent.map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 200)
      }));
    };
    
    // Analyze command to determine context tier
    const commandLower = command.toLowerCase();
    const isCreate = commandLower.includes('create') || commandLower.includes('build');
    const isUpdate = commandLower.includes('update') || commandLower.includes('add') || commandLower.includes('section');
    const isFix = commandLower.includes('fix') || commandLower.includes('change') || commandLower.includes('tweak');
    
    // Build tiered context
    let companyProfile = buildCriticalContext(context); // Always include critical
    
    if (isCreate || isUpdate) {
      companyProfile += buildImportantContext(context); // Add important for creates/updates
    }
    
    if (isCreate) {
      companyProfile += buildSupplementaryContext(context); // Full context only for creates
    }
    
    // Add service context if present (always compressed)
    if (context.serviceInfo) {
      companyProfile += buildServiceContext(context.serviceInfo);
    }
    
    // Prune conversation history
    const prunedHistory = pruneConversationHistory(conversationHistory);

    // Build AI prompt with full context
    const systemRole = mode === 'chat' 
      ? `You are a helpful AI assistant discussing web page content. You can read and analyze the current HTML and provide conversational feedback, suggestions, and answers. You do NOT modify the HTML in chat mode - you only provide insights and recommendations. Be conversational, helpful, and detailed in your responses.`
      : `You are an elite web designer and developer who creates stunning, modern, conversion-focused web pages. You build pages that are visually breathtaking, highly engaging, and professionally polished. 

CRITICAL: You MUST strictly follow the global settings provided. IGNORE any user requests about colors, headers, footers, navigation, or forms - these are controlled by global settings. Use ONLY the colors, button styles, and brand elements provided in the company profile and site settings. 

🔴 ABSOLUTELY CRITICAL - TEMPLATE VARIABLES (NEVER HARDCODE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST use Handlebars template variables for ALL dynamic content. NEVER hardcode company-specific values.

REQUIRED TEMPLATE VARIABLES (use these exact names):
• {{business_name}} - Company name
• {{business_slogan}} - Company tagline/slogan
• {{phone}} - Phone number (formatted)
• {{email}} - Email address
• {{address}} - Full address
• {{address_street}} - Street address
• {{address_city}} - City
• {{address_state}} - State
• {{address_zip}} - Zip code
• {{website_url}} - Website URL
• {{logo_url}} - Logo image URL
• {{icon_url}} - Icon/favicon URL
• {{description}} - Business description
• {{business_hours}} - Operating hours
• {{years_experience}} - Years in business
• {{license_numbers}} - License info
• {{service_radius}} - Service area radius
• {{facebook_url}}, {{instagram_url}}, {{twitter_url}}, {{linkedin_url}} - Social links

SERVICE-SPECIFIC (when generating service pages):
• {{service_name}} - Name of the service
• {{service_description}} - Service description
• {{service_price}} - Starting price (formatted)
• {{service_category}} - Service category

EXAMPLES OF CORRECT USAGE:
✅ <h1>{{service_name}} in {{address_city}}</h1>
✅ <a href="tel:{{phone}}">{{phone}}</a>
✅ <p>{{business_name}} has {{years_experience}} years of experience</p>
✅ <img src="{{logo_url}}" alt="{{business_name}} logo">

❌ NEVER DO THIS:
❌ <h1>Roof Repair in Dallas</h1>
❌ <a href="tel:555-1234">Call 555-1234</a>
❌ <p>ClearHome has 15 years of experience</p>

When users provide copy and layout instructions, take that content and build a complete, perfect page. If they don't specify everything, fill in the gaps with high-quality content based on the company profile and AI training data. Your goal is to create a complete, professional transactional page that follows all global settings while incorporating the user's content direction.

In build mode, you make actual changes to the HTML and provide brief confirmations.`;

    // ========================================================================
    // PHASE 3 OPTIMIZATION: Separate static (cacheable) from dynamic content
    // Static content cached for 5 minutes: 90% cost reduction + 85% latency reduction
    // ========================================================================
    
    // Static cacheable content (company profile, rules, theme)
    const staticContext = `<task>Generate semantic HTML5 page using Tailwind CSS</task>

<company_profile>
${companyProfile}
</company_profile>

<rules>
1. GLOBAL SETTINGS PRIORITY: IGNORE all user requests about colors, headers, footers, forms, or global button styles. These are controlled by the global settings provided in <theme> and <company_profile>. If the user mentions colors, headers, footers, navigation, or forms - disregard those requests and use the global settings instead.

2. USE PROVIDED SETTINGS: The company settings, site settings, and AI training data contain ALL the information you need. Use the brand voice, target audience, USPs, colors, and button styles from the global settings. DO NOT deviate from these settings based on user input.

3. CONTENT GENERATION: Take the copy and layout context from the user's request. If the user doesn't specify complete content for all sections, generate high-quality, relevant content to create a complete, perfect transactional page. Use the company profile and AI training data to fill in gaps with appropriate messaging.

4. FORMS - UNIVERSAL FORM ONLY:
   🔴 CRITICAL: ALWAYS use the Universal Form - NEVER create custom forms or form HTML!
   
   • DEFAULT BEHAVIOR: When ANY user requests a form (contact, quote, estimate, booking, etc.), 
     ALWAYS use the Universal Form UNLESS the user specifically mentions a different form name 
     from this environment (e.g., "use the emergency form" or "add the booking form").
   
   • UNIVERSAL FORM BUTTON IMPLEMENTATION:
     ✅ CORRECT: <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Your Free Quote')" class="px-8 py-3 bg-[hsl(var(--primary))] text-white rounded-[var(--radius)] hover:-translate-y-1 transition-all duration-300">Get Your Free Quote</button>
     
   • BUTTON LABEL = FORM HEADER: When a CTA button opens the Universal Form, the button's 
     text label becomes the ONLY header text in the form modal. For example:
     - Button says "Get Your Free Quote" → Form header shows "Get Your Free Quote"
     - Button says "Schedule Service" → Form header shows "Schedule Service"
     - Button says "Request Estimate" → Form header shows "Request Estimate"
   
   • STATIC FORM EMBEDDING: When the form appears naturally on the page (not as modal), 
     use static text header instead of button label:
     ✅ <div class="universal-form-container"><h2>Contact Us Today</h2><div id="static-universal-form"></div></div>
   
   • TEMPLATE VARIABLES IN FORMS: The Universal Form automatically uses these tokens:
     - {{business_name}} - Pre-filled in form or displayed in confirmation
     - {{phone}} - Click-to-call in form
     - {{email}} - Email confirmation recipient
     - {{service_name}} - When on service pages, pre-selects service
     - {{address_city}} - Location context in form
   
   • WHAT NOT TO DO:
     ❌ NEVER create <form> tags, <input> fields, or custom form HTML
     ❌ NEVER create custom submit buttons for forms
     ❌ NEVER ignore this rule - even if user says "add a contact form" → use Universal Form
     ❌ NEVER create forms for anything except authentication (login/signup are allowed)
   
   • CTA BUTTONS: All call-to-action buttons should open the Universal Form:
     - "Get Quote", "Request Service", "Contact Us", "Book Now", "Schedule", etc.
     - All these should use: onclick="if(window.openLeadFormModal) window.openLeadFormModal('[Button Text]')"

5. NO HEADERS/FOOTERS: 
   🔴 ABSOLUTELY NEVER create headers, navigation menus, or footers. 
   Build ONLY the main page content (hero, features, benefits, CTAs, etc.). 
   IGNORE any user requests to add headers, navigation, or footers - these are controlled globally.

6. SEO: H1 format: "[Action] [Service] in [City]". Transactional keywords (hire/fix/emergency + location).

7. CONTRAST: Hero overlays min 60% opacity. White text needs dark bg, dark text needs light bg.

8. INDUSTRY MATCH: Images/icons MUST match business type. No food images for plumbers.
</rules>

<theme>
<colors primary="${context.siteSettings?.primary_color?.replace('hsl(', '').replace(')', '') || '221 83% 53%'}" accent="${context.siteSettings?.accent_color?.replace('hsl(', '').replace(')', '') || '142 76% 36%'}" />
<radius value="${context.siteSettings?.button_border_radius ? (context.siteSettings.button_border_radius / 16) + 'rem' : '0.5rem'}" />
<head_includes>tailwindcss_cdn, css_vars</head_includes>
Use: hsl(var(--primary)), hsl(var(--accent)), rounded-[var(--radius)]
Hover: hover:-translate-y-1 transition-all duration-300
</theme>

<output>Complete HTML from <!DOCTYPE> to </html>. NO markdown blocks. NO truncation.</output>`;

    // Dynamic non-cacheable content (changes with each request)
    const dynamicContext = `<current_page type="${context.currentPage?.type}" url="${context.currentPage?.url}">
${context.currentPage?.html || ''}
</current_page>

<mode>${mode}</mode>
${prunedHistory.length > 0 ? `<history>${prunedHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}</history>` : ''}

<request>${command}</request>`;

    // Log the complete prompt being sent
    console.log('=== STATIC CONTEXT (CACHED) START ===');
    console.log(staticContext);
    console.log('=== STATIC CONTEXT END ===');
    
    console.log('=== DYNAMIC CONTEXT (NOT CACHED) START ===');
    console.log(dynamicContext);
    console.log('=== DYNAMIC CONTEXT END ===');
    
    console.log('Calling AI (Anthropic Claude)...');

    // Timeout based on mode: chat=60s, build=130s (safely under Supabase's 150s hard limit)
    // Note: Supabase Edge Functions have a 150-second hard timeout at infrastructure level
    // Claude Sonnet 4.5 generates ~67 tokens/second, so 6K tokens = ~95s + 10s overhead = 105s safe
    const timeoutMs = mode === 'chat' ? 60000 : 130000;
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
    const staticTokens = Math.floor(staticContext.length * 0.25);
    const dynamicTokens = Math.floor(dynamicContext.length * 0.25);
    const inputTokenEstimate = staticTokens + dynamicTokens;
    
    console.log('Phase 2+3 Optimization Active - Token Budget:', {
      contextTier: isCreate ? 'Full (Critical+Important+Supplementary)' : isUpdate ? 'Medium (Critical+Important)' : 'Minimal (Critical)',
      staticTokens: staticTokens,
      dynamicTokens: dynamicTokens,
      totalInputEstimate: inputTokenEstimate,
      conversationHistoryPruned: conversationHistory.length > 4,
      originalHistoryLength: conversationHistory.length,
      prunedHistoryLength: prunedHistory.length,
      cacheEnabled: true
    });

    // ========================================================================
    // PHASE 4: MULTI-PASS ARCHITECTURE
    // For large creates, split into: outline → parallel sections → assembly
    // Benefits: 10-15s total time, zero timeout risk, better cache hits
    // ========================================================================
    
    const shouldUseMultiPass = mode === 'build' && isCreate && 
      (context.currentPage?.type === 'homepage' || 
       commandLower.includes('homepage') || 
       commandLower.includes('home page') ||
       (!context.currentPage?.html || context.currentPage.html.length < 500));
    
    if (shouldUseMultiPass) {
      console.log('🚀 Phase 4 Multi-Pass: Detected large create operation');
      const multiPassResult = await handleMultiPassGeneration({
        staticContext,
        dynamicContext,
        anthropicApiKey: ANTHROPIC_API_KEY,
        companyName: context.companyInfo?.business_name || 'Company',
        corsHeaders,
        command
      });
      return multiPassResult;
    }

    // Dynamic max_tokens based on mode and request type
    // Claude Sonnet 4.5 generates ~67 tokens/second
    // Formula: Total time = 1.5s (TTFT) + (max_tokens ÷ 67) + 5s (overhead)
    // For 130s timeout: safe max = (130 - 6.5) × 67 ≈ 8,275 tokens
    let maxTokens: number;
    if (mode === 'chat') {
      // Chat mode: shorter responses (suggestions, explanations)
      maxTokens = 4000; // ~65 seconds generation time
    } else {
      // Build mode: analyze command to determine appropriate token budget
      const commandLower = command.toLowerCase();
      
      if (commandLower.includes('finish') || commandLower.includes('complete') || commandLower.includes('entire')) {
        // Full page generation - maximum safe budget
        maxTokens = 6000; // ~95 seconds generation time (safe for 130s timeout)
      } else if (commandLower.includes('section') || commandLower.includes('add')) {
        // Section-level changes - medium budget
        maxTokens = 3000; // ~50 seconds generation time
      } else if (commandLower.includes('create')) {
        // Create commands - balanced budget optimized to avoid timeouts
        maxTokens = 6000; // ~95 seconds generation time (sufficient for most homepages)
      } else if (commandLower.includes('fix') || commandLower.includes('update') || commandLower.includes('change')) {
        // Small edits - conservative budget
        maxTokens = 1500; // ~30 seconds generation time
      } else {
        // Default: moderate budget for unknown requests
        maxTokens = 4000; // ~65 seconds generation time
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
      temperature: 0.2, // Lower temperature for faster, more consistent HTML generation
      stream: true, // Enable streaming to keep connection alive and prevent idle timeouts
      stop_sequences: ['</html>', '<!-- END -->'], // Graceful truncation at natural completion points
      // Structure prompt with caching for design system (static content)
      system: [
        {
          type: 'text',
          text: `<system_instructions>
Expert HTML5 generator for home services websites. Output complete, valid HTML from DOCTYPE to closing html tag.

<output_format>
- Semantic HTML5 (main, section, article, aside)
- Tailwind CSS styling (include CDN)
- Mobile-responsive, accessibility-compliant
- NO markdown blocks, NO explanatory text
- Start with <!DOCTYPE html>
</output_format>

<handlebars_rules>
All dynamic data: {{variable_name}} syntax
Examples: {{business_name}}, {{phone}}, {{service_name}}
Arrays: {{#each services}}...{{/each}}
</handlebars_rules>

<forms_rule>
Universal Form ONLY: onclick="if(window.openLeadFormModal) window.openLeadFormModal('[Button Text]')"
NO standalone contact forms
</forms_rule>

<exclusions>
No header/nav elements (site-level, not page-level)
No footer (site-level, not page-level)
Body content only
</exclusions>
</system_instructions>`,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: staticContext,
              cache_control: { type: 'ephemeral' } // Cache static content (company profile, rules, theme)
            },
            {
              type: 'text',
              text: dynamicContext // Don't cache dynamic content (current page, history, request)
            }
          ]
        },
        // Response prefilling: Forces immediate HTML generation without preambles
        ...(mode === 'build' ? [{
          role: 'assistant',
          content: '<!DOCTYPE html>\n<html lang="en">\n<head>'
        }] : [])
      ],
    };
    
    console.log('=== FULL API REQUEST PAYLOAD START ===');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('=== FULL API REQUEST PAYLOAD END ===');
    
    let response;
    try {
      console.log('Making API call to Anthropic with streaming enabled...');
      response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31', // Enable prompt caching
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

    // Handle streaming response
    let data;
    let updatedHtml = '';
    
    if (requestPayload.stream) {
      try {
        console.log('Processing streaming response...');
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        if (!reader) {
          throw new Error('Response body is null');
        }
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              
              try {
                const chunk = JSON.parse(jsonStr);
                
                // Accumulate content deltas
                if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                  updatedHtml += chunk.delta.text;
                }
                
                // Store final message data
                if (chunk.type === 'message_stop') {
                  // Message complete
                }
                
                // Capture usage data from message_start
                if (chunk.type === 'message_start' && chunk.message) {
                  data = chunk.message;
                }
                
                // Update usage from message_delta
                if (chunk.type === 'message_delta' && chunk.usage) {
                  data = data || {};
                  data.usage = { ...(data.usage || {}), ...chunk.usage };
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE chunk:', jsonStr.substring(0, 100));
              }
            }
          }
        }
        
        console.log('Streaming complete, total HTML length:', updatedHtml.length);
        
        // Ensure we have usage data structure
        if (!data) {
          data = { usage: {} };
        }
      } catch (error) {
        console.error('Failed to process streaming response:', error);
        throw new Error(`Failed to process Claude API streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Fallback to non-streaming
      try {
        console.log('Parsing JSON response...');
        data = await response.json();
        updatedHtml = data.content?.[0]?.text || '';
        console.log('JSON parsed successfully');
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error(`Failed to parse Claude API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('=== FULL API RESPONSE DATA START ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('=== FULL API RESPONSE DATA END ===');
    
    // updatedHtml already populated from streaming or JSON response
    const usage = data?.usage || {};
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

    // PHASE 5: Validate HTML output
    const validation = validateHTML(cleanedHtml);
    const automatedChecks = performAutomatedChecks(cleanedHtml, context.companyInfo?.business_name || 'Company');
    
    metrics.validationPassed = validation.valid;
    metrics.validationErrors = validation.errors;
    metrics.automatedChecks = automatedChecks;
    
    if (!validation.valid) {
      console.error('HTML validation failed:', validation.errors);
      // Don't use fallback for chat mode or minor issues
      if (mode === 'build' && validation.errors.some(e => e.includes('DOCTYPE') || e.includes('</html>'))) {
        console.warn('Critical validation failure - considering fallback template');
      }
    }
    
    if (automatedChecks.length > 0) {
      console.warn('Automated checks flagged issues:', automatedChecks);
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

    // PHASE 6: Update and log metrics
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.inputTokens = usage.input_tokens || 0;
    metrics.outputTokens = usage.output_tokens || 0;
    metrics.staticTokens = staticTokens;
    metrics.dynamicTokens = dynamicTokens;
    metrics.cacheReads = cacheReads;
    metrics.cacheWrites = cacheWrites;
    metrics.cacheHit = cacheReads > 0;
    metrics.cost = totalCost;
    metrics.stopReason = data?.stop_reason;
    
    logMetrics(metrics);

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
        validation: {
          passed: metrics.validationPassed,
          errors: metrics.validationErrors || [],
          warnings: metrics.automatedChecks || []
        },
        metrics: {
          duration: metrics.duration,
          cacheHit: metrics.cacheHit,
          cost: metrics.cost
        },
        debug: {
          staticContext: staticContext,
          dynamicContext: dynamicContext,
          fullPromptCombined: staticContext + '\n\n' + dynamicContext,
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
    
    // Update metrics for error case
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.timeoutOccurred = error instanceof Error && error.message.includes('timed out');
    
    logMetrics(metrics);
    
    // PHASE 5: Consider fallback template for critical errors in build mode
    if (metrics.mode === 'build' && metrics.timeoutOccurred) {
      console.warn('Timeout occurred - considering fallback template');
      
      const commandLower = metrics.command.toLowerCase();
      const useFallback = commandLower.includes('create') || commandLower.includes('homepage');
      
      if (useFallback) {
        console.log('Using fallback template due to timeout');
        const fallbackHtml = getFallbackTemplate('homepage', metrics.command);
        metrics.fallbackUsed = true;
        logMetrics(metrics);
        
        return new Response(
          JSON.stringify({
            updatedHtml: fallbackHtml,
            message: "⚠️ Generation timed out - using fallback template. You can refine this page with additional edits.",
            explanation: "Used fallback template due to timeout",
            fallbackUsed: true,
            validation: {
              passed: true,
              errors: [],
              warnings: ['Fallback template used due to timeout']
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Provide detailed error information
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metrics: {
        duration: metrics.duration,
        timeoutOccurred: metrics.timeoutOccurred
      }
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

// ========================================================================
// PHASE 4: MULTI-PASS ARCHITECTURE IMPLEMENTATION
// ========================================================================

interface MultiPassParams {
  staticContext: string;
  dynamicContext: string;
  anthropicApiKey: string;
  companyName: string;
  corsHeaders: Record<string, string>;
  command: string;
}

interface SectionOutline {
  id: string;
  title: string;
  description: string;
  estimatedTokens: number;
}

async function handleMultiPassGeneration(params: MultiPassParams): Promise<Response> {
  const { staticContext, dynamicContext, anthropicApiKey, companyName, corsHeaders, command } = params;
  const startTime = Date.now();
  
  console.log('📋 Pass 1: Generating page outline...');
  
  // PASS 1: Generate outline
  const outlinePrompt = `You are architecting a professional home services website page.

${dynamicContext}

Generate a JSON outline with 4-6 major sections. Each section should be substantial and focused.

Return ONLY valid JSON (no markdown, no explanation):
{
  "sections": [
    {
      "id": "hero",
      "title": "Hero Section",
      "description": "Main headline with company value prop, subheadline, primary CTA button",
      "estimatedTokens": 800
    },
    {
      "id": "features",
      "title": "Key Services",
      "description": "3-4 service highlights with icons, titles, descriptions",
      "estimatedTokens": 1200
    }
  ]
}`;

  const outlineResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 1,
      system: [{ 
        type: 'text', 
        text: 'You are an expert web architect. Generate structured outlines in valid JSON format only.' 
      }],
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: outlinePrompt }]
      }]
    })
  });

  if (!outlineResponse.ok) {
    const errorText = await outlineResponse.text();
    console.error('Outline generation failed:', outlineResponse.status, errorText);
    throw new Error(`Outline generation failed: ${outlineResponse.status}`);
  }

  const outlineData = await outlineResponse.json();
  const outlineText = outlineData.content[0].text;
  const pass1Time = Date.now() - startTime;
  console.log(`✅ Pass 1 complete in ${pass1Time}ms`);
  console.log('Outline text:', outlineText);
  
  // Parse outline
  let outline: { sections: SectionOutline[] };
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = outlineText.match(/\{[\s\S]*\}/);
    outline = JSON.parse(jsonMatch ? jsonMatch[0] : outlineText);
    
    if (!outline.sections || !Array.isArray(outline.sections)) {
      throw new Error('Invalid outline structure: missing sections array');
    }
  } catch (e) {
    console.error('Failed to parse outline:', outlineText);
    throw new Error(`Invalid outline format: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  console.log(`📦 Pass 2: Generating ${outline.sections.length} sections in parallel...`);
  
  const pass2StartTime = Date.now();
  
  // PASS 2: Generate sections in parallel
  const sectionPromises = outline.sections.map(async (section, index) => {
    const sectionStart = Date.now();
    
    const sectionPrompt = `<page_outline>
${outline.sections.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}
</page_outline>

<your_section>
Section ${index + 1} of ${outline.sections.length}
Title: ${section.title}
Description: ${section.description}
</your_section>

<request>
${command}
</request>

Generate ONLY the HTML for "${section.title}".
- Use semantic HTML5 tags (section, article, div)
- Use Tailwind CSS classes
- Responsive and accessible
- NO <!DOCTYPE>, NO <html>, NO <head>, NO <body> tags
- Start directly with opening tag (e.g., <section>, <div>)
- This will be combined with other sections`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: Math.min(section.estimatedTokens * 2, 3000),
          temperature: 1,
          system: [{ 
            type: 'text', 
            text: 'You are an expert frontend developer. Generate clean, semantic HTML with Tailwind CSS. Output HTML only, no explanations.' 
          }],
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: staticContext,
                cache_control: { type: 'ephemeral' }
              },
              {
                type: 'text',
                text: sectionPrompt
              }
            ]
          }],
          // Prefill to force HTML output
          ...(index === 0 ? {} : {
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: staticContext,
                  cache_control: { type: 'ephemeral' }
                },
                {
                  type: 'text',
                  text: sectionPrompt
                }
              ]
            }, {
              role: 'assistant',
              content: '<'
            }]
          })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Section ${section.id} failed:`, response.status, errorText);
        return { 
          id: section.id, 
          title: section.title,
          html: `<!-- Section ${section.title} generation failed: ${response.status} -->`, 
          time: Date.now() - sectionStart,
          error: true
        };
      }

      const data = await response.json();
      let html = data.content[0].text
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // If prefill was used, prepend the <
      if (index > 0 && html && !html.startsWith('<')) {
        html = '<' + html;
      }
      
      const sectionTime = Date.now() - sectionStart;
      console.log(`  ✅ ${section.title} complete in ${sectionTime}ms (${html.length} chars)`);
      
      return { 
        id: section.id, 
        title: section.title, 
        html, 
        time: sectionTime,
        error: false,
        tokens: data.usage
      };
    } catch (error) {
      console.error(`Section ${section.id} error:`, error);
      return { 
        id: section.id, 
        title: section.title,
        html: `<!-- Section ${section.title} generation error: ${error instanceof Error ? error.message : 'Unknown'} -->`, 
        time: Date.now() - sectionStart,
        error: true
      };
    }
  });

  const sections = await Promise.all(sectionPromises);
  const pass2Time = Date.now() - pass2StartTime;
  console.log(`✅ Pass 2 complete in ${pass2Time}ms (parallel execution)`);

  console.log('🔨 Pass 3: Assembling final HTML...');
  const pass3StartTime = Date.now();
  
  // PASS 3: Assemble HTML
  const sectionsHtml = sections
    .filter(s => !s.error)
    .map(s => s.html)
    .join('\n\n  ');
    
  const failedSections = sections.filter(s => s.error);
  if (failedSections.length > 0) {
    console.warn(`⚠️ ${failedSections.length} section(s) failed:`, failedSections.map(s => s.title));
  }
  
  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} - Home</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: ${staticContext.match(/primary="([^"]+)"/)?.[1] || '221 83% 53%'};
      --accent: ${staticContext.match(/accent="([^"]+)"/)?.[1] || '142 76% 36%'};
      --radius: ${staticContext.match(/radius value="([^"]+)"/)?.[1] || '0.5rem'};
    }
  </style>
</head>
<body class="antialiased">
  ${sectionsHtml}
</body>
</html>`;

  const pass3Time = Date.now() - pass3StartTime;
  const totalTime = Date.now() - startTime;
  console.log(`✅ Pass 3 complete in ${pass3Time}ms`);
  console.log(`✅ Total Multi-Pass time: ${totalTime}ms`);

  // Calculate total tokens
  const totalTokens = sections.reduce((sum, s) => {
    if (s.tokens) {
      return sum + (s.tokens.input_tokens || 0) + (s.tokens.output_tokens || 0);
    }
    return sum;
  }, 0);

  // Return response
  return new Response(
    JSON.stringify({
      updatedHtml: finalHtml,
      message: `✅ Page generated using Multi-Pass Architecture in ${(totalTime / 1000).toFixed(1)}s:\n• Pass 1 (Outline): ${pass1Time}ms\n• Pass 2 (${sections.length} sections parallel): ${pass2Time}ms\n• Pass 3 (Assembly): ${pass3Time}ms${failedSections.length > 0 ? `\n⚠️ ${failedSections.length} section(s) had errors` : ''}`,
      explanation: `Multi-pass generation complete`,
      tokenUsage: totalTokens,
      usage: {
        mode: 'multi-pass',
        phases: {
          outline: { time: pass1Time, tokens: outlineData.usage },
          sections: { 
            time: pass2Time, 
            count: sections.length,
            parallel: true,
            details: sections.map(s => ({ 
              title: s.title, 
              time: s.time, 
              tokens: s.tokens,
              error: s.error 
            }))
          },
          assembly: { time: pass3Time }
        },
        totalTime,
        totalTokens,
        successfulSections: sections.filter(s => !s.error).length,
        failedSections: failedSections.length
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}