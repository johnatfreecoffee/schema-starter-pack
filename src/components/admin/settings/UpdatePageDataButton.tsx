import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { callEdgeFunction } from '@/utils/callEdgeFunction';
import { useDataChanges } from '@/hooks/useDataChanges';

export const UpdatePageDataButton = () => {
  const [isRepublishing, setIsRepublishing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: changeStatus } = useDataChanges();

  const handleRepublish = async () => {
    if (!confirm('Update all page data with current company, service, and service area information?')) {
      return;
    }

    setIsRepublishing(true);
    try {
      const result = await callEdgeFunction({
        name: 'republish-all-pages',
        body: {}
      });

      // Store timestamp when republish completes
      localStorage.setItem('last_republish_timestamp', new Date().toISOString());

      toast({
        title: '✅ Update Complete',
        description: `Successfully updated ${result.summary.total_success} out of ${result.summary.total_pages} pages`,
      });

      if (result.summary.total_failed > 0) {
        console.error('Failed pages:', result.results.errors);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['static-page'] });
      queryClient.invalidateQueries({ queryKey: ['service-template'] });
      queryClient.invalidateQueries({ queryKey: ['rendered-page'] });
      queryClient.invalidateQueries({ queryKey: ['data-changes-check'] });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update pages',
        variant: 'destructive',
      });
    } finally {
      setIsRepublishing(false);
    }
  };

  const isYellow = changeStatus?.hasChanges ?? false;

  return (
    <div className="flex flex-col items-end gap-2">
      {isYellow && (
        <p className="text-sm text-muted-foreground">
          Some of your data has been updated, but not globally
        </p>
      )}
      <Button
        onClick={handleRepublish}
        disabled={isRepublishing}
        className={isYellow ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
        variant={isYellow ? 'default' : 'outline'}
      >
        {isRepublishing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
        Update Page Data
      </Button>
    </div>
  );
};
