import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface HTMLImporterProps {
  onClose: () => void;
}

const HTMLImporter = ({ onClose }: HTMLImporterProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importMethod, setImportMethod] = useState<'paste' | 'upload'>('paste');
  const [htmlContent, setHtmlContent] = useState('');
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      show_in_menu: true,
      display_order: 0
    }
  });

  const extractMetadata = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.querySelector('title')?.textContent || '';
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const bodyContent = doc.body?.innerHTML || html;

    if (title) setValue('title', title);
    if (metaDescription) setValue('meta_description', metaDescription);
    if (title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setValue('slug', slug);
    }

    return bodyContent;
  };

  const handleHTMLInput = (html: string) => {
    setHtmlContent(html);
    extractMetadata(html);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleHTMLInput(content);
      };
      reader.readAsText(file);
    }
  };

  const importPage = useMutation({
    mutationFn: async (data: any) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const bodyContent = doc.body?.innerHTML || htmlContent;

      const pageData = {
        ...data,
        content_html: bodyContent,
        url_path: '/' + data.slug,
        status: true,
        is_homepage: false
      };

      const { error } = await supabase
        .from('static_pages')
        .insert([pageData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      toast({ title: 'Page imported successfully!' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error importing page',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <Label>Import Method</Label>
        <RadioGroup value={importMethod} onValueChange={(value: any) => setImportMethod(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paste" id="paste" />
            <Label htmlFor="paste">Paste HTML</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id="upload" />
            <Label htmlFor="upload">Upload HTML File</Label>
          </div>
        </RadioGroup>
      </div>

      {importMethod === 'paste' ? (
        <div>
          <Label htmlFor="html-content">HTML Content</Label>
          <Textarea
            id="html-content"
            rows={15}
            value={htmlContent}
            onChange={(e) => handleHTMLInput(e.target.value)}
            placeholder="Paste your HTML content here..."
            className="font-mono text-sm"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="html-file">Upload HTML File</Label>
          <Input
            id="html-file"
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
          />
        </div>
      )}

      <form onSubmit={handleSubmit((data) => importPage.mutate(data))} className="space-y-4">
        <div>
          <Label htmlFor="title">Page Title *</Label>
          <Input
            id="title"
            {...register('title', { required: true })}
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
        </div>

        <div>
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            {...register('meta_title')}
            maxLength={60}
          />
        </div>

        <div>
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            {...register('meta_description')}
            maxLength={160}
            rows={3}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!htmlContent}>
            Import Page
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HTMLImporter;
