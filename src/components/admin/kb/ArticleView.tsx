import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  kb_categories?: {
    name: string;
  } | null;
}

interface ArticleViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Article | null;
  onEdit: () => void;
  onDelete: () => void;
}

const ArticleView = ({ open, onOpenChange, article, onEdit, onDelete }: ArticleViewProps) => {
  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-2xl">{article.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {article.kb_categories && (
                  <span className="font-medium">{article.kb_categories.name}</span>
                )}
                <span>Created: {format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                <span>Updated: {format(new Date(article.updated_at), 'MMM d, yyyy')}</span>
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {!article.is_active && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This article is currently <strong>inactive</strong> and not visible in the knowledge base.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ArticleView;