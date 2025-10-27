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

### 3. Form Integration: Use Global Function

**For all CTAs and forms, use:**
```html
<button 
    onclick="window.openLeadFormModal('Request quote', {
        serviceId: '{{service_id}}',
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

### 7. Footer Guidelines

**DO:**
- Create ONE simple footer with basic contact info
- Use plain HTML entities: `•` for bullets (NOT `{" • "}`)
- Keep footer minimal and clean

**DON'T:**
- Create a huge "Final CTA Section" before the footer
- Duplicate contact information in both pre-footer section AND footer
- Use JSX syntax like `{" • "}` - this is HTML, not React!

**Good Footer Example:**
```html
<footer class="bg-gray-900 text-gray-300 py-8">
    <div class="container mx-auto px-4 text-center">
        <p class="font-bold text-white mb-2">{{company_name}}</p>
        <p class="text-sm mb-2">
            {{company_address}}, {{company_city}}, {{company_state}} {{company_zip}}
        </p>
        <p class="text-sm">
            <a href="tel:{{company_phone}}">{{company_phone}}</a>
            •
            <a href="mailto:{{company_email}}">{{company_email}}</a>
        </p>
        <p class="text-xs text-gray-500 mt-4">
            © 2025 {{company_name}}. All rights reserved.
        </p>
    </div>
</footer>
```

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
