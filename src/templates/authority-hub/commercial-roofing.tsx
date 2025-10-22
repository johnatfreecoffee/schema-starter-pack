import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Calendar,
  DollarSign,
  Phone,
  CheckCircle2,
  Shield,
  MapPin,
  Clock,
  Award,
  Zap,
  Umbrella,
  Home,
  Factory,
  Store,
  Warehouse,
  Hotel,
  School
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

/**
 * Commercial Roofing Authority Hub Template
 * 
 * Template Category: Authority Hub
 * Target Word Count: 1800+ words
 * SEO Focus: Commercial roofing contractors, TPO/EPDM installation
 * 
 * Design System: Uses semantic tokens (bg-background, text-foreground, etc.)
 * Components: shadcn/ui only
 * Icons: Lucide React
 * Variables: {{company_*}}, {{service_*}}, {{city_*}}
 */

interface CommercialRoofingProps {
  companyName: string;
  companyPhone: string;
  cityName: string;
  baseUrl: string;
}

export const CommercialRoofingTemplate: React.FC<CommercialRoofingProps> = ({
  companyName,
  companyPhone,
  cityName,
  baseUrl
}) => {
  return (
    <>
      <SEOHead
        title={`Commercial Roofing Contractors ${cityName} | ${companyName}`}
        description={`Trusted commercial roofing contractors serving ${cityName} businesses. TPO, EPDM, metal roofing installation & repair. Free estimates. Call ${companyPhone}.`}
        keywords="commercial roofing contractors, commercial roof repair, TPO roofing, EPDM roofing"
        canonical={`${baseUrl}/commercial-roofing`}
      />

      <article className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-accent/30 py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="container relative z-10">
            <div className="grid lg:grid-cols-[60%_40%] gap-8 lg:gap-12 items-start">
              {/* Hero Content */}
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Commercial Roofing Contractors You Can Trust
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  Protecting {cityName} Businesses with Expert Commercial Roofing Solutions - Installation, Repair & Emergency Services
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Over 20 years of experience serving commercial properties throughout the {cityName} metro area. From emergency repairs to complete roof replacements, we deliver durable solutions that protect your business investment.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="text-lg">
                    Get Free Commercial Estimate
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg">
                    <Phone className="mr-2 h-5 w-5" />
                    Call {companyPhone}
                  </Button>
                </div>

                <div className="mt-8 rounded-lg bg-muted/50 border border-border h-64 flex items-center justify-center text-sm text-muted-foreground">
                  Commercial building with new roof - Professional photography
                </div>
              </div>

              {/* Hero Form */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Get Your Free Commercial Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name *</Label>
                      <Input id="business-name" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Contact Name *</Label>
                      <Input id="contact-name" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" type="tel" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property-address">Property Address</Label>
                      <Input id="property-address" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roofing-type">Roofing Type *</Label>
                      <Select required>
                        <SelectTrigger id="roofing-type">
                          <SelectValue placeholder="Select Roofing Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tpo">TPO Roofing</SelectItem>
                          <SelectItem value="epdm">EPDM Rubber</SelectItem>
                          <SelectItem value="modified-bitumen">Modified Bitumen</SelectItem>
                          <SelectItem value="metal">Metal Roofing</SelectItem>
                          <SelectItem value="flat-roof-repair">Flat Roof Repair</SelectItem>
                          <SelectItem value="emergency">Emergency Repair</SelectItem>
                          <SelectItem value="not-sure">Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-details">Project Details</Label>
                      <Textarea id="project-details" rows={3} />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Get My Free Estimate
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="bg-primary text-primary-foreground py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center space-y-3">
                <Building2 className="h-10 w-10" />
                <div className="text-4xl font-bold">500+</div>
                <div className="text-sm opacity-90">Commercial Projects Completed</div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <Calendar className="h-10 w-10" />
                <div className="text-4xl font-bold">20+</div>
                <div className="text-sm opacity-90">Years Commercial Roofing Experience</div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <DollarSign className="h-10 w-10" />
                <div className="text-4xl font-bold">$2M+</div>
                <div className="text-sm opacity-90">In Insurance Claims Successfully Processed</div>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <Phone className="h-10 w-10" />
                <div className="text-4xl font-bold">24/7</div>
                <div className="text-sm opacity-90">Emergency Commercial Response</div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comprehensive Commercial Roofing Services
              </h2>
              <p className="text-lg text-muted-foreground">
                From small retail buildings to large industrial complexes, {companyName} provides complete commercial roofing solutions tailored to your business needs and budget.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Factory className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>TPO Roofing Systems</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Energy-efficient single-ply membrane roofing ideal for flat and low-slope commercial buildings. Excellent chemical and UV resistance.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>EPDM Rubber Roofing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Durable synthetic rubber membrane offering superior weather resistance and longevity. Perfect for commercial applications requiring reliable waterproofing.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Umbrella className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Modified Bitumen Systems</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Multi-layer roofing system providing excellent protection against extreme weather. Self-healing properties ensure long-term performance.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Home className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Metal Commercial Roofing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Durable metal roofing solutions with exceptional longevity. Energy-efficient, low-maintenance, and environmentally sustainable option.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Zap className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Flat Roof Repair & Restoration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Expert repairs for leaks, ponding water, and membrane damage. Cost-effective solutions to extend your commercial roof's lifespan.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Commercial Insurance Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Expert assistance navigating commercial insurance claims for storm damage. We handle documentation and work directly with adjusters.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-20 bg-accent/30 border-y border-border">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                  Why {cityName} Businesses Choose {companyName}
                </h2>

                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Licensed & Insured</h4>
                      <p className="text-muted-foreground">
                        Fully licensed commercial contractors with comprehensive liability coverage protecting your business
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Local Expertise</h4>
                      <p className="text-muted-foreground">
                        Deep understanding of {cityName} weather challenges and building code requirements
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Emergency Response</h4>
                      <p className="text-muted-foreground">
                        24/7 emergency service for urgent commercial roofing issues that can't wait
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Insurance Specialists</h4>
                      <p className="text-muted-foreground">
                        Proven track record helping businesses maximize insurance claim settlements
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Quality Materials</h4>
                      <p className="text-muted-foreground">
                        Premium roofing systems from trusted manufacturers with strong warranties
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-semibold text-primary mb-1">Project Management</h4>
                      <p className="text-muted-foreground">
                        Dedicated project managers ensure minimal disruption to your business operations
                      </p>
                    </div>
                  </li>
                </ul>

                <p className="mt-8 text-muted-foreground">
                  When your commercial roof fails, every minute counts. Our experienced team responds quickly with professional solutions that get your business back to normal fast.
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border h-96 flex items-center justify-center text-sm text-muted-foreground">
                Commercial roof installation in progress - Professional quality photography
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Commercial Roofing Process
              </h2>
              <p className="text-lg text-muted-foreground">
                From initial inspection to project completion, our streamlined process ensures professional results with minimal disruption to your business.
              </p>
            </div>

            <div className="relative mt-12">
              {/* Desktop connector line */}
              <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-primary" />

              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Free Inspection & Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive roof evaluation including structural integrity, drainage, and potential issues
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Detailed Quote & Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Transparent pricing with detailed specifications and realistic project timeline
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Insurance Coordination</h3>
                  <p className="text-sm text-muted-foreground">
                    Handle all insurance communications and documentation if claim-related work
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    4
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Professional Installation</h3>
                  <p className="text-sm text-muted-foreground">
                    Licensed crews following manufacturer specifications and safety protocols
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    5
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Final Inspection & Warranty</h3>
                  <p className="text-sm text-muted-foreground">
                    Quality assurance inspection with comprehensive warranty documentation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Callout */}
        <section className="py-16 md:py-20 bg-destructive text-destructive-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-10" />
          <div className="container relative z-10 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Commercial Roof Emergency?
              </h2>
              <p className="text-lg opacity-95">
                Don't let a roof leak shut down your business. Our emergency response team is available 24/7 for urgent commercial roofing issues.
              </p>
              <p className="text-base">
                • Rapid Response • Temporary Protection • Insurance Documentation • Professional Repairs
              </p>
              <Button size="lg" variant="secondary" className="mt-4 text-lg">
                <Phone className="mr-2 h-5 w-5" />
                Call Emergency Line: {companyPhone}
              </Button>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-16 md:py-20 bg-accent/30">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recent Commercial Projects
              </h2>
              <p className="text-lg text-muted-foreground">
                See examples of our commercial roofing work throughout the {cityName} metro area.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="relative group cursor-pointer rounded-lg overflow-hidden h-64">
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Commercial Project
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <div className="font-semibold">Retail Plaza - Metairie</div>
                  <div className="text-sm opacity-90">12,000 sq ft TPO Installation</div>
                </div>
              </div>

              <div className="relative group cursor-pointer rounded-lg overflow-hidden h-64">
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Commercial Project
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <div className="font-semibold">Warehouse - Kenner</div>
                  <div className="text-sm opacity-90">25,000 sq ft EPDM System</div>
                </div>
              </div>

              <div className="relative group cursor-pointer rounded-lg overflow-hidden h-64">
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Commercial Project
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <div className="font-semibold">Office Building - New Orleans</div>
                  <div className="text-sm opacity-90">8,500 sq ft Modified Bitumen</div>
                </div>
              </div>

              <div className="relative group cursor-pointer rounded-lg overflow-hidden h-64">
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Commercial Project
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <div className="font-semibold">Hotel - Slidell</div>
                  <div className="text-sm opacity-90">30,000 sq ft Metal Roof</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What {cityName} Business Owners Say
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              <Card className="bg-accent/30">
                <CardContent className="p-8">
                  <p className="text-lg italic text-muted-foreground mb-6 relative">
                    <span className="text-6xl text-primary absolute -top-4 -left-2 leading-none">"</span>
                    <span className="relative z-10">
                      Clear Home responded within hours when our commercial roof started leaking during a storm. Their emergency team secured the building and had permanent repairs completed in just three days. Exceptional service when we needed it most.
                    </span>
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">Michael Rodriguez</div>
                    <div className="text-sm text-muted-foreground italic">Owner, Rodriguez Auto Parts</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/30">
                <CardContent className="p-8">
                  <p className="text-lg italic text-muted-foreground mb-6 relative">
                    <span className="text-6xl text-primary absolute -top-4 -left-2 leading-none">"</span>
                    <span className="relative z-10">
                      We've used Clear Home for multiple properties across our retail portfolio. Their commercial expertise, competitive pricing, and reliability keep us coming back. They understand business owners can't afford downtime.
                    </span>
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Johnson</div>
                    <div className="text-sm text-muted-foreground italic">Property Manager, Johnson Commercial Real Estate</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/30">
                <CardContent className="p-8">
                  <p className="text-lg italic text-muted-foreground mb-6 relative">
                    <span className="text-6xl text-primary absolute -top-4 -left-2 leading-none">"</span>
                    <span className="relative z-10">
                      The insurance claim process was painless thanks to Clear Home's documentation and communication with our adjuster. They secured full coverage for our TPO installation and the new roof looks fantastic. Highly recommended for commercial work.
                    </span>
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">David Chen</div>
                    <div className="text-sm text-muted-foreground italic">Facilities Director, Chen Manufacturing</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 md:py-20 bg-accent/30">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Commercial Service Areas
              </h2>
              <p className="text-lg text-muted-foreground">
                Serving businesses throughout the {cityName} metro area and surrounding communities.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="rounded-lg bg-muted/50 border border-border h-96 flex items-center justify-center text-sm text-muted-foreground">
                Service area map placeholder
              </div>

              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {[
                    'New Orleans', 'Metairie', 'Kenner', 'Laplace', 'Arabi', 'Chalmette',
                    'Algiers', 'Gretna', 'Harvey', 'Terrytown', 'Belle Chasse', 'Marrero',
                    'Slidell', 'Covington', 'Mandeville', 'Madisonville', 'Hammond', 'Ponchatoula'
                  ].map((area) => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className="justify-center py-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  Serving your area? Contact us for a free commercial roof assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-geometric-pattern opacity-5" />
          <div className="container relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Protect Your Commercial Investment?
              </h2>
              <p className="text-lg opacity-95">
                Get a free commercial roof inspection and detailed quote from {cityName}'s trusted commercial roofing contractors.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-base pt-4">
                <span>✓ Free Inspection</span>
                <span>✓ Written Quote</span>
                <span>✓ Insurance Assistance</span>
                <span>✓ Emergency Service</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" variant="secondary" className="text-lg">
                  Schedule Free Inspection
                </Button>
                <Button size="lg" variant="outline" className="text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Phone className="mr-2 h-5 w-5" />
                  Call {companyPhone}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </article>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: companyName,
            description: `Commercial roofing contractors serving ${cityName} businesses with TPO, EPDM, metal roofing installation and repair services.`,
            url: `${baseUrl}/commercial-roofing`,
            telephone: companyPhone,
            address: {
              '@type': 'PostalAddress',
              addressLocality: cityName,
              addressRegion: 'Louisiana',
              addressCountry: 'US'
            },
            areaServed: [
              'New Orleans', 'Metairie', 'Kenner', 'Laplace', 'Arabi', 'Chalmette',
              'Algiers', 'Gretna', 'Harvey', 'Terrytown', 'Belle Chasse', 'Marrero',
              'Slidell', 'Covington', 'Mandeville', 'Madisonville', 'Hammond', 'Ponchatoula'
            ],
            serviceType: [
              'TPO Roofing', 'EPDM Roofing', 'Modified Bitumen', 'Metal Commercial Roofing',
              'Flat Roof Repair', 'Commercial Insurance Claims', 'Emergency Commercial Roofing'
            ],
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Commercial Roofing Services',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'TPO Roofing Systems',
                    description: 'Energy-efficient single-ply membrane roofing ideal for flat and low-slope commercial buildings.'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'EPDM Rubber Roofing',
                    description: 'Durable synthetic rubber membrane offering superior weather resistance and longevity.'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Commercial Insurance Claims',
                    description: 'Expert assistance navigating commercial insurance claims for storm damage.'
                  }
                }
              ]
            }
          })
        }}
      />
    </>
  );
};

export default CommercialRoofingTemplate;
