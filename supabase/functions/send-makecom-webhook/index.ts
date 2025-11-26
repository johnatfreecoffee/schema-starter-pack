import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
- **Stages 3-4**: Full HTML document starting with \`<!DOCTYPE html>\` — NO markdown code fences

---

## VARIABLE REFERENCE

| Variable | Purpose |
|----------|---------|
| \`{{business_name}}\` | Company name |
| \`{{business_slogan}}\` | Tagline |
| \`{{phone}}\` | Phone number |
| \`{{email}}\` | Email address |
| \`{{address}}\` | Full address |
| \`{{address_city}}\` | City |
| \`{{address_state}}\` | State abbreviation |
| \`{{years_experience}}\` | Years in business |
| \`{{description}}\` | Company description |
| \`{{logo_url}}\` | Logo URL |
| \`{{service_name}}\` | Service name (service pages) |
| \`{{service_slug}}\` | URL-safe service name (service pages) |
| \`{{service_description}}\` | Service description (service pages) |
| \`{{city_name}}\` | City name (location pages) |
| \`{{city_slug}}\` | URL-safe city name (location pages) |
| \`{{state}}\` | State abbreviation (location pages) |
| \`{{zip_code}}\` | ZIP code (location pages) |
| \`{{display_name}}\` | Formatted area display name (location pages) |

---

## CSS CUSTOM PROPERTIES

| Property | Purpose |
|----------|---------|
| \`var(--color-primary)\` | Primary brand color |
| \`var(--color-secondary)\` | Secondary color |
| \`var(--color-accent)\` | Accent color |
| \`var(--color-cta)\` | CTA button color |
| \`var(--radius-button)\` | Button border radius |
| \`var(--radius-card)\` | Card border radius |

---

## REQUIRED PATTERNS

### Button Pattern (MANDATORY)
ALL buttons must use inline SVG icons. NO emojis in button text.
\`\`\`html
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  Call Now
</a>
\`\`\`

### Form CTA Pattern
NEVER build custom HTML forms. Use modal trigger only:
\`\`\`html
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/>
  </svg>
  Get Free Quote
</button>
\`\`\`

### Phone Links vs Form CTAs
| Type | Has \`onclick\`? | Has \`href="tel:"\`? |
|------|---------------|-------------------|
| Phone button | ❌ NO | ✅ YES |
| Form CTA | ✅ YES | ❌ NO |

---

## CRITICAL RULES

### Icons
- ✅ Inline SVG with complete \`d=""\` path data only
- ❌ FORBIDDEN: \`data-lucide\`, Font Awesome, Material Icons, any CDN

### Page Structure
- ✅ First element in \`<body>\` must be hero \`<section>\`
- ❌ NO top CTA bars, emergency banners, or announcements before hero
- ❌ NO standalone centered icons above hero headlines

### Images
- ❌ NO \`<img>\` tags — this is icon/copy-focused mode

### Emojis
- ✅ Use 2-4 per page in section titles, feature lists, subheadings
- ❌ NEVER in hero H1 headline
- ❌ NEVER in button text
- Example: "Our Services ✨" or "Why Choose Us 🏆"

### Forms
- ❌ NEVER use \`<form>\`, \`<input>\`, \`<textarea>\` tags
- ❌ NEVER use \`data-form-embed\` or iframe-style injections
- ✅ Form CTAs use: \`onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"\`

---

## ANTI-HALLUCINATION CHECKLIST

Before outputting, search your response for these violations:

| Violation | Fix |
|-----------|-----|
| Any 10-digit phone pattern | Replace with \`{{phone}}\` |
| Any @email.com address | Replace with \`{{email}}\` |
| Any street address | Replace with \`{{address}}\` |
| Any company name | Replace with \`{{business_name}}\` |
| Any hex color (#ffffff) | Replace with \`var(--color-*)\` |
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
Build complete HTML from \`<!DOCTYPE html>\` to \`</html>\`.

### Requirements
- Use all Handlebars variables for business data
- Use CSS custom properties for colors
- Inline SVG icons only (minimum 6-8 throughout page)
- Include emojis from Stage 2 copy
- Multiple form CTA buttons (hero, mid-page, footer)
- Semantic HTML5 structure

### Validation
- [ ] Starts with hero section (no top bars/banners)
- [ ] NO \`<img>\` tags
- [ ] NO \`<form>\` tags or form inputs
- [ ] All form CTAs use \`if(window.openLeadFormModal) window.openLeadFormModal('Button Text')\`
- [ ] ALL buttons have inline SVG icons
- [ ] ZERO emojis in button text
- [ ] All company data uses \`{{variable}}\` format
- [ ] Phone links have NO onclick handlers

---

## STAGE 4: CSS STYLING

### Task
Create comprehensive responsive CSS embedded in \`<style>\` within \`<head>\`.

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

1. Stage 1 → Validate → Store as \`STAGE_1_WIREFRAME\`
2. Stage 2 (include Stage 1) → Validate → Store as \`STAGE_2_COPY\`
3. Stage 3 (include Stages 1-2) → Validate → Store as \`STAGE_3_HTML\`
4. Stage 4 (include Stages 1,3) → Validate → Embed CSS in HTML
5. Final Assembly → Return complete page

**Do not proceed to next stage until current stage passes validation.**`;

// =============================================================================
// STAGE-SPECIFIC TASK INSTRUCTIONS - WITH IMAGES
// =============================================================================
// These task prompts are injected into each pipeline stage.
// All stages use CANONICAL variables from the Specification Sheet.
// =============================================================================

// -----------------------------------------------------------------------------
// STAGE 1: WIREFRAME & CONTENT PLANNING
// -----------------------------------------------------------------------------
const stage1TaskWithImages = `🤖 AUTOMATION MODE: Complete entire wireframe in ONE response.

TASK: Create a detailed wireframe and content structure. Output must include:

1. PAGE LAYOUT STRUCTURE
   - Hero section with image placement
   - Main content sections (minimum 3)
   - CTA placements

2. CONTENT BLOCKS
   - Name and purpose of each block
   - IMAGE PLACEHOLDERS: Identify hero, service, team, process images
   - Special features (accordions, grids, etc.)

3. INFORMATION HIERARCHY
   - Primary message → Secondary messages → Supporting details

4. CALL-TO-ACTION STRATEGY
   - Primary CTA: Phone button with {{phone}}
   - Secondary CTAs: Form triggers using window.openLeadFormModal()

5. NAVIGATION STRUCTURE (reference only - system injects header/footer)

FORMAT: Structured wireframe document with clear section labels.

CRITICAL RULES:
- NO headers/footers (system injects these)
- All business data will use Handlebars variables ({{business_name}}, {{phone}}, etc.)
- Identify 3-6 image placements with descriptive purposes
- Complete ALL 5 sections - no partial outputs`;

// -----------------------------------------------------------------------------
// STAGE 2: COPYWRITING
// -----------------------------------------------------------------------------
const stage2TaskWithImages = `🤖 AUTOMATION MODE: Write ALL copy in ONE response.

TASK: Write all copy based on the approved wireframe. Provide:

1. HEADLINES
   - H1: Primary headline (one only)
   - H2s: Section headlines
   - H3s: Sub-headlines where needed

2. BODY COPY
   - Complete copy for each content block
   - Match brand voice from context
   - Use {{business_name}} for company references
   - Use {{years_experience}} for experience claims

3. CALLS-TO-ACTION
   - Phone CTA: "Call {{phone}}" or "Call Now"
   - Form CTAs: "Get Free Quote", "Schedule Service", etc.
   - NO hardcoded phone numbers or company names

4. IMAGE ALT TEXT (CRITICAL)
   For each image placeholder, write:
   - Detailed description (50-100 characters)
   - Subject, setting, mood, lighting
   - Example: "Professional roofer inspecting shingles on residential home, clear blue sky"

5. META CONTENT
   - Page title: Include {{business_name}} and primary keyword
   - Meta description: 150-160 characters

FORMAT: Label each piece by section and element type.

ANTI-HALLUCINATION CHECK:
Before finalizing, verify NO hardcoded:
- Phone numbers (use {{phone}})
- Email addresses (use {{email}})
- Company names (use {{business_name}})
- Street addresses (use {{address}} or components)
- Years in business (use {{years_experience}})`;

// -----------------------------------------------------------------------------
// STAGE 3: HTML STRUCTURE
// -----------------------------------------------------------------------------
const stage3TaskWithImages = `🤖 AUTOMATION MODE: Build COMPLETE HTML from <!DOCTYPE html> to </html>.

OUTPUT FORMAT: Full HTML Document starting with <!DOCTYPE html>
NO markdown code fences. NO explanatory text. RAW HTML ONLY.

═══════════════════════════════════════════════════════════════════════════════
CANONICAL VARIABLES - USE EXACTLY AS SHOWN
═══════════════════════════════════════════════════════════════════════════════

Company Data:
{{business_name}}     {{phone}}              {{email}}
{{address}}           {{address_city}}       {{address_state}}
{{business_slogan}}   {{years_experience}}   {{description}}
{{logo_url}}          {{website_url}}

Service Pages Only:
{{service_name}}      {{service_slug}}       {{service_description}}

Location Pages Only:
{{city_name}}         {{city_slug}}          {{state}}
{{zip_code}}          {{display_name}}

═══════════════════════════════════════════════════════════════════════════════
CSS CUSTOM PROPERTIES - DEFINE IN :root
═══════════════════════════════════════════════════════════════════════════════

:root {
  --color-primary: {{siteSettings.primary_color}};
  --color-secondary: {{siteSettings.secondary_color}};
  --color-accent: {{siteSettings.accent_color}};
  --radius-button: {{siteSettings.button_border_radius}};
  --radius-card: {{siteSettings.card_border_radius}};
}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED PATTERNS
═══════════════════════════════════════════════════════════════════════════════

BUTTON PATTERN (all buttons must follow):
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  Call {{phone}}
</a>

FORM CTA PATTERN (no custom forms - modal only):
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
  Get Free Quote
</button>

IMAGE PLACEHOLDER PATTERN:
<img src="placeholder-hero.jpg" alt="Professional roofer inspecting shingles on residential home under clear blue sky" style="width: 100%; height: auto; object-fit: cover; border-radius: var(--radius-card);">

File extensions:
- .jpg = photos (people, buildings, scenes)
- .png = graphics, icons, illustrations
- .svg = logos only

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════════════════════

✓ Page starts with hero section (NO top bars, NO emergency banners)
✓ NO <header> or <footer> tags (system injects these)
✓ NO custom <form> elements (use window.openLeadFormModal() only)
✓ ALL icons must be inline SVG (NO data-lucide, NO Font Awesome, NO CDNs)
✓ ALL buttons use: inline-flex items-center gap-2 text-base
✓ Phone links: href="tel:{{phone}}" with NO onclick
✓ Form CTAs: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')" 
✓ ALL colors use CSS variables (NO hex codes, NO Tailwind colors)

═══════════════════════════════════════════════════════════════════════════════
ANTI-HALLUCINATION SELF-CHECK
═══════════════════════════════════════════════════════════════════════════════

Before output, search for and REPLACE any:
❌ 10-digit phone patterns → {{phone}}
❌ @email.com addresses → {{email}}
❌ Street addresses with numbers → {{address}}
❌ Hex color codes (#fff, #000) → var(--color-*)
❌ Tailwind colors (bg-blue-500) → var(--color-*)
❌ Hardcoded company names → {{business_name}}
❌ "XX years" claims → {{years_experience}} years

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

[ ] Starts with <!DOCTYPE html> (no markdown)
[ ] Page begins with hero <section> (no top bars)
[ ] NO <header> or <footer> tags
[ ] All business data uses Handlebars variables
[ ] All colors use CSS custom properties
[ ] All icons are inline SVG (complete path data)
[ ] Phone buttons have tel: href, NO onclick
[ ] Form CTAs use window.openLeadFormModal()
[ ] All images have descriptive alt text (50-100 chars)
[ ] Proper heading hierarchy (one H1, then H2s, H3s)
[ ] Complete document from <!DOCTYPE html> to </html>`;

// -----------------------------------------------------------------------------
// STAGE 4: CSS STYLING
// -----------------------------------------------------------------------------
const stage4TaskWithImages = `🤖 AUTOMATION MODE: Output COMPLETE production-ready HTML with embedded CSS.

OUTPUT FORMAT: Full HTML Document with <style> in <head>
NO markdown code fences. NO explanatory text. RAW HTML ONLY.

TASK:
1. Create responsive, mobile-first CSS for the provided HTML
2. Use CSS variables from :root for ALL colors and design tokens
3. Style all images with proper sizing, object-fit, border-radius
4. Embed CSS in <style> tag within <head>
5. Output the complete, final HTML file

═══════════════════════════════════════════════════════════════════════════════
CSS REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

REQUIRED CSS VARIABLES (reference, not redefine):
var(--color-primary)    var(--color-secondary)    var(--color-accent)
var(--radius-button)    var(--radius-card)

ACCORDION CSS (required):
.accordion-content { 
  max-height: 0; 
  overflow: hidden; 
  transition: max-height 0.3s ease; 
}
.accordion-content.active { 
  max-height: 2000px; 
}
.accordion-header svg { 
  transition: transform 0.3s ease; 
}

BUTTON CSS (required):
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-button);
  transition: all 0.3s ease;
  text-decoration: none;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

IMAGE CSS (required):
img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: var(--radius-card);
}

RESPONSIVE BREAKPOINTS:
@media (min-width: 768px) { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1280px) { /* large */ }

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

[ ] CSS embedded in <style> within <head>
[ ] All colors use var(--color-*) (NO hex codes)
[ ] Responsive media queries included
[ ] Button hover/focus states defined
[ ] Accordion CSS included (if accordions used)
[ ] Image styling complete (responsive, object-fit)
[ ] Complete document from <!DOCTYPE html> to </html>
[ ] NO markdown code fences in output
[ ] Ends with proper </html> tag`;

// These constants are used within this file - no export needed

// Stage-Specific Task Instructions - WITHOUT IMAGES (Icon & Copy Focused)
// Optimized version - uses canonical variables and inline SVG only

// ============================================================================
// STAGE 1: WIREFRAME & CONTENT PLANNING
// ============================================================================
const stage1TaskNoImages = `🤖 AUTOMATION MODE: Complete entire wireframe in ONE response.

TASK: Create a detailed wireframe for the requested page. Include ALL 5 sections:

1. PAGE LAYOUT STRUCTURE
   - Hero section (NO centered icon containers at top)
   - Main content sections (3-5 minimum)
   - CTA placements throughout

2. CONTENT BLOCKS
   - Name and purpose of each block
   - Icon placement strategy (inline SVG only)
   - NO image placeholders

3. INFORMATION HIERARCHY
   - Primary message first
   - Supporting content prioritized
   - Emoji placement (section titles only, NOT hero H1)

4. CALL-TO-ACTION STRATEGY
   - Primary CTA with phone button
   - Secondary CTAs with form triggers
   - All CTAs require inline SVG icons

5. NAVIGATION STRUCTURE
   - Main nav items
   - NO header/footer (system injects separately)

OUTPUT: Structured wireframe document with all 5 sections complete.`;

// ============================================================================
// STAGE 2: COPYWRITING
// ============================================================================
const stage2TaskNoImages = `🤖 AUTOMATION MODE: Write ALL copy in ONE response.

TASK: Write complete copy for every wireframe section. Provide:

1. HEADLINES
   - H1: Compelling, keyword-rich (NO emoji at start)
   - H2s: Section titles (emoji OK at end: "Our Services ✨")
   - H3s: Subheadings as needed

2. BODY COPY
   - Complete paragraphs for each content block
   - Match brand voice from context
   - 2-4 emojis per section (NOT in buttons)

3. CALLS-TO-ACTION
   - Button text (NO emojis in buttons)
   - Primary: "Call Now" / "Get Free Quote"
   - Secondary: "Schedule Service" / "Learn More"

4. NAVIGATION & UI TEXT
   - Menu labels
   - Form field labels

5. META CONTENT
   - Page title: [Keyword] | {{business_name}}
   - Meta description: 150-160 characters

OUTPUT: Complete copy labeled by section. Use {{business_name}} for company references.`;

// ============================================================================
// STAGE 3: HTML STRUCTURE
// ============================================================================
const stage3TaskNoImages = `🤖 AUTOMATION MODE: Build COMPLETE HTML from <!DOCTYPE html> to </html>.

## CANONICAL VARIABLES (use these EXACTLY)
| Variable | Purpose |
|----------|---------|
| {{business_name}} | Company name |
| {{phone}} | Phone number |
| {{email}} | Email address |
| {{address}} | Full address |
| {{years_experience}} | Years in business |
| {{description}} | Company description |

## CRITICAL REQUIREMENTS

### NO IMAGES
- Zero <img> tags anywhere
- Use inline SVG icons for visual interest
- Focus on typography and spacing

### INLINE SVG ICONS ONLY
❌ FORBIDDEN: data-lucide, Font Awesome, Material Icons, any CDN
✅ REQUIRED pattern:
\`\`\`html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="...complete path data..."/>
</svg>
\`\`\`

### BUTTON STRUCTURE (mandatory)
\`\`\`html
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  Call {{phone}}
</a>
\`\`\`
- ALL buttons: inline-flex, items-center, gap-2, text-base
- Phone numbers MUST be buttons with phone icon
- NO emojis in button text

### FORM HANDLING
- NEVER build custom <form> elements
- ALL form CTAs use: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"
\`\`\`html
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg><!-- clipboard/document icon --></svg>
  Get Free Quote
</button>
\`\`\`

### PAGE STRUCTURE
- Start with hero <section> (NO top banners/alerts)
- NO <header> or <footer> (system injects separately)
- Semantic HTML5: <main>, <section>, <article>
- One <h1> only, proper heading hierarchy

## ANTI-HALLUCINATION CHECK
Before outputting, scan for and REPLACE:
- ❌ Any 10-digit phone → {{phone}}
- ❌ Any @email.com → {{email}}
- ❌ Any street address → {{address}}
- ❌ Any company name → {{business_name}}
- ❌ Any hex colors → var(--color-*)

OUTPUT: Complete HTML document, properly indented, from <!DOCTYPE html> to </html>.`;

// ============================================================================
// STAGE 4: CSS STYLING
// ============================================================================
const stage4TaskNoImages = `🤖 AUTOMATION MODE: Output COMPLETE production-ready HTML with embedded CSS.

## CSS CUSTOM PROPERTIES (use in :root)
\`\`\`css
:root {
  --color-primary: {{siteSettings.primary_color}};
  --color-secondary: {{siteSettings.secondary_color}};
  --color-accent: {{siteSettings.accent_color}};
  --radius-button: {{siteSettings.button_border_radius}};
  --radius-card: {{siteSettings.card_border_radius}};
}
\`\`\`

## REQUIRED STYLES

### Icon Styling (replace image visual weight)
\`\`\`css
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.icon-wrapper svg {
  width: 1.5rem;
  height: 1.5rem;
  stroke: white;
}
\`\`\`

### Button Styling
\`\`\`css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-button);
  transition: all 0.3s ease;
}
.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
\`\`\`

### Accordion Styling
\`\`\`css
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.accordion-content.active {
  max-height: 2000px;
}
.accordion-header svg {
  transition: transform 0.3s ease;
}
.accordion-header.active svg {
  transform: rotate(180deg);
}
\`\`\`

## TASK
1. Create responsive, mobile-first CSS
2. Use CSS variables for ALL colors (no hex codes)
3. Style icons prominently (backgrounds, shadows, gradients)
4. Embed CSS in <style> within <head>
5. Ensure visual hierarchy without images

## ANTI-HALLUCINATION CHECK
Scan CSS for and REPLACE:
- ❌ #ffffff, #000000, any hex → var(--color-*)
- ❌ bg-blue-500, text-red-600 → var(--color-*)

OUTPUT: Complete styled HTML from <!DOCTYPE html> to </html>. No markdown, no explanations.`;

// ============================================================================
// VALIDATION CHECKLISTS (for automation pipeline)
// ============================================================================
const validationChecklist = {
  stage1: [
    "All 5 sections present",
    "3+ main content sections defined",
    "Icon strategy outlined (inline SVG)",
    "No image placeholders",
    "Primary CTA identified",
  ],
  stage2: [
    "Copy for every wireframe section",
    "H1 has no leading emoji",
    "Button text has no emojis",
    "Uses {{business_name}} not hardcoded names",
    "Meta description 150-160 chars",
  ],
  stage3: [
    "Starts with <!DOCTYPE html>",
    "Zero <img> tags",
    "All icons are inline SVG (no data-lucide)",
    "Buttons use inline-flex gap-2 text-base",
    "Phone is button with icon",
    "Forms use if(window.openLeadFormModal) window.openLeadFormModal()",
    "No hardcoded business data",
    "No <header> or <footer>",
  ],
  stage4: [
    "CSS uses var(--color-*) only",
    "No hex color codes",
    "Icon styling is prominent",
    "Responsive breakpoints included",
    "Complete document with </html>",
  ],
};

// Instructions are used in the webhook payload below

// Stage 1: Wireframe Planning Instructions
const stage1Instructions = `# MULTI-STAGE WEB PAGE BUILDER (WITH IMAGES)

## ROLE
You are building production-ready web pages in a 4-stage pipeline. Each stage builds on the previous. Output must use Handlebars variables for ALL business data and CSS custom properties for ALL styling. Zero hardcoding allowed.

## OUTPUT FORMAT
- **Stages 1-2**: Structured text documents
- **Stages 3-4**: Raw HTML starting with `<!DOCTYPE html>` — NO markdown code fences

---

## CANONICAL VARIABLE REFERENCE

| Variable | Purpose |
|----------|---------|
| `{{business_name}}` | Company name |
| `{{business_slogan}}` | Tagline |
| `{{phone}}` | Phone number |
| `{{email}}` | Email address |
| `{{address}}` | Full address |
| `{{address_street}}` | Street only |
| `{{address_city}}` | City only |
| `{{address_state}}` | State abbreviation |
| `{{address_zip}}` | ZIP code |
| `{{website_url}}` | Website URL |
| `{{years_experience}}` | Years in business |
| `{{description}}` | Company description |
| `{{logo_url}}` | Logo URL |

### Service Page Variables
| `{{service_name}}` | Service name |
| `{{service_slug}}` | URL-friendly service name |
| `{{service_description}}` | Service description |
| `{{service_starting_price}}` | Starting price |

### Location Page Variables
| `{{city}}` | City/area name |
| `{{city_slug}}` | URL-friendly city name |
| `{{state}}` | State name |
| `{{zip}}` | ZIP/postal code |
| `{{country}}` | Country name |

---

## CSS CUSTOM PROPERTIES

| Property | Purpose |
|----------|---------|
| `var(--color-primary)` | Primary brand color |
| `var(--color-secondary)` | Secondary brand color |
| `var(--color-accent)` | Accent color |
| `var(--color-cta)` | CTA button color |
| `var(--radius-button)` | Button border radius |
| `var(--radius-card)` | Card border radius |

**NEVER use hex codes or Tailwind color classes (e.g., `bg-blue-500`)**

---

## STAGE 1: WIREFRAME & CONTENT PLANNING

### Task
Create a structural blueprint. NO code in this stage.

### Required Sections
1. **PAGE LAYOUT**: Hero section, main content sections (3-5 minimum), CTA placements
2. **CONTENT BLOCKS**: Name, purpose, and information for each block; note image placement locations
3. **INFORMATION HIERARCHY**: Primary message, secondary messages, priority order
4. **CTA STRATEGY**: Primary CTA placement/purpose, secondary CTAs, contact points
5. **IMAGE STRATEGY**: Hero image, service photos, team photos, process/before-after images

### Validation
- [ ] All 5 sections present
- [ ] At least 3 main content sections defined
- [ ] Image placements identified for each major section
- [ ] At least one primary CTA identified

---

## STAGE 2: COPYWRITING

### Task
Write all copy based on approved wireframe.

### Required Deliverables
1. **HEADLINES**: H1, section H2s, sub-headlines H3s
2. **BODY COPY**: Complete copy for each content block, matching brand voice
3. **CTAs**: Primary and secondary button text
4. **META CONTENT**: Page title, meta description (150-160 chars)
5. **IMAGE ALT TEXT**: Detailed descriptions for all identified image placements (50-100 chars each)

### Alt Text Guidelines
Include: subject, setting, mood, composition, lighting
- ✅ "Professional roofer inspecting shingles on residential home under clear blue sky"
- ✅ "Close-up of hands installing metal roofing panels with power drill, safety gloves visible"

### Validation
- [ ] Copy for every content block from Stage 1
- [ ] H1 includes primary keyword
- [ ] Alt text for all images (50-100 chars each)
- [ ] Meta description 150-160 characters

---

## STAGE 3: HTML STRUCTURE

### Task
Build complete HTML using approved wireframe and copy.

### Page Structure Rules
- **FIRST element** in `<body>` MUST be the hero `<section>`
- **NO** top CTA bars, emergency banners, or announcements before hero
- **NO** header/footer (system injects these separately)
- One `<h1>` only; proper heading hierarchy (h1 → h2 → h3)

### Image Requirements
```html

```

**File Extensions:**
- `.jpg` — Photos (people, buildings, scenes)
- `.png` — Graphics, icons, illustrations
- `.svg` — Logos, simple vectors

**FORBIDDEN:**
- ❌ External URLs (Unsplash, Pexels, Google Drive)
- ❌ Only use `placeholder-*.jpg/png/svg` filenames

### Button Pattern (REQUIRED)
```html

  
    
    
    
    
  
  Get Free Quote

```

**Button Rules:**
- ALL buttons have inline SVG icons (no external libraries)
- `inline-flex`, `gap-2`, `text-base` classes required
- Phone numbers MUST be buttons with phone icons
- NO emojis in button text

### Phone Links vs Form CTAs

**Phone Links** — Pure `tel:` links, NO onclick:
```html

  
  {{phone}}

```

**Form CTAs** — Use modal trigger with null check:
```html

  
  Get Free Quote

```

**NEVER build custom `<form>` elements** — Forms are managed via `window.openLeadFormModal()` only.

### Validation
- [ ] Page starts with hero section
- [ ] All business data uses canonical Handlebars variables
- [ ] All images use `placeholder-*.jpg/png/svg` format with detailed alt text
- [ ] All buttons have inline SVG icons
- [ ] Zero emojis in button text
- [ ] Phone links have NO onclick handlers
- [ ] Form CTAs use `if(window.openLeadFormModal) window.openLeadFormModal('...')`
- [ ] No custom `<form>` elements

---

## STAGE 4: CSS STYLING

### Task
Create responsive CSS using CSS custom properties.

### Required CSS Structure
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-cta);
  border-radius: var(--radius-button);
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Responsive Breakpoints
- Mobile-first approach
- Tablet: 768px
- Desktop: 1024px
- Large: 1280px

### Validation
- [ ] All colors use CSS custom properties
- [ ] Mobile-first responsive design
- [ ] Button hover/focus states defined
- [ ] Image styling (responsive, object-fit, border-radius)

---

## ANTI-HALLUCINATION CHECKLIST

Before outputting, search your HTML for these violations:

| ❌ If You Find | ✅ Replace With |
|---------------|-----------------|
| Any 10-digit phone pattern | `{{phone}}` |
| Any @email.com address | `{{email}}` |
| Any street address with numbers | `{{address}}` or components |
| Any hex color codes (#ffffff) | `var(--color-*)` |
| Tailwind colors (bg-blue-500) | `var(--color-*)` |
| Any company name text | `{{business_name}}` |
| External image URLs | `placeholder-*.jpg/png/svg` |

---

## FINAL OUTPUT FORMAT

### Success Response (for database webhook)
```json
{
  "data": {
    "id": "{supabaseData.id}",
    "updates": {
      "{supabaseData.field}": "..."
    }
  },
  "table": "{supabaseData.table}"
}
```

**Critical:**
- HTML string starts with `<!DOCTYPE html>` (no markdown fences)
- Use `supabaseData.field` value as key (`content_html_draft` or `template_html_draft`)
- Use `supabaseData.table` value (`static_pages` or `templates`)

### Error Response
```json
{
  "status": "failed",
  "failed_stage": "stage_number",
  "issue": "description",
  "partial_output": "completed content"
}
```

---

## EXECUTION ORDER

1. Stage 1 → Validate → Store as STAGE_1_WIREFRAME
2. Stage 2 (include Stage 1) → Validate → Store as STAGE_2_COPY
3. Stage 3 (include Stages 1+2) → Validate → Store as STAGE_3_HTML
4. Stage 4 (include Stage 3) → Validate → Embed CSS in `<head>`
5. Final assembly → Return complete page

**Do not proceed to next stage until current stage passes validation.**`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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
      useTestWebhook = true, // Default to test webhook
    } = await req.json();

    // Get webhook URL from environment based on mode
    const webhookUrl = useTestWebhook
      ? Deno.env.get("TEST_WEBHOOK_PAGE_BUILDER")
      : Deno.env.get("PRODUCTION_WEBHOOK_PAGE_BUILDER");

    if (!webhookUrl) {
      const webhookType = useTestWebhook ? "test" : "production";
      console.error(`${webhookType.toUpperCase()}_WEBHOOK_PAGE_BUILDER secret not configured`);
      return new Response(JSON.stringify({ error: `${webhookType} webhook URL not configured` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
            payment_options: aiTraining?.payment_options || "",
          },
          userPrompt: {
            content: userPrompt || "",
            type: "user_prompt",
            length: userPrompt?.length || null,
          },
          systemInstructions: {
            content: systemInstructions || "",
            type: "system_instructions",
            length: systemInstructions?.length || null,
          },
          builderStageInstructions: {
            content: builderInstructions,
            type: "builder_stages",
            length: builderInstructions?.length || null,
          },
          stage1Task: {
            content: includeImages ? stage1TaskWithImages : stage1TaskNoImages,
            type: "stage_1_task",
            length: includeImages ? stage1TaskWithImages?.length || null : stage1TaskNoImages?.length || null,
          },
          stage2Task: {
            content: includeImages ? stage2TaskWithImages : stage2TaskNoImages,
            type: "stage_2_task",
            length: includeImages ? stage2TaskWithImages?.length || null : stage2TaskNoImages?.length || null,
          },
          stage3Task: {
            content: includeImages ? stage3TaskWithImages : stage3TaskNoImages,
            type: "stage_3_task",
            length: includeImages ? stage3TaskWithImages?.length || null : stage3TaskNoImages?.length || null,
          },
          stage4Task: {
            content: includeImages ? stage4TaskWithImages : stage4TaskNoImages,
            type: "stage_4_task",
            length: includeImages ? stage4TaskWithImages?.length || null : stage4TaskNoImages?.length || null,
          },
          // Only include imageGenInstructions if images are enabled
          ...(includeImages && {
            imageGenInstructions: {
              content: imageGenInstructions || "",
              type: "image_generation",
              length: imageGenInstructions?.length || null,
            },
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
            needsResearch: needsResearch,
          },
          researchPrompt: needsResearch
            ? `You are a research assistant preparing context for a page builder automation.

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
- Calls-to-action aligned with business objectives`
            : undefined,
          output_tokens: 150000,
        },
      },
    ];

    console.log("Sending webhook to n8n:", {
      webhookType: useTestWebhook ? "TEST" : "PRODUCTION",
      url: webhookUrl.substring(0, 50) + "...",
      hasCompanyData: !!companyData,
      hasSocialMedia: !!socialMedia,
      hasAiTraining: !!aiTraining,
      hasSystemInstructions: !!systemInstructions,
      includeImages,
      needsResearch,
      hasResearchPrompt: needsResearch,
      supabaseData,
      timestamp: new Date().toISOString(),
    });

    // Send to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Webhook failed:", webhookResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Webhook failed with status ${webhookResponse.status}`,
          details: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const responseData = await webhookResponse.json().catch(() => ({}));

    const webhookType = useTestWebhook ? "test" : "production";
    console.log(`Webhook sent successfully to ${webhookType} endpoint`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook sent to ${webhookType} endpoint successfully`,
        webhookType,
        response: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-makecom-webhook:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
