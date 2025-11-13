import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image Generation Instructions
const imageGenInstructions = `# IMAGE GENERATION TASK

Analyze the following "APPROVED HTML CONTENT" from Stage 3. Identify all image placeholders, which are <img> tags with a placeholder src attribute (e.g., src="placeholder-hero.jpg", src="placeholder-service-1.png") and a descriptive alt attribute.

## Your Task
Generate a valid JSON array of objects. Each object represents one image that needs to be generated. The object must have exactly two keys:

1. "location": The exact string value from the src attribute of the placeholder <img> tag (e.g., "placeholder-hero.jpg")
2. "prompt": A detailed, photorealistic image generation prompt based on the alt text and surrounding HTML context. The prompt should be suitable for Google's Imagen 2 model to create a lifelike, high-quality photograph that fits perfectly on a professional website.

## Prompt Guidelines
- Start with "Photorealistic photograph of..."
- Include subject, setting, lighting, mood, and composition details
- Mention professional quality, high resolution, sharp focus
- For roofing/construction: include safety equipment, professional tools, clean work environment
- For business: include modern settings, diverse professionals, natural lighting
- For before/after: specify the contrast clearly
- Keep prompts 100-200 characters for optimal results

## Example Output Format

[
  {
    "location": "placeholder-hero.jpg",
    "prompt": "Photorealistic photograph of professional roofer inspecting shingles on modern residential home under clear blue sky, wide angle, natural lighting, high detail"
  },
  {
    "location": "placeholder-service-1.png",
    "prompt": "Close-up photorealistic image of hands installing metal roofing panels with cordless drill, safety gloves visible, bright daylight, sharp focus on tools and materials"
  },
  {
    "location": "placeholder-team.jpg",
    "prompt": "Photorealistic group photo of diverse professional roofing team standing in front of company truck, smiling, wearing branded uniforms and safety gear, natural outdoor lighting"
  }
]

## Important Rules
- Output MUST start with opening bracket [ on the first line
- **CRITICAL: NO BACKTICKS ANYWHERE** - Do not wrap JSON in backticks or code fences
- No markdown formatting of any kind (no \`\`\`json, no \`\`\`, no backticks)
- No explanatory text before or after the JSON array
- No line numbers, no comments, no extra text - ONLY the JSON array
- Output must be pure, raw JSON that starts with [ and ends with ]
- If no image placeholders are found, output: []
- Ensure all JSON is valid (proper quotes, commas, brackets)
- Include ALL image placeholders found in the HTML
- The JSON array must be perfectly formatted and directly loopable in automation tools

## Context
The HTML content represents a {{business_name}} web page focused on {{service_or_topic}}. Tailor image prompts to match the business industry and service offerings while maintaining photorealistic quality suitable for a professional website.`;

// Stage 1: Wireframe Planning Instructions
const stage1Instructions = `# STAGE 1: WIREFRAME & CONTENT PLANNING

## Your Role
You are creating the structural blueprint for a web page. DO NOT write any code in this stage.

## Input Context
You will receive:
- Company information (name, industry, services)
- Brand voice and target audience
- User's page request
- System instructions for reference

## Your Task
Create a detailed wireframe that includes:

### MODEL INPUT FORMAT:
\`\`\`
CONTEXT:
Company Name: {companyData.company_name}
Industry: {companyData.industry}
Brand Voice: {aiTraining.brand_voice}
Target Audience: {aiTraining.target_audience}
Key Services/Products: {companyData.services}

USER REQUEST:
{userPrompt}

SYSTEM INSTRUCTIONS:
{systemInstructions}

TASK:
Create a detailed wireframe and content structure for this web page. Your output must include:

1. PAGE LAYOUT STRUCTURE
   - Header design and navigation placement
   - Hero/banner section layout
   - Main content sections (list each with purpose)
   - Sidebar elements (if applicable)
   - Footer structure

2. CONTENT BLOCKS
   - Name each content block
   - Define the purpose of each block
   - Specify what information goes in each block
   - Note any special features (forms, galleries, etc.)

3. INFORMATION HIERARCHY
   - What's the primary message?
   - What are secondary messages?
   - What supporting details are needed?
   - Priority order of content sections

4. CALL-TO-ACTION STRATEGY
   - Primary CTA placement and purpose
   - Secondary CTAs (if any)
   - Contact points locations

5. NAVIGATION STRUCTURE
   - Main navigation items
   - Footer navigation items
   - Any special navigation features

Format your response as a structured wireframe document.
\`\`\`

### VALIDATION CHECKLIST:
- [ ] All 5 required sections are present (Layout, Blocks, Hierarchy, CTA, Navigation)
- [ ] At least 3 main content sections are defined
- [ ] Each content block has a clear purpose stated
- [ ] At least one primary CTA is identified with placement
- [ ] Information hierarchy prioritizes most important content first
- [ ] Layout addresses the user's specific request

### ON VALIDATION FAILURE:
Send follow-up prompt: "The wireframe is missing {specific_missing_elements}. Please provide these details."

### ON VALIDATION SUCCESS:
Store entire response as STAGE_1_WIREFRAME and proceed to Stage 2.

---

## STAGE 2: Copywriting

### MODEL INPUT FORMAT:
\`\`\`
CONTEXT:
Company Name: {companyData.company_name}
Industry: {companyData.industry}
Brand Voice: {aiTraining.brand_voice}
Target Audience: {aiTraining.target_audience}
Tone: {aiTraining.tone}
Key Messages: {aiTraining.key_messages}

APPROVED WIREFRAME FROM STAGE 1:
{STAGE_1_WIREFRAME}

USER REQUEST:
{userPrompt}

TASK:
Write all copy for this web page based on the approved wireframe. Provide:

1. HEADLINES
   - Main H1 headline
   - Section headlines (H2s)
   - Sub-headlines (H3s) where needed

2. BODY COPY
   - Write complete copy for each content block identified in the wireframe
   - Match the brand voice and tone specified
   - Address the target audience appropriately
   - Include key messages naturally

3. CALLS-TO-ACTION
   - Primary CTA button text
   - Secondary CTA text (if applicable)
   - Supporting CTA microcopy

4. NAVIGATION & UI TEXT
   - Navigation menu labels
   - Button labels
   - Form field labels and placeholders
   - Footer text

5. META CONTENT
   - Page title (for browser tab)
   - Meta description (150-160 characters)

Format each piece of copy clearly labeled by section and element type.
\`\`\`

### VALIDATION CHECKLIST:
- [ ] Copy provided for every content block from Stage 1 wireframe
- [ ] H1 headline is compelling and includes primary keyword
- [ ] Body copy matches specified brand voice/tone
- [ ] At least one clear, action-oriented CTA is written
- [ ] Navigation labels are clear and concise
- [ ] Meta description is 150-160 characters
- [ ] Copy addresses target audience appropriately

### ON VALIDATION FAILURE:
Send follow-up prompt: "Please revise the copy for {specific_sections}. It needs to {specific_requirement}."

### ON VALIDATION SUCCESS:
Store entire response as STAGE_2_COPY and proceed to Stage 3.

---

## STAGE 3: HTML Structure

### MODEL INPUT FORMAT:
\`\`\`
CONTEXT:
{systemInstructions}

APPROVED WIREFRAME:
{STAGE_1_WIREFRAME}

APPROVED COPY:
{STAGE_2_COPY}

TEMPLATE VARIABLES AVAILABLE:
{{company_name}}, {{phone}}, {{email}}, {{address}}, {{city}}, {{state}}, {{zip}}, {{country}}
{{facebook_url}}, {{twitter_url}}, {{linkedin_url}}, {{instagram_url}}, {{youtube_url}}
(Use these variables in HTML where dynamic company data should appear)

TASK:
Build the complete HTML structure for this page. Requirements:

1. SEMANTIC HTML5
   - Use proper semantic elements (<header>, <main>, <section>, <article>, <aside>, <footer>, <nav>)
   - One <h1> element only
   - Proper heading hierarchy (h1 → h2 → h3, no skipping levels)

2. CONTENT INTEGRATION
   - Place ALL copy from Stage 2 in appropriate HTML elements
   - Follow the wireframe structure exactly
   - Use template variables where company data should appear dynamically
   - Example: <span>{{company_name}}</span> instead of hardcoding "Acme Corp"

3. ACCESSIBILITY
   - All images must have descriptive alt attributes
   - Form inputs must have associated labels
   - Use ARIA labels where appropriate
   - Ensure logical tab order

4. STRUCTURE
   - Add class names for styling (use semantic, BEM-style naming)
   - Include all sections from the wireframe
   - Add container divs for layout purposes
   - Include proper meta tags in <head>

5. CRITICAL: PHONE LINKS VS. LEAD FORM CTAs
   - Phone numbers: Use ONLY <a href="tel:{{phone}}">{{phone}}</a>
     * NO onclick handlers on phone links
     * NO window.openLeadFormModal() calls
     * Phone links should directly initiate calls when clicked
   
   - Lead Form CTAs: Use onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Name')"
     * ONLY on explicit CTA buttons like "Get Quote", "Request Service", "Book Now"
     * NOT on phone numbers, email addresses, or direct contact information

6. IMAGES
   - Include <img> tags with placeholder src attributes for all visual elements
   - Use descriptive naming: src="placeholder-hero.jpg", src="placeholder-service-1.png", etc.
   - File extensions: .jpg for photos, .png for graphics/icons, .svg for logos
   - Write DETAILED alt attributes that describe the ideal image (50-100 chars)
   - Alt text should include: subject, setting, mood, composition, lighting
   - Examples:
     * alt="Professional roofer inspecting shingles on residential home under clear blue sky"
     * alt="Close-up of hands installing metal roofing panels with power drill, safety gloves visible"
     * alt="Before and after comparison of weathered vs new roof tiles in bright daylight"
   - Use placeholders for: hero images, service photos, team photos, process diagrams, before/after images
   - Every major content section should have at least one relevant image

7. COMPLETE PAGE
   - Include <!DOCTYPE html>, <html>, <head>, and <body>
   - Add viewport meta tag for responsive design
   - Add charset and meta description

Output ONLY the HTML code, properly formatted and indented.
\`\`\`

### VALIDATION CHECKLIST:
- [ ] Valid HTML5 (proper DOCTYPE, html, head, body structure)
- [ ] Exactly one <h1> element present
- [ ] Heading hierarchy is correct (no skipped levels)
- [ ] All copy from Stage 2 is present in HTML
- [ ] Template variables used ({{variable_name}} format)
- [ ] Semantic elements used appropriately
- [ ] All images have alt attributes
- [ ] Meta tags present (viewport, charset, description)
- [ ] Structure matches wireframe layout
- [ ] Class names are semantic and consistent

### ON VALIDATION FAILURE:
Send follow-up prompt: "The HTML has these issues: {specific_issues}. Please correct them."

### ON VALIDATION SUCCESS:
Store entire response as STAGE_3_HTML and proceed to Stage 4.

---

## STAGE 4: CSS Styling

### MODEL INPUT FORMAT:
\`\`\`
CONTEXT:
Brand Colors: {companyData.brand_colors or aiTraining.visual_preferences}
Style Preferences: {aiTraining.style_preferences}

WIREFRAME (for visual layout intent):
{STAGE_1_WIREFRAME}

HTML TO STYLE:
{STAGE_3_HTML}

TASK:
Create comprehensive CSS to style this HTML page. Requirements:

1. RESPONSIVE DESIGN
   - Mobile-first approach (base styles for mobile, media queries for larger screens)
   - Breakpoints: 768px (tablet), 1024px (desktop), 1280px (large desktop)
   - All elements must work on mobile (320px), tablet, and desktop
   - Test that text is readable and buttons are tappable on mobile

2. BRAND ALIGNMENT
   - Use brand colors provided in context
   - If specific colors not provided, use professional, modern color palette
   - Ensure sufficient contrast for readability (WCAG AA compliance)

3. TYPOGRAPHY
   - Use web-safe fonts or Google Fonts
   - Establish clear typographic hierarchy (size, weight, spacing)
   - Line height should be 1.5-1.7 for body text
   - Headings should be visually distinct

4. LAYOUT
   - Use CSS Grid or Flexbox for layouts
   - Proper spacing (margin, padding) between sections
   - Consistent alignment
   - Max-width on content containers for readability (typically 1200-1400px)

5. INTERACTIVE ELEMENTS
   - Buttons: clear hover, focus, and active states
   - Links: visible hover states
   - Forms: styled inputs with focus states
   - Smooth transitions (0.2-0.3s)

6. COMPLETE STYLING
   - Style EVERY class used in the HTML
   - Include reset/normalize styles
   - Add utility classes as needed
   - Ensure no unstyled elements remain

Output ONLY the CSS code, well-organized with comments for major sections.
\`\`\`

### VALIDATION CHECKLIST:
- [ ] CSS provided for all HTML classes and elements
- [ ] Responsive media queries included (mobile, tablet, desktop)
- [ ] Mobile-first approach used (base styles work on mobile)
- [ ] Brand colors applied consistently
- [ ] Typography hierarchy is clear (headings distinct from body)
- [ ] Interactive elements have hover/focus/active states
- [ ] Layout uses modern CSS (Grid/Flexbox)
- [ ] Spacing is consistent throughout
- [ ] High contrast for readability (text on backgrounds)
- [ ] Transitions/animations are subtle and purposeful

### ON VALIDATION FAILURE:
Send follow-up prompt: "The CSS needs these improvements: {specific_issues}. Please update the styles."

### ON VALIDATION SUCCESS:
Store response as STAGE_4_CSS and proceed to Final Assembly.

---

## FINAL ASSEMBLY

### Combine HTML and CSS:
1. Take STAGE_3_HTML
2. Locate the closing </head> tag
3. Insert <style>{STAGE_4_CSS}</style> before </head>
4. This creates the complete, styled page

### FINAL VALIDATION CHECKLIST:
- [ ] HTML and CSS are properly combined
- [ ] Page structure is complete (doctype through closing html tag)
- [ ] All template variables are in {{variable}} format
- [ ] No placeholder or dummy content remains
- [ ] Code is properly formatted and indented

### OUTPUT FORMAT:
Return ONLY the complete HTML page with embedded CSS. No explanations, no markdown code fences, just the raw HTML starting with <!DOCTYPE html>.

---

## MEMORY MANAGEMENT

Throughout all stages, maintain in working memory:
- **User's original request**: {userPrompt}
- **Company context**: All companyData, socialMedia, aiTraining fields
- **System instructions**: {systemInstructions}
- **Stage 1 output**: STAGE_1_WIREFRAME
- **Stage 2 output**: STAGE_2_COPY
- **Stage 3 output**: STAGE_3_HTML
- **Stage 4 output**: STAGE_4_CSS
- **Validation results**: Pass/fail status and any revision requests

---

## ERROR HANDLING

If a stage fails validation twice:
1. Document specific failure points
2. Store partial progress
3. Return error object:
   \`\`\`json
   {
     "status": "failed",
     "failed_stage": "stage_number",
     "issue": "description of what failed validation",
     "partial_output": "whatever was completed successfully"
   }
   \`\`\`

---

## SUCCESS OUTPUT

When all stages pass validation, you MUST format your response in this EXACT structure for the database webhook:

\`\`\`json
{
  "data": {
    "id": "USE_THE_ID_FROM_SUPABASE_DATA",
    "updates": {
      "content_html_draft": "PLACE_THE_COMPLETE_HTML_PAGE_HERE_AS_A_STRING"
    }
  },
  "table": "static_pages"
}
\`\`\`

### CRITICAL FORMATTING REQUIREMENTS:

1. **Extract the ID**: Use \`supabaseData.id\` value for the \`"id"\` field
2. **Place HTML**: Put the ENTIRE final assembled HTML page (with embedded CSS) inside \`"content_html_draft"\` as a plain string
3. **Table name**: Always use \`"static_pages"\` for the \`"table"\` field
4. **No escaping**: Do NOT escape quotes or special characters in the HTML - send it as a raw string
5. **Complete structure**: Include the entire HTML from \`<!DOCTYPE html>\` through closing \`</html>\` tag
6. **NO MARKDOWN**: DO NOT wrap the HTML in markdown code fences like \`\`\`html or \`\`\`css - output RAW HTML ONLY
7. **NO CODE BLOCKS**: The HTML must start directly with \`<!DOCTYPE html>\` NOT with \`\`\`html

### EXAMPLE OUTPUT:

\`\`\`json
{
  "data": {
    "id": "d749020b-e074-464d-abab-80cf44b7c077",
    "updates": {
      "content_html_draft": "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>{{company_name}}</title><style>body { margin: 0; font-family: Arial, sans-serif; } .hero { padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }</style></head><body><section class=\"hero\"><h1>Welcome to {{company_name}}</h1><p>Your trusted partner in excellence</p></section></body></html>"
    }
  },
  "table": "static_pages"
}
\`\`\`

### WRONG OUTPUT EXAMPLE (DO NOT DO THIS):

\`\`\`json
{
  "data": {
    "id": "d749020b-e074-464d-abab-80cf44b7c077",
    "updates": {
      "content_html_draft": "\`\`\`html\\n<!DOCTYPE html>\\n<html>...</html>\\n\`\`\`"
    }
  },
  "table": "static_pages"
}
\`\`\`

❌ The above is WRONG because it includes markdown code fences (\`\`\`html) - these MUST NOT appear in the HTML string.

This output will be sent directly to the database webhook which expects this exact structure.

---

## EXECUTION ORDER

1. Format Stage 1 prompt → Send to model → Validate → Store
2. Format Stage 2 prompt (include Stage 1 output) → Send to model → Validate → Store
3. Format Stage 3 prompt (include Stages 1 & 2 outputs) → Send to model → Validate → Store
4. Format Stage 4 prompt (include Stages 1 & 3 outputs) → Send to model → Validate → Store
5. Combine HTML + CSS → Final validation → Return complete page

Execute sequentially. Do not proceed to next stage until current stage passes validation.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyData, socialMedia, aiTraining, systemInstructions, userPrompt, supabaseData } = await req.json();

    // Get webhook URL from environment
    const webhookUrl = Deno.env.get('BREW_PAGE_BUILDER_WEBHOOK');
    
    if (!webhookUrl) {
      console.error('BREW_PAGE_BUILDER_WEBHOOK secret not configured');
      return new Response(
        JSON.stringify({ error: 'Make.com webhook URL not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare webhook payload in exact format requested by user
    const webhookPayload = [
      {
        body: {
          companyData: {
            business_name: companyData?.business_name || "",
            business_slogan: companyData?.business_slogan || "",
            description: companyData?.description || "",
            id: companyData?.id || "",
            brand_voice: aiTraining?.brand_voice || "",
            mission_statement: aiTraining?.mission_statement || "",
            customer_promise: aiTraining?.customer_promise || "",
            competitive_positioning: aiTraining?.competitive_positioning || "",
            unique_selling_points: aiTraining?.unique_selling_points || "",
            competitive_advantages: aiTraining?.competitive_advantages || "",
            target_audience: aiTraining?.target_audience || "",
            service_standards: aiTraining?.service_standards || "",
            certifications: aiTraining?.certifications || "",
            emergency_response: aiTraining?.emergency_response || "",
            service_area_coverage: aiTraining?.service_area_coverage || "",
            project_timeline: aiTraining?.project_timeline || "",
            payment_options: aiTraining?.payment_options || ""
          },
          userPrompt: {
            content: userPrompt || "",
            type: "user_prompt",
            length: userPrompt?.length || null
          },
          systemInstructions: {
            content: systemInstructions || "",
            type: "system_instructions",
            length: systemInstructions?.length || null
          },
          builderStageInstructions: {
            content: stage1Instructions || "",
            type: "builder_stages",
            length: stage1Instructions?.length || null
          },
          imageGenInstructions: {
            content: imageGenInstructions || "",
            type: "image_generation",
            length: imageGenInstructions?.length || null
          },
          supabaseData: {
            pageType: supabaseData?.pageType || "",
            pageTitle: supabaseData?.pageTitle || "",
            table: supabaseData?.table || "",
            pageId: supabaseData?.pageId || "",
            pageRowId: supabaseData?.pageRowId || ""
          }
        }
      }
    ];

    console.log('Sending webhook to Make.com:', {
      url: webhookUrl.substring(0, 50) + '...',
      hasCompanyData: !!companyData,
      hasSocialMedia: !!socialMedia,
      hasAiTraining: !!aiTraining,
      hasSystemInstructions: !!systemInstructions,
      supabaseData
    });

    // Send to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook failed:', webhookResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Webhook failed with status ${webhookResponse.status}`,
          details: errorText 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await webhookResponse.json().catch(() => ({}));

    console.log('Webhook sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook sent to Make.com successfully',
        response: responseData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-makecom-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
