# HTML Template Specification Sheet

## Complete Reference Guide for Template Generation

This document provides comprehensive technical specifications for generating HTML templates compatible with the Lovable template system.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Technical Stack](#technical-stack)
3. [Complete Variable Reference](#complete-variable-reference)
4. [Form Integration System](#form-integration-system)
5. [Page Type Specifications](#page-type-specifications)
6. [HTML Component Library](#html-component-library)
7. [SEO Requirements](#seo-requirements)
8. [Responsive Design Patterns](#responsive-design-patterns)
9. [Complete Examples](#complete-examples)

---

## Design Principles

### 1. Professional, Trust-Building Design
**This is a professional, modern, elegant business website** targeting commercial clients and property owners.

- Clean layouts with strategic use of white space
- Professional color palette (blues, reds for emergency, greens for success)
- High-quality imagery showing actual work/results
- Clear visual hierarchy guiding users to CTAs
- Sophisticated, corporate-appropriate visual language
- Professional icon usage (SVG icons, not emojis for UI elements)

### 2. Icon Usage Standards - Lucide Icons (REQUIRED)

**CRITICAL:** This application uses Lucide icons exclusively. They are loaded globally and ready to use.

**How to Implement Lucide Icons:**
```html
<!-- Basic icon -->
<i data-lucide="check" class="w-6 h-6"></i>

<!-- Icon with CSS variable color -->
<i data-lucide="shield-check" style="color: hsl(var(--primary));" class="w-8 h-8"></i>

<!-- Icon in colored background -->
<div style="background-color: hsl(var(--accent) / 0.1); border-radius: var(--radius);" class="p-3">
    <i data-lucide="phone" style="color: hsl(var(--accent));" class="w-6 h-6"></i>
</div>
```

**Icon Categories & Common Choices:**
- **CTAs & Actions**: `arrow-right`, `phone`, `mail`, `calendar`, `send`, `external-link`
- **Features & Benefits**: `check`, `check-circle`, `shield-check`, `star`, `award`, `badge-check`
- **Emergency/Alerts**: `alert-triangle`, `alert-circle`, `clock`, `zap`, `siren`
- **Contact Methods**: `phone`, `mail`, `map-pin`, `message-circle`, `headphones`
- **Process Steps**: `clipboard-check`, `wrench`, `truck`, `check-circle-2`, `package`
- **Trust Indicators**: `shield`, `badge-check`, `users`, `building`, `award`
- **Services**: `hammer`, `paintbrush`, `zap`, `droplet`, `wind`, `home`

**Icon Sizing Guidelines:**
- Inline with text: `w-4 h-4` or `w-5 h-5`
- Standard UI icons: `w-6 h-6`
- Feature/service icons: `w-8 h-8` to `w-12 h-12`
- Hero section icons: `w-16 h-16` or larger

**Browse All Icons:** https://lucide.dev/icons/

**Emoji Guidelines (Limited Use Only):**
- ✅ Acceptable: Sparingly in body text for personality ("We're here 24/7 ⚡")
- ❌ Prohibited: As primary feature icons, section headers, buttons, or UI elements
- ❌ Never use: Emoji alarm bells, checkmarks, phones, etc. as main icons

**NEVER:**
- ❌ Use inline SVG code (use Lucide `data-lucide` instead)
- ❌ Use external icon CDNs or icon fonts
- ❌ Use emojis for UI icons

### 3. Mobile-First Responsive
- All layouts must work perfectly on mobile devices
- Touch-friendly buttons and spacing (44px minimum touch targets)
- Readable text sizes (16px minimum on mobile)
- Simplified navigation and forms for small screens

---

## Brand Theming System

### Dynamic CSS Variables (CRITICAL)

The system uses CSS custom properties for brand colors and styling that users can customize in their Site Settings. **You MUST use these CSS variables instead of hard-coded color classes.**

#### Available CSS Variables

```css
/* Brand Colors - User customizable via Site Settings */
--primary      /* Primary brand color (HSL format, e.g., "221.2 83.2% 53.3%") */
--secondary    /* Secondary brand color (HSL format) */
--accent       /* Accent brand color (HSL format) */

/* Component Styling */
--radius       /* Border radius (e.g., "0.5rem", "20px", "8px") */

/* Header/Footer Theming */
--header-bg    /* Header background (HSL format) */
--header-text  /* Header text color (HSL format) */
--footer-bg    /* Footer background (HSL format) */
--footer-text  /* Footer text color (HSL format) */
```

#### How to Use CSS Variables in Templates

**CRITICAL RULES:**
- ❌ **NEVER** use hard-coded Tailwind color classes: `bg-blue-600`, `text-red-500`, `border-green-400`
- ✅ **ALWAYS** use inline styles with CSS variables for brand colors
- ✅ Use Tailwind utilities for neutral colors: `bg-white`, `bg-gray-50`, `text-gray-900`

**Color Implementation Patterns:**

```html
<!-- PRIMARY COLOR (Main CTAs, Hero sections, Primary buttons) -->
<button 
    onclick="window.openLeadFormModal('Get Quote', {source: 'hero'})"
    style="background-color: hsl(var(--primary)); border-radius: var(--radius);"
    class="text-white px-8 py-4 text-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
>
    Get Free Quote
</button>

<!-- SECONDARY COLOR (Alternative CTAs, Supporting elements) -->
<button 
    onclick="window.openLeadFormModal('Learn More', {source: 'features'})"
    style="background-color: hsl(var(--secondary)); border-radius: var(--radius);"
    class="text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
>
    Learn More
</button>

<!-- ACCENT COLOR (Highlights, Borders, Success indicators) -->
<div style="border-left: 4px solid hsl(var(--accent));" class="pl-6 py-4 bg-gray-50">
    <h3 class="text-xl font-bold mb-2">Special Offer</h3>
    <p class="text-gray-700">Limited time discount available!</p>
</div>

<!-- PRIMARY BACKGROUND SECTION -->
<section style="background-color: hsl(var(--primary));" class="py-20 text-white">
    <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold mb-6">{{company_name}}</h2>
        <p class="text-xl opacity-90 mb-8">{{company_tagline}}</p>
        <button 
            onclick="window.openLeadFormModal('Contact Us', {source: 'cta'})"
            style="background-color: white; color: hsl(var(--primary)); border-radius: var(--radius);"
            class="px-10 py-4 text-lg font-bold hover:opacity-90 transition-opacity shadow-xl"
        >
            Contact Us Today
        </button>
    </div>
</section>

<!-- GRADIENT WITH PRIMARY COLOR -->
<section 
    style="background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));"
    class="py-16 text-white"
>
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold">Emergency Services</h2>
    </div>
</section>

<!-- ACCENT COLOR FOR ICONS/BADGES -->
<div class="flex items-center gap-3">
    <div style="background-color: hsl(var(--accent) / 0.1);" class="p-3 rounded-full">
        <svg class="w-6 h-6" style="color: hsl(var(--accent));" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
    </div>
    <span class="text-gray-900 font-semibold">Certified & Licensed</span>
</div>

<!-- BORDER RADIUS ON CARDS -->
<div style="border-radius: var(--radius);" class="bg-white shadow-xl p-8">
    <h3 class="text-2xl font-bold mb-4 text-gray-900">{{service_name}}</h3>
    <p class="text-gray-600 mb-6">{{service_description}}</p>
    <button 
        onclick="window.openLeadFormModal('Request Service', {serviceId: '{{service_id}}'})"
        style="background-color: hsl(var(--primary)); border-radius: var(--radius);"
        class="text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
    >
        Request Service
    </button>
</div>

<!-- PHONE LINK WITH SECONDARY COLOR -->
<a 
    href="tel:{{company_phone}}"
    style="background-color: hsl(var(--secondary)); border-radius: var(--radius);"
    class="inline-flex items-center gap-3 text-white px-8 py-4 text-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
>
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
    {{company_phone}}
</a>
```

#### Color Usage Guidelines

**When to use each color:**

| Color | Usage | Examples |
|-------|-------|----------|
| **Primary** | Main CTAs, hero sections, primary buttons, key highlights | "Get Quote" buttons, hero backgrounds, main section backgrounds |
| **Secondary** | Alternative CTAs, secondary buttons, supporting elements | "Learn More" buttons, secondary features, alternate CTAs |
| **Accent** | Success indicators, special highlights, borders, badges | Checkmarks, "24/7 Available" badges, success borders, special callouts |

**Neutral Colors (Use Tailwind):**
- Text: `text-gray-900`, `text-gray-700`, `text-gray-600`, `text-white`
- Backgrounds: `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-gray-900`
- Borders: `border-gray-200`, `border-gray-300`

#### Common Mistakes to Avoid

❌ **WRONG - Hard-coded colors:**
```html
<button class="bg-blue-600 text-white">Get Quote</button>
<section class="bg-red-500">Emergency</section>
<div class="border-l-4 border-green-500">Success</div>
```

✅ **CORRECT - Dynamic CSS variables:**
```html
<button style="background-color: hsl(var(--primary));" class="text-white">Get Quote</button>
<section style="background-color: hsl(var(--primary));">Emergency</section>
<div style="border-left: 4px solid hsl(var(--accent));">Success</div>
```

---

## Technical Stack

### CRITICAL: HTML Output Format

**Your HTML output must be ONLY main content sections - NO document structure:**

```html
<main>
    <section class="hero">
        <!-- Hero content -->
    </section>
    
    <section class="features">
        <!-- Features content -->
    </section>
</main>
```

**❌ DO NOT INCLUDE:**
- NO `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags
- NO `<script src="https://cdn.tailwindcss.com"></script>` (Tailwind already loaded globally)
- NO `<meta>` tags, `<title>` tags, or any head elements
- NO `<header>` or navigation (CMS injects automatically)
- NO `<footer>` (CMS injects automatically)

**Why:** The CMS renders your HTML inside a React app that already has complete document structure, Tailwind CSS loaded globally, and auto-injected headers/footers. Including these will cause style conflicts.

### Required Technologies

**Tailwind CSS**
- Already loaded globally in the application
- All utility classes available
- Use semantic color names from design system
- Mobile-first responsive classes

**Handlebars Template Engine**
- Variable syntax: `{{variable_name}}`
- Case-sensitive variable names
- No logic in templates (conditionals/loops handled by system)

**JavaScript (Global Functions)**
- `window.openLeadFormModal(message, context)` - Lead form trigger function
- **CRITICAL:** Function name is `openLeadFormModal` NOT `openLeadForm`
- No external JS libraries required
- No custom JavaScript allowed

### Prohibited Technologies

❌ React, Vue, Angular, or any JavaScript framework
❌ TypeScript or JSX
❌ npm packages or node_modules
❌ CSS preprocessors (Sass, Less, etc.)
❌ External CSS files or `<style>` tags
❌ jQuery or any JavaScript libraries

---

## Complete Variable Reference

### Company Variables

**Available on:** ALL page types (static and service)

#### Basic Information
```handlebars
{{company_name}}              # Legal business name
                              # Example: "ABC Roofing & Construction"
                              # Usage: Headings, titles, body text

{{company_tagline}}           # Company slogan/motto
                              # Example: "Excellence in Every Project"
                              # Usage: Hero sections, headers

{{company_description}}       # Full company description (2-3 paragraphs)
                              # Example: "We are a family-owned business..."
                              # Usage: About sections, hero subheadings

{{company_years_in_business}} # Number only (e.g., 25)
                              # Usage: Trust indicators, stats sections

{{company_founding_year}}     # Year only (e.g., 1998)
                              # Usage: About sections, badges
```

#### Contact Information
```handlebars
{{company_phone}}             # Primary phone (PRE-FORMATTED)
                              # Example: "(555) 123-4567"
                              # Usage: Phone links, contact info
                              # IMPORTANT: Display as-is, already formatted

{{company_email}}             # Primary email address
                              # Example: "info@company.com"
                              # Usage: Email links, contact sections

{{company_website}}           # Full website URL
                              # Example: "https://www.company.com"
                              # Usage: Links, footer

{{company_address}}           # Street address only
                              # Example: "123 Main Street"
                              # Usage: Contact sections, footers

{{company_city}}              # City name
                              # Example: "Dallas"
                              # Usage: Contact info, location indicators

{{company_state}}             # State/Province (2-letter code or full name)
                              # Example: "TX" or "Texas"
                              # Usage: Contact info, service area descriptions

{{company_zip}}               # ZIP/Postal code
                              # Example: "75201"
                              # Usage: Complete address displays

{{company_country}}           # Country name
                              # Example: "United States"
                              # Usage: International contexts
```

#### Business Details
```handlebars
{{company_license_number}}    # Business license/certification number
                              # Example: "TX-CONTR-12345"
                              # Usage: Trust indicators, credentials

{{company_insurance_info}}    # Insurance details
                              # Example: "Fully insured up to $5M"
                              # Usage: Trust sections

{{service_area_description}}  # Description of service coverage area
                              # Example: "Serving Dallas and 50-mile radius"
                              # Usage: Service area sections

{{business_hours}}            # Operating hours (may include line breaks)
                              # Example: "Mon-Fri: 8am-6pm\nSat: 9am-3pm"
                              # Usage: Contact sections (use white-space: pre-line)

{{emergency_available}}       # Boolean/text for emergency availability
                              # Example: "24/7 Emergency Service Available"
                              # Usage: Trust indicators, emergency sections
```

#### Social Media
```handlebars
{{company_facebook}}          # Full Facebook URL
                              # Example: "https://facebook.com/company"

{{company_twitter}}           # Full Twitter/X URL
                              # Example: "https://twitter.com/company"

{{company_instagram}}         # Full Instagram URL
                              # Example: "https://instagram.com/company"

{{company_linkedin}}          # Full LinkedIn URL
                              # Example: "https://linkedin.com/company/..."

{{company_youtube}}           # Full YouTube channel URL
                              # Example: "https://youtube.com/@company"
```

**Usage Example:**
```html
<div class="flex gap-4">
    <a href="{{company_facebook}}" target="_blank" rel="noopener">
        Facebook
    </a>
    <a href="{{company_instagram}}" target="_blank" rel="noopener">
        Instagram
    </a>
</div>
```

---

### Service Variables

**Available on:** Service template pages ONLY
**NOT available on:** Static pages (About, Contact, Terms, etc.)

#### Core Service Information
```handlebars
{{service_name}}              # Service display name
                              # Example: "Commercial Roof Repair"
                              # Usage: H1, page titles, CTAs

{{service_description}}       # Full service description (1-2 paragraphs)
                              # Example: "Our commercial roof repair..."
                              # Usage: Hero sections, intro paragraphs

{{service_tagline}}           # Short service tagline
                              # Example: "Expert Repairs, Lasting Results"
                              # Usage: Badges, subheadings

{{service_slug}}              # URL-friendly service identifier
                              # Example: "commercial-roof-repair"
                              # Usage: Internal linking (rarely in display)

{{service_id}}                # Unique service identifier (UUID/number)
                              # Example: "abc123-def456"
                              # Usage: Form context, tracking
```

#### SEO Metadata
```handlebars
{{service_meta_title}}        # SEO-optimized page title
                              # Example: "Commercial Roof Repair | Dallas TX"
                              # Usage: <title> tag

{{service_meta_description}}  # SEO meta description
                              # Example: "Professional commercial roof..."
                              # Usage: <meta name="description"> tag
```

#### Service Features (if provided)
```handlebars
{{service_features}}          # May be array or list
                              # System handles iteration
                              # Usage: Feature lists, bullet points

{{service_benefits}}          # May be array or list
                              # System handles iteration
                              # Usage: Benefits sections

{{service_process_steps}}     # May be array or list
                              # System handles iteration
                              # Usage: Process/workflow sections
```

#### Pricing (optional, if available)
```handlebars
{{service_price_min}}         # Minimum price (number or formatted)
                              # Example: "$500" or "500"
                              
{{service_price_max}}         # Maximum price (number or formatted)
                              # Example: "$2500" or "2500"

{{service_price_description}} # Pricing explanation text
                              # Example: "Prices vary based on roof size..."
```

---

### Service Area Variables

**Available on:** Service template pages ONLY (location-specific)
**NOT available on:** Static pages or generic service pages

#### Location Information
```handlebars
{{city_name}}                 # Target city name
                              # Example: "Dallas"
                              # Usage: H1, location references throughout

{{city_state}}                # State/Province for this city
                              # Example: "Texas" or "TX"
                              # Usage: Complete location references

{{city_zip}}                  # Primary ZIP code for area
                              # Example: "75201"
                              # Usage: Complete address/location info

{{city_id}}                   # Unique city identifier (UUID/number)
                              # Example: "xyz789-abc123"
                              # Usage: Form context, tracking

{{area_description}}          # Location-specific description
                              # Example: "Serving downtown Dallas and..."
                              # Usage: Location-specific intro sections

{{service_area_tagline}}      # Location + service tagline
                              # Example: "Dallas's Trusted Roofing Experts"
                              # Usage: Badges, location-specific headlines
```

#### Local Content
```handlebars
{{local_expertise}}           # Local knowledge/experience description
                              # Example: "We understand Dallas's unique..."
                              # Usage: Trust sections, local expertise sections

{{area_coverage}}             # Specific coverage area details
                              # Example: "Downtown, North Dallas, Plano..."
                              # Usage: Service area sections

{{nearby_cities}}             # List of nearby served cities
                              # May be array or comma-separated
                              # Example: "Plano, Frisco, McKinney"
                              # Usage: Service area lists
```

---

## Form Integration System

### Universal Lead Form Function

The system provides a global JavaScript function that opens a pre-built lead form modal.

**Function Signature:**
```javascript
window.openLeadFormModal(headerText, contextObject)
```

**CRITICAL:** The function name is `openLeadFormModal` NOT `openLeadForm`

**Parameters:**

1. `headerText` (string) - Displayed as form modal heading
   - Can include variables: `"Request {{service_name}} quote"`
   - Be specific and action-oriented
   - Examples: "Get Free Quote", "Schedule Consultation", "Emergency Service Request"

2. `contextObject` (object) - Tracking and context data
   - `source` (string, required) - Where the form was triggered from
   - `serviceId` (string, optional) - From `{{service_id}}`
   - `cityId` (string, optional) - From `{{city_id}}`
   - Additional custom properties allowed

### Form Integration Patterns

#### Basic CTA Button
```html
<button 
    onclick="window.openLeadFormModal('Request free quote', {
        source: 'hero_primary_cta'
    })"
    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
>
    Get Free Quote
</button>
```

#### Service-Specific CTA
```html
<button 
    onclick="window.openLeadFormModal('Request {{service_name}} quote in {{city_name}}', {
        serviceId: '{{service_id}}',
        cityId: '{{city_id}}',
        source: 'service_card_cta'
    })"
    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
>
    Get Quote for {{service_name}}
</button>
```

#### Emergency CTA
```html
<button 
    onclick="window.openLeadFormModal('Emergency service request', {
        source: 'emergency_cta',
        priority: 'urgent'
    })"
    class="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-700"
>
    🚨 Emergency Service
</button>
```

#### Multiple CTAs (Primary + Secondary)
```html
<div class="flex flex-col sm:flex-row gap-4">
    <!-- Primary CTA -->
    <button 
        onclick="window.openLeadFormModal('Get your free estimate', {
            source: 'hero_primary'
        })"
        class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700"
    >
        Get Free Estimate
    </button>
    
    <!-- Secondary CTA -->
    <button 
        onclick="window.openLeadFormModal('Schedule consultation', {
            source: 'hero_secondary'
        })"
        class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50"
    >
        Schedule Consultation
    </button>
</div>
```

#### Phone Link Alternative
```html
<div class="flex flex-col sm:flex-row gap-4 items-center">
    <button onclick="window.openLeadFormModal('Request callback', {source: 'contact_form'})">
        Request Callback
    </button>
    
    <span class="text-gray-500">or</span>
    
    <a href="tel:{{company_phone}}" class="text-2xl font-bold text-blue-600 hover:text-blue-800">
        📞 {{company_phone}}
    </a>
</div>
```

### Source Tracking Convention

Use descriptive `source` values to track where leads originate:

**Page-Level Sources:**
- `hero_primary` - Main hero CTA
- `hero_secondary` - Secondary hero CTA
- `hero_form` - Hero section form card

**Section-Level Sources:**
- `service_card_[index]` - Service card CTAs
- `final_cta` - Bottom of page final CTA
- `emergency_cta` - Emergency service CTAs
- `about_cta` - About section CTA

**Content-Level Sources:**
- `process_step_[number]` - Process section CTAs
- `faq_cta` - FAQ section CTA
- `testimonial_cta` - After testimonials
- `contact_form` - Contact page form

---

## Page Type Specifications

### Static Pages

**Definition:** Pages with content that doesn't change based on service or location.

**Page Types:**
- About Us
- Contact
- Terms & Conditions
- Privacy Policy
- FAQ
- Careers
- Blog/Resources

**Available Variables:**
- ✅ ALL Company Variables
- ❌ NO Service Variables
- ❌ NO Service Area Variables

**Required Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title | {{company_name}}</title>
    <meta name="description" content="{{company_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <section class="py-12 md:py-20">
            <div class="container mx-auto px-4 max-w-4xl">
                <h1 class="text-4xl md:text-5xl font-bold mb-6">
                    Page Heading - {{company_name}}
                </h1>
                
                <p class="text-xl text-gray-600 mb-8">
                    {{company_description}}
                </p>
                
                <!-- Content sections -->
            </div>
        </section>
    </main>
</body>
</html>
```

**CTA Integration:**
Use generic, company-focused messaging:
```html
<button onclick="window.openLeadFormModal('Contact {{company_name}}', {source: 'about_cta'})">
    Get In Touch
</button>
```

**CRITICAL - HTML Output Format:**
Your HTML output must be ONLY the main content sections - NO document structure.

**❌ DO NOT INCLUDE:**
- NO `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags
- NO `<script src="https://cdn.tailwindcss.com"></script>` tag (Tailwind already loaded globally)
- NO `<meta>` tags, `<title>` tags, or any head elements
- NO `<header>` or navigation elements (CMS injects these automatically)
- NO `<footer>` elements (CMS injects these automatically)
- NO "Final CTA Section" that duplicates footer content

**✅ CORRECT OUTPUT FORMAT:**
```html
<main>
    <section class="hero">
        <!-- Hero content -->
    </section>
    
    <section class="features">
        <!-- Features content -->
    </section>
    
    <!-- Additional sections -->
</main>
```

**Why This Matters:**
The CMS renders your HTML inside a React app that already has complete document structure, Tailwind CSS loaded globally, and auto-injected headers/footers. Including these elements will cause style conflicts and break the layout.

---

### Service Template Pages

**Definition:** Pages that combine service information with location targeting.

**Page Types:**
- Service landing pages (e.g., "Roof Repair in Dallas")
- Location-specific service pages
- Emergency service pages

**Available Variables:**
- ✅ ALL Company Variables
- ✅ ALL Service Variables
- ✅ ALL Service Area Variables

**Required Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_meta_title}}</title>
    <meta name="description" content="{{service_meta_description}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{service_name}} in {{city_name}}, {{city_state}}">
    <meta property="og:description" content="{{service_description}}">
    <meta property="og:type" content="website">
    
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <!-- Hero with service + location -->
        <section class="py-16 md:py-24">
            <div class="container mx-auto px-4">
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                    {{service_name}} in {{city_name}}, {{city_state}}
                </h1>
                
                <p class="text-xl text-gray-600 mb-8">
                    {{service_description}}
                </p>
                
                <button 
                    onclick="window.openLeadForm('Request {{service_name}} quote', {
                        serviceId: '{{service_id}}',
                        cityId: '{{city_id}}',
                        source: 'hero_primary'
                    })"
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg"
                >
                    Get Free Quote
                </button>
            </div>
        </section>
        
        <!-- Multiple content sections -->
    </main>
</body>
</html>
```

**CTA Integration:**
Include service and location context:
```html
<button 
    onclick="window.openLeadForm('Request {{service_name}} quote in {{city_name}}', {
        serviceId: '{{service_id}}',
        cityId: '{{city_id}}',
        source: 'service_card'
    })"
>
    Get {{service_name}} Quote
</button>
```

---

## HTML Component Library

### Hero Sections

#### Service Hero with Multiple CTAs
```html
<section class="py-20 md:py-32 bg-gradient-to-br from-blue-50 via-white to-gray-50">
    <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto text-center">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <span>⭐</span>
                <span>{{company_years_in_business}}+ Years of Excellence</span>
            </div>
            
            <!-- Main Headline -->
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                Professional {{service_name}} in {{city_name}}, {{city_state}}
            </h1>
            
            <!-- Subheadline -->
            <p class="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
                {{service_description}}
            </p>
            
            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                    onclick="window.openLeadForm('Request {{service_name}} quote', {
                        serviceId: '{{service_id}}',
                        cityId: '{{city_id}}',
                        source: 'hero_primary'
                    })"
                    class="bg-blue-600 text-white px-10 py-5 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                    Get Free Quote
                </button>
                
                <button 
                    onclick="window.openLeadForm('Schedule consultation for {{service_name}}', {
                        source: 'hero_secondary'
                    })"
                    class="border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-lg text-lg font-bold hover:bg-blue-50 transition-colors"
                >
                    Schedule Consultation
                </button>
            </div>
            
            <!-- Phone CTA -->
            <div class="flex items-center justify-center gap-4">
                <a href="tel:{{company_phone}}" class="text-2xl md:text-3xl font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2">
                    <span class="text-3xl">📞</span>
                    {{company_phone}}
                </a>
            </div>
            <p class="text-sm text-gray-500 mt-2">Available 24/7 for emergencies</p>
        </div>
    </div>
</section>
```

#### Static Page Hero (About/Contact)
```html
<section class="py-16 md:py-24 bg-gradient-to-r from-blue-50 to-gray-50">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                About {{company_name}}
            </h1>
            
            <p class="text-xl md:text-2xl text-gray-600 mb-8">
                {{company_tagline}}
            </p>
            
            <div class="prose prose-lg max-w-none text-gray-700">
                <p>{{company_description}}</p>
            </div>
            
            <div class="mt-8">
                <button 
                    onclick="window.openLeadForm('Contact {{company_name}}', {source: 'about_hero'})"
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700"
                >
                    Get In Touch
                </button>
            </div>
        </div>
    </div>
</section>
```

### Trust Indicator Sections

#### Stats Bar
```html
<section class="py-12 md:py-16 bg-blue-600 text-white">
    <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
            <!-- Years in Business -->
            <div>
                <div class="text-4xl md:text-5xl font-bold mb-2">
                    {{company_years_in_business}}+
                </div>
                <div class="text-sm md:text-base opacity-90">Years Experience</div>
            </div>
            
            <!-- Emergency Service -->
            <div>
                <div class="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                <div class="text-sm md:text-base opacity-90">Emergency Service</div>
            </div>
            
            <!-- Satisfaction -->
            <div>
                <div class="text-4xl md:text-5xl font-bold mb-2">100%</div>
                <div class="text-sm md:text-base opacity-90">Satisfaction Guaranteed</div>
            </div>
            
            <!-- Licensed -->
            <div>
                <div class="text-4xl md:text-5xl font-bold mb-2">
                    <span class="text-3xl">✓</span>
                </div>
                <div class="text-sm md:text-base opacity-90">Licensed & Insured</div>
            </div>
        </div>
        
        <!-- Separator -->
        <div class="max-w-5xl mx-auto">
            <div class="border-t border-white/20 my-8"></div>
            <p class="text-center text-sm md:text-base opacity-90">
                Proudly serving {{city_name}}, {{city_state}} and surrounding areas
            </p>
        </div>
    </div>
</section>
```

### Service Cards

#### Three-Column Service Grid
```html
<section class="py-16 md:py-24 bg-gray-50">
    <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                Complete {{service_name}} Services
            </h2>
            <p class="text-xl text-gray-600">
                Expert solutions for all your needs in {{city_name}}
            </p>
        </div>
        
        <!-- Service Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <!-- Service Card 1 -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <!-- Card Icon Header -->
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-center">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
                        <span class="text-4xl">🔧</span>
                    </div>
                </div>
                
                <!-- Card Content -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold mb-3 text-gray-900">
                        Emergency Repairs
                    </h3>
                    <p class="text-gray-600 mb-6">
                        24/7 emergency {{service_name}} available for urgent issues in {{city_name}}.
                    </p>
                    
                    <!-- Feature List -->
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Rapid response within 2 hours</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Available 24/7/365</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Emergency temporary repairs</span>
                        </li>
                    </ul>
                    
                    <!-- CTA Button -->
                    <button 
                        onclick="window.openLeadForm('Request emergency {{service_name}}', {
                            serviceId: '{{service_id}}',
                            cityId: '{{city_id}}',
                            source: 'emergency_service_card',
                            priority: 'urgent'
                        })"
                        class="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                        Emergency Service
                    </button>
                </div>
            </div>
            
            <!-- Service Card 2 -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div class="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
                        <span class="text-4xl">🏠</span>
                    </div>
                </div>
                
                <div class="p-6">
                    <h3 class="text-2xl font-bold mb-3 text-gray-900">
                        Complete Installations
                    </h3>
                    <p class="text-gray-600 mb-6">
                        Professional {{service_name}} installations throughout {{city_name}} and {{city_state}}.
                    </p>
                    
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">{{company_years_in_business}}+ years experience</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Licensed & insured</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Warranty included</span>
                        </li>
                    </ul>
                    
                    <button 
                        onclick="window.openLeadForm('Request {{service_name}} installation quote', {
                            serviceId: '{{service_id}}',
                            cityId: '{{city_id}}',
                            source: 'installation_service_card'
                        })"
                        class="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Get Installation Quote
                    </button>
                </div>
            </div>
            
            <!-- Service Card 3 -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-center">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
                        <span class="text-4xl">⚙️</span>
                    </div>
                </div>
                
                <div class="p-6">
                    <h3 class="text-2xl font-bold mb-3 text-gray-900">
                        Maintenance Plans
                    </h3>
                    <p class="text-gray-600 mb-6">
                        Preventive maintenance to extend the life of your {{service_name}} investment.
                    </p>
                    
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Regular inspections</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Priority scheduling</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Discounted rates</span>
                        </li>
                    </ul>
                    
                    <button 
                        onclick="window.openLeadForm('Learn about maintenance plans', {
                            serviceId: '{{service_id}}',
                            source: 'maintenance_service_card'
                        })"
                        class="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    </div>
</section>
```

### FAQ Sections

#### Accordion-Style FAQ
```html
<section class="py-16 md:py-24">
    <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                Frequently Asked Questions About {{service_name}}
            </h2>
            
            <div class="space-y-4">
                <!-- FAQ Item 1 -->
                <details class="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-500 transition-colors">
                    <summary class="px-6 py-5 cursor-pointer font-semibold text-lg text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                        <span>What is {{service_name}}?</span>
                        <span class="text-blue-600 text-2xl">+</span>
                    </summary>
                    <div class="px-6 py-5 border-t-2 border-gray-200 text-gray-700 leading-relaxed">
                        <p>{{service_description}}</p>
                        <p class="mt-4">
                            {{company_name}} has been providing expert {{service_name}} services 
                            in {{city_name}}, {{city_state}} for over {{company_years_in_business}} years.
                        </p>
                    </div>
                </details>
                
                <!-- FAQ Item 2 -->
                <details class="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-500 transition-colors">
                    <summary class="px-6 py-5 cursor-pointer font-semibold text-lg text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                        <span>How much does {{service_name}} cost in {{city_name}}?</span>
                        <span class="text-blue-600 text-2xl">+</span>
                    </summary>
                    <div class="px-6 py-5 border-t-2 border-gray-200 text-gray-700 leading-relaxed">
                        <p>
                            The cost of {{service_name}} varies based on project size, materials, 
                            and specific requirements. We offer free, no-obligation quotes for all 
                            {{service_name}} projects in {{city_name}}.
                        </p>
                        <div class="mt-4">
                            <button 
                                onclick="window.openLeadForm('Request pricing for {{service_name}}', {
                                    serviceId: '{{service_id}}',
                                    cityId: '{{city_id}}',
                                    source: 'faq_pricing_question'
                                })"
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Get Free Quote
                            </button>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ Item 3 -->
                <details class="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-500 transition-colors">
                    <summary class="px-6 py-5 cursor-pointer font-semibold text-lg text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                        <span>Do you offer emergency {{service_name}}?</span>
                        <span class="text-blue-600 text-2xl">+</span>
                    </summary>
                    <div class="px-6 py-5 border-t-2 border-gray-200 text-gray-700 leading-relaxed">
                        <p>
                            Yes! {{company_name}} provides 24/7 emergency {{service_name}} throughout 
                            {{city_name}} and surrounding areas. Our emergency response team is available 
                            around the clock to handle urgent situations.
                        </p>
                        <div class="mt-4 flex items-center gap-4">
                            <a href="tel:{{company_phone}}" class="text-2xl font-bold text-blue-600 hover:text-blue-800">
                                📞 {{company_phone}}
                            </a>
                            <span class="text-sm text-gray-500">Available 24/7</span>
                        </div>
                    </div>
                </details>
                
                <!-- More FAQ items as needed -->
            </div>
            
            <!-- CTA after FAQ -->
            <div class="mt-12 text-center bg-blue-50 rounded-lg p-8">
                <h3 class="text-2xl font-bold mb-4 text-gray-900">
                    Still Have Questions?
                </h3>
                <p class="text-gray-600 mb-6">
                    Our team is ready to answer any questions about {{service_name}} in {{city_name}}.
                </p>
                <button 
                    onclick="window.openLeadForm('I have questions about {{service_name}}', {
                        source: 'faq_footer_cta'
                    })"
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700"
                >
                    Ask a Question
                </button>
            </div>
        </div>
    </div>
</section>
```

### Contact Sections

#### Contact Information Grid
```html
<section class="py-16 md:py-24 bg-gray-50">
    <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                Contact {{company_name}}
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Contact Information -->
                <div class="space-y-6">
                    <!-- Phone -->
                    <a 
                        href="tel:{{company_phone}}" 
                        class="flex items-start gap-4 p-6 bg-white rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">📞</span>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 mb-1">Phone</div>
                            <div class="text-blue-600 hover:text-blue-800 text-lg">
                                {{company_phone}}
                            </div>
                            <div class="text-sm text-gray-500 mt-1">
                                Available {{business_hours}}
                            </div>
                        </div>
                    </a>
                    
                    <!-- Email -->
                    <a 
                        href="mailto:{{company_email}}" 
                        class="flex items-start gap-4 p-6 bg-white rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">✉️</span>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 mb-1">Email</div>
                            <div class="text-blue-600 hover:text-blue-800">
                                {{company_email}}
                            </div>
                            <div class="text-sm text-gray-500 mt-1">
                                We respond within 24 hours
                            </div>
                        </div>
                    </a>
                    
                    <!-- Address -->
                    <div class="flex items-start gap-4 p-6 bg-white rounded-lg">
                        <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">📍</span>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 mb-1">Address</div>
                            <div class="text-gray-700">
                                {{company_address}}<br>
                                {{company_city}}, {{company_state}} {{company_zip}}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Business Hours -->
                    <div class="flex items-start gap-4 p-6 bg-white rounded-lg">
                        <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">🕐</span>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 mb-1">Business Hours</div>
                            <div class="text-gray-700 whitespace-pre-line">{{business_hours}}</div>
                            <div class="text-sm text-red-600 font-semibold mt-2">
                                {{emergency_available}}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CTA Card -->
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-xl shadow-xl">
                    <h3 class="text-2xl md:text-3xl font-bold mb-4">
                        Ready to Get Started?
                    </h3>
                    <p class="text-blue-100 mb-8 text-lg">
                        Contact {{company_name}} today for your free consultation and quote. 
                        We're ready to help with all your {{service_name}} needs in {{city_name}}.
                    </p>
                    
                    <div class="space-y-4">
                        <button 
                            onclick="window.openLeadForm('Request free consultation', {
                                source: 'contact_page_cta'
                            })"
                            class="w-full bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
                        >
                            Request Free Consultation
                        </button>
                        
                        <a 
                            href="tel:{{company_phone}}" 
                            class="block w-full text-center border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition-colors"
                        >
                            📞 Call {{company_phone}}
                        </a>
                    </div>
                    
                    <div class="mt-8 pt-8 border-t border-white/20">
                        <p class="text-sm text-blue-100 text-center">
                            No obligation • Fast response • Licensed & insured
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

### Final CTA Sections

#### Urgency-Focused Final CTA
```html
<section class="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Don't Wait - Get Expert {{service_name}} Today
            </h2>
            <p class="text-xl md:text-2xl mb-10 text-blue-100">
                {{company_name}} is ready to help with your {{service_name}} needs in {{city_name}}. 
                Contact us today for your free, no-obligation quote.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
                <!-- Primary CTA -->
                <button 
                    onclick="window.openLeadForm('Request immediate quote for {{service_name}}', {
                        serviceId: '{{service_id}}',
                        cityId: '{{city_id}}',
                        source: 'final_cta_primary'
                    })"
                    class="bg-white text-blue-600 px-10 py-5 rounded-lg text-xl font-bold hover:bg-gray-100 transition-colors shadow-xl"
                >
                    Get Your Free Quote
                </button>
                
                <!-- Phone CTA -->
                <a 
                    href="tel:{{company_phone}}" 
                    class="border-2 border-white text-white px-10 py-5 rounded-lg text-xl font-bold hover:bg-white/10 transition-colors inline-flex items-center gap-3"
                >
                    <span class="text-2xl">📞</span>
                    {{company_phone}}
                </a>
            </div>
            
            <!-- Trust Indicators -->
            <div class="border-t border-white/20 pt-8">
                <div class="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">✓</span>
                        <span>{{company_years_in_business}}+ Years Experience</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xl">✓</span>
                        <span>Licensed & Insured</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xl">✓</span>
                        <span>100% Satisfaction Guarantee</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xl">✓</span>
                        <span>Free Estimates</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## SEO Requirements

### Meta Tags Template

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary SEO Tags -->
    <title>{{service_meta_title}}</title>
    <meta name="description" content="{{service_meta_description}}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{service_name}} in {{city_name}}, {{city_state}} | {{company_name}}">
    <meta property="og:description" content="{{service_description}}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="{{service_name}} in {{city_name}}">
    <meta property="twitter:description" content="{{service_description}}">
    
    <!-- Canonical URL (if known) -->
    <!-- <link rel="canonical" href="https://example.com/page"> -->
    
    <script src="https://cdn.tailwindcss.com"></script>
</head>
```

### Heading Hierarchy Rules

**Every page MUST have:**

1. **Exactly ONE H1** - Primary keyword target
```html
<!-- Service Page -->
<h1>{{service_name}} in {{city_name}}, {{city_state}}</h1>

<!-- Static Page -->
<h1>About {{company_name}}</h1>
```

2. **Multiple H2s** - Major page sections (4-6 recommended)
```html
<h2>Why Choose {{company_name}} for {{service_name}}?</h2>
<h2>Our {{service_name}} Process</h2>
<h2>{{service_name}} Service Areas</h2>
<h2>Frequently Asked Questions</h2>
<h2>Contact Us Today</h2>
```

3. **H3s for Subsections**
```html
<h3>Step 1: Initial Consultation</h3>
<h3>Emergency Service Available</h3>
<h3>What Our Customers Say</h3>
```

### Semantic HTML5 Structure

```html
<body>
    <main>
        <!-- Hero/Header Section -->
        <header class="py-20">
            <h1>{{service_name}} in {{city_name}}</h1>
        </header>
        
        <!-- Main Content Article -->
        <article>
            <!-- Services Section -->
            <section class="py-16">
                <h2>Our Services</h2>
                <!-- Content -->
            </section>
            
            <!-- Why Choose Us Section -->
            <section class="py-16">
                <h2>Why Choose Us</h2>
                <!-- Content -->
            </section>
            
            <!-- Process Section -->
            <section class="py-16">
                <h2>Our Process</h2>
                <!-- Content -->
            </section>
        </article>
        
        <!-- Aside for supplementary content (optional) -->
        <aside class="py-16">
            <h2>Additional Information</h2>
            <!-- Content -->
        </aside>
    </main>
</body>
```

### Image Optimization

```html
<!-- Product/Service Images -->
<img 
    src="/service-image.jpg" 
    alt="Professional {{service_name}} by {{company_name}} in {{city_name}}, {{city_state}}"
    loading="lazy"
    width="800"
    height="600"
    class="w-full h-auto rounded-lg shadow-lg"
>

<!-- Team/Company Images -->
<img 
    src="/team.jpg" 
    alt="{{company_name}} professional team serving {{city_name}}"
    loading="lazy"
    class="w-full h-auto rounded-lg"
>

<!-- Decorative Images (empty alt) -->
<img 
    src="/decoration.jpg" 
    alt=""
    loading="lazy"
    class="w-full h-auto"
>
```

---

## Responsive Design Patterns

### Tailwind Breakpoint System

```
Base (mobile):  0px - 639px    (no prefix)
sm:             640px+         (small tablets)
md:             768px+         (tablets)
lg:             1024px+        (desktop)
xl:             1280px+        (large desktop)
2xl:            1536px+        (extra large)
```

### Common Responsive Patterns

#### Text Sizing
```html
<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
    Responsive Headline
</h1>

<p class="text-base md:text-lg lg:text-xl">
    Responsive body text
</p>
```

#### Spacing
```html
<section class="py-12 md:py-16 lg:py-24">
    <div class="px-4 md:px-6 lg:px-8">
        <!-- Content -->
    </div>
</section>
```

#### Grid Layouts
```html
<!-- Stack on mobile, 2 cols on tablet, 3 cols on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Items -->
</div>

<!-- 2 cols on mobile, 4 cols on desktop -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <!-- Items -->
</div>
```

#### Flexbox Direction
```html
<!-- Stack on mobile, row on tablet+ -->
<div class="flex flex-col md:flex-row gap-4">
    <!-- Items -->
</div>

<!-- Reverse order on desktop -->
<div class="flex flex-col lg:flex-row-reverse gap-8">
    <!-- Items -->
</div>
```

#### Hidden/Visible Elements
```html
<!-- Hidden on mobile, visible on desktop -->
<div class="hidden lg:block">
    Desktop only content
</div>

<!-- Visible on mobile, hidden on desktop -->
<div class="block lg:hidden">
    Mobile only content
</div>
```

---

## Complete Examples

### Complete Static Page (About Us)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About {{company_name}} | {{company_tagline}}</title>
    <meta name="description" content="{{company_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <!-- Hero Section -->
        <section class="py-16 md:py-24 bg-gradient-to-r from-blue-50 to-gray-50">
            <div class="container mx-auto px-4">
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                        About {{company_name}}
                    </h1>
                    
                    <p class="text-xl md:text-2xl text-gray-600 mb-8">
                        {{company_tagline}}
                    </p>
                    
                    <div class="prose prose-lg max-w-none text-gray-700">
                        <p>{{company_description}}</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Company Stats -->
        <section class="py-12 bg-blue-600 text-white">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">
                            {{company_years_in_business}}+
                        </div>
                        <div class="text-sm md:text-base opacity-90">Years in Business</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">100%</div>
                        <div class="text-sm md:text-base opacity-90">Customer Satisfaction</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">Licensed</div>
                        <div class="text-sm md:text-base opacity-90">& Insured</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">Local</div>
                        <div class="text-sm md:text-base opacity-90">{{company_city}} Business</div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Our Story -->
        <section class="py-16 md:py-24">
            <div class="container mx-auto px-4">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
                        Our Story
                    </h2>
                    
                    <div class="space-y-6 text-gray-700 text-lg">
                        <p>
                            Founded in {{company_founding_year}}, {{company_name}} has been serving 
                            {{company_city}}, {{company_state}} for over {{company_years_in_business}} years. 
                            Our commitment to excellence and customer satisfaction has made us a trusted 
                            name in the community.
                        </p>
                        
                        <p>
                            {{company_description}}
                        </p>
                        
                        <p>
                            Today, we continue to uphold the values that have defined {{company_name}} 
                            since day one: integrity, quality craftsmanship, and exceptional customer service.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Why Choose Us -->
        <section class="py-16 md:py-24 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="max-w-5xl mx-auto">
                    <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                        Why Choose {{company_name}}?
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">🏆</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Experienced Team
                            </h3>
                            <p class="text-gray-600">
                                With {{company_years_in_business}}+ years of experience, our team brings 
                                unmatched expertise to every project.
                            </p>
                        </div>
                        
                        <div class="text-center">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">⭐</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Quality Workmanship
                            </h3>
                            <p class="text-gray-600">
                                We take pride in delivering exceptional quality on every project, 
                                big or small.
                            </p>
                        </div>
                        
                        <div class="text-center">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">🤝</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Customer Focused
                            </h3>
                            <p class="text-gray-600">
                                Your satisfaction is our top priority. We're not done until you're 
                                completely happy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Contact CTA -->
        <section class="py-16 md:py-24 bg-blue-600 text-white">
            <div class="container mx-auto px-4">
                <div class="max-w-3xl mx-auto text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-6">
                        Ready to Work With {{company_name}}?
                    </h2>
                    <p class="text-xl mb-10 text-blue-100">
                        Contact us today to discuss your project and get a free quote.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onclick="window.openLeadForm('Contact {{company_name}}', {
                                source: 'about_page_cta'
                            })"
                            class="bg-white text-blue-600 px-10 py-5 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
                        >
                            Get In Touch
                        </button>
                        
                        <a 
                            href="tel:{{company_phone}}" 
                            class="border-2 border-white text-white px-10 py-5 rounded-lg text-lg font-bold hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <span>📞</span>
                            {{company_phone}}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
```

### Complete Service Template Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_meta_title}}</title>
    <meta name="description" content="{{service_meta_description}}">
    
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{service_name}} in {{city_name}}, {{city_state}}">
    <meta property="og:description" content="{{service_description}}">
    
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <!-- Hero Section -->
        <section class="py-20 md:py-32 bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <div class="container mx-auto px-4">
                <div class="max-w-5xl mx-auto text-center">
                    <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                        <span>⭐</span>
                        <span>{{company_years_in_business}}+ Years of Excellence</span>
                    </div>
                    
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                        Professional {{service_name}} in {{city_name}}, {{city_state}}
                    </h1>
                    
                    <p class="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
                        {{service_description}}
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <button 
                            onclick="window.openLeadForm('Request {{service_name}} quote', {
                                serviceId: '{{service_id}}',
                                cityId: '{{city_id}}',
                                source: 'hero_primary'
                            })"
                            class="bg-blue-600 text-white px-10 py-5 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            Get Free Quote
                        </button>
                        
                        <button 
                            onclick="window.openLeadForm('Schedule consultation for {{service_name}}', {
                                source: 'hero_secondary'
                            })"
                            class="border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-lg text-lg font-bold hover:bg-blue-50 transition-colors"
                        >
                            Schedule Consultation
                        </button>
                    </div>
                    
                    <div class="flex items-center justify-center gap-4">
                        <a href="tel:{{company_phone}}" class="text-2xl md:text-3xl font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2">
                            <span class="text-3xl">📞</span>
                            {{company_phone}}
                        </a>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">Available 24/7 for emergencies</p>
                </div>
            </div>
        </section>
        
        <!-- Trust Bar -->
        <section class="py-12 md:py-16 bg-blue-600 text-white">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">
                            {{company_years_in_business}}+
                        </div>
                        <div class="text-sm md:text-base opacity-90">Years Experience</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                        <div class="text-sm md:text-base opacity-90">Emergency Service</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">100%</div>
                        <div class="text-sm md:text-base opacity-90">Satisfaction Guaranteed</div>
                    </div>
                    
                    <div>
                        <div class="text-4xl md:text-5xl font-bold mb-2">
                            <span class="text-3xl">✓</span>
                        </div>
                        <div class="text-sm md:text-base opacity-90">Licensed & Insured</div>
                    </div>
                </div>
                
                <div class="border-t border-white/20 mt-8 pt-8 text-center">
                    <p class="text-sm md:text-base opacity-90">
                        Proudly serving {{city_name}}, {{city_state}} and surrounding areas
                    </p>
                </div>
            </div>
        </section>
        
        <!-- Why Choose Us -->
        <section class="py-16 md:py-24">
            <div class="container mx-auto px-4">
                <div class="max-w-5xl mx-auto">
                    <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                        Why Choose {{company_name}} for {{service_name}}?
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="text-center p-6">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">🏆</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Local Experts
                            </h3>
                            <p class="text-gray-600">
                                {{company_years_in_business}}+ years serving {{city_name}} with expert 
                                {{service_name}} services.
                            </p>
                        </div>
                        
                        <div class="text-center p-6">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">⚡</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Fast Response
                            </h3>
                            <p class="text-gray-600">
                                24/7 emergency {{service_name}} available throughout {{city_name}}.
                            </p>
                        </div>
                        
                        <div class="text-center p-6">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-4xl">✓</span>
                            </div>
                            <h3 class="text-xl font-bold mb-3 text-gray-900">
                                Guaranteed Work
                            </h3>
                            <p class="text-gray-600">
                                100% satisfaction guarantee on all {{service_name}} projects.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Service Details -->
        <section class="py-16 md:py-24 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
                        About Our {{service_name}} Services
                    </h2>
                    
                    <div class="prose prose-lg max-w-none text-gray-700 mb-8">
                        <p>{{service_description}}</p>
                        
                        <p>
                            {{company_name}} has been providing expert {{service_name}} throughout 
                            {{city_name}}, {{city_state}} for over {{company_years_in_business}} years. 
                            Our experienced team understands the unique needs of properties in {{city_name}} 
                            and delivers solutions that last.
                        </p>
                    </div>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                        <h3 class="text-xl font-bold mb-3 text-gray-900">
                            {{service_name}} Features:
                        </h3>
                        <ul class="space-y-2 text-gray-700">
                            <li class="flex items-start gap-2">
                                <span class="text-green-500 text-xl">✓</span>
                                <span>Licensed and insured professionals</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-green-500 text-xl">✓</span>
                                <span>Free estimates and consultations</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-green-500 text-xl">✓</span>
                                <span>{{company_years_in_business}}+ years of experience</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-green-500 text-xl">✓</span>
                                <span>100% satisfaction guarantee</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <span class="text-green-500 text-xl">✓</span>
                                <span>24/7 emergency service available</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- CTA Section -->
        <section class="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
            <div class="container mx-auto px-4">
                <div class="max-w-4xl mx-auto text-center">
                    <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Ready for Expert {{service_name}}?
                    </h2>
                    <p class="text-xl md:text-2xl mb-10 text-blue-100">
                        Contact {{company_name}} today for your free {{service_name}} quote in {{city_name}}.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
                        <button 
                            onclick="window.openLeadForm('Request immediate quote for {{service_name}}', {
                                serviceId: '{{service_id}}',
                                cityId: '{{city_id}}',
                                source: 'final_cta_primary'
                            })"
                            class="bg-white text-blue-600 px-10 py-5 rounded-lg text-xl font-bold hover:bg-gray-100 transition-colors shadow-xl"
                        >
                            Get Your Free Quote
                        </button>
                        
                        <a 
                            href="tel:{{company_phone}}" 
                            class="border-2 border-white text-white px-10 py-5 rounded-lg text-xl font-bold hover:bg-white/10 transition-colors inline-flex items-center gap-3"
                        >
                            <span class="text-2xl">📞</span>
                            {{company_phone}}
                        </a>
                    </div>
                    
                    <div class="border-t border-white/20 pt-8">
                        <div class="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base">
                            <div class="flex items-center gap-2">
                                <span class="text-xl">✓</span>
                                <span>{{company_years_in_business}}+ Years Experience</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xl">✓</span>
                                <span>Licensed & Insured</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xl">✓</span>
                                <span>Free Estimates</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
```

---

## End of Specification

This specification sheet provides complete technical reference for HTML template generation. When generating templates, always refer back to this document for:
- Variable availability and usage
- HTML patterns and components
- SEO requirements
- Responsive design patterns
- Complete working examples

For instructions on how to use this specification, refer to `AI_INSTRUCTIONS.md`.
