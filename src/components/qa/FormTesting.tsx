import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const FormTesting = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: 'John',
    last_name: 'Doe',
    email: 'test@example.com',
    phone: '555-0123',
    service_needed: 'Plumbing',
    project_details: 'Test lead submission'
  });

  const testLeadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('leads').insert([{
        ...formData,
        street_address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        is_test_data: true
      }]);
      
      if (error) throw error;

      // Log test submission
      await supabase.from('qa_test_submissions').insert([{
        test_type: 'lead_form',
        test_data: formData,
        result: 'success'
      }]);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Test lead created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const testContactMutation = useMutation({
    mutationFn: async () => {
      // Get first account for testing
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .limit(1)
        .single();

      if (!accounts) {
        throw new Error('No accounts found. Create an account first.');
      }

      const { error } = await supabase.from('contacts').insert([{
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        account_id: accounts.id,
        is_test_data: true
      }]);
      
      if (error) throw error;

      await supabase.from('qa_test_submissions').insert([{
        test_type: 'contact_form',
        test_data: formData,
        result: 'success'
      }]);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Test contact created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Testing</CardTitle>
        <CardDescription>Test form submissions with pre-filled data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="service">Service Needed</Label>
          <Input
            id="service"
            value={formData.service_needed}
            onChange={(e) => setFormData({ ...formData, service_needed: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="details">Project Details</Label>
          <Textarea
            id="details"
            value={formData.project_details}
            onChange={(e) => setFormData({ ...formData, project_details: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => testLeadMutation.mutate()}
            disabled={testLeadMutation.isPending}
          >
            {testLeadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Lead Form
          </Button>
          <Button 
            variant="outline"
            onClick={() => testContactMutation.mutate()}
            disabled={testContactMutation.isPending}
          >
            {testContactMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Test Contact Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};