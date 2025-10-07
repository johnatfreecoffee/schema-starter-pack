import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  city_name: z.string().min(1, 'City name is required').max(100),
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
      city_name: area?.city_name || '',
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
            city_name: data.city_name,
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

        toast({ title: 'Service area updated successfully' });
      } else {
        // Create new area
        const { data: newArea, error: insertError } = await supabase
          .from('service_areas')
          .insert({
            city_name: data.city_name,
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
          name="city_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Orleans" {...field} />
              </FormControl>
              <FormDescription>The name of the city or area</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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