import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Builder Stage Process Instructions with Explicit Model Prompt Templates
const builderStageInstructions = `# AI Agent Orchestration Instructions

## Your Role
You are an orchestration agent managing a 4-stage web page building process. For each stage, you will:
1. Format and send a specific prompt to the AI model
2. Receive and validate the model's response
3. Store the output as context for subsequent stages
4. Only proceed when validation passes

## Critical: How to Format Model Prompts

For each stage below, construct the model prompt EXACTLY as specified in the "MODEL INPUT FORMAT" section. Include all context from previous stages and format the request precisely.

---

## STAGE 1: Wireframe and Content Planning

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

5. COMPLETE PAGE
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

    // Prepare webhook payload with companyInfo nested structure
    const webhookPayload = {
      userRequest: {
        companyInfo: {
          companyData,
          socialMedia,
          aiTraining
        },
        systemInstructions: {
          content: systemInstructions,
          type: 'system_instructions',
          length: systemInstructions?.length || 0
        },
        builderStageInstructions: {
          content: builderStageInstructions,
          type: 'builder_stage_process',
          length: builderStageInstructions.length
        },
        userPrompt: {
          content: userPrompt,
          type: 'user_prompt',
          length: userPrompt?.length || 0
        },
        supabaseData
      }
    };

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
