import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, DollarSign, FolderKanban } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';

const DocumentTemplates = () => {
  const { toast } = useToast();
  const { data: settings, isLoading, refetch } = useCompanySettings();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    show_logo_in_documents: true,
    document_logo_position: 'left',
    document_header_color: '#3b82f6',
    document_theme_color: '#3b82f6',
    document_footer_text: 'Thank you for your business!',
    document_terms: '',
    document_payment_instructions: 'Please make payment within the specified due date.',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        show_logo_in_documents: settings.show_logo_in_documents ?? true,
        document_logo_position: settings.document_logo_position || 'left',
        document_header_color: settings.document_header_color || '#3b82f6',
        document_theme_color: settings.document_theme_color || '#3b82f6',
        document_footer_text: settings.document_footer_text || 'Thank you for your business!',
        document_terms: settings.document_terms || '',
        document_payment_instructions: settings.document_payment_instructions || 'Please make payment within the specified due date.',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_settings')
        .update(formData)
        .eq('id', settings?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document template settings saved successfully',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Document Templates</h1>
          <p className="text-muted-foreground">Customize how your PDF documents look</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="quote">
              <FileText className="h-4 w-4 mr-2" />
              Quote Template
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <DollarSign className="h-4 w-4 mr-2" />
              Invoice Template
            </TabsTrigger>
            <TabsTrigger value="project">
              <FolderKanban className="h-4 w-4 mr-2" />
              Project Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>Configure how your company logo appears in documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Logo in Documents</Label>
                    <p className="text-sm text-muted-foreground">Display your company logo in PDF headers</p>
                  </div>
                  <Switch
                    checked={formData.show_logo_in_documents}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_logo_in_documents: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <RadioGroup
                    value={formData.document_logo_position}
                    onValueChange={(value) => setFormData({ ...formData, document_logo_position: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="left" id="left" />
                      <Label htmlFor="left">Left</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="center" id="center" />
                      <Label htmlFor="center">Center</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="right" id="right" />
                      <Label htmlFor="right">Right</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Colors</CardTitle>
                <CardDescription>Customize document colors to match your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="header-color">Header Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="header-color"
                      type="color"
                      value={formData.document_header_color}
                      onChange={(e) => setFormData({ ...formData, document_header_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.document_header_color}
                      onChange={(e) => setFormData({ ...formData, document_header_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme-color">Theme Accent Color</Label>
                  <p className="text-sm text-muted-foreground">Used for table headers, badges, and highlights</p>
                  <div className="flex gap-2">
                    <Input
                      id="theme-color"
                      type="color"
                      value={formData.document_theme_color}
                      onChange={(e) => setFormData({ ...formData, document_theme_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.document_theme_color}
                      onChange={(e) => setFormData({ ...formData, document_theme_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer Text</CardTitle>
                <CardDescription>Text displayed at the bottom of all documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.document_footer_text}
                  onChange={(e) => setFormData({ ...formData, document_footer_text: e.target.value })}
                  placeholder="Thank you for your business!"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quote" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Template</CardTitle>
                <CardDescription>Customize quote-specific settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.document_terms}
                    onChange={(e) => setFormData({ ...formData, document_terms: e.target.value })}
                    placeholder="Enter terms and conditions that will appear on quotes..."
                    rows={6}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Quote Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    Your quote will include: Company logo (if enabled), quote number, customer info, itemized services, totals, and terms.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Template</CardTitle>
                <CardDescription>Customize invoice-specific settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-instructions">Payment Instructions</Label>
                  <Textarea
                    id="payment-instructions"
                    value={formData.document_payment_instructions}
                    onChange={(e) => setFormData({ ...formData, document_payment_instructions: e.target.value })}
                    placeholder="Enter payment instructions..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-terms">Terms & Conditions</Label>
                  <Textarea
                    id="invoice-terms"
                    value={formData.document_terms}
                    onChange={(e) => setFormData({ ...formData, document_terms: e.target.value })}
                    placeholder="Enter terms and conditions that will appear on invoices..."
                    rows={6}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Invoice Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    Your invoice will include: Company logo, invoice number, due date, payment status, itemized services, totals, payment instructions, and terms.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="project" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Report Template</CardTitle>
                <CardDescription>Customize project report settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Project Report Preview</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your project report will include:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Project name, status, and timeline</li>
                    <li>Customer information</li>
                    <li>Task list with completion status</li>
                    <li>Project phases and milestones</li>
                    <li>Associated quotes and invoices</li>
                    <li>Recent notes and attachments</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => refetch()}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DocumentTemplates;
