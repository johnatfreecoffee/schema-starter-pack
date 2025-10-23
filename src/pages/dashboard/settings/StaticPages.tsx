import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Trash2, Sparkles, FileUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StaticPageForm from '@/components/admin/settings/static-pages/StaticPageForm';
import HTMLImporter from '@/components/admin/settings/static-pages/HTMLImporter';
import UnifiedPageEditor from '@/components/admin/ai-editor/UnifiedPageEditor';

const StaticPages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['static-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from('static_pages')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      toast({ title: 'Status updated successfully' });
    }
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('static_pages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      toast({ title: 'Page deleted successfully' });
    }
  });

  const handleEdit = (page: any) => {
    setSelectedPage(page);
    setShowForm(true);
  };

  const handleAIEdit = (page: any) => {
    setSelectedPage(page);
    setShowAIEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Static Pages</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImporter(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Import HTML
            </Button>
            <Button onClick={() => { setSelectedPage(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Page
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Management</CardTitle>
            <CardDescription>Create and manage static website pages</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>URL Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Show in Menu</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages?.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.title}
                        {page.is_homepage && <Badge className="ml-2" variant="secondary">Homepage</Badge>}
                      </TableCell>
                      <TableCell>
                        <a href={page.url_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {page.url_path}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={page.status}
                          onCheckedChange={(checked) => toggleStatus.mutate({ id: page.id, status: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.show_in_menu ? 'default' : 'outline'}>
                          {page.show_in_menu ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.display_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => window.open(page.url_path, '_blank')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleAIEdit(page)}>
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
            </DialogHeader>
            <StaticPageForm page={selectedPage} onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showImporter} onOpenChange={setShowImporter}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import HTML</DialogTitle>
            </DialogHeader>
            <HTMLImporter onClose={() => setShowImporter(false)} />
          </DialogContent>
        </Dialog>

        {showAIEditor && selectedPage && (
          <UnifiedPageEditor
            open={showAIEditor}
            pageId={selectedPage.id}
            pageType="static"
            pageTitle={selectedPage.title}
            initialHtml={selectedPage.content_html}
            onClose={() => setShowAIEditor(false)}
            onSave={async (newContent) => {
              const { error } = await supabase
                .from('static_pages')
                .update({ content_html: newContent })
                .eq('id', selectedPage.id);
              if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ['static-pages'] });
            }}
        />
      )}
    </div>
  );
};

export default StaticPages;
