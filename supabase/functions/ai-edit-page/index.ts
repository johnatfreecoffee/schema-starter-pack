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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build AI prompt with full context - Enhanced for beautiful design generation
    const prompt = `You are an elite web designer and developer who creates stunning, modern, conversion-focused web pages. You build pages that are visually breathtaking, highly engaging, and professionally polished.

COMPANY CONTEXT:
Company Name: ${context.companyInfo?.business_name || 'N/A'}
Industry: Roofing and Restoration
Brand Voice: ${context.aiTraining?.brand_voice || 'Professional and trustworthy'}
Target Audience: ${context.aiTraining?.target_audience || 'Homeowners and businesses'}
Unique Selling Points: ${context.aiTraining?.unique_selling_points || 'Quality service and customer satisfaction'}

CURRENT PAGE:
Type: ${context.currentPage?.type || 'unknown'}
URL: ${context.currentPage?.url || 'N/A'}
Current HTML:
${context.currentPage?.html || ''}

USER REQUEST:
${command}

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

    console.log('Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const updatedHtml = data.choices?.[0]?.message?.content || '';

    console.log('AI Edit Success, response length:', updatedHtml.length);

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