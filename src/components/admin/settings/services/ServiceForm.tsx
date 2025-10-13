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
  starting_price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Must be a valid positive number',
  }),
  template_id: z.string().uuid('Please select a template'),
});

interface ServiceFormProps {
  service?: any;
  onSuccess: () => void;
}

export default function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const queryClient = useQueryClient();
  const [descriptionLength, setDescriptionLength] = useState(0);

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || '',
      slug: service?.slug || '',
      category: service?.category || 'Granular Services',
      full_description: service?.full_description || '',
      starting_price: service?.starting_price ? (service.starting_price / 100).toString() : '',
      template_id: service?.template_id || '',
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        slug: service.slug,
        category: service.category,
        full_description: service.full_description,
        starting_price: (service.starting_price / 100).toString(),
        template_id: service.template_id,
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

      const serviceData = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        full_description: values.full_description,
        starting_price: Math.round(parseFloat(values.starting_price) * 100),
        template_id: values.template_id,
      };

      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (serviceError) throw serviceError;

      const { data: serviceAreas, error: areasError } = await supabase
        .from('service_areas')
        .select('*')
        .eq('status', true);

      if (areasError) throw areasError;

      const generatedPages = serviceAreas.map(area => ({
        service_id: newService.id,
        service_area_id: area.id,
        url_path: `/${area.city_slug}/${values.slug}`,
        page_title: `${values.name} in ${area.city_name}, LA | ${companySettings?.business_name || 'Our Company'}`,
        meta_description: values.full_description.substring(0, 160),
        status: true,
      }));

      const { error: pagesError } = await supabase
        .from('generated_pages')
        .insert(generatedPages);

      if (pagesError) throw pagesError;

      return { service: newService, pagesCount: generatedPages.length };
    },
    onSuccess: async (data) => {
      await cacheInvalidation.invalidateService(data.service.id);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Service created!',
        description: `${data.pagesCount} pages generated.`,
      });
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
        starting_price: Math.round(parseFloat(values.starting_price) * 100),
        template_id: values.template_id,
      };

      const { error: serviceError } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', service.id);

      if (serviceError) throw serviceError;

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
                  <SelectItem value="authority_hub">Authority Hub</SelectItem>
                  <SelectItem value="emergency_services">Emergency Services</SelectItem>
                  <SelectItem value="granular_services">Granular Services</SelectItem>
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
          name="starting_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Price</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" placeholder="1500.00" />
              </FormControl>
              <FormDescription>Price in dollars</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="template_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Template</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.template_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select template for this service's pages</FormDescription>
              <FormMessage />
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
