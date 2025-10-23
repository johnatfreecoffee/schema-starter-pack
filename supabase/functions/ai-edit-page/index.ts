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
    const { command, context } = await req.json();
    
    console.log('AI Edit Request:', { command, contextKeys: Object.keys(context) });

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

    // Build AI prompt with full context - Enhanced for beautiful design generation
    const prompt = `You are an elite web designer and developer who creates stunning, modern, conversion-focused web pages. You build pages that are visually breathtaking, highly engaging, and professionally polished.

${companyProfile}

CURRENT PAGE:
Type: ${context.currentPage?.type || 'unknown'}
URL: ${context.currentPage?.url || 'N/A'}
Current HTML:
${context.currentPage?.html || ''}

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

DESIGN SYSTEM & COMPONENT LIBRARY - USE THESE EXTENSIVELY:

1. MODERN CSS TECHNIQUES:
   - Use CSS gradients: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
   - Apply subtle shadows: box-shadow: 0 10px 30px rgba(0,0,0,0.1)
   - Add smooth transitions: transition: all 0.3s ease
   - Use backdrop-filter: backdrop-filter: blur(10px)
   - Implement grid/flexbox for layouts
   - Add hover effects on interactive elements

2. BEAUTIFUL HERO SECTIONS:
   <div class="hero" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 80px 20px; border-radius: 16px; color: white; text-align: center; margin-bottom: 60px;">
     <h1 style="font-size: 3.5rem; font-weight: 800; margin: 0 0 1.5rem; line-height: 1.2;">{{service_name}} in {{city_name}}</h1>
     <p style="font-size: 1.5rem; opacity: 0.95; margin-bottom: 2rem; max-width: 800px; margin-left: auto; margin-right: auto;">{{service_description}}</p>
     <a href="#contact" style="background: white; color: #667eea; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: transform 0.3s; hover: transform: translateY(-2px);">Get Started Today</a>
   </div>

3. STUNNING FEATURE CARDS:
   <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 60px 0;">
     <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: transform 0.3s, box-shadow 0.3s; border: 1px solid rgba(0,0,0,0.05);" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.12)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.08)'">
       <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
         <span style="color: white; font-size: 24px;">🎯</span>
       </div>
       <h3 style="font-size: 1.5rem; margin-bottom: 12px; color: #1a202c;">Feature Title</h3>
       <p style="color: #718096; line-height: 1.7;">Feature description goes here with compelling copy.</p>
     </div>
   </div>

4. TESTIMONIAL SECTIONS:
   <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); padding: 80px 20px; border-radius: 16px; margin: 60px 0;">
     <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 50px; color: #1a202c;">What Our Customers Say</h2>
     <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
       <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
         <div style="display: flex; gap: 4px; margin-bottom: 15px;">
           <span style="color: #fbbf24; font-size: 20px;">⭐</span>
           <span style="color: #fbbf24; font-size: 20px;">⭐</span>
           <span style="color: #fbbf24; font-size: 20px;">⭐</span>
           <span style="color: #fbbf24; font-size: 20px;">⭐</span>
           <span style="color: #fbbf24; font-size: 20px;">⭐</span>
         </div>
         <p style="font-style: italic; color: #4a5568; line-height: 1.7; margin-bottom: 20px;">"Outstanding service! Highly recommend."</p>
         <p style="font-weight: 700; color: #1a202c;">- Customer Name</p>
       </div>
     </div>
   </div>

5. CALL-TO-ACTION SECTIONS:
   <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; border-radius: 16px; text-align: center; color: white; margin: 60px 0;">
     <h2 style="font-size: 2.5rem; margin-bottom: 20px; font-weight: 700;">Ready to Get Started?</h2>
     <p style="font-size: 1.25rem; opacity: 0.95; margin-bottom: 35px;">Contact {{company_name}} today for a free consultation</p>
     <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
       <a href="tel:{{company_phone}}" style="background: white; color: #667eea; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">Call {{company_phone}}</a>
       <a href="mailto:{{company_email}}" style="background: rgba(255,255,255,0.2); color: white; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; backdrop-filter: blur(10px);">Email Us</a>
     </div>
   </div>

6. PRICING TABLES:
   <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 60px 0;">
     <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 2px solid transparent; transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'; this.style.transform='scale(1.03)'" onmouseout="this.style.borderColor='transparent'; this.style.transform=''">
       <h3 style="font-size: 1.5rem; margin-bottom: 10px; color: #1a202c;">Basic Package</h3>
       <div style="font-size: 3rem; font-weight: 800; color: #667eea; margin: 20px 0;">$999</div>
       <ul style="list-style: none; padding: 0; margin: 30px 0;">
         <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">✓ Feature one</li>
         <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">✓ Feature two</li>
         <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">✓ Feature three</li>
       </ul>
       <a href="#contact" style="display: block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px; border-radius: 10px; text-align: center; text-decoration: none; font-weight: 700; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">Choose Plan</a>
     </div>
   </div>

7. STATS/NUMBERS SECTION:
   <div style="background: #1a202c; padding: 80px 20px; border-radius: 16px; margin: 60px 0;">
     <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; max-width: 1200px; margin: 0 auto; text-align: center;">
       <div>
         <div style="font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">500+</div>
         <div style="color: #a0aec0; font-size: 1.1rem;">Projects Completed</div>
       </div>
       <div>
         <div style="font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">25+</div>
         <div style="color: #a0aec0; font-size: 1.1rem;">Years Experience</div>
       </div>
       <div>
         <div style="font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">100%</div>
         <div style="color: #a0aec0; font-size: 1.1rem;">Customer Satisfaction</div>
       </div>
     </div>
   </div>

CRITICAL INSTRUCTIONS:
1. Create STUNNING, visually impressive pages with modern design
2. Use the component patterns above extensively
3. Apply beautiful gradients, shadows, and transitions
4. Maintain all Handlebars variables like {{service_name}}, {{city_name}}, {{company_phone}}
5. Return a complete HTML document with <!DOCTYPE html>, proper <head> with meta tags and embedded CSS
6. Include responsive design with proper viewport meta tag
7. Add smooth transitions and hover effects
8. Use semantic HTML5 elements
9. Ensure excellent typography with proper font sizing and hierarchy
10. Create clear visual hierarchy with proper spacing
11. Return ONLY the HTML - no explanations, no markdown code blocks
12. Make it mobile-responsive using CSS media queries
13. Add compelling copy that converts visitors

Return the complete, beautiful HTML page now:`;

    console.log('Calling Claude (Anthropic)...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const updatedHtml = data.content?.[0]?.text || '';

    console.log('Claude Edit Success, response length:', updatedHtml.length);

    // Clean up the response - remove markdown code blocks if present
    let cleanedHtml = updatedHtml.trim();
    if (cleanedHtml.startsWith('```html')) {
      cleanedHtml = cleanedHtml.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (cleanedHtml.startsWith('```')) {
      cleanedHtml = cleanedHtml.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return new Response(
      JSON.stringify({
        updatedHtml: cleanedHtml,
        explanation: 'AI processed your request and updated the page'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-edit-page function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});