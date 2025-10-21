import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cacheInvalidation } from '@/lib/cacheInvalidation';

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  category: z.enum(['Authority Hub', 'Emergency Services', 'Granular Services']),
  full_description: z.string().min(10).max(2000),
  is_active: z.boolean().default(true),
});

interface ServiceFormProps {
  service?: any;
  onSuccess: () => void;
}

export default function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const queryClient = useQueryClient();
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || '',
      slug: service?.slug || '',
      category: service?.category || 'Granular Services',
      full_description: service?.full_description || '',
      is_active: service?.is_active !== undefined ? service.is_active : true,
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        slug: service.slug,
        category: service.category,
        full_description: service.full_description,
        is_active: service.is_active !== undefined ? service.is_active : true,
      });
      setDescriptionLength(service.full_description?.length || 0);
    }
  }, [service, form]);

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('business_name')
        .single();

      // Create default template for the service
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .insert([{
          name: `${values.name} Template`,
          template_type: 'service' as const,
          template_html: `
<div class="service-page">
  <section class="hero">
    <h1>{{service_name}} in {{city_name}}</h1>
    <p class="lead">Professional {{service_name}} services in {{city_name}}. {{company_name}} has been serving {{display_name}} with quality and reliability.</p>
    <div class="cta-buttons">
      <a href="tel:{{company_phone}}" class="btn btn-primary">Call {{company_phone}}</a>
      <a href="/contact" class="btn btn-secondary">Get Free Quote</a>
    </div>
  </section>

  <section class="service-details">
    <h2>About Our {{service_name}} Service</h2>
    <p>{{service_description}}</p>
  </section>

  <section class="local-info">
    <h2>{{service_name}} in {{city_name}}</h2>
    <p>{{local_description}}</p>
    
    {{#if local_benefits}}
    <h3>Why Choose Us in {{city_name}}?</h3>
    <ul class="benefits">
      {{#each local_benefits}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    {{/if}}
    
    {{#if response_time}}
    <div class="service-stats">
      <p><strong>Average Response Time:</strong> {{response_time}}</p>
      {{#if completion_time}}<p><strong>Typical Completion:</strong> {{completion_time}}</p>{{/if}}
      {{#if customer_count}}<p><strong>Customers Served in {{city_name}}:</strong> {{customer_count}}+</p>{{/if}}
    </div>
    {{/if}}
  </section>

  {{#if service_starting_price}}
  <section class="pricing">
    <h2>{{service_name}} Pricing in {{city_name}}</h2>
    {{#if pricing_notes}}<p>{{pricing_notes}}</p>{{/if}}
    <p class="starting-price">Starting at {{service_starting_price}}</p>
  </section>
  {{/if}}

  <section class="cta-bottom">
    <h2>Ready to Get Started?</h2>
    <p>Contact {{company_name}} today for professional {{service_name}} in {{city_name}}.</p>
    <div class="contact-info">
      <a href="tel:{{company_phone}}" class="phone-link">📞 {{company_phone}}</a>
      <a href="mailto:{{company_email}}" class="email-link">✉️ {{company_email}}</a>
    </div>
  </section>
</div>
          `,
        }])
        .select()
        .single();

      if (templateError) throw templateError;

      const serviceData = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        full_description: values.full_description,
        is_active: values.is_active,
        template_id: template.id,
      };

      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Fetch ALL service areas (not just active ones)
      const { data: serviceAreas, error: areasError } = await supabase
        .from('service_areas')
        .select('*');

      if (areasError) throw areasError;

      if (serviceAreas && serviceAreas.length > 0) {
        // Create service_area_services junction entries for ALL areas
        const junctionEntries = serviceAreas.map(area => ({
          service_id: newService.id,
          service_area_id: area.id,
          is_active: area.status && values.is_active, // Both must be active
        }));

        const { error: junctionError } = await supabase
          .from('service_area_services')
          .insert(junctionEntries);

        if (junctionError) throw junctionError;

        // Create generated_pages for ALL areas
        const generatedPages = serviceAreas.map(area => ({
          service_id: newService.id,
          service_area_id: area.id,
          url_path: `/${area.city_slug}/${values.slug}`,
          page_title: `${values.name} in ${area.city_name} | ${companySettings?.business_name || 'Our Company'}`,
          meta_description: values.full_description.substring(0, 160),
          status: area.status && values.is_active, // Page active only if both are active
        }));

        const { error: pagesError } = await supabase
          .from('generated_pages')
          .insert(generatedPages);

        if (pagesError) throw pagesError;
      }

      return { service: newService, pagesCount: serviceAreas?.length || 0 };
    },
    onSuccess: async (data) => {
      await cacheInvalidation.invalidateService(data.service.id);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['generated-pages'] });
      
      if (data.pagesCount > 0) {
        toast({
          title: 'Service created!',
          description: `Generated ${data.pagesCount} pages (one for each area).`,
        });
      } else {
        toast({
          title: 'Service created!',
          description: 'No areas exist yet - pages will be created when you add areas.',
        });
      }
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const serviceData = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        full_description: values.full_description,
        is_active: values.is_active,
      };

      const { error: serviceError } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', service.id);

      if (serviceError) throw serviceError;

      // Update generated pages status if is_active changed
      if (service.is_active !== values.is_active) {
        await supabase
          .from('generated_pages')
          .update({ status: values.is_active })
          .eq('service_id', service.id);
      }

      if (service.slug !== values.slug) {
        const { data: pages } = await supabase
          .from('generated_pages')
          .select('id, service_area_id, service_areas!inner(city_slug)')
          .eq('service_id', service.id);

        if (pages) {
          for (const page of pages) {
            const citySlug = (page.service_areas as any).city_slug;
            await supabase
              .from('generated_pages')
              .update({ url_path: `/${citySlug}/${values.slug}` })
              .eq('id', page.id);
          }
        }
      }
    },
    onSuccess: async () => {
      await cacheInvalidation.invalidateService(service.id);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Service updated!' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (service) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Storm Damage Restoration"
                  onChange={(e) => {
                    field.onChange(e);
                    if (!service) {
                      form.setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="storm-damage-restoration" />
              </FormControl>
              <FormDescription>Auto-generated from name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Authority Hub">Authority Hub</SelectItem>
                  <SelectItem value="Emergency Services">Emergency Services</SelectItem>
                  <SelectItem value="Granular Services">Granular Services</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="full_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={8}
                  placeholder="Detailed description of this service..."
                  onChange={(e) => {
                    field.onChange(e);
                    setDescriptionLength(e.target.value.length);
                  }}
                />
              </FormControl>
              <FormDescription>{descriptionLength} / 2000 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable this service to make it visible on the public website
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {service ? 'Update Service' : 'Create Service'}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
