# Complete AI Page Builder Guide
## For External AI Page Generation Compatible with Lovable System

---

## TABLE OF CONTENTS
1. [Technology Stack & Requirements](#technology-stack)
2. [Variable System - Complete Reference](#variable-system)
3. [Design System Integration](#design-system)
4. [Form Integration](#form-integration)
5. [Page Types & Differences](#page-types)
6. [Component Patterns](#component-patterns)
7. [SEO Requirements](#seo-requirements)
8. [Review Integration](#review-integration)
9. [Critical Rules & Validation](#critical-rules)

---

## TECHNOLOGY STACK

### Core Technologies
- **React**: 18.3+
- **TypeScript**: All code must be TypeScript
- **Tailwind CSS**: For all styling (semantic tokens only)
- **shadcn/ui**: For all UI components
- **Lucide React**: For all icons
- **Handlebars**: Template syntax for variables `{{variable_name}}`

### Required Component Imports

```typescript
// shadcn/ui Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

// Lucide React Icons
import { 
  Phone, Mail, MapPin, Clock, Star, ChevronRight, Check, 
  Shield, Award, Users, Zap, ArrowRight, Calendar, FileText,
  Home, Building, Wrench, ThumbsUp, MessageSquare, DollarSign
} from "lucide-react"
```

---

## VARIABLE SYSTEM - COMPLETE REFERENCE

### How Variables Work
- Variables use Handlebars syntax: `{{variable_name}}`
- Variables are replaced at render time with actual data
- **NEVER hardcode** company info, service info, or location info
- **ALWAYS use variables** for dynamic content

---

### COMPANY VARIABLES (Available in ALL Pages)

#### Basic Information
```handlebars
{{company_name}}              - Company legal name
{{company_tagline}}           - Company slogan/tagline
{{company_description}}       - Company description
{{company_years_in_business}} - Years in business (number)
{{company_founded_year}}      - Year founded
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
{{company_country}}           - Country
```

#### Business Details
```handlebars
{{company_license_number}}    - Business license number
{{company_insurance_info}}    - Insurance information
{{service_area_description}}  - Service area description
{{business_hours}}            - Operating hours
{{emergency_available}}       - Emergency availability (boolean)
```

#### Social Media
```handlebars
{{company_facebook}}          - Facebook URL
{{company_twitter}}           - Twitter/X URL
{{company_instagram}}         - Instagram URL
{{company_linkedin}}          - LinkedIn URL
{{company_youtube}}           - YouTube URL
```

---

### SERVICE VARIABLES (Only for Service Template Pages)

#### Service Information
```handlebars
{{service_name}}              - Service name
{{service_description}}       - Service description
{{service_slug}}              - Service URL slug
{{service_tagline}}           - Service tagline
{{service_meta_title}}        - SEO title
{{service_meta_description}}  - SEO description
```

#### Service Features
```handlebars
{{service_features}}          - Array of service features
{{service_benefits}}          - Array of service benefits
{{service_process_steps}}     - Array of process steps
```

#### Pricing (if available)
```handlebars
{{service_price_min}}         - Minimum price
{{service_price_max}}         - Maximum price
{{service_price_description}} - Pricing description
```

---

### SERVICE AREA VARIABLES (Only for Service Template Pages with Location)

#### Location Information
```handlebars
{{city_name}}                 - City name
{{city_state}}                - State/Province
{{city_zip}}                  - ZIP code
{{area_description}}          - Location-specific description
{{service_area_tagline}}      - Location-specific tagline
```

#### Location-Specific Content
```handlebars
{{local_expertise}}           - Local expertise description
{{area_coverage}}             - Coverage area details
{{nearby_cities}}             - Array of nearby cities
```

---

## DESIGN SYSTEM INTEGRATION

### CRITICAL: Semantic Color System

**NEVER use hardcoded colors like:**
- ❌ `text-white`, `bg-white`, `text-black`, `bg-black`
- ❌ `bg-blue-500`, `text-red-600`
- ❌ Hex colors: `#ffffff`, `#000000`
- ❌ RGB values: `rgb(255, 255, 255)`

**ALWAYS use semantic tokens:**

```typescript
// Background Colors
bg-background           // Main background
bg-card                // Card backgrounds
bg-muted               // Muted backgrounds
bg-accent              // Accent backgrounds
bg-primary             // Primary brand color
bg-secondary           // Secondary color

// Text Colors
text-foreground        // Primary text
text-muted-foreground  // Secondary text
text-primary           // Primary brand text
text-accent            // Accent text
text-card-foreground   // Text on cards

// Border Colors
border-border          // Default borders
border-primary         // Primary borders
border-accent          // Accent borders

// Special States
hover:bg-accent        // Hover states
hover:text-accent-foreground
focus:ring-primary     // Focus states
```

### Brand Theme Integration

The system automatically applies brand theme from site settings:

```typescript
// These CSS variables are set by useSiteSettings hook:
--primary              // Primary brand color (HSL)
--secondary            // Secondary color (HSL)
--accent               // Accent color (HSL)
--radius               // Button border radius
--card-radius          // Card border radius

// Header/Footer (auto-applied)
--header-bg            // Header background
--header-border        // Header border
--footer-bg            // Footer background
--footer-text          // Footer text color
```

### Responsive Design Patterns

```typescript
// Mobile-first breakpoints
sm:  // 640px
md:  // 768px
lg:  // 1024px
xl:  // 1280px
2xl: // 1536px

// Example Usage
className="text-lg md:text-2xl lg:text-4xl"          // Text sizing
className="px-4 md:px-6 lg:px-8"                    // Padding
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"  // Grid
className="flex-col md:flex-row"                    // Flex direction
```

### Border Radius (Dynamic from Settings)

```typescript
// Use rounded utilities that respect --radius variable
rounded-md             // Standard rounding
rounded-lg             // Large rounding
rounded-full           // Full rounding (circles)

// For cards specifically (respects --card-radius)
className="rounded-lg" // Applied to Card components
```

---

## FORM INTEGRATION

### Universal Lead Form (Modal)

The system has a **single source of truth** universal lead form component that opens in a modal.

#### How to Trigger the Universal Form

```typescript
import { useLeadFormModal } from '@/hooks/useLeadFormModal';

// In your component:
const { showLeadForm } = useLeadFormModal();

// In your JSX - Button that opens the form
<Button 
  size="lg" 
  onClick={() => showLeadForm({
    initialMessage: `Request {{service_name}} quote in {{city_name}}`,
    source: 'service_page_hero'
  })}
>
  Get Free Quote
</Button>

// The button label becomes the form's main heading automatically
```

#### Universal Form Features
- Opens in a modal overlay
- Button label text becomes the form heading
- Handles all form submission logic
- Saves leads to database automatically
- Shows success/error toasts
- Closes automatically on success

#### When to Use Universal Form
- Primary CTA buttons (hero sections)
- Bottom of page CTAs
- In-content CTA buttons
- Any "Get Quote", "Contact Us", "Request Service" buttons

---

### Inline Forms (On-Page Forms)

For forms that appear directly on the page (not in a modal):

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

// In component:
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: "",
    email: "",
    phone: "",
    message: "",
  },
});

const onSubmit = async (data: FormData) => {
  try {
    const { error } = await supabase.from('leads').insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      source: 'contact_page_form',
      service_id: null, // or specific service ID if applicable
      service_area_id: null, // or specific area ID if applicable
      status: 'new',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    toast.success("Thank you! We'll contact you soon.");
    form.reset();
  } catch (error) {
    console.error('Form submission error:', error);
    toast.error("Failed to submit form. Please try again.");
  }
};

// JSX with dynamic variables:
<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
  <div>
    <Label htmlFor="name">Full Name</Label>
    <Input 
      id="name" 
      placeholder="John Doe"
      {...form.register("name")}
    />
    {form.formState.errors.name && (
      <p className="text-sm text-destructive mt-1">
        {form.formState.errors.name.message}
      </p>
    )}
  </div>
  
  <div>
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      type="email"
      placeholder="john@example.com"
      {...form.register("email")}
    />
    {form.formState.errors.email && (
      <p className="text-sm text-destructive mt-1">
        {form.formState.errors.email.message}
      </p>
    )}
  </div>

  <div>
    <Label htmlFor="phone">Phone</Label>
    <Input 
      id="phone" 
      type="tel"
      placeholder="{{company_phone}}"
      {...form.register("phone")}
    />
    {form.formState.errors.phone && (
      <p className="text-sm text-destructive mt-1">
        {form.formState.errors.phone.message}
      </p>
    )}
  </div>

  <div>
    <Label htmlFor="message">Message</Label>
    <Textarea 
      id="message"
      placeholder="Tell us about your {{service_name}} needs..."
      rows={4}
      {...form.register("message")}
    />
    {form.formState.errors.message && (
      <p className="text-sm text-destructive mt-1">
        {form.formState.errors.message.message}
      </p>
    )}
  </div>

  <Button 
    type="submit" 
    size="lg" 
    className="w-full"
    disabled={form.formState.isSubmitting}
  >
    {form.formState.isSubmitting ? "Sending..." : "Send Message"}
  </Button>
</form>
```

#### Inline Form Variables
- Use `{{company_phone}}` in phone placeholder
- Use `{{service_name}}` in message placeholder
- Use `{{company_name}}` in form heading
- Set appropriate `source` field for tracking

---

## PAGE TYPES & DIFFERENCES

### Static Pages

**Available Variables:** ONLY Company Variables
**No Service or Service Area Variables**

#### Static Page Types:
1. **About Us** - Company history, mission, values
2. **Contact** - Contact information and inline form
3. **Terms & Conditions** - Legal terms
4. **Privacy Policy** - Privacy policy
5. **FAQ** - Frequently asked questions
6. **Careers** - Job opportunities
7. **Blog/Resources** - Educational content

#### Static Page Rules:
- ❌ NO `{{service_name}}`, `{{service_description}}`, etc.
- ❌ NO `{{city_name}}`, `{{city_state}}`, etc.
- ✅ ONLY `{{company_*}}` variables
- ✅ Can use universal form with generic messaging
- ✅ Should include inline contact forms where appropriate

#### Static Page Structure:
```typescript
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* No header/footer - system handles those */}
      
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About {{company_name}}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {{company_description}}
          </p>
          {/* Rest of content */}
        </div>
      </section>
    </div>
  );
}
```

---

### Service Template Pages

**Available Variables:** Company Variables + Service Variables + Service Area Variables

#### Service Template Page Types:
1. **Authority Hub** - Main service overview page
2. **Granular Service** - Specific service detail page
3. **Emergency Service** - Emergency/24-7 service page

#### Service Template Page Rules:
- ✅ ALL company variables available
- ✅ ALL service variables available
- ✅ ALL service area variables available (if city-specific)
- ✅ Must include review integration
- ✅ Should include multiple CTAs with universal form
- ✅ Must be SEO-optimized

#### Service Template Page Structure:
```typescript
import { useLeadFormModal } from '@/hooks/useLeadFormModal';

export default function ServicePage() {
  const { showLeadForm } = useLeadFormModal();

  return (
    <div className="min-h-screen bg-background">
      {/* No header/footer */}
      
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {{service_name}} in {{city_name}}, {{city_state}}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {{service_description}}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => showLeadForm({
                  initialMessage: `Request {{service_name}} quote in {{city_name}}`,
                  source: 'service_hero'
                })}
              >
                Get Free Quote
              </Button>
              <Button size="lg" variant="outline">
                <Phone className="mr-2 h-5 w-5" />
                Call {{company_phone}}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {{company_years_in_business}}+
              </div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
            {/* More trust indicators */}
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Our {{service_name}} Services
          </h2>
          {/* Content */}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Expert {{service_name}}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contact {{company_name}} today for professional service in {{city_name}}
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => showLeadForm({
              initialMessage: `Schedule {{service_name}} in {{city_name}}`,
              source: 'service_bottom_cta'
            })}
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
}
```

---

## COMPONENT PATTERNS

### Hero Section Pattern
```typescript
<section className="relative py-12 md:py-20 lg:py-28 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
        {{service_name}} in {{city_name}}
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground mb-8">
        {{service_tagline}}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          className="text-lg px-8"
          onClick={() => showLeadForm({
            initialMessage: `Request {{service_name}} quote`,
            source: 'hero_cta'
          })}
        >
          Get Free Quote
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button size="lg" variant="outline" className="text-lg px-8">
          <Phone className="mr-2 h-5 w-5" />
          {{company_phone}}
        </Button>
      </div>
    </div>
  </div>
</section>
```

### Service Card Pattern
```typescript
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
      <Wrench className="h-6 w-6 text-primary" />
    </div>
    <CardTitle className="text-xl">Feature Name</CardTitle>
    <CardDescription>
      Feature description using {{service_name}} variables
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2">
      <li className="flex items-start gap-2">
        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <span className="text-muted-foreground">Benefit point</span>
      </li>
    </ul>
  </CardContent>
</Card>
```

### Process Accordion Pattern
```typescript
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="step-1">
    <AccordionTrigger className="text-lg font-semibold">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
          1
        </div>
        <span>Initial Consultation</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground pl-11">
      <p>We start by understanding your {{service_name}} needs...</p>
    </AccordionContent>
  </AccordionItem>
  {/* More steps */}
</Accordion>
```

### Trust Badge Section
```typescript
<section className="py-12 bg-muted/30">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
      <div className="text-center">
        <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
        <div className="font-bold text-lg mb-1">Licensed & Insured</div>
        <div className="text-sm text-muted-foreground">
          License #{{company_license_number}}
        </div>
      </div>
      <div className="text-center">
        <Award className="h-10 w-10 text-primary mx-auto mb-3" />
        <div className="font-bold text-lg mb-1">{{company_years_in_business}}+ Years</div>
        <div className="text-sm text-muted-foreground">
          Serving {{city_name}}
        </div>
      </div>
      {/* More badges */}
    </div>
  </div>
</section>
```

### FAQ Section Pattern
```typescript
<section className="py-12 md:py-20">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
      {{service_name}} FAQs
    </h2>
    <div className="max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1">
          <AccordionTrigger className="text-left">
            How much does {{service_name}} cost in {{city_name}}?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p>{{service_price_description}}</p>
          </AccordionContent>
        </AccordionItem>
        {/* More FAQs */}
      </Accordion>
    </div>
  </div>
</section>
```

---

## SEO REQUIREMENTS

### Meta Tags (in comments for reference)
```html
<!-- 
Title: {{service_name}} in {{city_name}}, {{city_state}} | {{company_name}}
Description: Professional {{service_name}} services in {{city_name}}. {{company_years_in_business}}+ years experience. Licensed & insured. Call {{company_phone}} for free quote!
-->
```

### Heading Hierarchy
```typescript
// Each page MUST have exactly ONE H1
<h1>{{service_name}} in {{city_name}}, {{city_state}}</h1>

// Multiple H2s for main sections
<h2>Our {{service_name}} Process</h2>
<h2>Why Choose {{company_name}}?</h2>
<h2>Service Areas</h2>

// H3s for subsections
<h3>Step 1: Initial Assessment</h3>
<h3>Commercial {{service_name}}</h3>
```

### Semantic HTML Structure
```typescript
<main>
  <article>
    <header>
      {/* Hero section */}
    </header>
    
    <section aria-labelledby="services-heading">
      <h2 id="services-heading">Our Services</h2>
      {/* Content */}
    </section>
    
    <section aria-labelledby="process-heading">
      <h2 id="process-heading">Our Process</h2>
      {/* Content */}
    </section>
    
    <aside>
      {/* Sidebar content if applicable */}
    </aside>
  </article>
</main>
```

### Image Optimization
```typescript
// All images MUST have:
<img 
  src="/path/to/image.jpg" 
  alt="{{service_name}} in {{city_name}} - {{company_name}}"
  loading="lazy"
  className="w-full h-auto rounded-lg"
/>
```

---

## REVIEW INTEGRATION

### How Reviews Work
- Reviews are stored in Supabase `service_reviews` table
- Reviews are linked to specific services via `service_id`
- System automatically fetches and displays reviews
- Reviews include: rating (1-5 stars), customer name, review text, date, verified status

### Displaying Reviews on Service Pages

```typescript
// Reviews are automatically available via {{reviews}} variable
// The system injects review data at render time

// Simple Review Display Pattern
<section className="py-12 md:py-20 bg-muted/30">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
      What Our {{city_name}} Customers Say
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* This section will be populated with actual reviews by the system */}
      {/* Individual review cards will be generated automatically */}
      
      <Card className="bg-background">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {/* 5 star rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
          </div>
          <CardTitle className="text-lg">Review Title</CardTitle>
          <CardDescription>Customer Name - Date</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review text will appear here...
          </p>
        </CardContent>
      </Card>
      
      {/* More review cards will be added by the system */}
    </div>
    
    <div className="text-center mt-12">
      <Button 
        size="lg"
        onClick={() => showLeadForm({
          initialMessage: `Join our satisfied {{city_name}} customers`,
          source: 'reviews_cta'
        })}
      >
        Get Your Free Quote Today
      </Button>
    </div>
  </div>
</section>
```

### Review Statistics Section
```typescript
<section className="py-12 bg-primary text-primary-foreground">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-5xl font-bold mb-2">4.9/5</div>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-6 w-6 fill-current" />
            ))}
          </div>
          <div className="opacity-90">Average Rating</div>
        </div>
        <div>
          <div className="text-5xl font-bold mb-2">500+</div>
          <div className="opacity-90">5-Star Reviews</div>
        </div>
        <div>
          <div className="text-5xl font-bold mb-2">100%</div>
          <div className="opacity-90">Satisfaction Rate</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## CRITICAL RULES & VALIDATION

### ✅ MUST DO
1. **Use variables for ALL dynamic content**
   - Company information: `{{company_*}}`
   - Service information: `{{service_*}}`
   - Location information: `{{city_*}}`

2. **Use semantic color tokens ONLY**
   - `bg-background`, `text-foreground`, `border-border`
   - `bg-primary`, `text-primary`, `bg-accent`
   - Never hardcode colors

3. **Responsive design**
   - Mobile-first approach
   - Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
   - Test all layouts at different screen sizes

4. **Import only from allowed sources**
   - shadcn/ui components from `@/components/ui/`
   - Lucide icons from `lucide-react`
   - Hooks from `@/hooks/`

5. **Form integration**
   - Use `useLeadFormModal()` hook for modal forms
   - Include proper button labels (becomes form heading)
   - Add appropriate `source` tracking

6. **SEO optimization**
   - One H1 per page with keywords
   - Proper heading hierarchy (H1 > H2 > H3)
   - Image alt text with keywords
   - Semantic HTML structure

7. **TypeScript**
   - All components must be TypeScript
   - Proper type definitions
   - No `any` types

### ❌ NEVER DO
1. **Never hardcode:**
   - Company names, addresses, phones
   - Service names or descriptions
   - City or location names
   - Colors (use semantic tokens)
   - Border radius (use theme variables)

2. **Never include:**
   - Headers or navigation bars
   - Footers
   - External scripts or libraries not mentioned
   - Direct Supabase queries in components

3. **Never use:**
   - Inline styles (use Tailwind classes)
   - Custom CSS files
   - Non-semantic color classes
   - Wrong variable scopes (service vars in static pages)

4. **Never create:**
   - New form components (use universal form)
   - Custom authentication logic
   - Direct database connections

### Page Type Validation

**Static Pages Checklist:**
- [ ] Uses ONLY `{{company_*}}` variables
- [ ] No `{{service_*}}` variables
- [ ] No `{{city_*}}` variables
- [ ] Includes appropriate inline forms
- [ ] No service-specific content

**Service Template Pages Checklist:**
- [ ] Uses `{{company_*}}` variables
- [ ] Uses `{{service_*}}` variables
- [ ] Uses `{{city_*}}` variables (if applicable)
- [ ] Includes universal form CTAs
- [ ] Includes review section
- [ ] Optimized for SEO
- [ ] Multiple CTA placements

### Design System Validation
- [ ] All colors use semantic tokens
- [ ] No hardcoded hex/rgb colors
- [ ] Responsive at all breakpoints
- [ ] Uses proper spacing scale
- [ ] Typography follows hierarchy
- [ ] Components use shadcn/ui
- [ ] Icons use Lucide React

### Form Validation
- [ ] Universal form uses `useLeadFormModal()`
- [ ] Button labels are descriptive
- [ ] Source tracking is present
- [ ] Inline forms have proper validation
- [ ] Form submissions go to Supabase `leads` table

---

## COMPLETE VARIABLE REFERENCE CARD

### Quick Reference for All Variables

```handlebars
COMPANY VARIABLES (All Pages):
{{company_name}}
{{company_tagline}}
{{company_description}}
{{company_phone}}
{{company_email}}
{{company_website}}
{{company_address}}
{{company_city}}
{{company_state}}
{{company_zip}}
{{company_country}}
{{company_years_in_business}}
{{company_founded_year}}
{{company_license_number}}
{{company_insurance_info}}
{{service_area_description}}
{{business_hours}}
{{emergency_available}}
{{company_facebook}}
{{company_twitter}}
{{company_instagram}}
{{company_linkedin}}
{{company_youtube}}

SERVICE VARIABLES (Service Pages Only):
{{service_name}}
{{service_description}}
{{service_slug}}
{{service_tagline}}
{{service_meta_title}}
{{service_meta_description}}
{{service_features}}
{{service_benefits}}
{{service_process_steps}}
{{service_price_min}}
{{service_price_max}}
{{service_price_description}}

SERVICE AREA VARIABLES (Service Pages with Location):
{{city_name}}
{{city_state}}
{{city_zip}}
{{area_description}}
{{service_area_tagline}}
{{local_expertise}}
{{area_coverage}}
{{nearby_cities}}
```

---

## FINAL CHECKLIST BEFORE GENERATION

### Pre-Generation Validation
1. [ ] Identified page type (Static vs Service Template)
2. [ ] Confirmed which variables are available
3. [ ] Reviewed design system tokens
4. [ ] Planned responsive breakpoints
5. [ ] Identified CTA placements
6. [ ] Planned form integration points
7. [ ] SEO structure planned (H1, H2, H3)
8. [ ] Component imports identified

### Post-Generation Validation
1. [ ] All variables use correct syntax `{{variable_name}}`
2. [ ] No hardcoded company/service/location info
3. [ ] All colors use semantic tokens
4. [ ] Responsive classes applied
5. [ ] Forms properly integrated
6. [ ] TypeScript types correct
7. [ ] Component imports from correct paths
8. [ ] No headers/footers included
9. [ ] SEO requirements met
10. [ ] Accessibility attributes present

---

## EXAMPLES

### Complete Static Page Example (Contact Page)

```typescript
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function ContactPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.from('leads').insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source: 'contact_page',
        status: 'new',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Thank you! We'll contact you soon.");
      form.reset();
    } catch (error) {
      console.error('Form error:', error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact {{company_name}}
            </h1>
            <p className="text-xl text-muted-foreground">
              Get in touch with our team. We're here to help with all your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Get In Touch</CardTitle>
                  <CardDescription>
                    Reach out to us through any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Phone</div>
                      <a href="tel:{{company_phone}}" className="text-muted-foreground hover:text-primary">
                        {{company_phone}}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Email</div>
                      <a href="mailto:{{company_email}}" className="text-muted-foreground hover:text-primary">
                        {{company_email}}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Address</div>
                      <div className="text-muted-foreground">
                        {{company_address}}<br />
                        {{company_city}}, {{company_state}} {{company_zip}}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Business Hours</div>
                      <div className="text-muted-foreground">
                        {{business_hours}}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="john@example.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="{{company_phone}}"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      placeholder="How can we help you?"
                      rows={4}
                      {...form.register("message")}
                    />
                    {form.formState.errors.message && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## END OF COMPLETE GUIDE

This document contains everything needed to generate pages compatible with the Lovable system. Follow all guidelines strictly for proper integration.
