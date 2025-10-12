import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CannedResponses() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'support'
  });

  const { data: responses, isLoading } = useQuery({
    queryKey: ['canned-responses', searchQuery, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('canned_responses')
        .select('*')
        .order('usage_count', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const createResponse = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('canned_responses')
        .insert({
          ...data,
          created_by: user!.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast({ title: 'Canned response created successfully' });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateResponse = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('canned_responses')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast({ title: 'Canned response updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteResponse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canned_responses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast({ title: 'Canned response deleted successfully' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResponse) {
      updateResponse.mutate({ id: editingResponse.id, ...formData });
    } else {
      createResponse.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'support' });
    setEditingResponse(null);
  };

  const handleEdit = (response: any) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category
    });
    setIsDialogOpen(true);
  };

  const categories = [
    { value: 'support', label: 'Support' },
    { value: 'billing', label: 'Billing' },
    { value: 'project', label: 'Project' },
    { value: 'general', label: 'General' }
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Canned Responses</h1>
            <p className="text-muted-foreground">Manage quick reply templates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingResponse ? 'Edit Canned Response' : 'Create Canned Response'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Type your message template here..."
                    rows={8}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Available variables: {'{'}customer_name{'}'}, {'{'}ticket_number{'}'}, {'{'}company_name{'}'}
                  </p>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createResponse.isPending || updateResponse.isPending}>
                    {editingResponse ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Responses List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Loading...</p>
            </Card>
          ) : responses && responses.length > 0 ? (
            responses.map((response) => (
              <Card key={response.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{response.title}</h3>
                      <Badge variant="outline" className="capitalize">
                        {response.category}
                      </Badge>
                      {response.usage_count > 0 && (
                        <Badge variant="secondary">
                          Used {response.usage_count} times
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {response.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(response)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this canned response?')) {
                          deleteResponse.mutate(response.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No canned responses found</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Response
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
