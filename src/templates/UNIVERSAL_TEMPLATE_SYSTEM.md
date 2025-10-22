# Universal Service Business Template Design System

## **SYSTEM OVERVIEW**

This template system generates professional service pages for ANY service business - roofing, plumbing, HVAC, electrical, landscaping, or any B2C service provider. All company-specific information uses variables, making templates instantly portable between businesses.

## **TECHNOLOGY REQUIREMENTS**

### Core Stack (Non-Negotiable)
- **Framework:** React 18.3+ with TypeScript
- **UI Library:** shadcn/ui components EXCLUSIVELY
- **Styling:** Tailwind CSS with semantic tokens ONLY
- **Icons:** Lucide React
- **Structure:** Functional components with default exports
- **Variables:** Handlebars {{syntax}} for all dynamic content

### Component Import Reference
```typescript
// Layout & Structure
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interactive Elements
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Form Components
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Icons (Lucide React)
import { 
  Phone, PhoneCall, Mail, MapPin, Clock, Calendar,
  Shield, ShieldCheck, Award, BadgeCheck,
  CheckCircle, AlertTriangle, ChevronRight, ArrowRight,
  Star, Zap, DollarSign, Wrench, HardHat,
  Home, Building, Users, Hammer
} from 'lucide-react'
```

## **UNIVERSAL VARIABLE SYSTEM**

All templates use these variables, enabling instant customization for any business:

### Company Information
```handlebars
{{company_name}}              - Business name
{{company_phone}}             - Primary phone
{{company_email}}             - Contact email
{{company_address}}           - Full address
{{company_website}}           - Website URL
{{years_experience}}          - Years in business
{{license_number}}            - License/certification
{{insurance_info}}            - Insurance details
```

### Service Information
```handlebars
{{service_name}}              - Service being offered
{{service_description}}       - Detailed description
{{service_category}}          - Service type/category
{{service_starting_price}}    - Starting price point
{{service_price_range}}       - Price range
{{service_duration}}          - Typical time to complete
{{service_warranty}}          - Warranty information
```

### Location Information
```handlebars
{{city_name}}                 - Primary city
{{city_slug}}                 - URL-friendly city name
{{state_name}}                - State/province
{{state_code}}                - State abbreviation
{{service_area}}              - Coverage radius
{{neighborhood_list}}         - Local neighborhoods
{{zip_codes_served}}          - Service ZIP codes
{{local_description}}         - Area-specific content
```

### Business Operations
```handlebars
{{business_hours}}            - Operating hours
{{emergency_available}}       - 24/7 availability (true/false)
{{response_time}}             - Average response time
{{same_day_service}}          - Same-day availability
{{free_estimates}}            - Free estimate offer
{{payment_methods}}           - Accepted payments
{{financing_available}}       - Financing options
```

## **SEMANTIC COLOR SYSTEM (CRITICAL)**

### MANDATORY: Use Only These Semantic Tokens

```css
/* Backgrounds */
.bg-background               /* Page background */
.bg-card                    /* Card backgrounds */
.bg-primary                 /* Primary brand color */
.bg-secondary               /* Secondary backgrounds */
.bg-muted                   /* Muted/subtle backgrounds */
.bg-accent                  /* Accent highlights */
.bg-destructive             /* Error/urgent states */

/* Text Colors */
.text-foreground            /* Primary text */
.text-card-foreground       /* Text on cards */
.text-primary-foreground    /* Text on primary bg */
.text-secondary-foreground  /* Text on secondary bg */
.text-muted-foreground      /* Muted/secondary text */
.text-accent-foreground     /* Text on accent bg */
.text-destructive          /* Error/urgent text */

/* Borders */
.border-border              /* Default borders */
.border-input              /* Form input borders */
.border-primary            /* Primary borders */
.border-destructive        /* Error borders */

/* Opacity Modifiers (use slash notation) */
.bg-primary/10             /* 10% opacity */
.bg-secondary/5            /* 5% opacity */
.from-primary/10           /* Gradient start */
.to-primary/5              /* Gradient end */
```

### FORBIDDEN: Never Use These

```css
/* ❌ NEVER USE */
.bg-white, .bg-black
.bg-gray-100, .bg-slate-500
.text-white, .text-black
.text-gray-600
#ffffff, #000000, #3B82F6
rgb(255, 255, 255)
rgba(0, 0, 0, 0.5)
```

## **TEMPLATE CATEGORIES & SPECIFICATIONS**

### 1. Authority Hub Templates
**Purpose:** Main service category pages showcasing expertise
**Word Count:** 1,200-1,500 words
**Sections:** 7-8 major sections
**Use Cases:** Primary services, main categories, service hubs

**Required Sections:**
1. Hero with trust badges
2. Service overview grid (3+ services)
3. Process explanation (4-6 steps)
4. Benefits section (6-8 benefits)
5. Why choose us
6. FAQ accordion (5-7 questions)
7. Strong CTA with form
8. Service areas

### 2. Granular Service Templates
**Purpose:** Specific service pages with detailed information
**Word Count:** 800-1,000 words
**Sections:** 5-6 focused sections
**Use Cases:** Individual services, specific offerings

**Required Sections:**
1. Focused hero with pricing
2. Service details
3. Benefits grid (4-6 items)
4. Simple process (3-4 steps)
5. Pricing/quote section
6. CTA and service areas

### 3. Emergency Service Templates
**Purpose:** Urgent service pages emphasizing immediate response
**Word Count:** 600-800 words
**Sections:** 4-5 urgent-focused sections
**Use Cases:** 24/7 services, emergency response, urgent repairs

**Required Sections:**
1. Urgent hero with alert
2. Response time guarantee
3. Emergency scenarios
4. Immediate contact options
5. Service coverage

## **RESPONSIVE DESIGN PATTERNS**

### Mobile-First Breakpoints
```css
/* Breakpoints */
sm: 640px    /* Small devices */
md: 768px    /* Tablets */
lg: 1024px   /* Desktops */
xl: 1280px   /* Large screens */
2xl: 1536px  /* Extra large */
```

### Responsive Classes (Always Use)
```typescript
// Text Sizing
className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
className="text-base md:text-lg lg:text-xl"

// Spacing
className="py-8 md:py-12 lg:py-16 xl:py-20"
className="px-4 md:px-6 lg:px-8"

// Grid Layouts
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"

// Flexbox
className="flex flex-col md:flex-row"
className="gap-4 md:gap-6 lg:gap-8"

// Containers
className="max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-6xl"
```

## **COMPONENT PATTERNS**

### Universal Hero Section
```typescript
<section className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-foreground">
        {{service_name}} in {{city_name}}
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8">
        Professional {{service_name}} with {{years_experience}}+ years of experience
      </p>
      
      {/* Trust Badges */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Badge variant="outline" className="px-3 py-1.5">
          <Award className="mr-1.5 h-3.5 w-3.5" />
          {{years_experience}}+ Years
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5">
          <Shield className="mr-1.5 h-3.5 w-3.5" />
          Licensed & Insured
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5">
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Fast Response
        </Badge>
      </div>
      
      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg">
          <Phone className="mr-2 h-5 w-5" />
          Call {{company_phone}}
        </Button>
        <Button size="lg" variant="outline">
          Get Free Quote
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
    <CardTitle className="flex items-center">
      <Wrench className="mr-2 h-5 w-5 text-primary" />
      Service Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground mb-4">
      Service description focusing on customer benefits
    </p>
    <ul className="space-y-2">
      <li className="flex items-start">
        <CheckCircle className="mr-2 h-4 w-4 text-primary mt-0.5" />
        <span className="text-sm">Key benefit</span>
      </li>
    </ul>
  </CardContent>
  <CardFooter>
    <Button variant="outline" className="w-full">
      Learn More <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  </CardFooter>
</Card>
```

### Process Accordion
```typescript
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="step-1">
    <AccordionTrigger className="text-left">
      <span className="flex items-center">
        <Badge className="mr-3">1</Badge>
        Initial Assessment
      </span>
    </AccordionTrigger>
    <AccordionContent>
      <p className="text-muted-foreground">
        We begin with a thorough evaluation of your {{service_name}} needs...
      </p>
    </AccordionContent>
  </AccordionItem>
  {/* Repeat for each step */}
</Accordion>
```

### Universal CTA Section
```typescript
<section className="py-12 md:py-16 bg-gradient-to-r from-primary/10 to-primary/5">
  <div className="container mx-auto px-4">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
        Ready to Get Started?
      </h2>
      <p className="text-lg text-muted-foreground mb-6">
        {{company_name}} provides professional {{service_name}} in {{city_name}}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg">
          <PhoneCall className="mr-2 h-5 w-5" />
          {{company_phone}}
        </Button>
        <Button size="lg" variant="outline">
          Schedule Service
        </Button>
      </div>
    </div>
  </div>
</section>
```

### Service Areas Section
```typescript
<section className="py-12 bg-secondary/5">
  <div className="container mx-auto px-4">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
      Serving {{city_name}} and Surrounding Areas
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 max-w-4xl mx-auto">
      {/* Area badges - can be populated dynamically */}
      <Badge variant="secondary" className="justify-center py-2">
        <MapPin className="mr-1 h-3 w-3" />
        Downtown
      </Badge>
      {/* More areas */}
    </div>
    <p className="text-center text-muted-foreground mt-6">
      ...and more! Call {{company_phone}} to confirm service in your area.
    </p>
  </div>
</section>
```

### Contact Form Pattern
```typescript
<Card>
  <CardHeader>
    <CardTitle>Get Your Free {{service_name}} Quote</CardTitle>
    <CardDescription>
      Quick response for {{city_name}} residents
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="John" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Doe" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" placeholder="(555) 123-4567" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="your@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="service">Service Needed</Label>
        <Select>
          <SelectTrigger id="service">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultation">Free Consultation</SelectItem>
            <SelectItem value="repair">Repair Service</SelectItem>
            <SelectItem value="installation">New Installation</SelectItem>
            <SelectItem value="emergency">Emergency Service</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea 
          id="message" 
          placeholder="Tell us about your {{service_name}} needs..."
          rows={4}
        />
      </div>
      <Button type="submit" className="w-full">
        Get Free Quote
      </Button>
    </form>
  </CardContent>
</Card>
```

## **SEO OPTIMIZATION**

### Title Tag Formulas
```html
<!-- Authority Hub -->
<title>{{service_name}} {{city_name}} | {{company_name}} - Licensed Professionals</title>

<!-- Granular Service -->
<title>{{service_name}} in {{city_name}} | From ${{service_starting_price}} - {{company_name}}</title>

<!-- Emergency Service -->
<title>Emergency {{service_name}} {{city_name}} - 24/7 Response | {{company_phone}}</title>
```

### Meta Description Formulas
```html
<!-- Universal Format -->
<meta name="description" content="Professional {{service_name}} in {{city_name}}. {{years_experience}}+ years experience. Licensed & insured. Free estimates. Call {{company_phone}}.">
```

### Heading Hierarchy
```html
<h1>{{service_name}} in {{city_name}}</h1>
  <h2>Our {{service_name}} Services</h2>
    <h3>Residential {{service_name}}</h3>
    <h3>Commercial {{service_name}}</h3>
  <h2>Why Choose {{company_name}}</h2>
  <h2>Our Process</h2>
  <h2>Service Areas</h2>
```

## **CONTENT GUIDELINES**

### Universal Value Propositions
- Licensed and insured professionals
- X+ years of experience
- Free estimates/consultations
- Satisfaction guarantee
- Local, family-owned business
- 24/7 emergency service
- Transparent pricing
- Warranty on work

### Trust Building Elements
Every template must include:
- Years in business
- License/insurance mentions
- Service guarantees
- Response time commitments
- Customer satisfaction focus
- Local business emphasis
- Professional certifications
- Industry memberships

### CTA Frequency & Placement
- Above the fold: Primary phone CTA
- After benefits: Service CTA
- Mid-page: Quote request
- After process: Schedule CTA
- Bottom: Strong closing CTA
- Emergency pages: Multiple urgent CTAs

## **INDUSTRY ADAPTABILITY**

This system works for:

### Home Services
- Roofing, Siding, Gutters
- Plumbing, Drain Cleaning, Water Heaters
- HVAC, Heating, Air Conditioning
- Electrical, Wiring, Panels
- Windows, Doors, Insulation

### Property Services
- Landscaping, Lawn Care, Tree Service
- Painting, Interior, Exterior
- Flooring, Carpet, Hardwood, Tile
- Pest Control, Termites, Wildlife
- Cleaning, Pressure Washing

### Specialty Trades
- Solar Panel Installation
- Pool Service, Maintenance
- Garage Door Repair, Installation
- Concrete, Driveways, Patios
- Fencing, Decks, Outdoor Living

### Emergency Services
- Water Damage Restoration
- Fire Damage Cleanup
- Mold Remediation
- Storm Damage Recovery
- Sewage Cleanup

## **QUALITY VALIDATION CHECKLIST**

Before any template is complete, verify:

### Technical Requirements
- [ ] React functional component with TypeScript
- [ ] All imports from @/components/ui/
- [ ] Lucide React icons only
- [ ] Default export with proper name

### Design System Compliance
- [ ] ONLY semantic color tokens used
- [ ] Zero hex/rgb colors
- [ ] All responsive classes included
- [ ] Mobile-first approach

### Content Structure
- [ ] All company info uses {{variables}}
- [ ] No hardcoded business information
- [ ] Proper word count for template type
- [ ] Required sections included

### User Experience
- [ ] Multiple CTAs throughout
- [ ] Trust badges visible
- [ ] Contact form included
- [ ] Service areas listed
- [ ] Emergency option if applicable

### SEO Elements
- [ ] H1 includes service + city
- [ ] Proper heading hierarchy
- [ ] Meta tags formula included
- [ ] Keywords naturally integrated

## **ERROR PREVENTION**

### Common Mistakes to Avoid

1. **Color Violations**
   ```typescript
   // ❌ WRONG
   className="bg-white text-black"
   
   // ✅ CORRECT
   className="bg-background text-foreground"
   ```

2. **Missing Responsive**
   ```typescript
   // ❌ WRONG
   className="text-4xl p-8"
   
   // ✅ CORRECT
   className="text-2xl md:text-3xl lg:text-4xl p-4 md:p-6 lg:p-8"
   ```

3. **Hardcoded Information**
   ```typescript
   // ❌ WRONG
   <Button>Call (555) 123-4567</Button>
   
   // ✅ CORRECT
   <Button>Call {{company_phone}}</Button>
   ```

4. **Wrong Components**
   ```typescript
   // ❌ WRONG
   import Button from './custom-button'
   
   // ✅ CORRECT
   import { Button } from "@/components/ui/button"
   ```

## **IMPLEMENTATION WORKFLOW**

1. **Identify template type** (Authority/Granular/Emergency)
2. **Set up imports** - All shadcn/ui components and icons
3. **Create wrapper** - min-h-screen bg-background
4. **Build hero section** - With trust badges and CTAs
5. **Add content sections** - Following template formula
6. **Insert variables** - Replace all static content
7. **Apply responsive** - Mobile-first classes throughout
8. **Add multiple CTAs** - Every 2-3 sections
9. **Include service areas** - Always at bottom
10. **Validate output** - Check against checklist

## **OUTPUT CONFIRMATION**

Every generated template should confirm:

```
✅ Universal Template Generated

Type: [Authority Hub | Granular Service | Emergency]
Industry: Compatible with ANY service business
Technology: React/TypeScript + shadcn/ui
Styling: Semantic tokens only (no hex/rgb)
Variables: All dynamic content uses {{}} syntax
Responsive: Mobile-first with all breakpoints
Sections: [count] included
Word Count: ~[count]

This template works for any company:
- Update {{variables}} with business data
- All styling uses semantic tokens
- Fully responsive design
- SEO optimized structure

Zero hardcoded values - 100% portable!
```

This system ensures every template is professional, consistent, and instantly adaptable for any service business.
