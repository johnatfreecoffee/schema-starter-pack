import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AutoAssignment() {
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState({ category: 'support', assigned_to: '' });

  const { data: rules } = useQuery({
    queryKey: ['auto-assignment-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_assignment_rules' as any)
        .select('*')
        .order('category');
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: users } = useQuery({
    queryKey: ['crm-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'crm_user']);
      if (error) throw error;
      return data;
    }
  });

  const createRule = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('auto_assignment_rules' as any)
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-assignment-rules'] });
      toast({ title: 'Assignment rule created' });
      setNewRule({ category: 'support', assigned_to: '' });
    }
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('auto_assignment_rules' as any)
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-assignment-rules'] });
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auto_assignment_rules' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-assignment-rules'] });
      toast({ title: 'Assignment rule deleted' });
    }
  });

  const categories = [
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing' },
    { value: 'project', label: 'Project Related' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const usedCategories = rules?.map(r => r.category) || [];
  const availableCategories = categories.filter(c => !usedCategories.includes(c.value));

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Auto-Assignment Rules</h1>
          <p className="text-muted-foreground">
            Automatically assign tickets to team members based on category
          </p>
        </div>

        {/* Add New Rule */}
        {availableCategories.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Rule</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Category</Label>
                <Select
                  value={newRule.category}
                  onValueChange={(value) => setNewRule({ ...newRule, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label>Assign To</Label>
                <Select
                  value={newRule.assigned_to}
                  onValueChange={(value) => setNewRule({ ...newRule, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => createRule.mutate(newRule)}
                disabled={!newRule.assigned_to || createRule.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </Card>
        )}

        {/* Existing Rules */}
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Active Rules</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {rules?.length || 0} assignment rules configured
            </p>
          </div>

          <div className="divide-y">
            {rules && rules.length > 0 ? (
              rules.map((rule) => (
                <div key={rule.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleRule.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{rule.category}</span>
                        {!rule.is_active && (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Auto-assign to: {rule.assigned_to}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this assignment rule?')) {
                        deleteRule.mutate(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No assignment rules configured</p>
                <p className="text-sm mt-1">Add a rule above to get started</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-muted/50">
          <h4 className="font-semibold mb-2">How Auto-Assignment Works</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• When a ticket is created without an assignee, the system checks for matching category rules</li>
            <li>• If a rule exists and is active, the ticket is automatically assigned to the specified team member</li>
            <li>• If no rule matches, tickets remain unassigned for manual assignment</li>
            <li>• Rules can be enabled/disabled without deleting them</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
