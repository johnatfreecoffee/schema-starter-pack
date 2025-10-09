import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const CompanySettings = () => {
  const { data: company } = useCompanySettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    business_name: '',
    business_slogan: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    years_experience: 0,
    logo_url: '',
    icon_url: '',
    document_header_color: '#3b82f6',
    document_logo_position: 'left',
    document_font: 'helvetica',
    document_footer_text: 'Thank you for your business!',
    document_terms: '',
    document_payment_instructions: 'Please make payment within the specified due date.',
    show_tagline_on_documents: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [iconPreview, setIconPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        business_name: company.business_name || '',
        business_slogan: company.business_slogan || '',
        phone: formatPhoneNumber(company.phone || ''),
        email: company.email || '',
        address: company.address || '',
        description: company.description || '',
        years_experience: company.years_experience || 0,
        logo_url: company.logo_url || '',
        icon_url: company.icon_url || '',
        document_header_color: company.document_header_color || '#3b82f6',
        document_logo_position: company.document_logo_position || 'left',
        document_font: company.document_font || 'helvetica',
        document_footer_text: company.document_footer_text || 'Thank you for your business!',
        document_terms: company.document_terms || '',
        document_payment_instructions: company.document_payment_instructions || 'Please make payment within the specified due date.',
        show_tagline_on_documents: company.show_tagline_on_documents ?? true,
      });
      setLogoPreview(company.logo_url || '');
      setIconPreview(company.icon_url || '');
    }
  }, [company]);

  const formatPhoneNumber = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('company-assets')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      let logoUrl = formData.logo_url;
      let iconUrl = formData.icon_url;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logo');
      }
      if (iconFile) {
        iconUrl = await uploadImage(iconFile, 'icon');
      }

      const updateData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        logo_url: logoUrl,
        icon_url: iconUrl,
      };

      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert(updateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setLogoFile(null);
      setIconFile(null);
      setUploading(false);
      toast({
        title: 'Success',
        description: 'Company settings saved successfully',
      });
    },
    onError: (error) => {
      setUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to save settings: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReset = () => {
    if (company) {
      setFormData({
        business_name: company.business_name || '',
        business_slogan: company.business_slogan || '',
        phone: formatPhoneNumber(company.phone || ''),
        email: company.email || '',
        address: company.address || '',
        description: company.description || '',
        years_experience: company.years_experience || 0,
        logo_url: company.logo_url || '',
        icon_url: company.icon_url || '',
        document_header_color: company.document_header_color || '#3b82f6',
        document_logo_position: company.document_logo_position || 'left',
        document_font: company.document_font || 'helvetica',
        document_footer_text: company.document_footer_text || 'Thank you for your business!',
        document_terms: company.document_terms || '',
        document_payment_instructions: company.document_payment_instructions || 'Please make payment within the specified due date.',
        show_tagline_on_documents: company.show_tagline_on_documents ?? true,
      });
      setLogoPreview(company.logo_url || '');
      setIconPreview(company.icon_url || '');
      setLogoFile(null);
      setIconFile(null);
    }
  };

  const isFormValid = () => {
    return (
      formData.business_name.length > 0 &&
      formData.email.includes('@') &&
      formData.phone.replace(/\D/g, '').length === 10 &&
      formData.address.length > 0 &&
      formData.description.length > 0
    );
  };

  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Company Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Manage your company details and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                maxLength={100}
                required
              />
            </div>

            {/* Business Slogan */}
            <div className="space-y-2">
              <Label htmlFor="business_slogan">Business Slogan</Label>
              <Input
                id="business_slogan"
                value={formData.business_slogan}
                onChange={(e) => setFormData({ ...formData, business_slogan: e.target.value })}
                maxLength={50}
                placeholder="e.g., Your Trusted Roofing Experts"
              />
              <p className="text-xs text-muted-foreground">
                Short tagline (3-5 words) displayed under your logo
              </p>
            </div>

            {/* Logo and Icon Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Main Logo</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {logoPreview && (
                    <div className="flex justify-center">
                      <img src={logoPreview} alt="Logo preview" className="max-h-32 object-contain" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 300-600px width. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Icon Upload */}
              <div className="space-y-2">
                <Label>Square Icon / Favicon</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {iconPreview && (
                    <div className="flex justify-center">
                      <img src={iconPreview} alt="Icon preview" className="h-32 w-32 object-contain" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => handleFileChange(e, 'icon')}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 512x512px. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience *</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                max="150"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            {/* Business Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                placeholder="123 Main St, Suite 100, City, ST 12345"
                required
              />
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Company Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                maxLength={1000}
                placeholder="Tell customers about your business..."
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length} / 1000
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleReset} disabled={uploading}>
                Reset Changes
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!isFormValid() || uploading}
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Company Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Template Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Document Template Settings</CardTitle>
            <CardDescription>Customize how your quotes and invoices look</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Color */}
            <div className="space-y-2">
              <Label htmlFor="document_header_color">Header Color</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="document_header_color"
                  type="color"
                  value={formData.document_header_color}
                  onChange={(e) => setFormData({ ...formData, document_header_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.document_header_color}
                  onChange={(e) => setFormData({ ...formData, document_header_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Color used for document header background
              </p>
            </div>

            {/* Logo Position */}
            <div className="space-y-2">
              <Label htmlFor="document_logo_position">Logo Position</Label>
              <Select
                value={formData.document_logo_position}
                onValueChange={(value) => setFormData({ ...formData, document_logo_position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Selection */}
            <div className="space-y-2">
              <Label htmlFor="document_font">Font</Label>
              <Select
                value={formData.document_font}
                onValueChange={(value) => setFormData({ ...formData, document_font: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helvetica">Helvetica</SelectItem>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Tagline */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Tagline on Documents</Label>
                <p className="text-sm text-muted-foreground">
                  Display your business slogan on quotes and invoices
                </p>
              </div>
              <Switch
                checked={formData.show_tagline_on_documents}
                onCheckedChange={(checked) => setFormData({ ...formData, show_tagline_on_documents: checked })}
              />
            </div>

            <Separator />

            {/* Footer Text */}
            <div className="space-y-2">
              <Label htmlFor="document_footer_text">Footer Text</Label>
              <Input
                id="document_footer_text"
                value={formData.document_footer_text}
                onChange={(e) => setFormData({ ...formData, document_footer_text: e.target.value })}
                placeholder="Thank you for your business!"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Text displayed at the bottom of documents
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label htmlFor="document_terms">Terms & Conditions</Label>
              <Textarea
                id="document_terms"
                value={formData.document_terms}
                onChange={(e) => setFormData({ ...formData, document_terms: e.target.value })}
                rows={4}
                placeholder="Enter your standard terms and conditions..."
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.document_terms.length} / 1000
              </p>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-2">
              <Label htmlFor="document_payment_instructions">Payment Instructions</Label>
              <Textarea
                id="document_payment_instructions"
                value={formData.document_payment_instructions}
                onChange={(e) => setFormData({ ...formData, document_payment_instructions: e.target.value })}
                rows={3}
                placeholder="Enter payment instructions..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.document_payment_instructions.length} / 500
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CompanySettings;
