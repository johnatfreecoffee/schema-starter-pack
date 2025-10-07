import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { History, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface EditHistoryProps {
  pageId: string;
  pageType: string;
  onRevert: (historyId: string, content: string) => void;
}

const EditHistory = ({ pageId, pageType, onRevert }: EditHistoryProps) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['page-edit-history', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_edit_history')
        .select('*')
        .eq('page_id', pageId)
        .eq('page_type', pageType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading history...</div>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No edit history yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Edit History</h3>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.edit_description || 'AI Edit'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevert(item.id, item.new_content)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            {item.ai_command && (
              <p className="text-xs text-muted-foreground italic truncate">
                "{item.ai_command}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditHistory;