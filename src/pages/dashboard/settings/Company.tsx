import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMediaManager } from '@/components/admin/settings/site-settings/SocialMediaManager';

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
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    description: '',
    years_experience: 0,
    website_url: '',
    license_numbers: '',
    service_radius: 0,
    service_radius_unit: 'miles',
    business_hours: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [iconPreview, setIconPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (company) {
      // Parse existing address if it exists
      let addressStreet = '';
      let addressUnit = '';
      let addressCity = '';
      let addressState = '';
      let addressZip = '';
      
      if (company.address) {
        // Try to parse the combined address: "123 Main St, Unit 100, City, ST, 12345"
        const parts = company.address.split(',').map(p => p.trim());
        
        if (parts.length >= 1) addressStreet = parts[0];
        
        // Check if second part contains "Unit" or "Suite"
        let cityIndex = 1;
        if (parts.length >= 2 && (parts[1].toLowerCase().includes('unit') || parts[1].toLowerCase().includes('suite'))) {
          addressUnit = parts[1].replace(/^(unit|suite)\s*/i, '');
          cityIndex = 2;
        }
        
        if (parts.length > cityIndex) addressCity = parts[cityIndex];
        if (parts.length > cityIndex + 1) addressState = parts[cityIndex + 1];
        if (parts.length > cityIndex + 2) addressZip = parts[cityIndex + 2];
      }
      
      setFormData({
        business_name: company.business_name || '',
        business_slogan: company.business_slogan || '',
        phone: formatPhoneNumber(company.phone || ''),
        email: company.email || '',
        address: company.address || '',
        address_street: addressStreet,
        address_unit: addressUnit,
        address_city: addressCity,
        address_state: addressState,
        address_zip: addressZip,
        description: company.description || '',
        years_experience: company.years_experience || 0,
        website_url: company.website_url || '',
        license_numbers: company.license_numbers || '',
        service_radius: company.service_radius || 0,
        service_radius_unit: company.service_radius_unit || 'miles',
        business_hours: company.business_hours || '',
        facebook_url: company.facebook_url || '',
        instagram_url: company.instagram_url || '',
        twitter_url: company.twitter_url || '',
        linkedin_url: company.linkedin_url || '',
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

      // Build full address from parts
      const fullAddress = [
        formData.address_street,
        formData.address_unit ? `Unit ${formData.address_unit}` : '',
        formData.address_city,
        formData.address_state,
        formData.address_zip
      ].filter(Boolean).join(', ');

      // Exclude the individual address fields as they're not in the database
      const { address_street, address_unit, address_city, address_state, address_zip, ...dbFormData } = formData;

      const updateData = {
        ...dbFormData,
        phone: formData.phone.replace(/\D/g, ''),
        address: fullAddress,
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
    onSuccess: async () => {
      await cacheInvalidation.invalidateCompanySettings();
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional fields
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.address_street.trim()) {
      newErrors.address_street = 'Street address is required';
    }

    if (!formData.address_city.trim()) {
      newErrors.address_city = 'City is required';
    }

    if (!formData.address_state.trim()) {
      newErrors.address_state = 'State is required';
    }

    if (!formData.address_zip.trim()) {
      newErrors.address_zip = 'Zip code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.address_zip)) {
      newErrors.address_zip = 'Invalid zip code format';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Company description is required';
    }

    if (formData.website_url && !validateUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.facebook_url && !validateUrl(formData.facebook_url)) {
      newErrors.facebook_url = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.instagram_url && !validateUrl(formData.instagram_url)) {
      newErrors.instagram_url = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.twitter_url && !validateUrl(formData.twitter_url)) {
      newErrors.twitter_url = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.linkedin_url && !validateUrl(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    if (company) {
      // Parse existing address if it exists
      let addressStreet = '';
      let addressUnit = '';
      let addressCity = '';
      let addressState = '';
      let addressZip = '';
      
      if (company.address) {
        // Try to parse the combined address: "123 Main St, Unit 100, City, ST, 12345"
        const parts = company.address.split(',').map(p => p.trim());
        
        if (parts.length >= 1) addressStreet = parts[0];
        
        // Check if second part contains "Unit" or "Suite"
        let cityIndex = 1;
        if (parts.length >= 2 && (parts[1].toLowerCase().includes('unit') || parts[1].toLowerCase().includes('suite'))) {
          addressUnit = parts[1].replace(/^(unit|suite)\s*/i, '');
          cityIndex = 2;
        }
        
        if (parts.length > cityIndex) addressCity = parts[cityIndex];
        if (parts.length > cityIndex + 1) addressState = parts[cityIndex + 1];
        if (parts.length > cityIndex + 2) addressZip = parts[cityIndex + 2];
      }
      
      setFormData({
        business_name: company.business_name || '',
        business_slogan: company.business_slogan || '',
        phone: formatPhoneNumber(company.phone || ''),
        email: company.email || '',
        address: company.address || '',
        address_street: addressStreet,
        address_unit: addressUnit,
        address_city: addressCity,
        address_state: addressState,
        address_zip: addressZip,
        description: company.description || '',
        years_experience: company.years_experience || 0,
        website_url: company.website_url || '',
        license_numbers: company.license_numbers || '',
        service_radius: company.service_radius || 0,
        service_radius_unit: company.service_radius_unit || 'miles',
        business_hours: company.business_hours || '',
        facebook_url: company.facebook_url || '',
        instagram_url: company.instagram_url || '',
        twitter_url: company.twitter_url || '',
        linkedin_url: company.linkedin_url || '',
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
      setErrors({});
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      saveMutation.mutate();
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before saving.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Company Settings</h1>
        
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="business">Business Details</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Company name, description, and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className={errors.business_name ? 'border-destructive' : ''}
                  />
                  {errors.business_name && (
                    <p className="text-sm text-destructive">{errors.business_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_slogan">Business Slogan</Label>
                  <Input
                    id="business_slogan"
                    value={formData.business_slogan}
                    onChange={(e) => setFormData({ ...formData, business_slogan: e.target.value })}
                    placeholder="e.g., Your Trusted Roofing Experts"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    placeholder="Tell customers about your business..."
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years in Business</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://www.yourcompany.com"
                    className={errors.website_url ? 'border-destructive' : ''}
                  />
                  {errors.website_url && (
                    <p className="text-sm text-destructive">{errors.website_url}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 555-5555"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_street">Street Address *</Label>
                    <Input
                      id="address_street"
                      value={formData.address_street}
                      onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      placeholder="123 Main Street"
                      className={errors.address_street ? 'border-destructive' : ''}
                    />
                    {errors.address_street && (
                      <p className="text-sm text-destructive">{errors.address_street}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_unit">Unit/Suite</Label>
                    <Input
                      id="address_unit"
                      value={formData.address_unit}
                      onChange={(e) => setFormData({ ...formData, address_unit: e.target.value })}
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_city">City *</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                        placeholder="City"
                        className={errors.address_city ? 'border-destructive' : ''}
                      />
                      {errors.address_city && (
                        <p className="text-sm text-destructive">{errors.address_city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_state">State *</Label>
                      <Select
                        value={formData.address_state}
                        onValueChange={(value) => setFormData({ ...formData, address_state: value })}
                      >
                        <SelectTrigger className={errors.address_state ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AL">AL</SelectItem>
                          <SelectItem value="AK">AK</SelectItem>
                          <SelectItem value="AZ">AZ</SelectItem>
                          <SelectItem value="AR">AR</SelectItem>
                          <SelectItem value="CA">CA</SelectItem>
                          <SelectItem value="CO">CO</SelectItem>
                          <SelectItem value="CT">CT</SelectItem>
                          <SelectItem value="DE">DE</SelectItem>
                          <SelectItem value="FL">FL</SelectItem>
                          <SelectItem value="GA">GA</SelectItem>
                          <SelectItem value="HI">HI</SelectItem>
                          <SelectItem value="ID">ID</SelectItem>
                          <SelectItem value="IL">IL</SelectItem>
                          <SelectItem value="IN">IN</SelectItem>
                          <SelectItem value="IA">IA</SelectItem>
                          <SelectItem value="KS">KS</SelectItem>
                          <SelectItem value="KY">KY</SelectItem>
                          <SelectItem value="LA">LA</SelectItem>
                          <SelectItem value="ME">ME</SelectItem>
                          <SelectItem value="MD">MD</SelectItem>
                          <SelectItem value="MA">MA</SelectItem>
                          <SelectItem value="MI">MI</SelectItem>
                          <SelectItem value="MN">MN</SelectItem>
                          <SelectItem value="MS">MS</SelectItem>
                          <SelectItem value="MO">MO</SelectItem>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="NE">NE</SelectItem>
                          <SelectItem value="NV">NV</SelectItem>
                          <SelectItem value="NH">NH</SelectItem>
                          <SelectItem value="NJ">NJ</SelectItem>
                          <SelectItem value="NM">NM</SelectItem>
                          <SelectItem value="NY">NY</SelectItem>
                          <SelectItem value="NC">NC</SelectItem>
                          <SelectItem value="ND">ND</SelectItem>
                          <SelectItem value="OH">OH</SelectItem>
                          <SelectItem value="OK">OK</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                          <SelectItem value="PA">PA</SelectItem>
                          <SelectItem value="RI">RI</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="TN">TN</SelectItem>
                          <SelectItem value="TX">TX</SelectItem>
                          <SelectItem value="UT">UT</SelectItem>
                          <SelectItem value="VT">VT</SelectItem>
                          <SelectItem value="VA">VA</SelectItem>
                          <SelectItem value="WA">WA</SelectItem>
                          <SelectItem value="WV">WV</SelectItem>
                          <SelectItem value="WI">WI</SelectItem>
                          <SelectItem value="WY">WY</SelectItem>
                          <SelectItem value="DC">DC</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.address_state && (
                        <p className="text-sm text-destructive">{errors.address_state}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_zip">Zip Code *</Label>
                      <Input
                        id="address_zip"
                        value={formData.address_zip}
                        onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                        placeholder="12345"
                        className={errors.address_zip ? 'border-destructive' : ''}
                      />
                      {errors.address_zip && (
                        <p className="text-sm text-destructive">{errors.address_zip}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_radius">Service Radius</Label>
                  <div className="flex gap-2">
                    <Input
                      id="service_radius"
                      type="number"
                      min="0"
                      value={formData.service_radius}
                      onChange={(e) => setFormData({ ...formData, service_radius: parseInt(e.target.value) || 0 })}
                      placeholder="50"
                      className="flex-1"
                    />
                    <Select
                      value={formData.service_radius_unit}
                      onValueChange={(value) => setFormData({ ...formData, service_radius_unit: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="miles">Miles</SelectItem>
                        <SelectItem value="kilometers">Kilometers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">How far from your location do you service?</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Details Tab */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Licenses, hours, and branding assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="license_numbers">License Number(s)</Label>
                  <Textarea
                    id="license_numbers"
                    value={formData.license_numbers}
                    onChange={(e) => setFormData({ ...formData, license_numbers: e.target.value })}
                    rows={3}
                    placeholder="Enter business licenses (one per line)"
                  />
                  <p className="text-sm text-muted-foreground">Add any relevant business licenses or certifications</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_hours">Business Hours</Label>
                  <Textarea
                    id="business_hours"
                    value={formData.business_hours}
                    onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                    rows={4}
                    placeholder="Monday-Friday: 8:00 AM - 6:00 PM&#10;Saturday: 9:00 AM - 4:00 PM&#10;Sunday: Closed"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      />
                      <p className="text-xs text-muted-foreground">Recommended: 300-600px width. Max 5MB.</p>
                    </div>
                  </div>

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
                      />
                      <p className="text-xs text-muted-foreground">Recommended: 512x512px. Max 5MB.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Manage your social media profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <SocialMediaManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Template Settings</CardTitle>
                <CardDescription>Customize how your quotes and invoices look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="document_footer_text">Footer Text</Label>
                  <Input
                    id="document_footer_text"
                    value={formData.document_footer_text}
                    onChange={(e) => setFormData({ ...formData, document_footer_text: e.target.value })}
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_terms">Terms & Conditions</Label>
                  <Textarea
                    id="document_terms"
                    value={formData.document_terms}
                    onChange={(e) => setFormData({ ...formData, document_terms: e.target.value })}
                    rows={4}
                    placeholder="Enter your standard terms and conditions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_payment_instructions">Payment Instructions</Label>
                  <Textarea
                    id="document_payment_instructions"
                    value={formData.document_payment_instructions}
                    onChange={(e) => setFormData({ ...formData, document_payment_instructions: e.target.value })}
                    rows={3}
                    placeholder="Enter payment instructions..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons - Outside tabs, always visible */}
        <div className="flex justify-between pt-6 pb-12">
          <Button variant="outline" onClick={handleReset} disabled={uploading}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Company Settings
          </Button>
        </div>
      </div>
    </>
  );
};

export default CompanySettings;
