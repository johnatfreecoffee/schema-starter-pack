import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Building, CheckSquare, Calendar, Briefcase, FileText, Trash2 } from 'lucide-react';

export const TestDataGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateLeadsMutation = useMutation({
    mutationFn: async () => {
      const testLeads = Array.from({ length: 10 }, (_, i) => ({
        first_name: ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'][i],
        last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][i],
        email: `test${i + 1}@example.com`,
        phone: `555-010${i}`,
        service_needed: ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Flooring'][i % 5],
        project_details: `Test project details ${i + 1}`,
        street_address: `${100 + i} Test Street`,
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        is_test_data: true
      }));

      const { error } = await supabase.from('leads').insert(testLeads);
      if (error) throw error;
      return testLeads.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast({ title: 'Success', description: `Created ${count} test leads` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const generateAccountsMutation = useMutation({
    mutationFn: async () => {
      const testAccounts = Array.from({ length: 5 }, (_, i) => ({
        account_name: `Test Company ${i + 1}`,
        industry: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'][i],
        website: `https://testcompany${i + 1}.com`,
        notes: `Test account ${i + 1}`,
        is_test_data: true
      }));

      const { error } = await supabase.from('accounts').insert(testAccounts);
      if (error) throw error;
      return testAccounts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast({ title: 'Success', description: `Created ${count} test accounts` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const testTasks = Array.from({ length: 10 }, (_, i) => ({
        title: `Test Task ${i + 1}`,
        description: `This is test task number ${i + 1}`,
        status: ['pending', 'in_progress', 'completed'][i % 3] as 'pending' | 'in_progress' | 'completed',
        priority: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
        due_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: user.id,
        created_by: user.id,
        is_test_data: true
      }));

      const { error } = await supabase.from('tasks').insert(testTasks);
      if (error) throw error;
      return testTasks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast({ title: 'Success', description: `Created ${count} test tasks` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const clearTestDataMutation = useMutation({
    mutationFn: async () => {
      const tables = ['leads', 'accounts', 'contacts', 'tasks', 'calendar_events', 'projects'];
      let totalDeleted = 0;

      for (const table of tables) {
        const { error, count } = await supabase
          .from(table as any)
          .delete()
          .eq('is_test_data', true);
        
        if (!error && count) totalDeleted += count;
      }

      return totalDeleted;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      toast({ title: 'Success', description: `Deleted ${count} test records` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Data Generator</CardTitle>
        <CardDescription>Create realistic test data for development</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => generateLeadsMutation.mutate()}
            disabled={generateLeadsMutation.isPending}
            variant="outline"
          >
            {generateLeadsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Generate 10 Leads
          </Button>

          <Button
            onClick={() => generateAccountsMutation.mutate()}
            disabled={generateAccountsMutation.isPending}
            variant="outline"
          >
            {generateAccountsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building className="h-4 w-4 mr-2" />
            )}
            Generate 5 Accounts
          </Button>

          <Button
            onClick={() => generateTasksMutation.mutate()}
            disabled={generateTasksMutation.isPending}
            variant="outline"
          >
            {generateTasksMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4 mr-2" />
            )}
            Generate 10 Tasks
          </Button>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={() => clearTestDataMutation.mutate()}
            disabled={clearTestDataMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {clearTestDataMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All Test Data
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This will only delete records marked as test data
          </p>
        </div>
      </CardContent>
    </Card>
  );
};