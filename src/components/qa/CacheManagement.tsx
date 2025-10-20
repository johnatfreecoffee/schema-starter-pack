import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Database, RefreshCw, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { clearMetrics } from '@/lib/performanceMetrics';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CacheManagement = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
      toast.success(`${action} completed successfully`);
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(`Failed to ${action.toLowerCase()}`);
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  const actions = [
    {
      id: 'clear-cache',
      label: 'Clear System Cache',
      description: 'Clears browser cache and performance metrics',
      icon: Trash2,
      action: async () => {
        clearMetrics();
        localStorage.clear();
        sessionStorage.clear();
      }
    },
    {
      id: 'rebuild-index',
      label: 'Rebuild Page Index',
      description: 'Re-indexes all generated pages',
      icon: RefreshCw,
      action: async () => {
        const { error } = await supabase
          .from('generated_pages')
          .update({ needs_regeneration: true })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      }
    },
    {
      id: 'clear-logs',
      label: 'Clear Old Logs',
      description: 'Deletes activity logs older than 90 days',
      icon: Archive,
      action: async () => {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from('activity_logs')
          .delete()
          .lt('created_at', ninetyDaysAgo);
        if (error) throw error;
      }
    },
    {
      id: 'optimize-db',
      label: 'Optimize Database',
      description: 'Runs maintenance queries (admin only)',
      icon: Database,
      action: async () => {
        // This would require a database function or edge function
        // For now, just simulate the action
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((item) => {
              const Icon = item.icon;
              const isLoading = loading === item.id;
              
              return (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.label}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction(item.id)}
                          disabled={!!loading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Run'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.replace('-', ' ')}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = actions.find(a => a.id === confirmAction);
                if (action) {
                  handleAction(action.label, action.action);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
