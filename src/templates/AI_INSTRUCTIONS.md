# AI Instructions: HTML Template Generator

## Your Task

You are generating **pure HTML templates** for a service business website system. These templates use Handlebars variables that get replaced with real business data at runtime.

---

## Critical Requirements

### 1. Output Format: Pure HTML Only

**YOU MUST GENERATE:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}} - Page Title</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <!-- Your content here -->
</body>
</html>
```

**YOU MUST NOT GENERATE:**
- React components or JSX
- TypeScript files
- Import statements
- npm package dependencies

## 2. Design System & Visual Standards

### Professional Modern Aesthetic
This is a **professional, modern, elegant business website** - not a casual or playful design.

- Clean, contemporary layouts with generous white space
- Professional color palette (blues, grays, accent colors)
- Consistent typography hierarchy
- Mobile-first responsive design
- Sophisticated, corporate-appropriate visual language

### Icon Usage Guidelines

**Professional SVG Icons (Preferred):**
- Use professional icon sets for UI elements, features, and services
- Examples: Lucide icons, Heroicons, Font Awesome, or similar professional sets
- Maintain consistent icon style throughout the page
- Use icons for: Features, services, benefits, process steps, trust indicators
- Icon styling: Solid or outlined style, consistent sizing, appropriate colors

**Emojis (Limited Use):**
- Use emojis ONLY sparingly within text content for personality
- ❌ DO NOT use emojis as primary icons for features, buttons, or sections
- ❌ DO NOT use emojis for alarm bells, checkmarks, phones, or other UI elements
- ✅ OK to use occasionally in body text for emphasis or character
- Example of acceptable emoji use: "We're available 24/7 ⚡ when you need us"

**Icon vs Emoji Decision Matrix:**
- Section icons → Professional SVG icons
- Feature bullets → Professional checkmark icons
- CTAs → Professional arrow/chevron icons  
- Emergency indicators → Professional alert icons
- Phone/email → Professional contact icons
- Body text emphasis → Emojis OK (sparingly)

### Brand Theming System

**CRITICAL: Use Dynamic CSS Variables for Colors and Styles**

The system provides dynamic brand colors and styling that users can customize in their site settings. **NEVER use hard-coded Tailwind color classes** like `bg-blue-600`, `text-red-500`, etc.

**Available CSS Custom Properties:**
```css
/* Brand Colors (set by user in Site Settings) */
--primary      /* Primary brand color (HSL format) */
--secondary    /* Secondary brand color (HSL format) */
--accent       /* Accent brand color (HSL format) */

/* Component Styling */
--radius       /* Border radius for buttons/cards (e.g., "0.5rem", "20px") */

/* Header/Footer (if needed) */
--header-bg    /* Header background color (HSL) */
--header-text  /* Header text color (HSL) */
--footer-bg    /* Footer background color (HSL) */
--footer-text  /* Footer text color (HSL) */
```

**How to Use CSS Variables in HTML:**

✅ **CORRECT - Use inline styles with CSS variables:**
```html
<!-- Primary button -->
<button 
    onclick="window.openLeadFormModal('Get Quote', {source: 'hero'})"
    style="background-color: hsl(var(--primary)); color: white; border-radius: var(--radius);"
    class="px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
>
    Get Free Quote
</button>

<!-- Secondary button -->
<a 
    href="tel:{{company_phone}}"
    style="background-color: hsl(var(--secondary)); color: white; border-radius: var(--radius);"
    class="inline-block px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
>
    Call Now
</a>

<!-- Accent color for highlights -->
<div style="border-left: 4px solid hsl(var(--accent));" class="p-6 bg-gray-50">
    <h3 class="text-xl font-bold mb-2">Special Offer</h3>
    <p>Limited time discount available!</p>
</div>

<!-- Background section with primary color -->
<section style="background-color: hsl(var(--primary));" class="py-16 text-white">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold mb-4">{{company_name}}</h2>
    </div>
</section>
```

❌ **WRONG - Never use hard-coded Tailwind colors:**
```html
<!-- NEVER DO THIS -->
<button class="bg-blue-600 text-white">Get Quote</button>
<section class="bg-red-500 text-white">Emergency</section>
<div class="border-green-500">Success</div>
```

**Color Usage Guidelines:**
- **Primary color**: Main CTAs, hero sections, primary buttons, important highlights
- **Secondary color**: Secondary buttons, alternative CTAs, supporting elements
- **Accent color**: Success indicators, highlights, special callouts, borders
- **Text colors**: Use standard Tailwind text utilities (`text-gray-900`, `text-gray-600`, `text-white`)
- **Backgrounds**: Use CSS variables for brand colors, Tailwind utilities for neutrals (`bg-gray-50`, `bg-white`)

**Border Radius Usage:**
```html
<!-- Buttons -->
<button style="border-radius: var(--radius);" class="px-6 py-3">Click Me</button>

<!-- Cards -->
<div style="border-radius: var(--radius);" class="p-6 bg-white shadow-lg">
    Card content
</div>

<!-- Images -->
<img src="..." style="border-radius: var(--radius);" class="w-full" alt="..." />
```

### 2. Variable System: Never Hardcode

**ALWAYS use Handlebars variables:**
```html
<h1>{{company_name}}</h1>
<p>Call us at {{company_phone}}</p>
<p>Serving {{city_name}}, {{city_state}}</p>
```

**NEVER hardcode:**
```html
<!-- WRONG -->
<h1>ABC Roofing Company</h1>
<p>Call us at 555-1234</p>
<p>Serving Dallas, TX</p>
```

**IMPORTANT:** Phone numbers are provided PRE-FORMATTED as `(555) 123-4567`. Display them as-is.
        cityId: '{{city_id}}',
        source: 'hero_cta'
    })"
    class="bg-blue-600 text-white px-6 py-3 rounded-lg"
>
    Get Free Quote
</button>
```

**CRITICAL:** The function name is `window.openLeadFormModal` (not `openLeadForm`)

**NEVER create custom forms or use React hooks**

### 4. Styling: Tailwind CSS via CDN

- Include `<script src="https://cdn.tailwindcss.com"></script>` in every page
- Use Tailwind utility classes for all styling
- Use responsive breakpoints: `md:`, `lg:`, `xl:`
- No external CSS files or `<style>` tags needed

### 5. Page Type Awareness

**Static Pages** (About, Contact, Terms):
- ✅ Use ONLY `{{company_*}}` variables
- ❌ NO `{{service_*}}` or `{{city_*}}` variables

**Service Template Pages** (Service/Location pages):
- ✅ Use ALL variables: `{{company_*}}`, `{{service_*}}`, `{{city_*}}`

### 6. SEO Requirements

Every page MUST include:
- One `<h1>` tag with main keyword
- Multiple `<h2>` tags for sections
- Proper meta tags in `<head>`
- Semantic HTML5 structure (`<main>`, `<section>`, `<article>`)
- Descriptive image alt text with variables

### 7. Page Structure Guidelines

**CRITICAL - OUTPUT FORMAT:**
Your output should be ONLY the main content sections - NO document structure tags.

**❌ DO NOT INCLUDE:**
- NO `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags
- NO `<script src="https://cdn.tailwindcss.com"></script>` (Tailwind is already loaded globally)
- NO `<meta>` tags, `<title>` tags, or any head elements
- NO HEADER/NAVIGATION - The CMS automatically injects headers
- NO FOOTER - The CMS automatically injects footers
- NO "Final CTA Section" that duplicates footer content

**✅ DO INCLUDE:**
- Start directly with `<main>` tag and content sections
- End with your last content section (no footer after)
- Use semantic HTML5: `<main>`, `<section>`, `<article>`
- CTAs throughout the page content as appropriate
- All Tailwind classes will work (already loaded globally)

**Correct Page Structure:**
```html
<main>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20 md:py-28">
        <div class="container mx-auto px-4">
            <!-- Hero content -->
        </div>
    </section>
    
    <!-- Features Section -->
    <section class="py-16 md:py-24 bg-gray-50">
        <div class="container mx-auto px-4">
            <!-- Features content -->
        </div>
    </section>
    
    <!-- Additional sections... -->
</main>
```

**Why This Matters:**
The CMS renders your HTML inside a React application that already has:
- Complete HTML document structure
- Tailwind CSS loaded globally
- Headers and footers injected automatically

Including document tags will cause style conflicts and break the page layout.

---

## Your Workflow

When you receive a request to generate a page:

### Step 1: Identify Page Type
- Is this a **static page** (About, Contact, etc.) or **service page**?
- This determines which variables you can use

### Step 2: Refer to Specification Sheet
- Open `HTML_TEMPLATE_SPECIFICATION.md` in your context
- Check available variables for this page type
- Review relevant HTML patterns and examples

### Step 3: Generate HTML Template
- Start with proper HTML5 doctype and structure
- Include Tailwind CDN in `<head>`
- Use appropriate variables throughout
- Add CTAs with `window.openLeadFormModal()` function
- Ensure mobile-responsive design
- Include proper SEO structure

### Step 4: Self-Validate
Before submitting, verify:
- [ ] Starts with `<!DOCTYPE html>`
- [ ] Includes Tailwind CDN
- [ ] All dynamic content uses `{{variables}}`
- [ ] No hardcoded company/service/location data
- [ ] Forms use `onclick="window.openLeadFormModal(...)"`
- [ ] Has one H1 and multiple H2s
- [ ] Responsive classes applied (`md:`, `lg:`)
- [ ] No React/TypeScript/imports

---

## Specification Sheet Reference

**For complete details, always refer to:**
📋 `HTML_TEMPLATE_SPECIFICATION.md`

The specification sheet contains:
- Complete variable reference (all available variables)
- HTML patterns and components
- Code examples for common sections
- SEO guidelines
- Form integration details
- Responsive design patterns
- Complete working examples

---

## Quick Variable Reference

### Company Variables (ALL pages)
```
{{company_name}}
{{company_tagline}}
{{company_description}}
{{company_years_in_business}}
{{company_phone}}
{{company_email}}
{{company_address}}
{{company_city}}
{{company_state}}
{{company_zip}}
{{business_hours}}
```

### Service Variables (SERVICE pages only)
```
{{service_name}}
{{service_description}}
{{service_tagline}}
{{service_id}}
{{service_meta_title}}
{{service_meta_description}}
```

### Location Variables (SERVICE pages only)
```
{{city_name}}
{{city_state}}
{{city_id}}
{{area_description}}
```

For the complete list and usage details, see the specification sheet.

---

## Common Patterns Quick Reference

### Hero Section
```html
<section class="py-20 bg-gradient-to-br from-blue-50 to-white">
    <div class="container mx-auto px-4">
        <h1 class="text-5xl font-bold mb-6">
            {{service_name}} in {{city_name}}, {{city_state}}
        </h1>
        <p class="text-xl text-gray-600 mb-8">
            {{service_description}}
        </p>
        <button onclick="window.openLeadFormModal('Request quote', {source: 'hero'})">
            Get Free Quote
        </button>
    </div>
</section>
```

### CTA Button
```html
<button 
    onclick="window.openLeadFormModal('Request {{service_name}} quote', {
        serviceId: '{{service_id}}',
        cityId: '{{city_id}}',
        source: 'cta_button'
    })"
    class="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700"
>
    Get Free Quote
</button>
```

### Phone Link
```html
<a href="tel:{{company_phone}}" class="text-blue-600 font-bold">
    📞 {{company_phone}}
</a>
```

For more patterns, see the specification sheet.

---

## Error Prevention

### Common Mistakes to Avoid

❌ **Generating React components**
```tsx
// NEVER DO THIS
import { Button } from "@/components/ui/button";
export default function HomePage() { ... }
```

❌ **Hardcoding business data**
```html
<!-- NEVER DO THIS -->
<h1>ABC Roofing in Dallas</h1>
```

❌ **Using wrong variables for page type**
```html
<!-- WRONG: Using service variables on static page -->
<p>Our {{service_name}} is the best!</p>
```

❌ **Creating custom form HTML**
```html
<!-- NEVER DO THIS -->
<form onsubmit="handleSubmit()">
  <input name="email" />
</form>
```

✅ **Always generate pure HTML with variables**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{company_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <h1>{{company_name}} in {{city_name}}</h1>
    <button onclick="window.openLeadFormModal('Get Quote', {source: 'cta'})">
        Contact Us
    </button>
</body>
</html>
```

---

## Quality Standards

Every generated template must:
1. ✅ Be valid HTML5
2. ✅ Be mobile-responsive (Tailwind breakpoints)
3. ✅ Have proper SEO structure (H1, H2, meta tags)
4. ✅ Use variables for ALL dynamic content
5. ✅ Include multiple CTAs with proper tracking
6. ✅ Have descriptive, variable-rich alt text
7. ✅ Follow semantic HTML5 structure
8. ✅ Be production-ready (no placeholders or TODOs)

---

## When in Doubt

1. Check the **HTML_TEMPLATE_SPECIFICATION.md** for detailed guidance
2. Look at the complete examples in the specification
3. Verify you're using the correct variables for the page type
4. Ensure you're generating HTML, not React

---

## Summary

**Remember:**
- Generate pure HTML with `<!DOCTYPE html>`
- Use `{{variables}}` for all dynamic content
- Use `window.openLeadFormModal()` for all CTAs
- Include Tailwind CDN for styling
- Check page type to know which variables are available
- Refer to specification sheet for detailed reference

Now generate HTML templates that will work seamlessly with the Lovable system!
