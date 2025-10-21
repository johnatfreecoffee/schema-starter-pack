import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMediaManager } from '@/components/admin/settings/site-settings/SocialMediaManager';
import { AISettingsGuide } from '@/components/admin/settings/site-settings/AISettingsGuide';
import { BusinessHoursEditor } from '@/components/admin/settings/site-settings/BusinessHoursEditor';

const CompanySettings = () => {
  const { data: company } = useCompanySettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);

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
  const [uploadingType, setUploadingType] = useState<'logo' | 'icon' | null>(null);
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  useEffect(() => {
    if (company) {
      setFormData({
        business_name: company.business_name || '',
        business_slogan: company.business_slogan || '',
        phone: formatPhoneNumber(company.phone || ''),
        email: company.email || '',
        address: company.address || '',
        address_street: company.address_street || '',
        address_unit: company.address_unit || '',
        address_city: company.address_city || '',
        address_state: company.address_state || '',
        address_zip: company.address_zip || '',
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
    handleFieldChange('phone', formatted);
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

    // Trigger autosave when file is selected
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(formData);
    }, 1000);
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
    mutationFn: async (dataToSave: any) => {
      let logoUrl = dataToSave.logo_url;
      let iconUrl = dataToSave.icon_url;

      if (logoFile) {
        setUploading(true);
        setUploadingType('logo');
        logoUrl = await uploadImage(logoFile, 'logo');
      }
      if (iconFile) {
        setUploading(true);
        setUploadingType('icon');
        iconUrl = await uploadImage(iconFile, 'icon');
      }

      // Build full address from parts for backward compatibility
      const fullAddress = [
        dataToSave.address_street,
        dataToSave.address_unit ? `Unit ${dataToSave.address_unit}` : '',
        dataToSave.address_city,
        dataToSave.address_state,
        dataToSave.address_zip
      ].filter(Boolean).join(', ');

      const updateData = {
        ...dataToSave,
        phone: dataToSave.phone.replace(/\D/g, ''),
        address: fullAddress,
        logo_url: logoUrl,
        icon_url: iconUrl,
      };

      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('company_settings')
          .insert(updateData)
          .select('id')
          .single();
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await cacheInvalidation.invalidateCompanySettings();
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setLogoFile(null);
      setIconFile(null);
      setUploading(false);
      setUploadingType(null);
      setIsSaving(false);
    },
    onError: (error) => {
      setUploading(false);
      setUploadingType(null);
      setIsSaving(false);
      toast({
        title: 'Error',
        description: 'Failed to save: ' + error.message,
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

  // Auto-save with debounce
  const autoSave = useCallback((data: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(data);
    }, 1000);
  }, [saveMutation]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    autoSave(newFormData);
  }, [formData, autoSave]);

  const handleSettingsUpdate = async () => {
    // Refresh settings from database after AI updates
    queryClient.invalidateQueries({ queryKey: ['company-settings'] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Company Settings</h1>
          <Button
            onClick={() => setShowAIGuide(true)}
            className="gap-2"
            variant="default"
          >
            <Sparkles className="h-4 w-4" />
            AI Guide
          </Button>
        </div>
        
        <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="business">Business Details</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="documents">Money Doc Settings</TabsTrigger>
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
                    onChange={(e) => handleFieldChange('business_name', e.target.value)}
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
                    onChange={(e) => handleFieldChange('business_slogan', e.target.value)}
                    placeholder="e.g., Your Trusted Roofing Experts"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
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
                    onChange={(e) => handleFieldChange('years_experience', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => handleFieldChange('website_url', e.target.value)}
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
                    onChange={(e) => handleFieldChange('email', e.target.value)}
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
                      onChange={(e) => handleFieldChange('address_street', e.target.value)}
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
                      onChange={(e) => handleFieldChange('address_unit', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_city">City *</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => handleFieldChange('address_city', e.target.value)}
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
                        value={formData.address_state || "placeholder"}
                        onValueChange={(value) => handleFieldChange('address_state', value === "placeholder" ? "" : value)}
                      >
                        <SelectTrigger className={errors.address_state ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder">Select state</SelectItem>
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
                        onChange={(e) => handleFieldChange('address_zip', e.target.value)}
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
                      onChange={(e) => handleFieldChange('service_radius', parseInt(e.target.value) || 0)}
                      placeholder="50"
                      className="flex-1"
                    />
                    <Select
                      value={formData.service_radius_unit}
                      onValueChange={(value) => handleFieldChange('service_radius_unit', value)}
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
                        disabled={uploadingType === 'icon'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 300-600px width. Max 5MB.
                        {uploadingType === 'icon' && ' (Wait for icon upload to complete)'}
                      </p>
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
                        disabled={uploadingType === 'logo'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 512x512px. Max 5MB.
                        {uploadingType === 'logo' && ' (Wait for logo upload to complete)'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Business Hours</Label>
                  <BusinessHoursEditor
                    value={formData.business_hours}
                    onChange={(value) => handleFieldChange('business_hours', value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="license_numbers">License Number(s)</Label>
                  <Textarea
                    id="license_numbers"
                    value={formData.license_numbers}
                    onChange={(e) => handleFieldChange('license_numbers', e.target.value)}
                    rows={3}
                    placeholder="Enter business licenses (one per line)"
                  />
                  <p className="text-sm text-muted-foreground">Add any relevant business licenses or certifications</p>
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
                      onChange={(e) => handleFieldChange('document_header_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.document_header_color}
                      onChange={(e) => handleFieldChange('document_header_color', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_logo_position">Logo Position</Label>
                  <Select
                    value={formData.document_logo_position}
                    onValueChange={(value) => handleFieldChange('document_logo_position', value)}
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
                    onValueChange={(value) => handleFieldChange('document_font', value)}
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
                    onCheckedChange={(checked) => handleFieldChange('show_tagline_on_documents', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="document_footer_text">Footer Text</Label>
                  <Input
                    id="document_footer_text"
                    value={formData.document_footer_text}
                    onChange={(e) => handleFieldChange('document_footer_text', e.target.value)}
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_terms">Terms & Conditions</Label>
                  <Textarea
                    id="document_terms"
                    value={formData.document_terms}
                    onChange={(e) => handleFieldChange('document_terms', e.target.value)}
                    rows={4}
                    placeholder="Enter your standard terms and conditions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_payment_instructions">Payment Instructions</Label>
                  <Textarea
                    id="document_payment_instructions"
                    value={formData.document_payment_instructions}
                    onChange={(e) => handleFieldChange('document_payment_instructions', e.target.value)}
                    rows={3}
                    placeholder="Enter payment instructions..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Auto-save indicator */}
        {(isSaving || uploading) && (
          <div className="flex items-center justify-end pt-6 pb-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}

        <AISettingsGuide
          open={showAIGuide}
          onOpenChange={setShowAIGuide}
          currentSettings={formData}
          onSettingsUpdate={handleSettingsUpdate}
        />
      </div>
  );
};

export default CompanySettings;
