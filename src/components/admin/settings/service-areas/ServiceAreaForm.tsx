import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

const formSchema = z.object({
  area_name: z.string().max(100).optional(),
  city_name: z.string().min(1, 'City name is required').max(100),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits or ZIP+4 format').optional().or(z.literal('')),
  city_slug: z.string().min(1, 'URL slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  display_name: z.string().min(1, 'Display name is required').max(150),
  local_description: z.string().max(1000).optional(),
  status: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceAreaFormProps {
  area?: any;
  onSuccess: () => void;
}

const ServiceAreaForm = ({ area, onSuccess }: ServiceAreaFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area_name: area?.area_name || '',
      city_name: area?.city_name || '',
      state: area?.state || 'LA',
      zip_code: area?.zip_code || '',
      city_slug: area?.city_slug || '',
      display_name: area?.display_name || '',
      local_description: area?.local_description || '',
      status: area?.status ?? true,
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'city_name' && !area) {
        const slug = generateSlug(value.city_name || '');
        form.setValue('city_slug', slug);
        
        // Auto-populate display_name if not set
        if (!value.display_name && value.city_name && value.state) {
          form.setValue('display_name', `${value.city_name}, ${value.state}`);
        }
      }
      if (name === 'state' && !area && value.city_name && !value.display_name) {
        form.setValue('display_name', `${value.city_name}, ${value.state}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, area]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (area) {
        // Update existing area
        const { error: updateError } = await supabase
          .from('service_areas')
          .update({
            area_name: data.area_name || null,
            city_name: data.city_name,
            state: data.state,
            zip_code: data.zip_code || null,
            city_slug: data.city_slug,
            display_name: data.display_name,
            local_description: data.local_description,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', area.id);

        if (updateError) throw updateError;

        // If slug changed, update all generated pages
        if (data.city_slug !== area.city_slug) {
          const { data: pages } = await supabase
            .from('generated_pages')
            .select('id, url_path, service_id')
            .eq('service_area_id', area.id);

          if (pages) {
            for (const page of pages) {
              const { data: service } = await supabase
                .from('services')
                .select('slug')
                .eq('id', page.service_id)
                .single();

              if (service) {
                await supabase
                  .from('generated_pages')
                  .update({ url_path: `/${data.city_slug}/${service.slug}` })
                  .eq('id', page.id);
              }
            }
          }
        }

        await cacheInvalidation.invalidateServiceArea(area.id);
        toast({ title: 'Service area updated successfully' });
      } else {
        // Create new area
        const { data: newArea, error: insertError } = await supabase
          .from('service_areas')
          .insert({
            area_name: data.area_name || null,
            city_name: data.city_name,
            state: data.state,
            zip_code: data.zip_code || null,
            city_slug: data.city_slug,
            display_name: data.display_name,
            local_description: data.local_description,
            status: data.status,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Get all active services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*');

        if (servicesError) throw servicesError;

        // Create service_area_services entries and generated_pages
        const serviceAreaServicesData = services.map(service => ({
          service_area_id: newArea.id,
          service_id: service.id,
          is_active: true,
        }));

        const { error: junctionError } = await supabase
          .from('service_area_services')
          .insert(serviceAreaServicesData);

        if (junctionError) throw junctionError;

        // Get company name for page titles
        const { data: companySettings } = await supabase
          .from('company_settings')
          .select('business_name')
          .single();

        const companyName = companySettings?.business_name || 'Company';

        // Create generated pages
        const generatedPagesData = services.map(service => ({
          service_id: service.id,
          service_area_id: newArea.id,
          url_path: `/${data.city_slug}/${service.slug}`,
          page_title: `${service.name} in ${data.city_name} | ${companyName}`,
          meta_description: service.full_description?.substring(0, 160) || `Professional ${service.name} services in ${data.display_name}`,
          status: true,
        }));

        const { error: pagesError } = await supabase
          .from('generated_pages')
          .insert(generatedPagesData);

        if (pagesError) throw pagesError;

        await cacheInvalidation.invalidateServiceArea(newArea.id);
        toast({ 
          title: 'Service area created successfully',
          description: `${services.length} pages generated for ${data.city_name}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="area_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Greater Atlanta Area" {...field} />
              </FormControl>
              <FormDescription>Custom name for this service area (if different from city)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Orleans" {...field} />
              </FormControl>
              <FormDescription>The name of the city</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 70112" {...field} />
                </FormControl>
                <FormDescription>5 digits or ZIP+4 format</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="city_slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <Input placeholder="e.g., new-orleans" {...field} />
              </FormControl>
              <FormDescription>Auto-generated from city name (lowercase with hyphens)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Orleans, Louisiana" {...field} />
              </FormControl>
              <FormDescription>Full name including state/region</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="local_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local Area Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your services in this area, local expertise, response times..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Area-specific marketing content used in templates ({field.value?.length || 0}/1000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  When inactive, all pages for this area are hidden
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : area ? 'Update Service Area' : 'Create Service Area'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServiceAreaForm;