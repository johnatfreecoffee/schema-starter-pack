import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, X, Plus, GripVertical } from 'lucide-react';
import { UniversalLeadForm } from '@/components/lead-form/UniversalLeadForm';
import { LeadFormModal } from '@/components/lead-form/LeadFormModal';

export default function FormFields() {
  const queryClient = useQueryClient();
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [formHeading, setFormHeading] = useState('');
  const [formSubheading, setFormSubheading] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModalPreview, setShowModalPreview] = useState(false);

  const { data: formSettings, isLoading } = useQuery({
    queryKey: ['form-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_settings')
        .select('*')
        .eq('form_type', 'lead_form')
        .single();

      if (error) throw error;
      
      // Initialize state with fetched data
      setServiceOptions(data.service_options || []);
      setFormHeading(data.form_heading || '');
      setFormSubheading(data.form_subheading || '');
      setSubmitButtonText(data.submit_button_text || '');
      setSuccessMessage(data.success_message || '');
      
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('form_settings')
        .update({
          service_options: serviceOptions,
          form_heading: formHeading,
          form_subheading: formSubheading,
          submit_button_text: submitButtonText,
          success_message: successMessage,
          updated_by: user.id,
        })
        .eq('form_type', 'lead_form');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-settings'] });
      toast.success('Form settings saved successfully');
    },
    onError: (error) => {
      console.error('Error updating form settings:', error);
      toast.error('Failed to save form settings');
    },
  });

  const handleAddOption = () => {
    if (newOption.trim() && !serviceOptions.includes(newOption.trim())) {
      setServiceOptions([...serviceOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setServiceOptions(serviceOptions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Form Fields Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure the universal lead capture form that appears across your site
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Options</CardTitle>
              <CardDescription>
                Manage the service options shown in the dropdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {serviceOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{option}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new service option"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                />
                <Button onClick={handleAddOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Text</CardTitle>
              <CardDescription>
                Customize the text shown in the lead form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-heading">Form Heading</Label>
                <Input
                  id="form-heading"
                  value={formHeading}
                  onChange={(e) => setFormHeading(e.target.value)}
                  placeholder="Get Your Free Quote"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-subheading">Form Subheading</Label>
                <Textarea
                  id="form-subheading"
                  value={formSubheading}
                  onChange={(e) => setFormSubheading(e.target.value)}
                  placeholder="Fill out the form below..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submit-button">Submit Button Text</Label>
                <Input
                  id="submit-button"
                  value={submitButtonText}
                  onChange={(e) => setSubmitButtonText(e.target.value)}
                  placeholder="Submit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success-message">Success Message</Label>
                <Textarea
                  id="success-message"
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  placeholder="Thank you! We received your request..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={updateSettingsMutation.isPending}
            className="w-full"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your form will look to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="embed">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="embed">Embed Preview</TabsTrigger>
                  <TabsTrigger value="modal">Modal Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="embed" className="mt-4">
                  <div className="border rounded-lg p-4 bg-background">
                    <UniversalLeadForm 
                      mode="embed"
                      showHeader={true}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="modal" className="mt-4">
                  <Button 
                    onClick={() => setShowModalPreview(true)}
                    className="w-full"
                  >
                    Open Modal Preview
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormModal
        isOpen={showModalPreview}
        headerText="Modal Preview"
        onClose={() => setShowModalPreview(false)}
      />
    </div>
  );
}
