import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Archive, ArchiveRestore, Sparkles, FileUp } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const { data: pages, isLoading } = useQuery({
    queryKey: ['static-pages', activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('archived', activeTab === 'archived')
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

  const archivePage = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('static_pages')
        .update({ archived })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      toast({ 
        title: variables.archived ? 'Page archived successfully' : 'Page restored successfully' 
      });
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

  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    const action = currentlyArchived ? 'restore' : 'archive';
    if (confirm(`Are you sure you want to ${action} this page?`)) {
      archivePage.mutate({ id, archived: !currentlyArchived });
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'archived')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="active">Active Pages</TabsTrigger>
                <TabsTrigger value="archived">Archived Pages</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <p>Loading...</p>
                ) : pages?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No {activeTab} pages found
                  </p>
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleArchive(page.id, page.archived)}
                              >
                                {page.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
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
            initialHtml={selectedPage.content_html_draft || selectedPage.content_html}
            onClose={() => setShowAIEditor(false)}
            onSave={async () => {
              queryClient.invalidateQueries({ queryKey: ['static-pages'] });
            }}
        />
      )}
    </div>
  );
};

export default StaticPages;
