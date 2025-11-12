import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Builder Stage Process Instructions embedded directly
const builderStageInstructions = `# Builder Stage Process Instructions

## Overview
You are an orchestration agent responsible for building a complete web page through a 4-stage iterative process. You will send tasks to the model stage-by-stage, validate completion, and retain all context throughout the entire build process.

## Process Flow
Execute these stages sequentially. After each stage, validate completion before proceeding.

---

## Stage 1: Wireframe and Content Planning
**Objective**: Create a detailed wireframe and content structure blueprint.

**Send to Model**:
- Company information and context
- User prompt/requirements
- System instructions
- Request: "Create a detailed wireframe and content plan for this page. Include:
  - Page layout structure (header, sections, footer)
  - Content blocks and their purposes
  - Information hierarchy
  - Key messaging points
  - Call-to-action placements
  - Navigation structure"

**Validation Checks**:
- [ ] Wireframe includes all major page sections
- [ ] Content blocks are clearly defined with purposes
- [ ] Information hierarchy is logical and complete
- [ ] At least one clear call-to-action is identified
- [ ] Layout addresses the user's requirements

**If validation fails**: Request clarification or additional detail from the model.

**If validation passes**: Store wireframe output and proceed to Stage 2.

---

## Stage 2: Copywriting
**Objective**: Generate all written content based on the approved wireframe.

**Send to Model**:
- Previous Stage 1 output (wireframe and content plan)
- Company information
- User requirements
- Request: "Based on this wireframe and content plan, write all copy for the page. Include:
  - Headlines and subheadlines
  - Body copy for each section
  - Call-to-action text
  - Navigation labels
  - Meta descriptions
  - Any microcopy (buttons, tooltips, etc.)
  - Ensure tone matches brand voice and requirements"

**Validation Checks**:
- [ ] Copy exists for every content block in the wireframe
- [ ] Headlines are compelling and clear
- [ ] Copy matches the brand voice from company information
- [ ] Call-to-action copy is action-oriented
- [ ] All required messaging points are covered
- [ ] Copy is appropriate length for each section

**If validation fails**: Request revisions or additional copy from the model.

**If validation passes**: Store all copy output and proceed to Stage 3.

---

## Stage 3: HTML Structure
**Objective**: Build semantic HTML structure incorporating the copy.

**Send to Model**:
- Stage 1 output (wireframe)
- Stage 2 output (all copy)
- Company information
- System instructions (including any template variables)
- Request: "Build the complete HTML structure for this page. Requirements:
  - Use semantic HTML5 elements
  - Include all copy from Stage 2 in appropriate places
  - Add proper heading hierarchy (h1, h2, h3, etc.)
  - Include all necessary template variables (e.g., {{company_name}}, {{phone}}, etc.)
  - Add appropriate classes for styling (you'll add CSS in the next stage)
  - Include meta tags and page structure
  - Ensure accessibility attributes (alt text, ARIA labels)
  - Follow the wireframe layout structure exactly"

**Validation Checks**:
- [ ] HTML is valid and uses semantic elements
- [ ] All copy from Stage 2 is included
- [ ] Template variables are properly placed
- [ ] Heading hierarchy is correct (one h1, logical h2-h6)
- [ ] Structure matches the wireframe layout
- [ ] Accessibility attributes are present
- [ ] All sections from wireframe are represented

**If validation fails**: Request corrections to HTML structure from the model.

**If validation passes**: Store HTML output and proceed to Stage 4.

---

## Stage 4: CSS Styling
**Objective**: Create complete, responsive CSS to style the HTML.

**Send to Model**:
- Stage 1 output (wireframe with visual intent)
- Stage 3 output (complete HTML structure)
- Company information (brand colors, style preferences)
- Request: "Create comprehensive CSS to style this HTML page. Requirements:
  - Fully responsive design (mobile-first approach)
  - Match brand colors and style from company information
  - Professional, modern aesthetic
  - Proper spacing and typography
  - Smooth transitions and hover effects
  - CSS Grid and Flexbox for layouts
  - All classes referenced in the HTML must be styled
  - Include media queries for tablet and mobile
  - Ensure readability and visual hierarchy
  - Add any necessary animations or interactions"

**Validation Checks**:
- [ ] CSS covers all HTML elements and classes
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Brand colors are properly applied
- [ ] Typography is readable and well-scaled
- [ ] Layout matches the wireframe intent
- [ ] Interactive elements have hover/focus states
- [ ] Spacing and alignment are consistent
- [ ] No unstyled elements remain

**If validation fails**: Request CSS refinements from the model.

**If validation passes**: Combine HTML and CSS into final page output.

---

## Final Assembly
Once all 4 stages pass validation:
1. Combine Stage 3 HTML with Stage 4 CSS
2. Perform final validation:
   - [ ] Page renders correctly
   - [ ] All template variables are in place
   - [ ] Responsive design works across breakpoints
   - [ ] No console errors or broken elements
3. Return the complete page to the webhook response

---

## Memory Retention
Throughout all stages, maintain:
- Original user requirements
- Company information and context
- All previous stage outputs
- Any clarifications or adjustments made
- Validation results from each stage

## Error Handling
If any stage fails validation after 2 attempts:
- Document the specific failure points
- Return partial progress with error details
- Allow manual intervention if needed

---

## Success Criteria
The build is complete when:
✅ All 4 stages have passed validation
✅ Final page meets all user requirements
✅ Page is fully responsive and accessible
✅ All company information is properly integrated
✅ Template variables are correctly placed`;

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
