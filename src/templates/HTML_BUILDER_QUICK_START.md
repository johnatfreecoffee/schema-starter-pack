# HTML Template Builder - Quick Start

## ⚠️ CRITICAL: Output Format

**Generate pure HTML templates - NOT React/TypeScript components.**

---

## 🚨 CORE RULES

### 1. Output Format: Pure HTML

❌ **WRONG: React Component**
```tsx
import { Button } from "@/components/ui/button";
export default function HomePage() {
  return <h1>{{company_name}}</h1>;
}
```

✅ **CORRECT: Pure HTML**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{company_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <h1 class="text-4xl font-bold">{{company_name}}</h1>
</body>
</html>
```

### 2. NEVER Hardcode Variables

❌ **WRONG:**
```html
<h1>ABC Roofing Company</h1>
<a href="tel:555-1234">Call Us</a>
```

✅ **CORRECT:**
```html
<h1>{{company_name}}</h1>
<a href="tel:{{company_phone}}">Call {{company_phone}}</a>
```

### 3. Use Tailwind for Styling

✅ **CORRECT:**
```html
<div class="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors">
    <h2 class="text-2xl font-bold">{{company_name}}</h2>
</div>
```

### 4. Understand Page Types

**Static Pages** (About, Contact):
- ✅ Use: `{{company_*}}` variables ONLY
- ❌ Never: `{{service_*}}` or `{{city_*}}` variables

**Service Pages**:
- ✅ Use: ALL variables (`{{company_*}}`, `{{service_*}}`, `{{city_*}}`)

### 5. Use Global Function for Forms

❌ **WRONG: Custom Form**
```html
<form onsubmit="handleSubmit()">
  <input name="email" />
  <button>Submit</button>
</form>
```

❌ **WRONG: React Hook**
```tsx
const { showLeadForm } = useLeadFormModal();
```

✅ **CORRECT: Global Function**
```html
<button 
    onclick="window.openLeadFormModal('Request quote', {
        serviceId: '{{service_id}}',
        source: 'hero_cta'
    })"
    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
>
    Get Free Quote
</button>
```

---

## 📦 Technology Stack

### Required in Every Page

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
    <!-- Your page content -->
</body>
</html>
```

### NO External Dependencies
- ❌ No React imports
- ❌ No TypeScript
- ❌ No npm packages
- ❌ No shadcn/ui
- ❌ No Lucide icons

### Icons: Use Unicode or SVG
```html
<!-- Unicode emoji icons -->
<span class="text-xl">📞</span>  <!-- Phone -->
<span class="text-xl">✉️</span>  <!-- Email -->
<span class="text-xl">⭐</span>  <!-- Star -->
<span class="text-green-500">✓</span>  <!-- Check -->

<!-- Or inline SVG -->
<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  <path d="M..."/>
</svg>
```

---

## 🎨 Quick Variable Reference

### Company Variables (Available on ALL pages)
```handlebars
{{company_name}}              {{company_phone}}
{{company_tagline}}           {{company_email}}
{{company_description}}       {{company_address}}
{{company_years_in_business}} {{company_city}}
{{business_hours}}            {{company_state}}
{{company_license_number}}    {{company_zip}}
```

### Service Variables (ONLY on service pages)
```handlebars
{{service_name}}              {{service_description}}
{{service_tagline}}           {{service_meta_title}}
{{service_id}}                {{service_meta_description}}
```

### Location Variables (ONLY on service pages)
```handlebars
{{city_name}}                 {{city_state}}
{{city_id}}                   {{area_description}}
```

---

## 🎨 Form Integration Pattern

### Basic CTA Button
```html
<button 
    onclick="window.openLeadFormModal('Request {{service_name}} quote', {
        serviceId: '{{service_id}}',
        cityId: '{{city_id}}',
        source: 'hero_primary'
    })"
    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
>
    Get Free Quote
</button>
```

### Multiple CTAs
```html
<div class="flex gap-4">
    <!-- Primary CTA -->
    <button 
        onclick="window.openLeadFormModal('Request quote', {source: 'primary_cta'})"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
    >
        Get Quote
    </button>
    
    <!-- Secondary CTA -->
    <button 
        onclick="window.openLeadFormModal('Schedule consultation', {source: 'secondary_cta'})"
        class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
    >
        Schedule Call
    </button>
    
    <!-- Phone CTA -->
    <a href="tel:{{company_phone}}" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold">
        <span>📞</span>
        {{company_phone}}
    </a>
</div>
```

---

## 📋 Common Page Patterns

### Hero Section
```html
<section class="py-20 bg-gradient-to-br from-blue-50 to-white">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                {{service_name}} in {{city_name}}, {{city_state}}
            </h1>
            <p class="text-xl text-gray-600 mb-8">
                {{service_description}}
            </p>
            <button 
                onclick="window.openLeadFormModal('Request {{service_name}} quote', {
                    serviceId: '{{service_id}}',
                    cityId: '{{city_id}}',
                    source: 'hero'
                })"
                class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Get Free Quote
            </button>
        </div>
    </div>
</section>
```

### Trust Indicators
```html
<section class="py-12 bg-blue-600 text-white">
    <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
                <div class="text-4xl font-bold mb-2">{{company_years_in_business}}+</div>
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

### Service Cards
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 container mx-auto px-4">
    <!-- Service Card -->
    <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span class="text-2xl">🔧</span>
        </div>
        <h3 class="text-2xl font-bold mb-4 text-gray-900">{{service_name}}</h3>
        <p class="text-gray-600 mb-6">{{service_description}}</p>
        
        <ul class="space-y-2 mb-6">
            <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span>
                <span>Licensed & Insured</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span>
                <span>Free Estimates</span>
            </li>
            <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span>
                <span>{{company_years_in_business}}+ Years Experience</span>
            </li>
        </ul>
        
        <button 
            onclick="window.openLeadFormModal('Request {{service_name}} quote', {
                serviceId: '{{service_id}}',
                source: 'service_card'
            })"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
            Get Quote
        </button>
    </div>
</div>
```

---

## 🔍 SEO Requirements

### Every Page MUST Have:

1. **Proper HTML Structure**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_name}} in {{city_name}} | {{company_name}}</title>
    <meta name="description" content="{{service_meta_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <main>
        <!-- Content -->
    </main>
</body>
</html>
```

2. **One H1 Tag**
```html
<h1>{{service_name}} in {{city_name}}, {{city_state}}</h1>
```

3. **Multiple H2 Tags**
```html
<h2>Our {{service_name}} Process</h2>
<h2>Why Choose {{company_name}}?</h2>
```

4. **Image Alt Text**
```html
<img 
    src="/image.jpg" 
    alt="{{service_name}} by {{company_name}} in {{city_name}}"
    loading="lazy"
    class="w-full h-auto rounded-lg"
>
```

5. **Semantic HTML**
```html
<main>
    <article>
        <header>
            <h1>Main Title</h1>
        </header>
        <section>
            <h2>Section Title</h2>
            <p>Content...</p>
        </section>
    </article>
</main>
```

---

## ✅ Validation Checklist

### Before Generating:
- [ ] Do I know the page type? (Static vs Service)
- [ ] Do I know which variables I can use?
- [ ] Will I output pure HTML (not React)?
- [ ] Will I include Tailwind CDN?
- [ ] Will I use `window.openLeadFormModal()` for forms?

### After Generating:
- [ ] Starts with `<!DOCTYPE html>`
- [ ] Includes `<script src="https://cdn.tailwindcss.com"></script>`
- [ ] All variables use `{{variable_name}}` syntax
- [ ] No hardcoded company/service/location data
- [ ] Forms use `onclick="window.openLeadFormModal(...)"`
- [ ] Responsive with `md:` and `lg:` classes
- [ ] Has one H1, multiple H2s
- [ ] No React imports or components
- [ ] No TypeScript

---

## ❌ Common Mistakes

### WRONG Examples:
```html
<!-- Hardcoded text -->
<h1>ABC Roofing Services in Dallas</h1>

<!-- Wrong variables in static pages -->
<p>Our {{service_name}} is the best!</p>  <!-- service_name not available on static pages! -->

<!-- Custom form HTML -->
<form onsubmit="handleSubmit()">
  <input name="email" />
</form>

<!-- React imports -->
import { Button } from "@/components/ui/button";
```

### CORRECT Examples:
```html
<!-- Variables -->
<h1>{{company_name}} Services in {{city_name}}</h1>

<!-- Correct variables for page type -->
<p>{{company_name}} has been serving {{company_city}} for {{company_years_in_business}} years!</p>

<!-- Global function for forms -->
<button onclick="window.openLeadFormModal('Get Quote', {source: 'cta'})">
  Get Quote
</button>

<!-- No imports needed - pure HTML -->
```

---

## 🚀 Quick Start Template

### Static Page Template:
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
                <h1 class="text-4xl md:text-5xl font-bold mb-6">
                    About {{company_name}}
                </h1>
                <p class="text-xl text-gray-600 mb-8">
                    {{company_description}}
                </p>
                <!-- More content -->
            </div>
        </section>
    </main>
</body>
</html>
```

### Service Page Template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{service_name}} in {{city_name}} | {{company_name}}</title>
    <meta name="description" content="{{service_meta_description}}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <main class="min-h-screen">
        <section class="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-white">
            <div class="container mx-auto px-4">
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                    {{service_name}} in {{city_name}}, {{city_state}}
                </h1>
                <p class="text-xl text-gray-600 mb-8">
                    {{service_description}}
                </p>
                <button 
                    onclick="window.openLeadFormModal('Request {{service_name}} quote', {
                        serviceId: '{{service_id}}',
                        cityId: '{{city_id}}',
                        source: 'hero'
                    })"
                    class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700"
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

## 📚 Complete Guide

For detailed documentation, examples, and all patterns:
📖 `src/templates/HTML_PAGE_BUILDER_COMPLETE_GUIDE.md`
