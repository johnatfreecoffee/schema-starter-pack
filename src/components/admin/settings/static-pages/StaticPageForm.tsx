import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Editor from '@monaco-editor/react';

/**
 * Static Page Form
 * 
 * IMPORTANT: Static pages follow the Static Pages Template Guide
 * Reference: src/templates/STATIC_PAGES_TEMPLATE_GUIDE.md
 * 
 * ALLOWED VARIABLES (Company Only):
 * {{company_name}}, {{company_phone}}, {{company_email}}, {{company_address}},
 * {{years_experience}}, {{business_hours}}, {{logo_url}}, {{description}}, etc.
 * 
 * FORBIDDEN VARIABLES (Service/Area):
 * {{service_name}}, {{city_name}}, {{service_starting_price}}, etc.
 * 
 * DESIGN SYSTEM:
 * - shadcn/ui components only
 * - Semantic color tokens only (bg-background, text-foreground)
 * - Mobile-first responsive design
 * - Reference: src/templates/UNIVERSAL_TEMPLATE_SYSTEM.md
 */

interface StaticPageFormProps {
  page?: any;
  onClose: () => void;
}

const StaticPageForm = ({ page, onClose }: StaticPageFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: page || {
      title: '',
      slug: '',
      content_html: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      status: true,
      show_in_menu: true,
      is_homepage: false,
      display_order: 0
    }
  });

  const title = watch('title');
  const slug = watch('slug');
  const contentHtml = watch('content_html');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    if (!page) {
      setValue('slug', generateSlug(newTitle));
    }
  };

  const savePage = useMutation({
    mutationFn: async (data: any) => {
      const pageData = {
        ...data,
        url_path: '/' + data.slug,
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        // Save to both live and draft when using form editor
        content_html_draft: data.content_html
      };

      // If setting as homepage, clear homepage flag from other pages first
      if (data.is_homepage) {
        const { error: clearError } = await supabase
          .from('static_pages')
          .update({ is_homepage: false })
          .neq('id', page?.id || '00000000-0000-0000-0000-000000000000');
        if (clearError) throw clearError;
      }

      if (page) {
        const { error } = await supabase
          .from('static_pages')
          .update(pageData)
          .eq('id', page.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('static_pages')
          .insert([pageData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      toast({ title: `Page ${page ? 'updated' : 'created'} successfully!` });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving page',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => savePage.mutate(data))} className="space-y-6">
      <div>
        <Label htmlFor="title">Page Title *</Label>
        <Input
          id="title"
          {...register('title', { required: true, onChange: handleTitleChange })}
          placeholder="About Our Company"
        />
      </div>

      <div>
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          {...register('slug', { required: true })}
          placeholder="about-us"
        />
        <p className="text-sm text-muted-foreground mt-1">
          URL: https://yoursite.com/{slug || 'slug'}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_homepage"
          {...register('is_homepage')}
        />
        <Label htmlFor="is_homepage">Set as Homepage</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show_in_menu"
          defaultChecked
          {...register('show_in_menu')}
        />
        <Label htmlFor="show_in_menu">Show in Navigation Menu</Label>
      </div>

      <div>
        <Label htmlFor="display_order">Menu Display Order</Label>
        <Input
          id="display_order"
          type="number"
          {...register('display_order', { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label htmlFor="meta_title">Meta Title (SEO)</Label>
        <Input
          id="meta_title"
          {...register('meta_title')}
          maxLength={60}
          placeholder="Page title for search engines"
        />
      </div>

      <div>
        <Label htmlFor="meta_description">Meta Description (SEO)</Label>
        <Textarea
          id="meta_description"
          {...register('meta_description')}
          maxLength={160}
          rows={3}
          placeholder="Brief description for search engines (160 chars max)"
        />
      </div>

      <div>
        <Label htmlFor="meta_keywords">Meta Keywords</Label>
        <Input
          id="meta_keywords"
          {...register('meta_keywords')}
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>

      <div>
        <Label htmlFor="content_html">Page Content (HTML)</Label>
        <div className="border rounded-md overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="html"
            value={contentHtml}
            onChange={(value) => setValue('content_html', value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on'
            }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          defaultChecked
          {...register('status')}
        />
        <Label htmlFor="status">Active</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {page ? 'Update' : 'Create'} Page
        </Button>
      </div>
    </form>
  );
};

export default StaticPageForm;
