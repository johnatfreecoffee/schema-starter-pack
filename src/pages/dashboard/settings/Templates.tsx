import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Copy, Trash2, Plus, Sparkles } from 'lucide-react';
import TemplateForm from '@/components/admin/settings/templates/TemplateForm';
import TemplatePreview from '@/components/admin/settings/templates/TemplatePreview';
import AIPageEditor from '@/components/admin/ai-editor/AIPageEditor';

const Templates = () => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          *,
          services:services(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from('templates')
        .insert({
          name: `${template.name} (Copy)`,
          template_type: template.template_type,
          template_html: template.template_html,
          description: template.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Success',
        description: 'Template duplicated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAISave = async (content: string) => {
    if (!selectedTemplate) return;
    
    const { error } = await supabase
      .from('templates')
      .update({ template_html: content, updated_at: new Date().toISOString() })
      .eq('id', selectedTemplate.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    await cacheInvalidation.invalidateTemplate(selectedTemplate.id);
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    setShowAIEditor(false);
    toast({
      title: 'Success',
      description: 'Template updated successfully with AI',
    });
  };

  const filteredTemplates = templates?.filter((template) => {
    const matchesType = typeFilter === 'all' || template.template_type === typeFilter;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    return type === 'service' ? (
      <Badge variant="default">Service</Badge>
    ) : (
      <Badge variant="secondary">Static</Badge>
    );
  };

  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Templates</h1>
          <Button onClick={() => { setSelectedTemplate(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create New Template
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="static">Static</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div>Loading templates...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{getTypeBadge(template.template_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.services?.[0]?.count || 0} services
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedTemplate(template); setShowPreview(true); }}
                          title="Preview template"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedTemplate(template); setShowAIEditor(true); }}
                          title="Edit with AI"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedTemplate(template); setShowForm(true); }}
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateMutation.mutate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(template.id)}
                          disabled={(template.services?.[0]?.count || 0) > 0}
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
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-7xl max-h-[90vh]">
            <TemplateForm
              template={selectedTemplate}
              onSuccess={() => {
                setShowForm(false);
                setSelectedTemplate(null);
                queryClient.invalidateQueries({ queryKey: ['templates'] });
              }}
              onCancel={() => {
                setShowForm(false);
                setSelectedTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-7xl max-h-[90vh]">
            {selectedTemplate && (
              <TemplatePreview
                templateHtml={selectedTemplate.template_html}
                onClose={() => setShowPreview(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {showAIEditor && selectedTemplate && (
          <AIPageEditor
            open={showAIEditor}
            onClose={() => {
              setShowAIEditor(false);
              setSelectedTemplate(null);
            }}
            pageId={selectedTemplate.id}
            pageType="template"
            initialContent={selectedTemplate.template_html}
            pageTitle={selectedTemplate.name}
            onSave={handleAISave}
          />
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Templates;
