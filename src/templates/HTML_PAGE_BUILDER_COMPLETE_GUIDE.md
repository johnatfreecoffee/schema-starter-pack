# HTML Template Builder - Complete Guide
## For External AI Page Generation Compatible with Lovable System

---

## ⚠️ CRITICAL OUTPUT FORMAT

**You MUST generate pure HTML templates - NOT React/TypeScript components.**

### ✅ CORRECT Output:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}} - {{service_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
    <h1 class="text-4xl font-bold">{{company_name}}</h1>
    <button 
        onclick="window.openLeadForm('Request Quote', {source: 'hero'})"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg"
    >
        Get Free Quote
    </button>
</body>
</html>
```

### ❌ WRONG Output (Do NOT Generate This):
```tsx
// DO NOT GENERATE REACT COMPONENTS
import { Button } from "@/components/ui/button";
export default function HomePage() {
  return <h1>{{company_name}}</h1>;
}
```

---

## TABLE OF CONTENTS
1. [Technology Stack](#technology-stack)
2. [Variable System](#variable-system)
3. [Form Integration](#form-integration)
4. [Page Types](#page-types)
5. [HTML Patterns](#html-patterns)
6. [SEO Requirements](#seo-requirements)
7. [Critical Rules](#critical-rules)

---

## TECHNOLOGY STACK

### Core Technologies
- **HTML5** with semantic structure
- **Tailwind CSS** via CDN for styling
- **Handlebars** template variables (`{{variable_name}}`)
- **JavaScript** global functions for interactivity

### Required in Every HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}} - Page Title</title>
    <meta name="description" content="{{company_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <!-- Your page content here -->
</body>
</html>
```

### NO External Dependencies
- ❌ No React imports
- ❌ No TypeScript
- ❌ No npm packages
- ❌ No shadcn/ui
- ❌ No Lucide React icons

### Icons
Use inline SVG or Unicode symbols:
```html
<!-- Phone icon -->
<span class="text-xl">📞</span>

<!-- Star icon -->
<span class="text-yellow-500">★</span>

<!-- Check mark -->
<span class="text-green-500">✓</span>

<!-- Or use inline SVG -->
<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  <path d="M..."/>
</svg>
```

---

## VARIABLE SYSTEM

### Handlebars Syntax
All dynamic content uses Handlebars template syntax in HTML:

```html
<h1>Welcome to {{company_name}}</h1>
<p>Call us at <a href="tel:{{company_phone}}">{{company_phone}}</a></p>
<p>Serving {{city_name}}, {{city_state}}</p>
```

**CRITICAL RULES:**
- NEVER hardcode company/service/location data
- ALWAYS use `{{double_braces}}` for variables
- Variables are case-sensitive
- Variables work in text content, attributes, and onclick handlers

---

### COMPANY VARIABLES (Available in ALL Pages)

#### Basic Information
```handlebars
{{company_name}}              - Company legal name
{{company_tagline}}           - Company slogan
{{company_description}}       - Company description
{{company_years_in_business}} - Years in business (number)
{{company_founding_year}}     - Year founded
```

#### Contact Information
```handlebars
{{company_phone}}             - Primary phone number
{{company_email}}             - Primary email address
{{company_website}}           - Company website URL
{{company_address}}           - Full street address
{{company_city}}              - City
{{company_state}}             - State/Province
{{company_zip}}               - ZIP/Postal code
```

#### Business Details
```handlebars
{{company_license_number}}    - Business license number
{{business_hours}}            - Operating hours
{{emergency_available}}       - Emergency availability
```

#### Social Media
```handlebars
{{company_facebook}}          - Facebook URL
{{company_instagram}}         - Instagram URL
{{company_linkedin}}          - LinkedIn URL
```

---

### SERVICE VARIABLES (Only for Service Template Pages)

#### Service Information
```handlebars
{{service_name}}              - Service name
{{service_description}}       - Service description
{{service_tagline}}           - Service tagline
{{service_meta_title}}        - SEO title
{{service_meta_description}}  - SEO description
```

---

### SERVICE AREA VARIABLES (Only for Service Template Pages)

#### Location Information
```handlebars
{{city_name}}                 - City name
{{city_state}}                - State/Province
{{area_description}}          - Location-specific description
{{service_area_tagline}}      - Location-specific tagline
```

---

## FORM INTEGRATION

### Universal Lead Form

The system includes a pre-built lead form. Pages trigger it using a global JavaScript function.

#### How It Works
1. Form opens in a modal overlay
2. Collects: name, email, phone, message
3. Automatically submits to backend
4. Includes context data (service, location, source)

#### Triggering the Universal Form

Use the global `window.openLeadForm()` function with onclick handlers:

```html
<!-- Basic button trigger -->
<button 
    onclick="window.openLeadForm('Request free quote', {source: 'hero_section'})"
    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
>
    Get Free Quote
</button>

<!-- With dynamic variables -->
<button 
    onclick="window.openLeadForm('Request {{service_name}} quote in {{city_name}}', {
        serviceId: '{{service_id}}',
        cityId: '{{city_id}}',
        source: 'service_card'
    })"
    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
>
    Get Quote for {{service_name}}
</button>

<!-- Emergency CTA -->
<button 
    onclick="window.openLeadForm('Emergency service request', {source: 'emergency_cta'})"
    class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold"
>
    Emergency Service
</button>

<!-- Phone link alternative -->
<a 
    href="tel:{{company_phone}}" 
    class="text-blue-600 hover:text-blue-800 underline font-semibold"
>
    Call {{company_phone}}
</a>
```

#### Form Integration Best Practices

1. **Primary CTA** - Hero sections, main call to action
2. **Secondary CTA** - Supporting actions, learn more
3. **Service-specific CTAs** - Include service context
4. **Emergency CTAs** - Urgent services, 24/7 availability
5. **Phone CTAs** - Always provide phone alternative

---

## PAGE TYPES

### Static Pages

**Available Variables:** ONLY Company Variables
**Examples:** About, Contact, Terms, Privacy, FAQ

#### Static Page Rules:
- ❌ NO `{{service_name}}`, `{{service_description}}`
- ❌ NO `{{city_name}}`, `{{city_state}}`
- ✅ ONLY `{{company_*}}` variables
- ✅ Can use universal form with generic messaging

#### Static Page Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About {{company_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <section class="py-12 md:py-20">
            <div class="container mx-auto px-4 max-w-4xl">
                <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                    About {{company_name}}
                </h1>
                <p class="text-lg text-gray-600 mb-8">
                    {{company_description}}
                </p>
                <!-- More content -->
            </div>
        </section>
    </main>
</body>
</html>
```

---

### Service Template Pages

**Available Variables:** Company + Service + Service Area Variables
**Examples:** Service pages, location-specific pages

#### Service Page Rules:
- ✅ ALL company variables available
- ✅ ALL service variables available
- ✅ ALL service area variables available
- ✅ Must include multiple CTAs
- ✅ Must be SEO-optimized

#### Service Page Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_name}} in {{city_name}}, {{city_state}} | {{company_name}}</title>
    <meta name="description" content="{{service_meta_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <!-- Hero Section -->
        <section class="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-white">
            <div class="container mx-auto px-4">
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
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
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Get Free Quote
                </button>
            </div>
        </section>
    </main>
</body>
</html>
```

---

## HTML PATTERNS

### Hero Section Pattern

```html
<section class="py-20 bg-gradient-to-br from-blue-50 to-white">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
            <!-- Badge -->
            <span class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Trusted Since {{company_founding_year}}
            </span>
            
            <!-- Main Headline (H1) -->
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                {{service_name}} in {{city_name}}, {{city_state}}
            </h1>
            
            <!-- Subheadline -->
            <p class="text-xl md:text-2xl text-gray-600 mb-8">
                {{service_description}}
            </p>
            
            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onclick="window.openLeadForm('Request {{service_name}} quote', {
                        serviceId: '{{service_id}}',
                        cityId: '{{city_id}}',
                        source: 'hero_primary'
                    })"
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                    Get Free Quote
                </button>
                
                <button 
                    onclick="window.openLeadForm('Learn more about {{service_name}}', {source: 'hero_secondary'})"
                    class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                    Learn More
                </button>
            </div>
            
            <!-- Phone CTA -->
            <div class="mt-8">
                <a href="tel:{{company_phone}}" class="text-2xl font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-2">
                    <span>📞</span>
                    {{company_phone}}
                </a>
                <p class="text-sm text-gray-500 mt-2">Available 24/7</p>
            </div>
        </div>
    </div>
</section>
```

### Trust Indicators Section

```html
<section class="py-12 bg-blue-600 text-white">
    <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
                <div class="text-4xl font-bold mb-2">
                    {{company_years_in_business}}+
                </div>
                <div class="text-sm opacity-90">Years Experience</div>
            </div>
            
            <div>
                <div class="text-4xl font-bold mb-2">24/7</div>
                <div class="text-sm opacity-90">Emergency Service</div>
            </div>
            
            <div>
                <div class="text-4xl font-bold mb-2">100%</div>
                <div class="text-sm opacity-90">Satisfaction</div>
            </div>
            
            <div>
                <div class="text-4xl font-bold mb-2">Licensed</div>
                <div class="text-sm opacity-90">& Insured</div>
            </div>
        </div>
    </div>
</section>
```

### Service Cards Grid

```html
<section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Our {{service_name}} Services
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <!-- Service Card -->
            <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <!-- Card Header -->
                <div class="p-6 border-b border-gray-200">
                    <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                        <span class="text-2xl">🔧</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">{{service_name}}</h3>
                    <p class="text-gray-600">Professional service in {{city_name}}</p>
                </div>
                
                <!-- Card Content -->
                <div class="p-6">
                    <ul class="space-y-3 mb-6">
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Licensed & Insured</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">{{company_years_in_business}}+ Years Experience</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">24/7 Emergency Service</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="text-green-500 text-xl flex-shrink-0">✓</span>
                            <span class="text-gray-700">Free Estimates</span>
                        </li>
                    </ul>
                    
                    <button 
                        onclick="window.openLeadForm('Request {{service_name}} quote', {
                            serviceId: '{{service_id}}',
                            cityId: '{{city_id}}',
                            source: 'service_card'
                        })"
                        class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Get Quote
                    </button>
                </div>
            </div>
        </div>
    </div>
</section>
```

### FAQ Accordion Pattern

```html
<section class="py-16">
    <div class="container mx-auto px-4 max-w-3xl">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
        </h2>
        
        <div class="space-y-4">
            <!-- FAQ Item -->
            <details class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <summary class="px-6 py-4 cursor-pointer font-semibold text-lg text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                    What is {{service_name}}?
                    <span class="text-blue-600">+</span>
                </summary>
                <div class="px-6 py-4 border-t border-gray-200 text-gray-600">
                    <p>{{service_description}}</p>
                </div>
            </details>
            
            <!-- More FAQ items -->
        </div>
    </div>
</section>
```

### Contact Section Pattern

```html
<section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                Contact {{company_name}}
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Contact Info -->
                <div class="space-y-6">
                    <!-- Phone -->
                    <a href="tel:{{company_phone}}" class="flex items-start gap-4 p-4 rounded-lg hover:bg-white transition-colors">
                        <span class="text-2xl">📞</span>
                        <div>
                            <div class="font-semibold text-gray-900 mb-1">Phone</div>
                            <div class="text-blue-600 hover:text-blue-800">{{company_phone}}</div>
                        </div>
                    </a>
                    
                    <!-- Email -->
                    <a href="mailto:{{company_email}}" class="flex items-start gap-4 p-4 rounded-lg hover:bg-white transition-colors">
                        <span class="text-2xl">✉️</span>
                        <div>
                            <div class="font-semibold text-gray-900 mb-1">Email</div>
                            <div class="text-blue-600 hover:text-blue-800">{{company_email}}</div>
                        </div>
                    </a>
                    
                    <!-- Address -->
                    <div class="flex items-start gap-4 p-4">
                        <span class="text-2xl">📍</span>
                        <div>
                            <div class="font-semibold text-gray-900 mb-1">Address</div>
                            <div class="text-gray-600">
                                {{company_address}}<br>
                                {{company_city}}, {{company_state}} {{company_zip}}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Hours -->
                    <div class="flex items-start gap-4 p-4">
                        <span class="text-2xl">🕐</span>
                        <div>
                            <div class="font-semibold text-gray-900 mb-1">Business Hours</div>
                            <div class="text-gray-600 whitespace-pre-line">{{business_hours}}</div>
                        </div>
                    </div>
                </div>
                
                <!-- CTA Card -->
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Get In Touch</h3>
                    <p class="text-gray-600 mb-6">
                        Ready to get started? Click below to send us a message.
                    </p>
                    <button 
                        onclick="window.openLeadForm('Contact form submission', {source: 'contact_form'})"
                        class="w-full bg-blue-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Send Message
                    </button>
                    <p class="text-sm text-gray-500 mt-4 text-center">
                        Fast response • No obligation
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## SEO REQUIREMENTS

### Meta Tags (in `<head>`)

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Title (under 60 characters) -->
    <title>{{service_name}} in {{city_name}}, {{city_state}} | {{company_name}}</title>
    
    <!-- Meta Description (under 160 characters) -->
    <meta name="description" content="{{service_meta_description}}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{service_name}} in {{city_name}}">
    <meta property="og:description" content="{{service_description}}">
    <meta property="og:type" content="website">
    
    <script src="https://cdn.tailwindcss.com"></script>
</head>
```

### Heading Hierarchy

**Every page MUST have:**

1. **One H1** - Main keyword
```html
<h1>{{service_name}} in {{city_name}}, {{city_state}}</h1>
```

2. **Multiple H2s** - Major sections
```html
<h2>Our {{service_name}} Process</h2>
<h2>Why Choose {{company_name}}?</h2>
<h2>{{service_name}} Service Areas</h2>
```

3. **H3s** - Subsections
```html
<h3>Step 1: Initial Consultation</h3>
<h3>Customer Reviews</h3>
```

### Semantic HTML Structure

```html
<body>
    <main>
        <article>
            <!-- Hero Section -->
            <header>
                <h1>{{service_name}} in {{city_name}}</h1>
            </header>
            
            <!-- Main Content Sections -->
            <section>
                <h2>Section Title</h2>
                <p>Content...</p>
            </section>
            
            <section>
                <h2>Another Section</h2>
                <p>Content...</p>
            </section>
        </article>
    </main>
</body>
```

### Image Optimization

```html
<!-- Always include descriptive alt text with variables -->
<img 
    src="/service-image.jpg" 
    alt="{{service_name}} by {{company_name}} in {{city_name}}, {{city_state}}"
    loading="lazy"
    class="w-full h-auto rounded-lg"
>

<!-- For decorative images -->
<img 
    src="/decoration.jpg" 
    alt=""
    loading="lazy"
    class="w-full h-auto"
>
```

---

## CRITICAL RULES

### MUST DO ✅

1. **Output Format**: Generate pure HTML with `<!DOCTYPE html>` - NOT React
2. **Variables**: Use `{{variable_name}}` for ALL dynamic content
3. **Forms**: Use `onclick="window.openLeadForm(...)"` for all lead capture
4. **Styling**: Include Tailwind CDN in `<head>`
5. **Responsive**: Mobile-first with `md:` and `lg:` breakpoints
6. **SEO**: Proper `<head>`, H1, meta tags, semantic HTML5
7. **No Dependencies**: No React, no TypeScript, no npm packages

### NEVER DO ❌

1. **NO React/JSX**: Never generate React components or JSX
2. **NO Imports**: Never include `import` statements
3. **NO Hardcoded Data**: Never hardcode company/service/city names
4. **NO useLeadFormModal()**: Use `window.openLeadForm()` instead
5. **NO TypeScript**: Pure HTML only
6. **NO Custom Forms**: Only onclick handlers to trigger global form

---

## VALIDATION CHECKLIST

### Before Generation:
- [ ] Do I know the page type? (Static vs Service)
- [ ] Do I know which variables I can use?
- [ ] Will I output pure HTML (not React)?
- [ ] Will I use `window.openLeadForm()` for forms?

### After Generation:
- [ ] Starts with `<!DOCTYPE html>`
- [ ] Includes Tailwind CDN in `<head>`
- [ ] All variables use `{{variable_name}}` syntax
- [ ] No hardcoded company/service/location data
- [ ] Forms use `onclick="window.openLeadForm(...)"`
- [ ] Responsive with Tailwind breakpoints
- [ ] Proper SEO structure (H1, meta tags)
- [ ] No React imports or components

---

## COMPLETE EXAMPLE: Service Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_name}} in {{city_name}}, {{city_state}} | {{company_name}}</title>
    <meta name="description" content="{{service_meta_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <!-- Hero Section -->
        <section class="py-20 bg-gradient-to-br from-blue-50 to-white">
            <div class="container mx-auto px-4">
                <div class="max-w-4xl mx-auto text-center">
                    <span class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        {{company_years_in_business}}+ Years Experience
                    </span>
                    
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                        {{service_name}} in {{city_name}}, {{city_state}}
                    </h1>
                    
                    <p class="text-xl md:text-2xl text-gray-600 mb-8">
                        {{service_description}}
                    </p>
                    
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onclick="window.openLeadForm('Request {{service_name}} quote', {
                                serviceId: '{{service_id}}',
                                cityId: '{{city_id}}',
                                source: 'hero_primary'
                            })"
                            class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            Get Free Quote
                        </button>
                        
                        <a href="tel:{{company_phone}}" class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2">
                            <span>📞</span>
                            Call {{company_phone}}
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Trust Indicators -->
        <section class="py-12 bg-blue-600 text-white">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
                    <div>
                        <div class="text-4xl font-bold mb-2">{{company_years_in_business}}+</div>
                        <div class="text-sm opacity-90">Years Experience</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">24/7</div>
                        <div class="text-sm opacity-90">Emergency Service</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">Licensed</div>
                        <div class="text-sm opacity-90">& Insured</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">{{city_name}}</div>
                        <div class="text-sm opacity-90">Local Experts</div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Services Section -->
        <section class="py-16">
            <div class="container mx-auto px-4">
                <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                    Why Choose {{company_name}}?
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">🏆</span>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-gray-900">Expert Team</h3>
                        <p class="text-gray-600">{{company_years_in_business}}+ years serving {{city_name}}</p>
                    </div>
                    
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">⚡</span>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-gray-900">Fast Response</h3>
                        <p class="text-gray-600">24/7 emergency service available</p>
                    </div>
                    
                    <div class="text-center">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-3xl">✓</span>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-gray-900">Guaranteed Work</h3>
                        <p class="text-gray-600">100% satisfaction guarantee</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Final CTA -->
        <section class="py-16 bg-gray-50">
            <div class="container mx-auto px-4">
                <div class="max-w-3xl mx-auto text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                        Ready to Get Started?
                    </h2>
                    <p class="text-xl text-gray-600 mb-8">
                        Contact {{company_name}} today for your free {{service_name}} quote
                    </p>
                    <button 
                        onclick="window.openLeadForm('Request free quote', {source: 'final_cta'})"
                        class="bg-blue-600 text-white px-10 py-5 rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        Get Your Free Quote
                    </button>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
```

---

## Support

This is your complete guide for generating HTML templates compatible with the Lovable system. Follow these patterns exactly for best results.
