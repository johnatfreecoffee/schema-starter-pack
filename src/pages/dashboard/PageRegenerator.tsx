import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const PageRegenerator = () => {
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      setProgress('Marking all pages for regeneration...');
      
      const { error, count } = await supabase
        .from('generated_pages')
        .update({ needs_regeneration: true })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all

      if (error) throw error;
      
      setProgress(`Marked ${count} pages for regeneration`);
      return count;
    },
    onSuccess: (count) => {
      toast({
        title: 'Success',
        description: `${count} pages marked for regeneration. They will be regenerated on next visit.`,
      });
      setProgress('');
      queryClient.invalidateQueries({ queryKey: ['generated_pages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setProgress('');
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Page Regeneration</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Regenerate All Pages
            </CardTitle>
            <CardDescription>
              Mark all generated pages for regeneration. Pages will be rebuilt with the latest templates,
              company settings, and service/area data on their next visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => regenerateAllMutation.mutate()}
              disabled={regenerateAllMutation.isPending}
              size="lg"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${regenerateAllMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate All Pages
            </Button>
            {progress && (
              <p className="mt-4 text-sm text-muted-foreground">{progress}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>When to Regenerate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pages are automatically marked for regeneration when:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>A template is updated</li>
              <li>Company settings are changed</li>
              <li>A service is updated</li>
              <li>A service area is updated</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Manual regeneration is useful when you want to force rebuild all pages immediately,
              or if you've made changes that didn't automatically trigger regeneration.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PageRegenerator;
