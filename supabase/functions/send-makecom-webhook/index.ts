import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image Generation Instructions
const imageGenInstructions = `# IMAGE GENERATION TASK

## ROLE
You are an image prompt generator. Analyze Stage 3 HTML output, identify all \`<img>\` placeholder tags, and generate photorealistic image prompts for each.

## OUTPUT FORMAT
**Pure JSON array only.** No markdown, no backticks, no explanatory text. Output starts with \`[\` and ends with \`]\`.

---

## JSON STRUCTURE

Each object has exactly two keys:

| Key | Value |
|-----|-------|
| \`location\` | Exact \`src\` attribute value (e.g., \`"placeholder-hero.jpg"\`) |
| \`prompt\` | Photorealistic image generation prompt (150-250 chars) |

---

## PROMPT FORMULA

Follow this structure for every prompt:

\`\`\`
"Photorealistic photograph of [SUBJECT] [ACTION/STATE], [SETTING], [LIGHTING], [COMPOSITION], [QUALITY MARKERS]"
\`\`\`

**Components:**
- **SUBJECT**: Who/what is the main focus
- **ACTION/STATE**: What they're doing or the condition shown
- **SETTING**: Where (indoor/outdoor, location type)
- **LIGHTING**: Natural daylight, studio, golden hour, etc.
- **COMPOSITION**: Wide angle, close-up, overhead, etc.
- **QUALITY MARKERS**: "high detail", "sharp focus", "professional quality"

---

## INDUSTRY-SPECIFIC GUIDANCE

| Industry | Include in Prompts |
|----------|-------------------|
| Roofing/Construction | Safety equipment, hard hats, professional tools, clean work site |
| Home Services | Uniformed workers, branded vehicles, residential settings |
| Professional/Business | Modern office, diverse professionals, natural lighting |
| Before/After | Split composition, clear contrast, same angle both sides |

---

## EXAMPLE OUTPUT

\`\`\`json
[
  {
    "location": "placeholder-hero.jpg",
    "prompt": "Photorealistic photograph of professional roofer inspecting shingles on suburban home, clear blue sky, wide angle from ground level, natural daylight, sharp focus, high detail"
  },
  {
    "location": "placeholder-service-1.jpg",
    "prompt": "Photorealistic close-up of gloved hands installing metal roofing panels with cordless drill, bright daylight, shallow depth of field, professional quality"
  },
  {
    "location": "placeholder-team.jpg",
    "prompt": "Photorealistic group photo of diverse roofing crew standing by company truck, wearing safety vests and hard hats, smiling, outdoor natural lighting, medium shot"
  }
]
\`\`\`

---

## PLACEHOLDER NAMING CONVENTIONS

Match file extensions to content type:
| Extension | Use For |
|-----------|---------|
| \`.jpg\` | Photos of people, buildings, landscapes, real scenes |
| \`.png\` | Graphics, icons, diagrams, illustrations |
| \`.svg\` | Logos, simple vector graphics |

---

## CRITICAL RULES

- ✅ Start output with \`[\` — no text before it
- ✅ End output with \`]\` — no text after it
- ✅ Include ALL placeholder images found in HTML
- ✅ Use exact \`src\` value for \`location\` field
- ✅ Prompts must be 150-250 characters
- ✅ Always start prompts with "Photorealistic photograph of..."
- ❌ NO markdown code fences (\` \`\`\` \`)
- ❌ NO backticks anywhere
- ❌ NO line numbers or comments
- ❌ NO explanatory text

---

## CONTEXT VARIABLES

When tailoring prompts to the business:
| Variable | Use |
|----------|-----|
| \`{{business_name}}\` | Company name (for branded elements) |
| \`{{service_name}}\` | Current service being shown |
| \`{{service_description}}\` | Service details for context |

---

## ANTI-HALLUCINATION CHECKLIST

Before outputting, verify:
- [ ] Every \`location\` matches an actual \`src\` attribute from the HTML
- [ ] No invented placeholder names
- [ ] No external URLs in location field
- [ ] Prompts describe realistic, achievable photographs
- [ ] No copyrighted characters, logos, or brand names in prompts

---

## VALIDATION CHECKLIST

- [ ] Output is valid JSON (parseable)
- [ ] First character is \`[\`
- [ ] Last character is \`]\`
- [ ] Every object has exactly \`location\` and \`prompt\` keys
- [ ] All prompts start with "Photorealistic photograph of..."
- [ ] All prompts are 150-250 characters
- [ ] No markdown formatting present
- [ ] If no placeholders found, output is \`[]\`

---

## EDGE CASES

| Scenario | Action |
|----------|--------|
| No \`<img>\` placeholders found | Output: \`[]\` |
| Placeholder has no \`alt\` text | Infer from surrounding HTML context |
| Ambiguous image purpose | Default to professional, industry-appropriate scene |`;

// Stage Instructions without Images
const stageInstructionsNoImages = `# MULTI-STAGE WEB PAGE BUILDER — NO IMAGES MODE

## ROLE
You are building professional web pages WITHOUT photo placeholders. Focus on compelling copy, inline SVG icons, and strategic emoji placement for visual interest. Execute stages sequentially — do not proceed until current stage passes validation.

## OUTPUT FORMAT
- **Stages 1-2**: Structured planning documents
- **Stages 3-4**: Full HTML document starting with `<!DOCTYPE html>` — NO markdown code fences

---

## VARIABLE REFERENCE

| Variable | Purpose |
|----------|---------|
| `{{business_name}}` | Company name |
| `{{business_slogan}}` | Tagline |
| `{{phone}}` | Phone number |
| `{{email}}` | Email address |
| `{{address}}` | Full address |
| `{{address_city}}` | City |
| `{{address_state}}` | State abbreviation |
| `{{years_experience}}` | Years in business |
| `{{description}}` | Company description |
| `{{logo_url}}` | Logo URL |
| `{{service_name}}` | Service name (service pages) |
| `{{service_slug}}` | URL-safe service name (service pages) |
| `{{service_description}}` | Service description (service pages) |
| `{{city_name}}` | City name (location pages) |
| `{{city_slug}}` | URL-safe city name (location pages) |
| `{{state}}` | State abbreviation (location pages) |
| `{{zip_code}}` | ZIP code (location pages) |
| `{{display_name}}` | Formatted area display name (location pages) |

---

## CSS CUSTOM PROPERTIES

| Property | Purpose |
|----------|---------|
| `var(--color-primary)` | Primary brand color |
| `var(--color-secondary)` | Secondary color |
| `var(--color-accent)` | Accent color |
| `var(--color-cta)` | CTA button color |
| `var(--radius-button)` | Button border radius |
| `var(--radius-card)` | Card border radius |

---

## REQUIRED PATTERNS

### Button Pattern (MANDATORY)
ALL buttons must use inline SVG icons. NO emojis in button text.
```html
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  Call Now
</a>
```

### Form CTA Pattern
NEVER build custom HTML forms. Use modal trigger only:
```html
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/>
  </svg>
  Get Free Quote
</button>
```

### Phone Links vs Form CTAs
| Type | Has `onclick`? | Has `href="tel:"`? |
|------|---------------|-------------------|
| Phone button | ❌ NO | ✅ YES |
| Form CTA | ✅ YES | ❌ NO |

---

## CRITICAL RULES

### Icons
- ✅ Inline SVG with complete `d=""` path data only
- ❌ FORBIDDEN: `data-lucide`, Font Awesome, Material Icons, any CDN

### Page Structure
- ✅ First element in `<body>` must be hero `<section>`
- ❌ NO top CTA bars, emergency banners, or announcements before hero
- ❌ NO standalone centered icons above hero headlines

### Images
- ❌ NO `<img>` tags — this is icon/copy-focused mode

### Emojis
- ✅ Use 2-4 per page in section titles, feature lists, subheadings
- ❌ NEVER in hero H1 headline
- ❌ NEVER in button text
- Example: "Our Services ✨" or "Why Choose Us 🏆"

### Forms
- ❌ NEVER use `<form>`, `<input>`, `<textarea>` tags
- ❌ NEVER use `data-form-embed` or iframe-style injections
- ✅ Form CTAs use: `onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"`

---

## ANTI-HALLUCINATION CHECKLIST

Before outputting, search your response for these violations:

| Violation | Fix |
|-----------|-----|
| Any 10-digit phone pattern | Replace with `{{phone}}` |
| Any @email.com address | Replace with `{{email}}` |
| Any street address | Replace with `{{address}}` |
| Any company name | Replace with `{{business_name}}` |
| Any hex color (#ffffff) | Replace with `var(--color-*)` |
| Tailwind color classes (bg-blue-500) | Replace with CSS variables |

---

## STAGE 1: WIREFRAME

### Task
Create structural blueprint — NO code.

### Required Sections
1. **Page Layout**: Hero, 3-5 content sections, footer structure
2. **Content Blocks**: Name, purpose, information for each block; icon placement strategy
3. **Information Hierarchy**: Primary → secondary → supporting messages
4. **CTA Strategy**: Primary/secondary CTA placements with icon usage
5. **Navigation**: Main nav items, footer nav

### Validation
- [ ] All 5 sections present
- [ ] At least 3 content sections defined
- [ ] Icon strategy outlined (where icons replace image weight)
- [ ] Emoji placement identified (NOT in hero H1)
- [ ] NO image/photo placeholders mentioned

---

## STAGE 2: COPYWRITING

### Task
Write all copy based on approved wireframe.

### Required Content
1. **Headlines**: H1 (no emoji at start), H2s (2-3 with emojis), H3s
2. **Body Copy**: Complete text for each content block, brand voice matched
3. **CTAs**: Button text (no emojis), supporting microcopy
4. **Navigation**: Menu labels, button labels
5. **Meta**: Page title, meta description (150-160 chars)

### Validation
- [ ] Copy for every wireframe block
- [ ] H1 is compelling, contains primary keyword, NO leading emoji
- [ ] 2-4 emojis in section titles/lists (not hero H1, not buttons)
- [ ] Clear action-oriented CTAs

---

## STAGE 3: HTML STRUCTURE

### Task
Build complete HTML from `<!DOCTYPE html>` to `</html>`.

### Requirements
- Use all Handlebars variables for business data
- Use CSS custom properties for colors
- Inline SVG icons only (minimum 6-8 throughout page)
- Include emojis from Stage 2 copy
- Multiple form CTA buttons (hero, mid-page, footer)
- Semantic HTML5 structure

### Validation
- [ ] Starts with hero section (no top bars/banners)
- [ ] NO `<img>` tags
- [ ] NO `<form>` tags or form inputs
- [ ] All form CTAs use `if(window.openLeadFormModal) window.openLeadFormModal('Button Text')`
- [ ] ALL buttons have inline SVG icons
- [ ] ZERO emojis in button text
- [ ] All company data uses `{{variable}}` format
- [ ] Phone links have NO onclick handlers

---

## STAGE 4: CSS STYLING

### Task
Create comprehensive responsive CSS embedded in `<style>` within `<head>`.

### Requirements
- Mobile-first with breakpoints: 768px, 1024px, 1280px
- All colors via CSS custom properties
- Icon containers styled prominently (backgrounds, shadows)
- Hover/focus/active states for interactive elements
- Consistent spacing and typography

### Validation
- [ ] All HTML classes styled
- [ ] Responsive media queries included
- [ ] Icon styling is visually prominent
- [ ] Color contrast meets accessibility standards

---

## EXECUTION ORDER

1. Stage 1 → Validate → Store as `STAGE_1_WIREFRAME`
2. Stage 2 (include Stage 1) → Validate → Store as `STAGE_2_COPY`
3. Stage 3 (include Stages 1-2) → Validate → Store as `STAGE_3_HTML`
4. Stage 4 (include Stages 1,3) → Validate → Embed CSS in HTML
5. Final Assembly → Return complete page

**Do not proceed to next stage until current stage passes validation.**`;

// Stage-Specific Task Instructions - WITH IMAGES
const stage1TaskWithImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Complete your entire wireframe in one response - no partial outputs.

TASK:
Based on all the context provided, create a detailed wireframe and content structure for the web page requested by the user. Your output must include:

1. PAGE LAYOUT STRUCTURE
2. CONTENT BLOCKS (identify where IMAGE PLACEHOLDERS will be needed)
3. INFORMATION HIERARCHY
4. CALL-TO-ACTION STRATEGY
5. NAVIGATION STRUCTURE

Format your response as a structured wireframe document.

CRITICAL: Complete ALL 5 sections fully. Specify image placement strategy - hero images, service photos, team photos, process diagrams, etc. This is an automation - you cannot stop mid-way or ask for more information.`;

const stage2TaskWithImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Write ALL copy completely in one response - no partial outputs or placeholders.

TASK:
Write all copy for this web page based on the approved wireframe and all the provided context. Provide:

1. HEADLINES
2. BODY COPY
3. CALLS-TO-ACTION
4. NAVIGATION & UI TEXT
5. META CONTENT
6. IMAGE ALT TEXT SUGGESTIONS (for every image placeholder identified in wireframe)

Format each piece of copy clearly labeled by section and element type.

CRITICAL: Provide complete, polished copy for EVERY section from the wireframe, including detailed alt text descriptions for all images. This is an automation - you cannot stop mid-way or use placeholders.`;

const stage3TaskWithImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Build the COMPLETE HTML from <!DOCTYPE html> to </html> in one response.

TASK:
Build the complete HTML structure for this page. Follow all rules in the context. Use Handlebars variables for all dynamic data.

**CRITICAL IMAGE REQUIREMENTS:**
- Include <img> tags with placeholder src attributes (e.g., src="placeholder-hero.jpg")
- Write DETAILED, DESCRIPTIVE alt attributes (50-100 chars) for each image
- Use .jpg for photos, .png for graphics/icons, .svg for logos
- Place images in hero, services, team, process sections as identified in wireframe

Output ONLY the HTML code, properly formatted and indented.

CRITICAL COMPLETION REQUIREMENTS:
- Complete the ENTIRE HTML document from <!DOCTYPE html> to </html>
- Every opening tag MUST have a closing tag
- Every section MUST be fully finished - no partial sections, no abrupt endings
- This is an automation - you CANNOT stop mid-way or leave placeholders
- The HTML must end with a proper footer and closing tags, not a "dull point"
- ALL content sections from the wireframe must be present and complete
- ALL identified image placeholders must be present with detailed alt text`;

const stage4TaskWithImages = `🤖 AUTOMATION MODE: This is the FINAL stage of an automated pipeline. Output the COMPLETE, production-ready HTML page with embedded CSS.

TASK:
1. Create comprehensive, responsive, mobile-first CSS to style the provided HTML.
2. Use the provided CSS variables from the DESIGN CONTEXT for all colors and design tokens.
3. Follow all rules from the SYSTEM INSTRUCTIONS regarding CSS variables, Tailwind usage, and responsive design.
4. Style all image elements with proper sizing, object-fit, borders, shadows as appropriate.
5. Embed the generated CSS inside a <style> tag within the <head> section of the original HTML.
6. Output ONLY the complete, final HTML file with the embedded CSS. Do not add any markdown or explanations.

CRITICAL COMPLETION REQUIREMENTS:
- Output the ENTIRE styled HTML document from <!DOCTYPE html> to </html>
- All CSS must be properly embedded in the <head> section
- Every section must have complete styles - no missing or incomplete CSS rules
- Image styling must be complete (responsive, proper aspect ratios, loading states)
- This is an automation - this MUST be the final, complete, production-ready page
- The output must end with a proper closing </html> tag, not a partial page
- Double-check that ALL sections from previous stages are present and styled`;

// Stage-Specific Task Instructions - WITHOUT IMAGES (Icon & Copy Focused)
const stage1TaskNoImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Complete your entire wireframe in one response - no partial outputs.

TASK:
Based on all the context provided, create a detailed wireframe and content structure for the web page requested by the user. Your output must include:

1. PAGE LAYOUT STRUCTURE
2. CONTENT BLOCKS (identify where ICONS and EMOJIS will enhance content - NO image placeholders)
3. INFORMATION HIERARCHY
4. CALL-TO-ACTION STRATEGY (emphasize icon usage in CTAs)
5. NAVIGATION STRUCTURE

Format your response as a structured wireframe document.

CRITICAL: Complete ALL 5 sections fully. Focus on ICON STRATEGY and EMOJI PLACEMENT instead of images. Specify which sections use Lucide icons. This is an automation - you cannot stop mid-way or ask for more information.`;

const stage2TaskNoImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Write ALL copy completely in one response - no partial outputs or placeholders.

TASK:
Write all copy for this web page based on the approved wireframe and all the provided context. Provide:

1. HEADLINES (include emoji placement - NOT in hero H1, but in section titles)
2. BODY COPY (rich, engaging paragraphs with strategic emoji use)
3. CALLS-TO-ACTION (with emoji suggestions for buttons where appropriate)
4. NAVIGATION & UI TEXT
5. META CONTENT

Format each piece of copy clearly labeled by section and element type.

CRITICAL: Provide complete, polished copy for EVERY section from the wireframe. Use 2-4 emojis throughout for visual interest. This is an automation - you cannot stop mid-way or use placeholders.`;

const stage3TaskNoImages = `🤖 AUTOMATION MODE: This is part of an automated pipeline. Build the COMPLETE HTML from <!DOCTYPE html> to </html> in one response.

TASK:
Build the complete HTML structure for this page. Follow all rules in the context. Use Handlebars variables for all dynamic data.

**CRITICAL NO-IMAGE REQUIREMENTS:**
- **DO NOT** include any <img> tags for photos or placeholders
- **USE** Lucide icons extensively via data-lucide attributes or inline SVG
- **INCLUDE** emojis from Stage 2 copy in the HTML
- **FOCUS** on icon-driven design and compelling copy instead of images

Output ONLY the HTML code, properly formatted and indented.

CRITICAL COMPLETION REQUIREMENTS:
- Complete the ENTIRE HTML document from <!DOCTYPE html> to </html>
- Every opening tag MUST have a closing tag
- Every section MUST be fully finished - no partial sections, no abrupt endings
- This is an automation - you CANNOT stop mid-way or leave placeholders
- The HTML must end with a proper footer and closing tags, not a "dull point"
- ALL content sections from the wireframe must be present and complete
- NO <img> tags present anywhere`;

const stage4TaskNoImages = `🤖 AUTOMATION MODE: This is the FINAL stage of an automated pipeline. Output the COMPLETE, production-ready HTML page with embedded CSS.

TASK:
1. Create comprehensive, responsive, mobile-first CSS to style the provided HTML.
2. Use the provided CSS variables from the DESIGN CONTEXT for all colors and design tokens.
3. Follow all rules from the SYSTEM INSTRUCTIONS regarding CSS variables, Tailwind usage, and responsive design.
4. Style all icon elements with backgrounds, shadows, gradients to make them visually prominent.
5. Embed the generated CSS inside a <style> tag within the <head> section of the original HTML.
6. Output ONLY the complete, final HTML file with the embedded CSS. Do not add any markdown or explanations.

CRITICAL COMPLETION REQUIREMENTS:
- Output the ENTIRE styled HTML document from <!DOCTYPE html> to </html>
- All CSS must be properly embedded in the <head> section
- Every section must have complete styles - no missing or incomplete CSS rules
- Icon styling must be prominent and attractive (replace visual weight of images)
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
            content: includeImages ? stage1TaskWithImages : stage1TaskNoImages,
            type: "stage_1_task",
            length: includeImages ? stage1TaskWithImages?.length || null : stage1TaskNoImages?.length || null
          },
          stage2Task: {
            content: includeImages ? stage2TaskWithImages : stage2TaskNoImages,
            type: "stage_2_task",
            length: includeImages ? stage2TaskWithImages?.length || null : stage2TaskNoImages?.length || null
          },
          stage3Task: {
            content: includeImages ? stage3TaskWithImages : stage3TaskNoImages,
            type: "stage_3_task",
            length: includeImages ? stage3TaskWithImages?.length || null : stage3TaskNoImages?.length || null
          },
          stage4Task: {
            content: includeImages ? stage4TaskWithImages : stage4TaskNoImages,
            type: "stage_4_task",
            length: includeImages ? stage4TaskWithImages?.length || null : stage4TaskNoImages?.length || null
          },
          // Only include imageGenInstructions if images are enabled
          ...(includeImages && {
            imageGenInstructions: {
              content: imageGenInstructions || "",
              type: "image_generation",
              length: imageGenInstructions?.length || null
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
