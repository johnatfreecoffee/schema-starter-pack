# Static Pages Template System - Company Variables Only

## **SYSTEM INTEGRATION**

**This is a PERMANENT part of static page generation and editing.**

This document extends the [Universal Template System](./UNIVERSAL_TEMPLATE_SYSTEM.md) specifically for static pages (About Us, Contact, Terms, Privacy, etc.) that use **COMPANY VARIABLES ONLY** - no service or service area variables.

## **CRITICAL DIFFERENCE: VARIABLE SCOPE**

### ✅ ALLOWED: Company Variables Only
```handlebars
{{company_name}}              - Business name
{{company_phone}}             - Primary phone
{{company_email}}             - Contact email
{{company_address}}           - Full address
{{company_website}}           - Website URL
{{years_experience}}          - Years in business
{{license_number}}            - License/certification
{{business_slogan}}           - Company tagline/slogan
{{logo_url}}                  - Company logo URL
{{icon_url}}                  - Favicon/icon URL
{{business_hours}}            - Operating hours
{{address_street}}            - Street address
{{address_unit}}              - Unit/Suite number
{{address_city}}              - City
{{address_state}}             - State/Province
{{address_zip}}               - ZIP/Postal code
{{service_radius}}            - Service coverage radius
{{service_radius_unit}}       - miles/km
{{facebook_url}}              - Facebook profile
{{instagram_url}}             - Instagram profile
{{twitter_url}}               - Twitter profile
{{linkedin_url}}              - LinkedIn profile
{{email_from_name}}           - Default email sender name
{{email_signature}}           - Email signature
{{description}}               - Company description
{{license_numbers}}           - All license numbers
```

### ❌ FORBIDDEN: Service & Service Area Variables
```handlebars
{{service_name}}              - NOT allowed on static pages
{{service_description}}       - NOT allowed on static pages
{{city_name}}                 - NOT allowed on static pages
{{service_starting_price}}    - NOT allowed on static pages
{{local_description}}         - NOT allowed on static pages
```

**Why?** Static pages are universal company pages that don't change per service or location. Service-specific content belongs on generated service pages.

## **INHERIT FROM UNIVERSAL TEMPLATE SYSTEM**

All static pages **MUST** follow the Universal Template System specifications:

### Technology Stack (Identical)
- **Framework:** React 18.3+ with TypeScript
- **UI Library:** shadcn/ui components EXCLUSIVELY
- **Styling:** Tailwind CSS with semantic tokens ONLY
- **Icons:** Lucide React
- **Structure:** Functional components with default exports

### Semantic Color System (Identical)
```css
/* ONLY USE THESE */
.bg-background, .bg-card, .bg-primary, .bg-secondary, .bg-muted
.text-foreground, .text-primary-foreground, .text-muted-foreground
.border-border, .border-input
.bg-primary/10  /* opacity modifiers */

/* NEVER USE THESE */
.bg-white, .bg-black, #ffffff, rgb(255,255,255)
```

### Responsive Design (Identical)
```typescript
// Always mobile-first with all breakpoints
className="text-2xl md:text-3xl lg:text-4xl"
className="py-8 md:py-12 lg:py-16"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Component Imports (Identical)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
```

## **STATIC PAGE TEMPLATES**

### 1. About Us Page Template

**Purpose:** Company history, mission, team, values
**Word Count:** 600-1,000 words
**Required Sections:**
1. Hero with company overview
2. Company history/story
3. Mission & values
4. Team section (optional)
5. Certifications/awards
6. CTA section

**Example Structure:**
```typescript
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Shield, Users, Clock } from 'lucide-react'

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              About {{company_name}}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {{description}}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="px-3 py-1.5">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {{years_experience}}+ Years Experience
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Licensed & Insured
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <Award className="mr-1.5 h-3.5 w-3.5" />
                Certified Professionals
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Our Story
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Founded over {{years_experience}} years ago, {{company_name}} has been 
                serving our community with dedication and excellence...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-12 md:py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We never compromise on quality...
                </p>
              </CardContent>
            </Card>
            {/* More value cards */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Ready to Work With Us?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Contact {{company_name}} today for a free consultation
            </p>
            <Button size="lg">
              <Phone className="mr-2 h-5 w-5" />
              Call {{company_phone}}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### 2. Contact Page Template

**Purpose:** Contact information and lead capture
**Word Count:** 300-500 words
**Required Sections:**
1. Hero with contact headline
2. Contact information grid
3. Contact form
4. Business hours
5. Map/location (optional)

**Example Structure:**
```typescript
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Contact {{company_name}}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Get in touch with our team - we're here to help
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Get In Touch
              </h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="tel:{{company_phone}}" className="text-lg text-primary hover:underline">
                    {{company_phone}}
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="mailto:{{company_email}}" className="text-lg text-primary hover:underline">
                    {{company_email}}
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {{address_street}}<br />
                    {{address_city}}, {{address_state}} {{address_zip}}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {{business_hours}}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={5} required />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### 3. Terms & Conditions / Privacy Policy Templates

**Purpose:** Legal pages
**Word Count:** Variable (as required by legal content)
**Required Sections:**
1. Simple hero with title
2. Content sections with proper hierarchy
3. Last updated date
4. Contact section

**Example Structure:**
```typescript
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last Updated: [Date]
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="prose prose-lg max-w-none pt-6">
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing and using the services of {{company_name}}, you agree 
                to be bound by these Terms and Conditions...
              </p>

              <h2>2. Services</h2>
              <p>
                {{company_name}} provides [description of services]...
              </p>

              <h2>3. Contact Information</h2>
              <p>
                For questions regarding these terms, contact {{company_name}}:<br />
                Email: {{company_email}}<br />
                Phone: {{company_phone}}<br />
                Address: {{company_address}}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Contact {{company_name}} for clarification on any terms
            </p>
            <Button size="lg">
              <Phone className="mr-2 h-5 w-5" />
              {{company_phone}}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
```

## **VALIDATION CHECKLIST FOR STATIC PAGES**

Before finalizing any static page, verify:

### Technical Requirements
- [ ] React functional component with TypeScript
- [ ] All imports from @/components/ui/
- [ ] Lucide React icons only
- [ ] Default export with proper name

### Design System Compliance
- [ ] ONLY semantic color tokens used (bg-background, text-foreground, etc.)
- [ ] Zero hex/rgb colors (#ffffff, rgb(), etc.)
- [ ] All responsive classes included (sm:, md:, lg:, xl:)
- [ ] Mobile-first approach

### Variable Compliance (CRITICAL)
- [ ] All company info uses {{company_variables}}
- [ ] **ZERO service variables** ({{service_name}}, etc.)
- [ ] **ZERO service area variables** ({{city_name}}, etc.)
- [ ] No hardcoded business information

### Content Structure
- [ ] Proper word count for page type
- [ ] Required sections included
- [ ] Proper heading hierarchy (H1→H2→H3)
- [ ] At least one CTA included

### SEO Elements
- [ ] H1 includes company name or page purpose
- [ ] Meta description appropriate for static page
- [ ] Proper heading hierarchy
- [ ] Contact information included

## **SITEMAP INTEGRATION**

Static pages are automatically included in the sitemap generation:

**Sitemap Function Behavior:**
```typescript
// From supabase/functions/sitemap/index.ts
// Static pages are fetched and added to sitemap
const { data: staticPages } = await supabase
  .from('static_pages')
  .select('slug, updated_at')
  .eq('status', true);

// Static pages use ONLY company variables
// Rendered HTML has company variables replaced server-side
// No service or service area variables in static pages
```

**Priority Guidelines:**
- Homepage: 1.0 (highest)
- About/Contact: 0.8-0.9
- Legal pages: 0.5-0.6
- Other static: 0.7

## **AI EDITOR INTEGRATION**

When using AI Page Editor with static pages:

**Instructions for AI:**
```
You are editing a static page for {{company_name}}.

ALLOWED VARIABLES:
✅ {{company_name}}, {{company_phone}}, {{company_email}}, 
   {{company_address}}, {{years_experience}}, {{business_hours}},
   {{logo_url}}, {{description}}, and all other company variables

FORBIDDEN VARIABLES:
❌ {{service_name}}, {{city_name}}, {{service_starting_price}},
   {{local_description}}, and all service/area variables

RULES:
1. Use shadcn/ui components only
2. Semantic color tokens only (bg-background, text-foreground)
3. Mobile-first responsive design
4. Proper heading hierarchy
5. Company variables only - NO service variables

VALIDATION:
Before returning edited content, verify:
- Zero hardcoded company info
- Zero service/area variables
- Zero hex/rgb colors
- All responsive classes present
```

## **IMPLEMENTATION WORKFLOW FOR STATIC PAGES**

1. **Identify page type** (About, Contact, Legal, Other)
2. **Reference this guide** for allowed variables
3. **Set up imports** from shadcn/ui and Lucide
4. **Build structure** following examples above
5. **Insert ONLY company variables** - no service/area variables
6. **Apply responsive design** - mobile-first
7. **Add CTAs** with company contact info
8. **Validate against checklist**
9. **Test variable replacement** with company data
10. **Verify sitemap inclusion**

## **ERROR PREVENTION FOR STATIC PAGES**

### Common Mistakes to Avoid

1. **Using Service Variables**
   ```typescript
   // ❌ WRONG - Never on static pages
   <h1>{{service_name}} in {{city_name}}</h1>
   
   // ✅ CORRECT - Company variables only
   <h1>About {{company_name}}</h1>
   ```

2. **Hardcoding Company Info**
   ```typescript
   // ❌ WRONG
   <p>Call us at (555) 123-4567</p>
   
   // ✅ CORRECT
   <p>Call us at {{company_phone}}</p>
   ```

3. **Using Direct Colors**
   ```typescript
   // ❌ WRONG
   <div className="bg-white text-blue-600">
   
   // ✅ CORRECT
   <div className="bg-background text-primary">
   ```

4. **Missing Responsive Classes**
   ```typescript
   // ❌ WRONG
   <h1 className="text-4xl mb-6">
   
   // ✅ CORRECT
   <h1 className="text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-6">
   ```

## **PERMANENT INSTALLATION CONFIRMATION**

This Static Pages Template Guide is now:
- ✅ **PERMANENT** part of static page generation
- ✅ **AUTOMATICALLY APPLIED** to all static page editing
- ✅ **INTEGRATED** with AI Page Editor
- ✅ **REFERENCED** by sitemap generation
- ✅ **ENFORCED** for all static content

**Variable Scope:**
- Static Pages: **Company variables ONLY**
- Service Pages: Company + Service + Service Area variables

**This separation ensures:**
- Static pages remain universal across all services/locations
- Service pages are properly localized and service-specific
- Sitemap correctly categorizes and prioritizes pages
- AI editing maintains proper variable scope

---

## **OUTPUT CONFIRMATION**

When generating/editing a static page, confirm:

```
✅ Static Page Generated/Edited Successfully

Validation Passed:
• Semantic colors only (no hex/rgb)
• Company {{variables}} only (no service/area)
• shadcn/ui components only
• Mobile-first responsive
• [X] sections included
• ~[Y] words of content
• Proper heading hierarchy
• Contact CTA included

This page uses ONLY company variables and will:
✓ Display consistently across all services/locations
✓ Be included in sitemap with proper priority
✓ Work for ANY company by updating company settings
✓ Maintain design system consistency

Zero service variables - 100% universal!
```
