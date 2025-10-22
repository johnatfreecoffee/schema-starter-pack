import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const UpdateCommercialTemplate = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTemplate = async () => {
    setIsUpdating(true);
    try {
      // Fetch the template HTML from the public folder
      const response = await fetch('/commercial-roofing-template.html');
      const templateHtml = await response.text();

      // Find the Commercial Roofing service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name, template_id')
        .ilike('name', '%commercial%roofing%')
        .single();

      if (serviceError) throw serviceError;
      if (!service || !service.template_id) {
        throw new Error('Commercial Roofing service or template not found');
      }

      // Update the template
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          template_html: templateHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.template_id);

      if (updateError) throw updateError;

      // Mark all generated pages for regeneration
      await supabase
        .from('generated_pages')
        .update({ needs_regeneration: true })
        .eq('service_id', service.id);

      toast({
        title: 'Success!',
        description: 'Commercial Roofing template has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Update Commercial Roofing Template</h1>
        <p className="text-muted-foreground mb-6">
          This will update your Commercial Roofing service template with the full version including all styles and content.
        </p>
        
        <Button 
          onClick={updateTemplate} 
          disabled={isUpdating}
          size="lg"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Template Now'
          )}
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          After updating, go back to Dashboard → Settings → Services and click "Edit Page Template" on Commercial Roofing to see the changes.
        </p>
      </Card>
    </div>
  );
};

export default UpdateCommercialTemplate;
