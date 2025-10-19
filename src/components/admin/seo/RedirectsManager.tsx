import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const RedirectsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newRedirect, setNewRedirect] = useState({
    from_path: '',
    to_path: '',
    redirect_type: 301,
    is_active: true,
  });

  const { data: redirects } = useQuery({
    queryKey: ['redirects'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('seo_redirects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (redirect: any) => {
      const { error } = await (supabase as any)
        .from('seo_redirects')
        .insert([redirect]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      toast({
        title: 'Redirect created',
        description: 'New redirect has been added',
      });
      setIsAdding(false);
      setNewRedirect({
        from_path: '',
        to_path: '',
        redirect_type: 301,
        is_active: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('seo_redirects')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      toast({
        title: 'Redirect updated',
        description: 'Redirect status has been changed',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('seo_redirects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      toast({
        title: 'Redirect deleted',
        description: 'Redirect has been removed',
      });
    },
  });

  const handleCreate = () => {
    if (!newRedirect.from_path || !newRedirect.to_path) {
      toast({
        title: 'Error',
        description: 'Please fill in both from and to paths',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newRedirect);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>URL Redirects</CardTitle>
              <CardDescription>
                Manage 301 and 302 redirects for your website
              </CardDescription>
            </div>
            <Button onClick={() => setIsAdding(!isAdding)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Redirect
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="from-path">From Path</Label>
                    <Input
                      id="from-path"
                      value={newRedirect.from_path}
                      onChange={(e) =>
                        setNewRedirect({ ...newRedirect, from_path: e.target.value })
                      }
                      placeholder="/old-page"
                    />
                  </div>

                  <div>
                    <Label htmlFor="to-path">To Path</Label>
                    <Input
                      id="to-path"
                      value={newRedirect.to_path}
                      onChange={(e) =>
                        setNewRedirect({ ...newRedirect, to_path: e.target.value })
                      }
                      placeholder="/new-page"
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirect-type">Type</Label>
                    <Select
                      value={String(newRedirect.redirect_type)}
                      onValueChange={(value) =>
                        setNewRedirect({ ...newRedirect, redirect_type: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="redirect-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="301">301 (Permanent)</SelectItem>
                        <SelectItem value="302">302 (Temporary)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {redirects && redirects.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Path</TableHead>
                    <TableHead>To Path</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hits</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirects.map((redirect: any) => (
                    <TableRow key={redirect.id}>
                      <TableCell className="font-mono text-sm">
                        {redirect.from_path}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {redirect.to_path}
                      </TableCell>
                      <TableCell>{redirect.redirect_type}</TableCell>
                      <TableCell>{redirect.hit_count}</TableCell>
                      <TableCell>
                        <Switch
                          checked={redirect.is_active}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate({
                              id: redirect.id,
                              is_active: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(redirect.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No redirects configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
