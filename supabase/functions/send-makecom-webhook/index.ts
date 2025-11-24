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

// Stage Instructions without Images
const stageInstructionsNoImages = `# MULTI-STAGE WEB PAGE BUILDER - ICON & COPY FOCUSED (NO IMAGES)

You are building a professional web page WITHOUT photo placeholders. Focus on rich copywriting, strategic icon usage, and well-placed emojis for visual interest.

## CRITICAL RULES FOR NO-IMAGE MODE:
- **DO NOT** include any <img> tags for photos or placeholders
- **DO NOT** reference photo generation or image sourcing
- **USE** Lucide icons extensively via data-lucide attributes
- **USE** emojis sparingly but strategically (in headlines, section breaks, CTAs)
- **FOCUS** on compelling copy, clear hierarchy, and icon-driven visual design
- **EMPHASIZE** call-to-action sections with icons and engaging copy

## CRITICAL ICON & EMOJI PLACEMENT RULES:
- **NO center-aligned icons at top of pages** - DO NOT place standalone centered icon containers above or before hero headlines
- **NO emojis starting hero headlines** - The H1 or main hero headline must NEVER begin with an emoji
- **Icons should be used ONLY in:**
  - Buttons and CTAs
  - Feature cards and service descriptions  
  - Deep content sections (not at page top)
  - List items and bullet points
- **Icons should NOT be used:**
  - As standalone centered decorative elements at page top
  - In large icon-wrapper containers before headlines
  - As page-leading elements in hero sections

## EMOJI USAGE GUIDELINES:
- Sprinkle 2-4 emojis per page section (not every line)
- Use in: Section titles (NOT hero H1), feature lists, CTAs, subheadings
- Examples: "Premium Services ✨" | "Call Us Today 📞" | "What We Offer 🔧"
- **NEVER start hero H1 with emoji** - Place emojis at END of hero headlines if used at all
- Keep professional - avoid overuse

---

## STAGE 1: WIREFRAME & CONTENT PLANNING

### Your Role
You are creating the structural blueprint for a web page. DO NOT write any code in this stage.

### Input Context
You will receive:
- Company information (name, industry, services)
- Brand voice and target audience
- User's page request
- System instructions for reference

### Your Task
Create a detailed wireframe that includes:

1. PAGE LAYOUT STRUCTURE
   - Hero section
   - Main content sections (3-5 sections minimum)
   - Call-to-action placements
   - Footer structure

2. CONTENT BLOCKS
   - Name each content block
   - Define the purpose of each block
   - Specify what information goes in each block
   - Note any special features (forms, icon grids, etc.)
   - **ICON STRATEGY**: Identify where icons will replace traditional images

3. INFORMATION HIERARCHY
   - What's the primary message?
   - What are secondary messages?
   - What supporting details are needed?
   - Priority order of content sections
   - **EMOJI PLACEMENT**: Where emojis will enhance headlines

4. CALL-TO-ACTION STRATEGY
   - Primary CTA placement and purpose
   - Secondary CTAs (if any)
   - Contact points locations
   - Icon usage in CTAs

5. NAVIGATION STRUCTURE
   - Main navigation items
   - Footer navigation items
   - Any special navigation features

Format your response as a structured wireframe document.

### VALIDATION CHECKLIST:
- [ ] All 5 required sections are present
- [ ] At least 3 main content sections are defined
- [ ] Icon strategy clearly outlined
- [ ] Emoji placement identified
- [ ] At least one primary CTA is identified
- [ ] NO image/photo placeholders mentioned

---

## STAGE 2: COPYWRITING

### Your Task
Write all copy for this web page based on the approved wireframe. Provide:

1. HEADLINES
   - Main H1 headline - **NEVER start with emoji** (place emoji at end if needed)
   - Section headlines (H2s) - add emojis to 2-3 key sections
   - Sub-headlines (H3s) where needed

2. BODY COPY
   - Write complete copy for each content block
   - Match the brand voice and tone
   - Rich, engaging paragraphs
   - Include key messages naturally
   - **Add emojis to feature lists and bullet points where appropriate**

3. CALLS-TO-ACTION
   - Primary CTA button text (consider emoji: "📞 Call Now" or "✨ Get Started")
   - Secondary CTA text
   - Supporting CTA microcopy

4. NAVIGATION & UI TEXT
   - Navigation menu labels
   - Button labels
   - Form field labels and placeholders
   - Footer text

5. META CONTENT
   - Page title (for browser tab)
   - Meta description (150-160 characters)

### VALIDATION CHECKLIST:
- [ ] Copy for every content block from Stage 1
- [ ] H1 headline is compelling and includes primary keyword
- [ ] 2-4 emojis strategically placed throughout copy
- [ ] Body copy matches brand voice/tone
- [ ] At least one clear, action-oriented CTA
- [ ] Meta description is 150-160 characters

---

## STAGE 3: HTML STRUCTURE

### Your Task
Build the complete HTML structure for this page WITHOUT image placeholders.

### CRITICAL REQUIREMENTS:
1. **NO <img> TAGS** for photos/placeholders

2. **PAGE STRUCTURE RULES** (STRICTLY ENFORCE):
   - **NEVER** start page with a top CTA bar, emergency banner, or header section
   - **FIRST element** in <body> MUST be the hero section
   - **NO** sticky alerts, warning banners, or promotional bars before hero
   - **NO** "emergency-alert" divs or similar announcement sections at the top
   - Page must begin directly with main <section> hero content

3. **FORM HANDLING RULES** (CRITICAL - NEVER BUILD FORMS):
   - **NEVER** build custom HTML forms (<form> tags with inputs)
   - **NEVER EMBED OR INJECT FORMS DIRECTLY ON THE PAGE**
   - **ALL forms must ONLY appear behind buttons in modal popups**
   
   **BUTTON-TRIGGERED FORMS (ONLY WAY TO DISPLAY FORMS):**
   - Use onclick="window.openLeadFormModal()" for all form CTAs
   - Default: Button opens universal lead form in modal popup
   - Place buttons throughout page: hero, sections, footer, etc.
   - Style buttons according to design system
   - If user specifies a particular form (e.g., "emergency contact form"), tag it with appropriate data attributes
   
   **WHAT NOT TO DO:**
   - ❌ NEVER use <div data-form-embed="true"> or similar iframe-like injections
   - ❌ NEVER build custom <form>, <input>, <textarea>, or other form elements
   - ❌ NEVER try to embed forms directly on the page
   - ❌ NEVER create contact forms, quote forms, or any other forms manually
   
   **FORM EXAMPLES:**
   ✅ CORRECT (Button-triggered form in hero):
      <section class="hero">
        <h1>Get Your Free Quote Today</h1>
        <p>Professional service you can trust</p>
        <button onclick="window.openLeadFormModal()">Request Free Quote</button>
      </section>
   
   ✅ CORRECT (Multiple CTAs with button-triggered forms):
      <section class="services">
        <h2>Our Services</h2>
        <div class="service-card">
          <h3>Emergency Service</h3>
          <p>24/7 availability</p>
          <button onclick="window.openLeadFormModal()">Get Emergency Help</button>
        </div>
      </section>
   
   ❌ WRONG (Embedded form on page):
      <div data-form-embed="true" data-form-header="Contact Us"></div>
   
   ❌ WRONG (Custom HTML form):
      <form>
        <input type="text" name="name">
        <input type="email" name="email">
      </form>
   
4. **ICON PLACEMENT RULES** (STRICTLY ENFORCE):
   - **DO NOT** place standalone centered icons at the top of hero sections
   - **DO NOT** use icon-wrapper or centered icon containers before headlines
   - **USE icons ONLY in**: Buttons, CTAs, feature cards, list items, deep content sections
   - **NEVER** lead the page with a centered decorative icon
   
3. **LUCIDE ICON USAGE** (after hero section):
   - Feature sections: icon for each feature
   - CTAs: icons in all buttons
   - Service grids: icon per service
   
3. **INCLUDE EMOJIS** from Stage 2 copy in the HTML

4. **BUTTON STRUCTURE** (CRITICAL - STRICTLY ENFORCE):
   - ALL buttons MUST have SVG icons (w-6 h-6 size - NO OTHER SIZES)
   - ABSOLUTELY NO EMOJIS in button text
   - Icon appears BEFORE button text
   
   **CORRECT BUTTON EXAMPLES:**
   \`\`\`html
   <!-- Phone CTA - NO emoji -->
   <a href="tel:{{phone}}" class="btn-consistent text-white" style="background: var(--color-cta); border-radius: var(--radius-button);">
     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
     </svg>
     Call: {{phone}}
   </a>
   
   <!-- Form CTA - NO emoji, w-6 h-6 icon -->
   <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Quote')" class="btn-consistent text-white" style="background: var(--color-cta); border-radius: var(--radius-button);">
     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
     </svg>
     Get Free Quote
   </button>
   \`\`\`
   
   **WRONG EXAMPLES:**
   \`\`\`html
   ❌ <button><svg class="w-8 h-8">...</svg>📞 Call</button> <!-- emoji + wrong size -->
   ❌ <button><svg class="w-5 h-5">...</svg>Call</button> <!-- wrong icon size -->
   ❌ <button>📝 Get Quote</button> <!-- emoji, no icon -->
   \`\`\`

5. **CRITICAL: PHONE LINKS VS. LEAD FORM CTAs** (STRICTLY ENFORCE):
   
   **PHONE NUMBER LINKS:**
   - Structure: <a href="tel:{{phone}}">{{phone}}</a>
   - **ABSOLUTELY NO onclick ATTRIBUTE** - Phone links must be pure tel: links
   - **DO NOT ADD window.openLeadFormModal()** - This prevents calls from working
   - Example CORRECT: <a href="tel:{{phone}}" class="btn">📞 Call: {{phone}}</a>
   - Example WRONG: <a href="tel:{{phone}}" onclick="...">Call</a> ❌
   
   **LEAD FORM CTA BUTTONS:**
   - Use onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Name')"
   - ONLY on form CTAs: "Get Quote", "Request Service", "Schedule Inspection"
   - NOT on phone/email links

6. Follow all system instructions for:
   - Handlebars variables
   - CSS custom properties
   - Semantic HTML
   - onclick handlers ONLY for form CTAs (NOT phone links)

### VALIDATION CHECKLIST:
- [ ] Page starts with hero section (NO top CTA bars/emergency banners)
- [ ] NO <img> tags present
- [ ] NO custom HTML forms (no <form> tags with inputs)
- [ ] NO embedded forms anywhere (no data-form-embed or iframe-like injections)
- [ ] All form CTAs use onclick="window.openLeadFormModal()" - buttons only
- [ ] Multiple CTA buttons throughout page for conversions
- [ ] ALL buttons have SVG icons (w-6 h-6)
- [ ] ZERO emojis in any button text
- [ ] ALL button icons are consistent w-6 h-6 size
- [ ] Lucide icons used throughout (minimum 6-8 icons)
- [ ] Emojis from Stage 2 copy are in the HTML
- [ ] All company data uses Handlebars variables
- [ ] All CTAs have icons
- [ ] Proper semantic HTML5 structure

---

## STAGE 4: CSS STYLING

### Your Task
Create comprehensive, responsive CSS to style the HTML. Use provided CSS variables.

### ICON-FOCUSED STYLING:
- Style icon containers with backgrounds, shadows, gradients
- Make icons prominent and visually appealing
- Use color variables for icon theming
- Ensure icons are responsive

### VALIDATION CHECKLIST:
- [ ] All colors use CSS custom properties
- [ ] Icon styles are prominent and attractive
- [ ] Mobile-first responsive design
- [ ] Proper spacing and typography
- [ ] Visual hierarchy is clear without images

---

## EXECUTION ORDER

1. Format Stage 1 prompt → Send to model → Validate → Store
2. Format Stage 2 prompt (include Stage 1 output) → Send to model → Validate → Store
3. Format Stage 3 prompt (include Stages 1 & 2 outputs) → Send to model → Validate → Store
4. Format Stage 4 prompt (include Stages 1 & 3 outputs) → Send to model → Validate → Store
5. Combine HTML + CSS → Final validation → Return complete page

Execute sequentially. Do not proceed to next stage until current stage passes validation.`;

// Stage-Specific Task Instructions
const stage1Task = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Complete your entire wireframe in one response - no partial outputs.

TASK:
Based on all the context provided, create a detailed wireframe and content structure for the web page requested by the user. Your output must include:

1. PAGE LAYOUT STRUCTURE
2. CONTENT BLOCKS
3. INFORMATION HIERARCHY
4. CALL-TO-ACTION STRATEGY
5. NAVIGATION STRUCTURE

Format your response as a structured wireframe document.

CRITICAL: Complete ALL 5 sections fully. This is an automation - you cannot stop mid-way or ask for more information.`;

const stage2Task = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Write ALL copy completely in one response - no partial outputs or placeholders.

TASK:
Write all copy for this web page based on the approved wireframe and all the provided context. Provide:

1. HEADLINES
2. BODY COPY
3. CALLS-TO-ACTION
4. NAVIGATION & UI TEXT
5. META CONTENT

Format each piece of copy clearly labeled by section and element type.

CRITICAL: Provide complete, polished copy for EVERY section from the wireframe. This is an automation - you cannot stop mid-way or use placeholders.`;

const stage3Task = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Build the COMPLETE HTML from <!DOCTYPE html> to </html> in one response.

TASK:
Build the complete HTML structure for this page. Follow all rules in the context. Use Handlebars variables for all dynamic data.

Output ONLY the HTML code, properly formatted and indented.

CRITICAL COMPLETION REQUIREMENTS:
- Complete the ENTIRE HTML document from <!DOCTYPE html> to </html>
- Every opening tag MUST have a closing tag
- Every section MUST be fully finished - no partial sections, no abrupt endings
- This is an automation - you CANNOT stop mid-way or leave placeholders
- The HTML must end with a proper footer and closing tags, not a "dull point"
- ALL content sections from the wireframe must be present and complete`;

const stage4Task = `🤖 AUTOMATION MODE: This is the FINAL stage of an automated pipeline. Output the COMPLETE, production-ready HTML page with embedded CSS.

TASK:
1. Create comprehensive, responsive, mobile-first CSS to style the provided HTML.
2. Use the provided CSS variables from the DESIGN CONTEXT for all colors and design tokens.
3. Follow all rules from the SYSTEM INSTRUCTIONS regarding CSS variables, Tailwind usage, and responsive design.
4. Embed the generated CSS inside a <style> tag within the <head> section of the original HTML.
5. Output ONLY the complete, final HTML file with the embedded CSS and replaced image URLs. Do not add any markdown or explanations.

CRITICAL COMPLETION REQUIREMENTS:
- Output the ENTIRE styled HTML document from <!DOCTYPE html> to </html>
- All CSS must be properly embedded in the <head> section
- Every section must have complete styles - no missing or incomplete CSS rules
- This is an automation - this MUST be the final, complete, production-ready page
- The output must end with a proper closing </html> tag, not a partial page
- Double-check that ALL sections from previous stages are present and styled`;

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

1. PAGE STRUCTURE (CRITICAL - STRICTLY ENFORCE):
   - **FIRST element** inside <body> MUST be the hero <section>
   - **NEVER** start page with a top CTA bar, emergency banner, or announcement section
   - **NO** sticky alerts, warning banners, or promotional bars before hero
   - **NO** "emergency-alert" divs or similar sections at the top
   - Page must begin directly with main hero content
   - NO header elements before the hero section

2. SEMANTIC HTML5
   - Use proper semantic elements (<header>, <main>, <section>, <article>, <aside>, <footer>, <nav>)
   - One <h1> element only
   - Proper heading hierarchy (h1 → h2 → h3, no skipping levels)

3. CONTENT INTEGRATION
   - Place ALL copy from Stage 2 in appropriate HTML elements
   - Follow the wireframe structure exactly
   - Use template variables where company data should appear dynamically
   - Example: <span>{{company_name}}</span> instead of hardcoding "Acme Corp"

4. ACCESSIBILITY
   - All images must have descriptive alt attributes
   - Form inputs must have associated labels
   - Use ARIA labels where appropriate
   - Ensure logical tab order

5. FORM HANDLING (CRITICAL - NEVER BUILD FORMS):
   - **NEVER** create custom HTML forms with <form> tags
   - **NEVER EMBED OR INJECT FORMS DIRECTLY ON THE PAGE**
   - **ALL forms must ONLY appear behind buttons in modal popups**
   
   **BUTTON-TRIGGERED FORMS (ONLY WAY TO DISPLAY FORMS):**
   - Use onclick="window.openLeadFormModal('Button Text')" for all form CTAs
   - Default: Button opens universal lead form in modal popup
   - Place buttons throughout page for conversion: hero, sections, footer, etc.
   - If user specifies a particular form (e.g., "emergency contact form"), tag appropriately with data attributes
   
   **WHAT NOT TO DO:**
   - ❌ NEVER use <div data-form-embed="..."> or similar iframe-like injections
   - ❌ NEVER build custom <form> elements with inputs/textareas
   - ❌ NEVER try to embed forms directly on the page
   - ❌ NEVER create multi-field forms even if user specifies field count
   - Forms are managed in dashboard, not by AI

6. BUTTON STRUCTURE (CRITICAL - STRICTLY ENFORCE):
   - ALL buttons MUST have SVG icons with w-6 h-6 sizing (NO exceptions)
   - ABSOLUTELY NO EMOJIS in button text
   - Icon appears BEFORE button text
   - Consistent icon sizing creates professional design
   
   **BUTTON ICON VALIDATION:**
   - [ ] Every button has an SVG icon
   - [ ] All button icons are exactly w-6 h-6
   - [ ] Zero emojis in any button text
   - [ ] Icons appear before text

7. STRUCTURE
   - Add class names for styling (use semantic, BEM-style naming)
   - Include all sections from the wireframe
   - Add container divs for layout purposes
   - Include proper meta tags in <head>

6. CRITICAL: PHONE LINKS VS. LEAD FORM CTAs (STRICTLY ENFORCE)
   
   **PHONE NUMBER LINKS (tel: links):**
   - Must include SVG phone icon (w-6 h-6)
   - NO emojis in button text
   - **ABSOLUTELY NO onclick ATTRIBUTE** - Phone links must be pure tel: links
   - **DO NOT ADD window.openLeadFormModal()** - This prevents calls from working
   - Phone links should ONLY initiate phone calls, nothing else
   - Example CORRECT: 
     \`\`\`html
     <a href="tel:{{phone}}" class="btn-consistent text-white" style="background: var(--color-cta); border-radius: var(--radius-button);">
       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
       </svg>
       Call: {{phone}}
     </a>
     \`\`\`
   - Example WRONG: <a href="tel:{{phone}}" onclick="...">📞 Call Us</a> ❌ (has emoji and onclick)
   
   **LEAD FORM CTA BUTTONS (NOT phone links):**
   - Must include relevant SVG icon (w-6 h-6) - calendar, document, clipboard, etc.
   - NO emojis in button text
   - Use onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Name')"
   - ONLY on explicit form CTAs: "Get Quote", "Request Service", "Schedule Inspection", "Book Now"
   - These should be <button> or <a> WITHOUT href="tel:" or href="mailto:"
   - Example CORRECT:
     \`\`\`html
     <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Quote')" class="btn-consistent text-white" style="background: var(--color-cta); border-radius: var(--radius-button);">
       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
       </svg>
       Get Free Quote
     </button>
     \`\`\`
   - Example WRONG: <button onclick="...">📝 Get Free Quote</button> ❌ (has emoji, missing icon)

6. IMAGES (CRITICAL REQUIREMENTS)
   - **ABSOLUTELY NO EXTERNAL URLS**: Do NOT use Google Drive URLs, Unsplash URLs, Pexels, or any external image services
   - **ONLY LOCAL PLACEHOLDERS**: Use ONLY local placeholder filenames
   - **NO CENTER-ALIGNED IMAGES AT PAGE TOP**: Do not place hero images in centered standalone containers before headlines
   - **FILE EXTENSIONS - CRITICAL**:
     * .jpg ONLY for photos of people, buildings, landscapes, real-world scenes
     * .png ONLY for graphics, icons, illustrations, diagrams
     * .svg ONLY for logos and simple vector graphics
     * DO NOT use .png for photos - photos MUST be .jpg
   - Naming examples:
     * src="placeholder-hero.jpg" (photo of building/scene)
     * src="placeholder-team-member.jpg" (photo of person)
     * src="placeholder-icon-wrench.png" (graphic/icon)
     * src="placeholder-logo.svg" (logo)
   - Use descriptive naming that reflects the image content
   - Write DETAILED alt attributes that describe the ideal image (50-100 chars)
   - Alt text should include: subject, setting, mood, composition, lighting
   - Examples:
     * alt="Professional roofer inspecting shingles on residential home under clear blue sky"
     * alt="Close-up of hands installing metal roofing panels with power drill, safety gloves visible"
     * alt="Before and after comparison of weathered vs new roof tiles in bright daylight"
   - Use placeholders for: hero images, service photos, team photos, process diagrams, before/after images
   - Every major content section should have at least one relevant image
   - **REPEAT: NEVER use https:// URLs for images - ONLY use placeholder-*.jpg/png/svg filenames**

7. COMPLETE PAGE
   - Include <!DOCTYPE html>, <html>, <head>, and <body>
   - Add viewport meta tag for responsive design
   - Add charset and meta description

Output ONLY the HTML code, properly formatted and indented.
\`\`\`

### VALIDATION CHECKLIST:
- [ ] Page starts with hero section (NO top CTA bars/emergency banners)
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
- [ ] NO embedded forms anywhere (no data-form-embed or iframe-like injections)
- [ ] All form CTAs use onclick="window.openLeadFormModal()" - buttons only
- [ ] Multiple CTA buttons placed strategically for conversions
- [ ] ALL buttons have SVG icons (w-6 h-6 size ONLY)
- [ ] ZERO emojis in any button text
- [ ] Phone links have NO onclick handlers

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
- [ ] Page starts with hero section (NO top CTA bars/emergency banners)
- [ ] HTML and CSS are properly combined
- [ ] Page structure is complete (doctype through closing html tag)
- [ ] NO custom HTML forms (only data-form-embed placeholders)
- [ ] At least ONE on-page form embed present in a prominent section
- [ ] All template variables are in {{variable}} format
- [ ] No placeholder or dummy content remains
- [ ] Code is properly formatted and indented
- [ ] ALL buttons have SVG icons (w-6 h-6 size - consistent throughout)
- [ ] ZERO emojis in button text
- [ ] Phone links use pure tel: with NO onclick handlers

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
    "id": "USE_supabaseData.id_OR_supabaseData.pageRowId",
    "updates": {
      "FIELD_NAME_FROM_supabaseData.field": "PLACE_THE_COMPLETE_HTML_PAGE_HERE_AS_A_STRING"
    }
  },
  "table": "VALUE_FROM_supabaseData.table"
}
\`\`\`

### CRITICAL FORMATTING REQUIREMENTS:

1. **Extract the ID**: Use \`supabaseData.id\` or \`supabaseData.pageRowId\` value for the \`"id"\` field
2. **Place HTML**: Put the ENTIRE final assembled HTML page (with embedded CSS) inside the field specified by \`supabaseData.field\` as a plain string
3. **Table name**: Use \`supabaseData.table\` value for the \`"table"\` field (will be "static_pages" for static pages, "templates" for service pages)
4. **Field name**: Use \`supabaseData.field\` value as the key in the updates object (will be "content_html_draft" for static pages, "template_html_draft" for service pages)
5. **No escaping**: Do NOT escape quotes or special characters in the HTML - send it as a raw string
6. **Complete structure**: Include the entire HTML from \`<!DOCTYPE html>\` through closing \`</html>\` tag
7. **NO MARKDOWN**: DO NOT wrap the HTML in markdown code fences like \`\`\`html or \`\`\`css - output RAW HTML ONLY
8. **NO CODE BLOCKS**: The HTML must start directly with \`<!DOCTYPE html>\` NOT with \`\`\`html

### EXAMPLE OUTPUT FOR STATIC PAGES:

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

### EXAMPLE OUTPUT FOR SERVICE TEMPLATE PAGES:

\`\`\`json
{
  "data": {
    "id": "c95f9a73-09da-4dbc-817f-1da0f97adc33",
    "updates": {
      "template_html_draft": "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>{{service_name}} in {{city_name}}</title><style>body { margin: 0; font-family: Arial, sans-serif; } .hero { padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }</style></head><body><section class=\"hero\"><h1>{{service_name}} in {{city_name}}</h1><p>Professional service for your home</p></section></body></html>"
    }
  },
  "table": "templates"
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

## EMOJI USAGE GUIDELINES (APPLIES TO ALL STAGES):
- Sprinkle 2-4 emojis per page section for visual interest
- Use in: Hero headlines, section titles, feature lists, call-to-actions
- Examples: "🏠 Your Dream Home" | "✨ Premium Quality" | "📞 Call Now"
- Keep it professional and tasteful - avoid emoji overload
- Emojis should complement, not replace, professional copy

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
    const { 
      companyData, 
      socialMedia, 
      aiTraining, 
      systemInstructions, 
      userPrompt, 
      supabaseData,
      includeImages = false,
      needsResearch = false,
      serviceInstructions, // Optional: MD instructions for service pages
      systemRevisionInstructions, // Optional: Modernization instructions for service pages
      useTestWebhook = true // Default to test webhook
    } = await req.json();

    // Get webhook URL from environment based on mode
    const webhookUrl = useTestWebhook 
      ? Deno.env.get('TEST_WEBHOOK_PAGE_BUILDER')
      : Deno.env.get('PRODUCTION_WEBHOOK_PAGE_BUILDER');
    
    if (!webhookUrl) {
      const webhookType = useTestWebhook ? 'test' : 'production';
      console.error(`${webhookType.toUpperCase()}_WEBHOOK_PAGE_BUILDER secret not configured`);
      return new Response(
        JSON.stringify({ error: `${webhookType} webhook URL not configured` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Choose instructions based on includeImages flag
    const builderInstructions = includeImages ? stage1Instructions : stageInstructionsNoImages;
    
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
            content: builderInstructions,
            type: "builder_stages",
            length: builderInstructions?.length || null
          },
          stage1Task: {
            content: stage1Task,
            type: "stage_1_task",
            length: stage1Task?.length || null
          },
          stage2Task: {
            content: stage2Task,
            type: "stage_2_task",
            length: stage2Task?.length || null
          },
          stage3Task: {
            content: stage3Task,
            type: "stage_3_task",
            length: stage3Task?.length || null
          },
          stage4Task: {
            content: stage4Task,
            type: "stage_4_task",
            length: stage4Task?.length || null
          },
          // Only include imageGenInstructions if images are enabled
          ...(includeImages && {
            imageGenInstructions: {
              content: imageGenInstructions || "",
              type: "image_generation",
              length: imageGenInstructions?.length || null
            }
          }),
          // Include serviceInstructions if provided (for service pages)
          ...(serviceInstructions && {
            serviceInstructions: {
              content: serviceInstructions,
              type: "service_instructions",
              length: serviceInstructions?.length || null
            }
          }),
          // Include systemRevisionInstructions if provided (for service pages)
          ...(systemRevisionInstructions && {
            systemRevisionInstructions: {
              content: systemRevisionInstructions,
              type: "system_revision_instructions",
              length: systemRevisionInstructions?.length || null
            }
          }),
          // Include servicePageDynamicCopyInstructions for service template pages
          ...(supabaseData?.pageType === 'service' && {
            servicePageDynamicCopyInstructions: {
              content: `# DYNAMIC SERVICE PAGE COPY GUIDELINES

**CRITICAL CONTEXT**: This service template page will be displayed in TWO scenarios:
1. **Generic Service Page** (/services/{service}) - With NO city-specific variables (all {{city_name}}, {{display_name}}, {{local_description}}, etc. will be BLANK)
2. **City-Specific Page** (/services/{service}/{city}) - With city-specific variables populated

## YOUR COPYWRITING TASK:

Write copy that reads naturally and professionally in BOTH scenarios. The reader should never feel like content is missing or incomplete when viewing the generic service page.

### STRATEGIES FOR DUAL-CONTEXT COPY:

**1. USE CONDITIONAL PHRASING:**
- ✅ GOOD: "Serving homeowners across the region" (works with or without city)
- ✅ GOOD: "Trusted by local communities" (works universally)
- ❌ BAD: "Serving homeowners in" (reads incomplete without city name)

**2. MAKE CITY REFERENCES ADDITIVE, NOT REQUIRED:**
- ✅ GOOD: "Professional service {{#if city_name}}in {{city_name}}{{/if}}" 
- ✅ GOOD: "Expert solutions for your home{{#if city_name}} in {{city_name}}{{/if}}"
- Place city references where their absence doesn't break sentence flow

**3. WRITE STRONG STANDALONE SENTENCES:**
- Focus on service quality, expertise, process, and benefits
- City-specific details should enhance, not define, the core message
- Headlines should be compelling without needing city context

**4. USE SMART VARIABLE PLACEMENT:**
- Place city/area variables at the END of sentences when possible
- Avoid starting sentences with city variables
- Use variables in supplementary phrases, not core statements

### EXAMPLES:

**HERO SECTION:**
- ✅ "Professional Roofing Services" (headline works everywhere)
- ✅ "Get a free quote for your home{{#if city_name}} in {{city_name}}{{/if}}" (CTA works with or without)
- ❌ "{{city_name}} Roofing Experts" (broken without city)

**SERVICE DESCRIPTIONS:**
- ✅ "We provide expert installations backed by industry certifications{{#if local_description}}. {{local_description}}{{/if}}"
- ✅ "Trusted by homeowners{{#if city_name}} throughout {{city_name}}{{/if}} for quality workmanship"
- ❌ "Providing service to {{city_name}} residents" (incomplete without city)

**BENEFITS/FEATURES:**
- ✅ "Fast response times" (universal benefit)
- ✅ "{{#if response_time}}{{response_time}} response time{{else}}Rapid service when you need it{{/if}}"
- Use fallback copy for conditional variables

### VALIDATION CHECKLIST:
Before finalizing copy, mentally remove ALL city/area variables and read it through:
- [ ] Does every sentence still make grammatical sense?
- [ ] Are there any awkward gaps or incomplete thoughts?
- [ ] Does the page still convey value and professionalism?
- [ ] Would a reader on the generic page feel well-informed?

**REMEMBER**: The generic service page is NOT inferior—it's an overview showcasing your expertise. The city-specific page adds localized context. Both should feel complete and professional.`,
              type: "service_page_copy_guidelines",
              length: null
            }
          }),
          supabaseData: {
            pageType: supabaseData?.pageType || "",
            pageTitle: supabaseData?.pageTitle || "",
            table: supabaseData?.table || "",
            id: supabaseData?.id || supabaseData?.pageRowId || "",
            pageId: supabaseData?.pageId || "",
            pageRowId: supabaseData?.pageRowId || "",
            field: supabaseData?.field || "",
          includeImages: includeImages,
          needsResearch: needsResearch
        },
        researchPrompt: needsResearch ? `You are a research assistant preparing context for a page builder automation.

TASK:
1. Examine the company data provided to understand the business, its services, brand voice, and positioning.
2. Examine the user's prompt to understand what page they want built.
3. Conduct research on the topic to gather relevant information, best practices, and content ideas.
4. Rebuild the user's prompt into a detailed, descriptive prompt that provides comprehensive context for the 4-stage AI page builder (Wireframe → Copywriting → HTML Structure → CSS Styling).

CRITICAL OUTPUT REQUIREMENTS:
- Your output must be ONLY the rebuilt prompt text
- Do NOT include any introductory text like "Here is the rebuilt prompt:" or "Based on my research:"
- Do NOT include any concluding remarks or explanations
- Your entire response will be fed directly into the next AI agent as the user prompt
- The rebuilt prompt should be detailed, specific, and actionable for page building

Your rebuilt prompt should include:
- Page purpose and goals
- Target audience insights
- Key messaging points based on company data
- Structural recommendations (sections, layout suggestions)
- Content themes and topics to cover
- SEO considerations
- Calls-to-action aligned with business objectives` : undefined,
        output_tokens: 150000
      }
      }
    ];

    console.log('Sending webhook to n8n:', {
      webhookType: useTestWebhook ? 'TEST' : 'PRODUCTION',
      url: webhookUrl.substring(0, 50) + '...',
      hasCompanyData: !!companyData,
      hasSocialMedia: !!socialMedia,
      hasAiTraining: !!aiTraining,
      hasSystemInstructions: !!systemInstructions,
      hasServiceInstructions: !!serviceInstructions,
      hasSystemRevisionInstructions: !!systemRevisionInstructions,
      includeImages,
      needsResearch,
      hasResearchPrompt: needsResearch,
      supabaseData,
      timestamp: new Date().toISOString()
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

    const webhookType = useTestWebhook ? 'test' : 'production';
    console.log(`Webhook sent successfully to ${webhookType} endpoint`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Webhook sent to ${webhookType} endpoint successfully`,
        webhookType,
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
