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
    const { command, mode = 'build', conversationHistory = [], context, model = 'claude' } = requestBody;
    
    console.log('AI Edit Request:', { 
      command: command.substring(0, 200) + (command.length > 200 ? '...' : ''), 
      mode, 
      model, 
      contextKeys: Object.keys(context),
      promptLength: command.length,
      htmlLength: context?.currentPage?.html?.length || 0
    });

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    
    if (model === 'claude' && !ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    if (model === 'grok' && !XAI_API_KEY) {
      throw new Error('XAI_API_KEY is not configured');
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
      : `You are an elite web designer and developer who creates stunning, modern, conversion-focused web pages. You build pages that are visually breathtaking, highly engaging, and professionally polished. In build mode, you make actual changes to the HTML and provide brief confirmations.`;

    const prompt = systemRole + `

${companyProfile}

CURRENT PAGE:
Type: ${context.currentPage?.type || 'unknown'}
URL: ${context.currentPage?.url || 'N/A'}
Current HTML:
${context.currentPage?.html || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CRITICAL FORM INSTRUCTIONS - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**UNIVERSAL FORM USAGE**:
When the user indicates they want to add a form, contact form, lead form, quote form, or any similar form to capture customer information, you MUST use the Universal Lead Form component.

**HOW TO IMPLEMENT THE UNIVERSAL FORM**:
1. Add a button that triggers the form modal
2. Use this exact button pattern:
   <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Request a Quote')" class="[button classes here]">
     Request a Quote
   </button>
3. The text inside openLeadFormModal('...') becomes the form header
4. The button text can be anything: "Get a Quote", "Contact Us", "Schedule Service", etc.
5. The form header will automatically match the button's purpose

**FORBIDDEN FORMS**:
- DO NOT create custom contact forms with individual input fields
- DO NOT create custom lead capture forms
- DO NOT create custom quote request forms
- The ONLY exception is if the user specifically asks for a sign-up/login form for authentication

**WHEN USER WANTS A DIFFERENT FORM**:
If the user requests a specialized form (not a standard contact/lead form), you MUST respond with:
"I understand you need a [specific form type]. To create custom forms beyond our Universal Lead Form, please build the form in the Forms management section (Dashboard > Settings > Forms) first, then tell me which form to place and where."

**DO NOT**:
- Create forms from scratch unless explicitly requested AND it's a sign-up/login form
- Assume you can build any form type directly in the page
- Use third-party form services without explicit instruction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 CRITICAL HEADER & FOOTER POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**DO NOT CREATE SITE HEADERS OR FOOTERS**:
If the user's request includes building a header, navigation menu, footer, or site-wide layout:
1. Build everything ELSE they requested
2. Skip the header/footer entirely
3. In your response, explicitly state: "I've built everything except the header/footer as those are managed separately in your site's global settings."

**WHAT TO SKIP**:
- Site navigation headers
- Main navigation menus
- Global footers with company info/links
- Fixed top/bottom navigation bars that persist across pages

**WHAT YOU CAN BUILD** (these are NOT headers/footers):
- Hero sections at the top of the page content
- Top announcement bars (e.g., "Limited time offer!")
- Section headers within the page (e.g., "Our Services")
- Content-specific navigation (e.g., table of contents)
- Call-to-action sections at the bottom of content
- Contact information sections within page content

**KEY DISTINCTION**:
- Header/Footer = Site-wide navigation/branding that appears on every page
- Top Bar/Hero/Section = Page-specific content that's part of this individual page

If unsure, ask yourself: "Would this element appear on every page of the website?" 
- If YES → It's a header/footer, skip it
- If NO → It's page content, you can build it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODE: ${mode.toUpperCase()}
${mode === 'chat' ? '(Chat mode - provide conversational feedback WITHOUT modifying HTML)' : '(Build mode - make actual HTML changes and provide brief confirmation)'}

${conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${conversationHistory.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}
` : ''}

USER REQUEST:
${command}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CRITICAL SEO & CONVERSION STRATEGY - TRANSACTIONAL FOCUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**PRIMARY DIRECTIVE**: Every service page MUST target **transactional search intent** - customers ready to purchase/hire immediately, not just researching.

🔑 TRANSACTIONAL KEYWORD REQUIREMENTS:

✓ Include ACTION WORDS: "hire," "buy," "fix," "repair," "install," "book," "schedule," "emergency"
✓ Specify LOCATION: "[service] in [city]," "[service] near me," "local [service] company"  
✓ Add URGENCY indicators: "today," "now," "emergency," "24/7," "same-day," "immediate"
✓ Use PROBLEM-SPECIFIC terms: "[specific problem] repair," "[issue] fix," "[situation] help"

HIGH-VALUE TRANSACTIONAL EXAMPLES:
• "emergency plumber Chicago" NOT "plumbing services"
• "hire IT consultant San Francisco" NOT "IT consulting information"  
• "ac repair company near me today" NOT "how air conditioning works"
• "same-day appliance repair Dallas" NOT "appliance maintenance tips"

📋 MANDATORY PAGE ELEMENTS:

1. **TRANSACTIONAL H1 HEADER**:
   Format: "[Action Word] [Specific Service] in [City] - [Company Name]"
   Example: "Emergency HVAC Repair in Austin - Available 24/7"
   ↳ NEVER use generic headers like "Plumbing Services" or "About Our IT Services"

2. **CALL-TO-ACTION FOCUS**:
   • Contact info prominent ABOVE THE FOLD
   • Action buttons: "Get Quote," "Call Now," "Book Service," "Schedule Today"
   • Response time commitments for urgent services
   • Phone number clickable and visible without scrolling

3. **LOCAL TRUST SIGNALS**:
   • "[City] residents and businesses trust..."
   • "Serving [City] since [year]..."
   • Specific neighborhoods and local area references
   • Local reviews and testimonials

4. **PROBLEM-SOLUTION CONTENT STRUCTURE**:
   • Open with customer's IMMEDIATE problem or need
   • Present company as the IMMEDIATE solution
   • Include availability and response time promises
   • Address specific pain points that drive urgent action

5. **CONVERSION-FOCUSED COPY**:
   • Urgency drivers: "Don't let [small problem] become [major issue]"
   • Time-sensitive language: "Same-day service available"
   • Trust builders: "Licensed, certified, insured, locally owned"
   • Social proof: Reviews, testimonials, years in business
   • Remove friction: "No-obligation quote," "Free estimate"

🎯 WHY THIS TRANSACTIONAL FOCUS MATTERS:

• Broad terms like "IT services" have massive competition from national companies
• Small to medium businesses WIN by dominating specific transactional searches
• Transactional keywords = HIGHER CONVERSION RATES (ready-to-buy customers)
• Competitive advantage: Capture thousands of service + location + urgency combinations

⚠️ WHAT TO AVOID:

✗ NO purely informational pages - No "what is [service]" or "types of [product]"
✗ NO generic service descriptions without location + action
✗ NO hiding contact methods below the fold
✗ NO focusing on company history instead of customer problems

📐 IMPLEMENTATION RULES:

• **Always include location + service + action** in primary keywords
• **Emphasize availability and response time** - problems need solutions NOW
• **Include industry-specific urgency triggers** - emergencies, deadlines, seasonal needs
• **Contact visible without scrolling** on every page
• **Focus on customer's problem first**, company capabilities second

🏢 INDUSTRY ADAPTATIONS:

• B2B Services: Target "hire," "consultant," "agency," "contractor," "provider"
• Home Services: Target "repair," "fix," "emergency," "installation," "replacement"  
• Professional Services: Target "attorney," "accountant," "advisor" + "near me"
• Technical Services: Target "support," "fix," "troubleshoot," "setup," "migration"

💡 STRATEGY GOAL: Create pages targeting specific customer needs at the exact moment of purchase decision, rather than competing for broad terms with low conversion intent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 YOUR MISSION - CREATE STUNNING, CONVERSION-FOCUSED PAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **USE THE COMPLETE COMPANY PROFILE ABOVE**
   ↳ Every piece of information provided is there for a reason - USE IT ALL
   ↳ Reference the business name, incorporate the brand voice, highlight the USPs
   ↳ Use actual contact info, mention certifications, reflect the mission
   ↳ Don't ignore any context - the more you use, the more personalized and effective the page

2. **MATCH THE BRAND VOICE EXACTLY**
   ↳ The brand voice describes HOW to write - tone, style, personality
   ↳ Professional? Friendly? Urgent? Technical? Match it perfectly
   ↳ Every sentence should sound like it came from THIS specific company

3. **SPEAK TO THE TARGET AUDIENCE**
   ↳ Write directly to the audience described above
   ↳ Use language, benefits, and examples that resonate with THEM
   ↳ Address their pain points, goals, and concerns

4. **HIGHLIGHT UNIQUE SELLING POINTS & COMPETITIVE ADVANTAGES**
   ↳ These are the company's differentiators - make them PROMINENT
   ↳ Weave them into headlines, feature sections, and CTAs
   ↳ Don't let the page be generic - show what makes THIS company special

5. **INCORPORATE SERVICE-SPECIFIC DETAILS** (when available)
   ↳ Use the EXACT service name throughout the page
   ↳ Reference the service description to create relevant content
   ↳ Mention service-specific benefits, use cases, and outcomes
   ↳ If pricing is provided, display it clearly with "starting at" language

6. **BUILD TRUST WITH CREDENTIALS**
   ↳ Display years of experience, certifications, and licenses
   ↳ Mention service standards and quality guarantees
   ↳ Show service area coverage and response capabilities

7. **MAKE IT EASY TO TAKE ACTION**
   ↳ Use the actual company phone number and email in CTAs
   ↳ Reference payment options to remove friction
   ↳ Set clear project timeline expectations where relevant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 CRITICAL PAGE QUALITY REQUIREMENTS - MUST FOLLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **ALWAYS COMPLETE THE ENTIRE PAGE**
   ↳ NEVER truncate or leave incomplete HTML - generate the FULL page from <!DOCTYPE> to </html>
   ↳ If you run out of space, prioritize completing sections rather than starting new ones
   ↳ All opening tags MUST have closing tags - validate HTML structure
   ↳ Every section you start MUST be finished with proper closing elements
   ↳ CRITICAL: User should receive a fully functional, complete HTML page every time

2. **CONTRAST & READABILITY REQUIREMENTS**
   ↳ HERO SECTIONS WITH BACKGROUND IMAGES:
     • Background overlay MUST be opaque enough to read white text clearly
     • Use: <div class="absolute inset-0 bg-black opacity-60"></div> (minimum 60% opacity)
     • For dark backgrounds with light text, use opacity-50 to opacity-70
     • For light backgrounds with dark text, use white overlay with opacity-70 to opacity-80
     • ALWAYS test readability: Can you read white text over this overlay + image combo?
   
   ↳ TEXT OVER COLORED BACKGROUNDS:
     • On blue/primary backgrounds: Use white text (text-white)
     • On white backgrounds: Use foreground color (text-[hsl(222,47%,11%)])
     • On dark backgrounds: Use white or light text with sufficient opacity
     • Badge/pill elements: Ensure background is dark/vibrant enough for white text
   
   ↳ OVERLAY CONTAINERS:
     • Semi-transparent containers (e.g., bg-white/20) need dark text shadows OR
     • Must be backed by a more opaque layer for text to be readable
     • Example: bg-white/10 backdrop-blur-sm is TOO LIGHT for small text - use bg-white/20 minimum
     • For glass-morphism effects, use backdrop-blur-md with bg-white/30 minimum

3. **IMAGE SELECTION - INDUSTRY APPROPRIATE**
   ↳ MATCH THE COMPANY'S INDUSTRY:
     • Roofing company → Show roofs, shingles, contractors working on roofs
     • Plumbing company → Show pipes, fixtures, plumbers at work
     • HVAC company → Show air conditioning units, heating systems, technicians
     • Restaurant → Show the actual food/dishes they serve, NOT random stock food
     • IT company → Show computers, servers, office tech setups
   
   ↳ USE UNSPLASH WITH SPECIFIC SEARCH TERMS:
     • https://images.unsplash.com/photo-[ID]?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80
     • Search terms MUST match the service (e.g., "roof repair" not "restaurant food")
     • For emergency services: Show damage, emergency response, or professional work
     • For professional services: Show relevant workplace or client interactions
   
   ↳ AVOID COMPLETELY:
     • Generic stock photos that don't match the industry
     • Random food images for non-restaurant businesses
     • Office meetings for hands-on service businesses
     • Unrelated imagery that confuses the service offering

4. **BACKGROUND IMAGE BEST PRACTICES**
   ↳ Hero sections with background images need:
     • Relevant image that matches the service/industry
     • Dark overlay (bg-black opacity-50 to opacity-70) for white text
     • Or gradient overlay: bg-gradient-to-br from-black/60 to-black/40
     • Background image should be high quality (w=1600 to w=2400)
     • Use background-size: cover and background-position: center
   
   Example proper hero structure:
   <section class="relative">
     <!-- Background Image -->
     <div class="absolute inset-0" style="background-image: url('[INDUSTRY-APPROPRIATE-IMAGE]'); background-size: cover; background-position: center; z-index: 0;"></div>
     <!-- Dark Overlay for Readability -->
     <div class="absolute inset-0 bg-black opacity-60 z-10"></div>
     <!-- Content (readable white text) -->
     <div class="relative z-20 text-white py-20 px-6">
       <h1>Perfectly Readable Text</h1>
     </div>
   </section>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOVABLE DESIGN SYSTEM - USE COMPANY'S CUSTOM THEME:

📦 REQUIRED: Include Tailwind CDN in <head>:
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @layer base {
    :root {
      ${context.siteSettings ? `
      --primary: ${context.siteSettings.primary_color?.replace('hsl(', '').replace(')', '') || '221 83% 53%'};
      --secondary: ${context.siteSettings.secondary_color?.replace('hsl(', '').replace(')', '') || '210 40% 96%'};
      --accent: ${context.siteSettings.accent_color?.replace('hsl(', '').replace(')', '') || '142 76% 36%'};
      --radius: ${context.siteSettings.button_border_radius ? (context.siteSettings.button_border_radius / 16) + 'rem' : '0.5rem'};
      --card-radius: ${context.siteSettings.card_border_radius ? (context.siteSettings.card_border_radius / 16) + 'rem' : '0.75rem'};` : `
      --primary: 221 83% 53%;
      --secondary: 210 40% 96%;
      --accent: 142 76% 36%;
      --radius: 0.5rem;
      --card-radius: 0.75rem;`}
      --primary-foreground: 0 0% 100%;
      --primary-glow: 221 83% 65%;
      --accent-foreground: 0 0% 100%;
      --destructive: 0 84% 60%;
      --destructive-foreground: 0 0% 100%;
      --background: 0 0% 100%;
      --foreground: 222 47% 11%;
      --muted: 210 40% 96%;
      --muted-foreground: 215 16% 47%;
      --border: 214 32% 91%;
    }
  }
</style>

🎨 YOUR THEME COLORS (Use these HSL values in all styling):
${context.siteSettings ? `
Primary Color: hsl(${context.siteSettings.primary_color?.replace('hsl(', '').replace(')', '') || '221 83% 53%'})
Secondary Color: hsl(${context.siteSettings.secondary_color?.replace('hsl(', '').replace(')', '') || '210 40% 96%'})
Accent Color: hsl(${context.siteSettings.accent_color?.replace('hsl(', '').replace(')', '') || '142 76% 36%'})
Button Border Radius: ${context.siteSettings.button_border_radius || 8}px
Card Border Radius: ${context.siteSettings.card_border_radius || 12}px
` : 'Using default theme values'}

⚠️ CRITICAL: Use ONLY the theme colors defined above. DO NOT use hardcoded colors.

🎨 COMPONENT PATTERNS (Replace color values with YOUR theme):

IMPORTANT: The examples below use default colors. You MUST replace them with the actual theme colors from above.
- Replace "hsl(221,83%,53%)" → Use PRIMARY color from your theme
- Replace "hsl(142,76%,36%)" → Use ACCENT color from your theme  
- Replace "hsl(210,40%,96%)" → Use SECONDARY color from your theme
- Use the actual border-radius values from your theme

1. HERO SECTION (use PRIMARY color):
<section class="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] text-white py-20 px-6 rounded-[var(--radius)] mb-16 overflow-hidden">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-5xl font-bold mb-6 leading-tight">{{service_name}} in {{city_name}}</h1>
    <p class="text-xl opacity-95 mb-8 max-w-3xl">{{service_description}}</p>
    <a href="#contact" class="inline-block bg-white text-[hsl(var(--primary))] px-8 py-4 rounded-[var(--radius)] font-bold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300">Get Started Today</a>
  </div>
</section>

2. FEATURE CARDS (use PRIMARY for accents):
<div class="grid md:grid-cols-3 gap-8 my-16">
  <div class="bg-white p-8 rounded-[var(--card-radius)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-[hsl(var(--border))] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300">
    <div class="w-14 h-14 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] rounded-[var(--radius)] flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 256 256">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28H116a8,8,0,0,1,0-16h24a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h4a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z"/>
      </svg>
    </div>
    <h3 class="text-2xl font-bold mb-4 text-[hsl(var(--foreground))]">Feature Title</h3>
    <p class="text-[hsl(var(--muted-foreground))] leading-relaxed">Feature description with compelling benefits.</p>
  </div>
</div>

3. TESTIMONIAL SECTION (use SECONDARY for background):
<section class="bg-[hsl(var(--secondary))] py-20 px-6 rounded-[var(--card-radius)] my-16">
  <h2 class="text-4xl font-bold text-center mb-12 text-[hsl(var(--foreground))]">What Our Customers Say</h2>
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
    <div class="bg-white p-8 rounded-[var(--card-radius)] shadow-[0_5px_20px_rgba(0,0,0,0.08)]">
      <div class="flex gap-1 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fbbf24" viewBox="0 0 256 256"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a16,16,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fbbf24" viewBox="0 0 256 256"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a16,16,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fbbf24" viewBox="0 0 256 256"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a16,16,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fbbf24" viewBox="0 0 256 256"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a16,16,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fbbf24" viewBox="0 0 256 256"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a16,16,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"/></svg>
      </div>
      <p class="text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">"Testimonial text goes here..."</p>
      <div class="font-semibold text-[hsl(var(--foreground))]">— Customer Name</div>
    </div>
  </div>
</section>

4. CTA BUTTON VARIANTS:
<!-- Primary CTA (use PRIMARY color) -->
<a href="#contact" class="inline-block bg-[hsl(var(--primary))] text-white px-8 py-4 rounded-[var(--radius)] font-bold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">Contact Us Now</a>

<!-- Accent CTA (use ACCENT color) -->
<a href="#call" class="inline-block bg-[hsl(var(--accent))] text-white px-8 py-4 rounded-[var(--radius)] font-bold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">Call Now</a>

<!-- Emergency/Urgent CTA (Red - only for emergencies) -->
<a href="tel:{{company_phone}}" class="inline-block bg-[hsl(var(--destructive))] text-white px-8 py-4 rounded-[var(--radius)] font-bold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">Emergency Service</a>

5. STATS/NUMBERS:
<div class="bg-[hsl(var(--foreground))] py-20 px-6 rounded-[var(--card-radius)] my-16">
  <div class="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto text-center">
    <div>
      <div class="text-6xl font-extrabold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] bg-clip-text text-transparent mb-3">500+</div>
      <div class="text-[hsl(var(--muted-foreground))] text-lg">Projects Completed</div>
    </div>
    <div>
      <div class="text-6xl font-extrabold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] bg-clip-text text-transparent mb-3">25+</div>
      <div class="text-[hsl(var(--muted-foreground))] text-lg">Years Experience</div>
    </div>
    <div>
      <div class="text-6xl font-extrabold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] bg-clip-text text-transparent mb-3">100%</div>
      <div class="text-[hsl(var(--muted-foreground))] text-lg">Satisfaction Rate</div>
    </div>
  </div>
</div>

6. PRICING CARDS:
<div class="grid md:grid-cols-3 gap-8 my-16">
  <div class="bg-white p-8 rounded-[var(--card-radius)] border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] transition-all duration-300">
    <h3 class="text-2xl font-bold mb-2 text-[hsl(var(--foreground))]">Basic Plan</h3>
    <div class="text-4xl font-extrabold mb-6 text-[hsl(var(--primary))]">$99<span class="text-lg text-[hsl(var(--muted-foreground))]">/mo</span></div>
    <ul class="space-y-3 mb-8">
      <li class="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#16a34a" viewBox="0 0 256 256"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>
        Feature one
      </li>
      <li class="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#16a34a" viewBox="0 0 256 256"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>
        Feature two
      </li>
      <li class="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#16a34a" viewBox="0 0 256 256"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg>
        Feature three
      </li>
    </ul>
    <a href="#contact" class="block text-center bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] text-white py-4 rounded-[var(--radius)] font-bold hover:-translate-y-1 transition-all duration-300">Choose Plan</a>
  </div>
</div>

7. CONTACT SECTION:
<section class="bg-white p-12 rounded-[var(--card-radius)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] my-16">
  <h2 class="text-4xl font-bold text-center mb-8 text-[hsl(var(--foreground))]">Get in Touch</h2>
  <div class="max-w-2xl mx-auto">
    <form class="space-y-6">
      <input type="text" placeholder="Your Name" class="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-[var(--radius)] focus:ring-2 focus:ring-[hsl(var(--primary))] outline-none transition-all">
      <input type="email" placeholder="Your Email" class="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-[var(--radius)] focus:ring-2 focus:ring-[hsl(var(--primary))] outline-none transition-all">
      <textarea placeholder="Your Message" rows="4" class="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-[var(--radius)] focus:ring-2 focus:ring-[hsl(var(--primary))] outline-none transition-all resize-none"></textarea>
      <button type="submit" class="w-full bg-[hsl(var(--accent))] text-white py-4 rounded-[var(--radius)] font-bold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300">Send Message</button>
    </form>
  </div>
</section>

🚫 CRITICAL BRANDING & VISUAL ASSETS POLICY:

1. **NEVER USE COMPANY LOGOS IN PAGE CONTENT**
   ↳ The company logo is already included in the site's header and footer
   ↳ DO NOT add logos to hero sections, feature cards, or any page content
   ↳ EXCEPTION: You MAY use the company favicon/icon ({{icon_url}}) sparingly in midsections if absolutely necessary
   ↳ Focus on typography, colors, and content hierarchy instead of redundant logo placement

2. **ICON & EMOJI USAGE - PROFESSIONAL FIRST**
   ↳ PRIMARY: Use SVG icons from professional icon libraries (Phosphor Icons, Heroicons, etc.)
   ↳ SECONDARY: Minimal emoji use is acceptable but must be very limited and tasteful
   ↳ RULE: Professional SVG icons should make up 80%+ of visual elements, emojis only 20% maximum
   ↳ WHEN TO USE EMOJIS: Only for emphasis in specific contexts (e.g., single star for rating, checkmark for benefits)
   ↳ WHEN TO USE SVG ICONS: Feature cards, navigation elements, service icons, decorative elements
   ↳ These are professional business websites - maintain a polished, credible appearance
   
   Example icon hierarchy:
   <!-- ✅ BEST: Professional SVG icon for main features -->
   <div class="w-14 h-14 bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(221,83%,65%)] rounded-xl flex items-center justify-center mb-6">
     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 256 256">
       <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28H116a8,8,0,0,1,0-16h24a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h4a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z"/>
     </svg>
   </div>
   
   <!-- ✓ ACCEPTABLE: Minimal emoji for inline emphasis -->
   <li class="flex items-center gap-2">✓ Professional service delivery</li>

3. **SUBTLE ANIMATIONS & HOVER EFFECTS - ENHANCE USER EXPERIENCE**
   ↳ ADD simple, professional hover effects to interactive elements
   ↳ USE Tailwind's transition classes: transition-all, duration-300, hover:-translate-y-1
   ↳ APPLY subtle scale effects: hover:scale-105, hover:scale-110 (max)
   ↳ IMPLEMENT smooth elevation changes with shadows
   ↳ AVOID excessive or distracting animations - keep it professional
   
   Professional hover effect examples:
   
   <!-- Card hover with elevation & subtle lift -->
   <div class="transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
   
   <!-- Button hover with lift and glow -->
   <button class="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]">
   
   <!-- Icon container hover with scale -->
   <div class="transition-transform duration-200 hover:scale-110">
   
   <!-- Text link hover with color change -->
   <a class="transition-colors duration-200 hover:text-[hsl(221,83%,53%)]">
   
   <!-- Image hover with scale and overlay -->
   <div class="overflow-hidden rounded-xl">
     <img class="transition-transform duration-500 hover:scale-110" />
   </div>
   
   🎯 ANIMATION GOALS:
   • Make pages feel responsive and interactive
   • Guide user attention to clickable elements
   • Maintain professional credibility
   • Avoid flashy or excessive motion
   • Use subtle movements that enhance, not distract

🔑 CRITICAL IMPLEMENTATION RULES:

1. **Include Tailwind CDN** - ALWAYS add the Tailwind script in <head>
2. **Use Lovable Design Tokens** - Reference HSL colors from the :root CSS variables
3. **Maintain Handlebars Variables** - Keep {{service_name}}, {{city_name}}, {{company_phone}}, etc.
4. **Complete HTML Document** - Include <!DOCTYPE html>, proper <head>, meta tags, and the Tailwind CDN
5. **Responsive Design** - Use Tailwind's responsive prefixes (md:, lg:)
6. **Semantic HTML** - Use <section>, <article>, <header>, <footer> properly
7. **Accessible** - Include proper alt text, ARIA labels, and keyboard navigation
8. **SEO Optimized** - Include proper title, meta description, Open Graph tags
9. **Professional Icons Only** - Use SVG icons from professional libraries, NEVER emojis
10. **No Logo Redundancy** - Never place company logos in page content
9. **Mobile-First** - Design for mobile, enhance for desktop
10. **Performance** - Minimize custom CSS, leverage Tailwind utilities
11. **Return ONLY HTML** - No explanations, no markdown code blocks
12. **Conversion-Focused** - Clear CTAs, visible contact info, trust signals
13. **Beautiful Design** - Use gradients, shadows, transitions from the design system above

Return the complete, stunning HTML page using Lovable's design system now:`;

    console.log(`Calling ${model === 'claude' ? 'Claude (Anthropic)' : 'Grok (xAI)'}...`);

    // Add timeout handling to prevent hanging requests
    const timeoutMs = 180000; // 3 minutes
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

    let response: Response;
    if (model === 'claude') {
      response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 50000,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });
    } else {
      // Grok
      response = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4-fast-reasoning',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });
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

    const data = await response.json();
    let updatedHtml = '';
    let tokenUsage = 0;
    
    if (model === 'claude') {
      updatedHtml = data.content?.[0]?.text || '';
      const usage = data.usage || {};
      tokenUsage = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    } else {
      // Grok
      updatedHtml = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || {};
      tokenUsage = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    }

    console.log(`${model === 'claude' ? 'Claude' : 'Grok'} Edit Success, response length:`, updatedHtml.length, 'tokens:', tokenUsage);

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

    return new Response(
      JSON.stringify({
        updatedHtml: responseHtml,
        message: message,
        explanation: message,
        tokenUsage: tokenUsage
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