import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, Pencil, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  tags: string[];
  is_active: boolean;
  updated_at: string;
  kb_categories?: {
    name: string;
  } | null;
}

interface ArticleListProps {
  onCreateClick: () => void;
  onViewClick: (article: Article) => void;
  onEditClick: (article: Article) => void;
}

const ArticleList = ({ onCreateClick, onViewClick, onEditClick }: ArticleListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['kb-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          *,
          kb_categories (
            name
          )
        `)
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Article[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kb_articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      toast({ title: 'Article deleted successfully' });
      setDeleteArticle(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting article', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Get all unique tags
  const allTags = Array.from(
    new Set(articles?.flatMap(a => a.tags || []) || [])
  ).sort();

  // Filter articles with debounced search
  const filteredArticles = useMemo(() => {
    return articles?.filter(article => {
      const matchesSearch = debouncedSearch === '' || 
        article.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        article.content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const matchesCategory = categoryFilter === '' || article.category_id === categoryFilter;
      const matchesTag = tagFilter === '' || article.tags?.includes(tagFilter);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [articles, debouncedSearch, categoryFilter, tagFilter]);

  // Pagination
  const totalPages = Math.ceil((filteredArticles?.length || 0) / itemsPerPage);
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredArticles?.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredArticles, currentPage]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTagFilter('');
    setCurrentPage(1);
  };

  const handleTagClick = (tag: string) => {
    setTagFilter(tag);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search articles by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchQuery || categoryFilter || tagFilter) && (
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        )}

        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Article Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {searchQuery || categoryFilter || tagFilter ? (
            <>
              Showing <span className="font-medium text-foreground">{filteredArticles?.length || 0}</span> of{' '}
              <span className="font-medium text-foreground">{articles?.length || 0}</span> articles
              {tagFilter && (
                <Badge variant="secondary" className="ml-2">
                  Tag: {tagFilter}
                  <button
                    onClick={() => setTagFilter('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{articles?.length || 0}</span> total article{articles?.length !== 1 ? 's' : ''}
            </>
          )}
        </div>
        {totalPages > 1 && (
          <div className="text-xs">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Articles Table */}
      {isLoading ? (
        <div className="border rounded-lg">
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      ) : paginatedArticles && paginatedArticles.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => onViewClick(article)}
                      className="text-left hover:underline"
                    >
                      {article.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    {article.kb_categories?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.tags?.slice(0, 2).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {article.tags && article.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(article.updated_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewClick(article)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(article)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteArticle(article)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">
            {searchQuery || categoryFilter || tagFilter
              ? 'No articles match your filters'
              : 'No articles yet'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || categoryFilter || tagFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first knowledge base article to get started'}
          </p>
          {(searchQuery || categoryFilter || tagFilter) ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Article
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && paginatedArticles && paginatedArticles.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteArticle?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArticle && deleteMutation.mutate(deleteArticle.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArticleList;