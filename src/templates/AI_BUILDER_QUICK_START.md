# AI Page Builder - Quick Start Instructions

## What You're Building

You are building page templates for a service business website that uses a dynamic variable system. These pages will be loaded into a system that automatically replaces variables with real business data.

---

## Critical Rules (Read First!)

### 1. **Variable System - NEVER Hardcode**
- Use Handlebars syntax: `{{variable_name}}`
- Examples: `{{company_name}}`, `{{service_name}}`, `{{city_name}}`
- ❌ NEVER write: "ABC Roofing", "Commercial Services", "Dallas"
- ✅ ALWAYS write: `{{company_name}}`, `{{service_name}}`, `{{city_name}}`

### 2. **Design System - ONLY Use Semantic Tokens**
- ❌ NEVER: `text-white`, `bg-black`, `bg-blue-500`, `#ffffff`
- ✅ ALWAYS: `text-foreground`, `bg-background`, `bg-primary`, `text-primary`

### 3. **Page Types - Know Which Variables You Can Use**
- **Static Pages**: ONLY `{{company_*}}` variables
- **Service Pages**: ALL variables (`{{company_*}}`, `{{service_*}}`, `{{city_*}}`)

### 4. **Forms - Use the Universal Form System**
- For CTA buttons: Use `useLeadFormModal()` hook
- Button label becomes the form heading
- Never build custom form components

### 5. **No Headers/Footers**
- The system handles navigation automatically
- Only build the main content

---

## Your Memory Base

**📚 Full Documentation Location:** `src/templates/AI_PAGE_BUILDER_COMPLETE_GUIDE.md`

**Read the complete guide in your memory** for:
- Complete variable reference (all company, service, and location variables)
- Design system tokens and color system
- Form integration patterns (universal modal form + inline forms)
- Component patterns (hero, cards, accordions, CTAs)
- SEO requirements and heading hierarchy
- Review integration for service pages
- Responsive design breakpoints
- TypeScript patterns
- Complete code examples

---

## Technology Stack

**Frontend:**
- React 18.3+ with TypeScript
- Tailwind CSS (semantic tokens only)
- shadcn/ui components
- Lucide React icons

**Backend:**
- Supabase for data storage
- Handlebars for variable templating

**Import Examples:**
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin } from "lucide-react"
import { useLeadFormModal } from '@/hooks/useLeadFormModal'
```

---

## Quick Variable Reference

### Company Variables (Available on ALL pages)
```handlebars
{{company_name}}              {{company_phone}}
{{company_tagline}}           {{company_email}}
{{company_description}}       {{company_address}}
{{company_years_in_business}} {{company_city}}
{{company_license_number}}    {{company_state}}
{{company_website}}           {{company_zip}}
{{business_hours}}            {{company_facebook}}
{{emergency_available}}       {{company_instagram}}
```

### Service Variables (ONLY on service pages)
```handlebars
{{service_name}}              {{service_features}}
{{service_description}}       {{service_benefits}}
{{service_tagline}}           {{service_price_min}}
{{service_meta_title}}        {{service_price_max}}
{{service_meta_description}}  {{service_price_description}}
```

### Service Area Variables (ONLY on service pages)
```handlebars
{{city_name}}                 {{area_description}}
{{city_state}}                {{local_expertise}}
{{city_zip}}                  {{area_coverage}}
{{service_area_tagline}}      {{nearby_cities}}
```

---

## Design System Quick Reference

### Semantic Color Tokens (ALWAYS USE THESE)
```typescript
// Backgrounds
bg-background       // Main background
bg-card            // Card backgrounds
bg-muted           // Muted backgrounds
bg-primary         // Primary brand color
bg-secondary       // Secondary color
bg-accent          // Accent color

// Text
text-foreground           // Primary text
text-muted-foreground     // Secondary text
text-primary              // Primary brand text
text-accent               // Accent text
text-card-foreground      // Card text

// Borders
border-border       // Default borders
border-primary      // Primary borders
```

### Responsive Breakpoints
```typescript
sm:   // 640px  - Small tablets
md:   // 768px  - Tablets
lg:   // 1024px - Desktop
xl:   // 1280px - Large desktop
2xl:  // 1536px - Extra large

// Example usage:
className="text-lg md:text-2xl lg:text-4xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## Form Integration Patterns

### Universal Form (Modal) - For CTA Buttons
```typescript
import { useLeadFormModal } from '@/hooks/useLeadFormModal';

const { showLeadForm } = useLeadFormModal();

// Usage:
<Button 
  size="lg"
  onClick={() => showLeadForm({
    initialMessage: `Request {{service_name}} quote in {{city_name}}`,
    source: 'hero_cta'
  })}
>
  Get Free Quote
</Button>
```

### Inline Form - For Contact Pages
```typescript
// See complete example in AI_PAGE_BUILDER_COMPLETE_GUIDE.md
// Includes: react-hook-form, zod validation, Supabase submission
```

---

## Common Page Patterns

### Hero Section with CTA
```typescript
<section className="py-12 md:py-20 bg-gradient-to-br from-primary/10 to-background">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
        {{service_name}} in {{city_name}}, {{city_state}}
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        {{service_description}}
      </p>
      <Button 
        size="lg"
        onClick={() => showLeadForm({
          initialMessage: `Request quote for {{service_name}}`,
          source: 'hero'
        })}
      >
        Get Free Quote
      </Button>
    </div>
  </div>
</section>
```

### Trust Indicators Section
```typescript
<section className="py-12 bg-muted/30">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">
          {{company_years_in_business}}+
        </div>
        <div className="text-sm text-muted-foreground">Years Experience</div>
      </div>
      {/* More indicators */}
    </div>
  </div>
</section>
```

### Service Cards Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Wrench className="h-6 w-6 text-primary" />
      </div>
      <CardTitle>Service Feature</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Description using {{service_name}} variables
      </p>
    </CardContent>
  </Card>
</div>
```

---

## SEO Requirements

### Every Page Must Have:
1. **One H1** with main keyword
   ```typescript
   <h1>{{service_name}} in {{city_name}}, {{city_state}}</h1>
   ```

2. **Multiple H2s** for main sections
   ```typescript
   <h2>Our {{service_name}} Process</h2>
   <h2>Why Choose {{company_name}}?</h2>
   ```

3. **Image alt text** with variables
   ```typescript
   <img 
     src="/image.jpg" 
     alt="{{service_name}} by {{company_name}} in {{city_name}}"
     loading="lazy"
   />
   ```

4. **Semantic HTML structure**
   ```typescript
   <main>
     <article>
       <header>{/* Hero */}</header>
       <section>{/* Content */}</section>
     </article>
   </main>
   ```

---

## Review Integration (Service Pages Only)

```typescript
<section className="py-12 md:py-20 bg-muted/30">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
      What Our {{city_name}} Customers Say
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Review cards - system will populate with actual reviews */}
      <Card>
        <CardHeader>
          <div className="flex gap-1 mb-2">
            {[1,2,3,4,5].map((star) => (
              <Star key={star} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <CardTitle className="text-lg">Review Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Review text...</p>
        </CardContent>
      </Card>
    </div>
  </div>
</section>
```

---

## Validation Checklist

### Before Generating Any Page:
- [ ] Do I know which page type? (Static vs Service)
- [ ] Do I know which variables I can use?
- [ ] Am I using semantic color tokens only?
- [ ] Is my design responsive with breakpoints?
- [ ] Am I using the universal form for CTAs?
- [ ] Do I have proper SEO structure (H1, H2, H3)?
- [ ] Are all imports from correct paths?
- [ ] No headers/footers in the content?

### After Generating:
- [ ] All variables use `{{variable_name}}` syntax
- [ ] No hardcoded company/service/location names
- [ ] All colors use semantic tokens (no `text-white`, `bg-blue-500`)
- [ ] Responsive classes applied at all breakpoints
- [ ] Forms properly integrated with hooks
- [ ] TypeScript types are correct
- [ ] Component imports from `@/components/ui/`
- [ ] Icons from `lucide-react`

---

## Common Mistakes to Avoid

### ❌ WRONG:
```typescript
// Hardcoded text
<h1>ABC Roofing Services in Dallas</h1>

// Hardcoded colors
<div className="bg-blue-500 text-white">

// Wrong variables in static pages
<p>Our {{service_name}} is the best!</p>  // service_name not available!

// Custom form component
<form onSubmit={handleSubmit}>  // Don't build custom forms!
```

### ✅ CORRECT:
```typescript
// Variables
<h1>{{company_name}} Services in {{city_name}}</h1>

// Semantic tokens
<div className="bg-primary text-primary-foreground">

// Correct variables for page type
<p>{{company_name}} has been serving {{company_city}} for {{company_years_in_business}} years!</p>

// Universal form
<Button onClick={() => showLeadForm({...})}>Get Quote</Button>
```

---

## Quick Start Template

**For Static Pages:**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaticPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Page Title - {{company_name}}
          </h1>
          <p className="text-xl text-muted-foreground">
            {{company_description}}
          </p>
        </div>
      </section>
    </div>
  );
}
```

**For Service Pages:**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { Phone } from "lucide-react";

export default function ServicePage() {
  const { showLeadForm } = useLeadFormModal();

  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {{service_name}} in {{city_name}}, {{city_state}}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {{service_description}}
          </p>
          <Button 
            size="lg"
            onClick={() => showLeadForm({
              initialMessage: `Request {{service_name}} quote`,
              source: 'hero'
            })}
          >
            Get Free Quote
          </Button>
        </div>
      </section>
    </div>
  );
}
```

---

## Next Steps

1. **Read the complete guide** in `AI_PAGE_BUILDER_COMPLETE_GUIDE.md`
2. **Identify your page type** (static or service)
3. **Check variable availability** for that page type
4. **Follow the patterns** in the complete guide
5. **Validate** using the checklists above

---

## Support

For complete details, examples, and all patterns, **always refer to:**
📚 `src/templates/AI_PAGE_BUILDER_COMPLETE_GUIDE.md`

This is your single source of truth for building compatible pages.
