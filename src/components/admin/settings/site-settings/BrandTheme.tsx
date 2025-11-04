import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import ColorPicker from './ColorPicker';

const BrandTheme = () => {
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [successColor, setSuccessColor] = useState('#10b981');
  const [warningColor, setWarningColor] = useState('#f59e0b');
  const [infoColor, setInfoColor] = useState('#3b82f6');
  const [dangerColor, setDangerColor] = useState('#ef4444');
  const [bgPrimaryColor, setBgPrimaryColor] = useState('#ffffff');
  const [bgSecondaryColor, setBgSecondaryColor] = useState('#f8f9fa');
  const [bgTertiaryColor, setBgTertiaryColor] = useState('#e9ecef');
  const [textPrimaryColor, setTextPrimaryColor] = useState('#212529');
  const [textSecondaryColor, setTextSecondaryColor] = useState('#6c757d');
  const [textMutedColor, setTextMutedColor] = useState('#adb5bd');
  const [borderColor, setBorderColor] = useState('#dee2e6');
  const [cardBgColor, setCardBgColor] = useState('#ffffff');
  const [featureColor, setFeatureColor] = useState('#0d6efd');
  const [ctaColor, setCtaColor] = useState('#198754');
  const [buttonRadius, setButtonRadius] = useState(6);
  const [cardRadius, setCardRadius] = useState(8);
  const [iconStrokeWidth, setIconStrokeWidth] = useState(2);
  const [iconBackgroundStyle, setIconBackgroundStyle] = useState<'none' | 'circle' | 'rounded-square'>('none');
  const [iconBackgroundPadding, setIconBackgroundPadding] = useState(8);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('site_settings')
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
      setAccentColor(settings.accent_color);
      setSuccessColor(settings.success_color || '#10b981');
      setWarningColor(settings.warning_color || '#f59e0b');
      setInfoColor(settings.info_color || '#3b82f6');
      setDangerColor(settings.danger_color || '#ef4444');
      setBgPrimaryColor(settings.bg_primary_color || '#ffffff');
      setBgSecondaryColor(settings.bg_secondary_color || '#f8f9fa');
      setBgTertiaryColor(settings.bg_tertiary_color || '#e9ecef');
      setTextPrimaryColor(settings.text_primary_color || '#212529');
      setTextSecondaryColor(settings.text_secondary_color || '#6c757d');
      setTextMutedColor(settings.text_muted_color || '#adb5bd');
      setBorderColor(settings.border_color || '#dee2e6');
      setCardBgColor(settings.card_bg_color || '#ffffff');
      setFeatureColor(settings.feature_color || '#0d6efd');
      setCtaColor(settings.cta_color || '#198754');
      setButtonRadius(settings.button_border_radius);
      setCardRadius(settings.card_border_radius);
      setIconStrokeWidth(settings.icon_stroke_width || 2);
      setIconBackgroundStyle((settings.icon_background_style as 'none' | 'circle' | 'rounded-square') || 'none');
      setIconBackgroundPadding(settings.icon_background_padding || 8);
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      document.documentElement.style.setProperty('--accent-color', settings.accent_color);
      document.documentElement.style.setProperty('--success-color', settings.success_color || '#10b981');
      document.documentElement.style.setProperty('--warning-color', settings.warning_color || '#f59e0b');
      document.documentElement.style.setProperty('--info-color', settings.info_color || '#3b82f6');
      document.documentElement.style.setProperty('--danger-color', settings.danger_color || '#ef4444');
      document.documentElement.style.setProperty('--button-radius', `${settings.button_border_radius}px`);
      document.documentElement.style.setProperty('--card-radius', `${settings.card_border_radius}px`);
      document.documentElement.style.setProperty('--icon-stroke-width', `${settings.icon_stroke_width || 2}`);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('site_settings')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await cacheInvalidation.invalidateSiteSettings();
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--primary-color', data.primary_color);
      document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
      document.documentElement.style.setProperty('--accent-color', data.accent_color);
      document.documentElement.style.setProperty('--success-color', data.success_color || '#10b981');
      document.documentElement.style.setProperty('--warning-color', data.warning_color || '#f59e0b');
      document.documentElement.style.setProperty('--info-color', data.info_color || '#3b82f6');
      document.documentElement.style.setProperty('--danger-color', data.danger_color || '#ef4444');
      document.documentElement.style.setProperty('--button-radius', `${data.button_border_radius}px`);
      document.documentElement.style.setProperty('--card-radius', `${data.card_border_radius}px`);
      
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to save brand theme');
      setIsSaving(false);
    },
  });

  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        success_color: successColor,
        warning_color: warningColor,
        info_color: infoColor,
        danger_color: dangerColor,
        bg_primary_color: bgPrimaryColor,
        bg_secondary_color: bgSecondaryColor,
        bg_tertiary_color: bgTertiaryColor,
        text_primary_color: textPrimaryColor,
        text_secondary_color: textSecondaryColor,
        text_muted_color: textMutedColor,
        border_color: borderColor,
        card_bg_color: cardBgColor,
        feature_color: featureColor,
        cta_color: ctaColor,
        button_border_radius: buttonRadius,
        card_border_radius: cardRadius,
        icon_stroke_width: iconStrokeWidth,
        icon_background_style: iconBackgroundStyle,
        icon_background_padding: iconBackgroundPadding,
      });
    }, 1000);
  }, [primaryColor, secondaryColor, accentColor, successColor, warningColor, infoColor, dangerColor, bgPrimaryColor, bgSecondaryColor, bgTertiaryColor, textPrimaryColor, textSecondaryColor, textMutedColor, borderColor, cardBgColor, featureColor, ctaColor, buttonRadius, cardRadius, iconStrokeWidth, iconBackgroundStyle, iconBackgroundPadding, updateMutation]);

  useEffect(() => {
    if (settings && settings.id) {
      autoSave();
    }
  }, [primaryColor, secondaryColor, accentColor, successColor, warningColor, infoColor, dangerColor, bgPrimaryColor, bgSecondaryColor, bgTertiaryColor, textPrimaryColor, textSecondaryColor, textMutedColor, borderColor, cardBgColor, featureColor, ctaColor, buttonRadius, cardRadius, iconStrokeWidth, iconBackgroundStyle, iconBackgroundPadding]);

  const handleGeneratePalette = async (type: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-color-palette', {
        body: { 
          type,
          companyContext: {
            businessName: companySettings?.business_name || '',
            slogan: companySettings?.business_slogan || '',
            description: companySettings?.description || '',
          }
        }
      });

      if (error) throw error;

      if (data.palette) {
        setPrimaryColor(data.palette.primary);
        setSecondaryColor(data.palette.secondary);
        setAccentColor(data.palette.accent);
        setSuccessColor(data.palette.success);
        setWarningColor(data.palette.warning);
        setInfoColor(data.palette.info);
        setDangerColor(data.palette.danger);
        
        // Set website palette colors if provided
        if (data.palette.bgPrimary) setBgPrimaryColor(data.palette.bgPrimary);
        if (data.palette.bgSecondary) setBgSecondaryColor(data.palette.bgSecondary);
        if (data.palette.bgTertiary) setBgTertiaryColor(data.palette.bgTertiary);
        if (data.palette.textPrimary) setTextPrimaryColor(data.palette.textPrimary);
        if (data.palette.textSecondary) setTextSecondaryColor(data.palette.textSecondary);
        if (data.palette.textMuted) setTextMutedColor(data.palette.textMuted);
        if (data.palette.border) setBorderColor(data.palette.border);
        if (data.palette.cardBg) setCardBgColor(data.palette.cardBg);
        if (data.palette.feature) setFeatureColor(data.palette.feature);
        if (data.palette.cta) setCtaColor(data.palette.cta);
        
        toast.success('Color palette generated!');
      }
    } catch (error: any) {
      console.error('Error generating palette:', error);
      toast.error(error.message || 'Failed to generate color palette');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {isSaving && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}

      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">AI Palette Generator</h3>
              <p className="text-sm text-muted-foreground">Generate a complete color system based on your company</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('professional')}
                disabled={isGenerating}
              >
                Professional
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('creative')}
                disabled={isGenerating}
              >
                Creative
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('minimal')}
                disabled={isGenerating}
              >
                Minimal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('modern')}
                disabled={isGenerating}
              >
                Modern
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('vibrant')}
                disabled={isGenerating}
              >
                Vibrant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('elegant')}
                disabled={isGenerating}
              >
                Elegant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('warm')}
                disabled={isGenerating}
              >
                Warm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('cool')}
                disabled={isGenerating}
              >
                Cool
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePalette('random')}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Randomize'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Brand Colors</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Main brand color</p>
                <ColorPicker
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  label="Primary Color"
                />
              </div>

              <div>
                <Label>Secondary Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Supporting color</p>
                <ColorPicker
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  label="Secondary Color"
                />
              </div>

              <div>
                <Label>Accent Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Highlights</p>
                <ColorPicker
                  value={accentColor}
                  onChange={setAccentColor}
                  label="Accent Color"
                />
              </div>

              <div>
                <Label>Success Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Positive states</p>
                <ColorPicker
                  value={successColor}
                  onChange={setSuccessColor}
                  label="Success Color"
                />
              </div>

              <div>
                <Label>Warning Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Caution states</p>
                <ColorPicker
                  value={warningColor}
                  onChange={setWarningColor}
                  label="Warning Color"
                />
              </div>

              <div>
                <Label>Info Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Informational</p>
                <ColorPicker
                  value={infoColor}
                  onChange={setInfoColor}
                  label="Info Color"
                />
              </div>

              <div>
                <Label>Danger Color</Label>
                <p className="text-sm text-muted-foreground mb-2">Error states</p>
              <ColorPicker
                value={dangerColor}
                onChange={setDangerColor}
                label="Danger Color"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Website Palette</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">Background Primary</label>
                <ColorPicker
                  value={bgPrimaryColor}
                  onChange={setBgPrimaryColor}
                  label="Background Primary Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Background Secondary</label>
                <ColorPicker
                  value={bgSecondaryColor}
                  onChange={setBgSecondaryColor}
                  label="Background Secondary Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Background Tertiary</label>
                <ColorPicker
                  value={bgTertiaryColor}
                  onChange={setBgTertiaryColor}
                  label="Background Tertiary Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Text Primary</label>
                <ColorPicker
                  value={textPrimaryColor}
                  onChange={setTextPrimaryColor}
                  label="Text Primary Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Text Secondary</label>
                <ColorPicker
                  value={textSecondaryColor}
                  onChange={setTextSecondaryColor}
                  label="Text Secondary Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Text Muted</label>
                <ColorPicker
                  value={textMutedColor}
                  onChange={setTextMutedColor}
                  label="Text Muted Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Border Color</label>
                <ColorPicker
                  value={borderColor}
                  onChange={setBorderColor}
                  label="Border Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Card Background</label>
                <ColorPicker
                  value={cardBgColor}
                  onChange={setCardBgColor}
                  label="Card Background Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Feature Color</label>
                <ColorPicker
                  value={featureColor}
                  onChange={setFeatureColor}
                  label="Feature Color"
                />
              </div>
              <div>
                <label className="text-sm font-medium">CTA Color</label>
                <ColorPicker
                  value={ctaColor}
                  onChange={setCtaColor}
                  label="CTA Color"
                />
              </div>
            </div>
          </div>
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">Border Radius</h3>
            
            <div>
              <Label htmlFor="button-radius">Button Border Radius: {buttonRadius}px</Label>
              <Slider
                id="button-radius"
                min={0}
                max={20}
                step={1}
                value={[buttonRadius]}
                onValueChange={([value]) => setButtonRadius(value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="card-radius">Card Border Radius: {cardRadius}px</Label>
              <Slider
                id="card-radius"
                min={0}
                max={24}
                step={1}
                value={[cardRadius]}
                onValueChange={([value]) => setCardRadius(value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">Icon Customization</h3>
            <p className="text-sm text-muted-foreground">
              Customize how icons appear across your website
            </p>
            
            <div>
              <Label htmlFor="icon-stroke">Icon Line Thickness: {iconStrokeWidth}px</Label>
              <p className="text-xs text-muted-foreground mb-2">Thickness of icon lines</p>
              <Slider
                id="icon-stroke"
                min={1}
                max={4}
                step={1}
                value={[iconStrokeWidth]}
                onValueChange={([value]) => setIconStrokeWidth(value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="icon-background">Icon Background Style</Label>
              <p className="text-xs text-muted-foreground mb-2">Container style for icons</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setIconBackgroundStyle('none')}
                  className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    iconBackgroundStyle === 'none'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => setIconBackgroundStyle('circle')}
                  className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    iconBackgroundStyle === 'circle'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  Circle
                </button>
                <button
                  onClick={() => setIconBackgroundStyle('rounded-square')}
                  className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    iconBackgroundStyle === 'rounded-square'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  Rounded
                </button>
              </div>
            </div>

            {iconBackgroundStyle !== 'none' && (
              <div>
                <Label htmlFor="icon-padding">Icon Background Padding: {iconBackgroundPadding}px</Label>
                <p className="text-xs text-muted-foreground mb-2">Space around icon in background</p>
                <Slider
                  id="icon-padding"
                  min={0}
                  max={24}
                  step={2}
                  value={[iconBackgroundPadding]}
                  onValueChange={([value]) => setIconBackgroundPadding(value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            
            {/* Button Examples */}
            <Card className="p-6 space-y-6" style={{ borderRadius: `${cardRadius}px` }}>
              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Primary Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: successColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Success
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: warningColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Warning
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: dangerColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Danger
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Secondary & Info</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: secondaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Secondary
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: infoColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Info
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: accentColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </Card>

            {/* Website Mockup */}
            <Card className="p-4 bg-slate-50" style={{ borderRadius: `${cardRadius}px` }}>
              <p className="text-sm font-medium mb-4 text-slate-700">Website Preview</p>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ borderRadius: `${cardRadius}px` }}>
                {/* Header */}
                <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Your Business</div>
                  <div className="flex gap-2">
                    <a 
                      href="#"
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      About
                    </a>
                    <a 
                      href="#"
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      Services
                    </a>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="p-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Welcome to Your Site</h2>
                  <p className="text-sm text-slate-600 mb-4">Experience the power of your brand colors</p>
                  <button
                    className="px-6 py-2 text-white font-medium transition-opacity hover:opacity-90 inline-block"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Feature Cards */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div 
                    className="p-3 border"
                    style={{ 
                      borderColor: secondaryColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      1
                    </div>
                    <p className="text-xs font-medium text-slate-700">Feature One</p>
                  </div>
                  <div 
                    className="p-3 bg-opacity-10"
                    style={{ 
                      backgroundColor: accentColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      ✓
                    </div>
                    <p className="text-xs font-medium text-slate-700">Success</p>
                  </div>
                  <div 
                    className="p-3 bg-opacity-10"
                    style={{ 
                      backgroundColor: infoColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: infoColor }}
                    >
                      i
                    </div>
                    <p className="text-xs font-medium text-slate-700">Info</p>
                  </div>
                  <div 
                    className="p-3 bg-opacity-10"
                    style={{ 
                      backgroundColor: warningColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: warningColor }}
                    >
                      !
                    </div>
                    <p className="text-xs font-medium text-slate-700">Warning</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Icon Preview */}
            <Card className="p-6 space-y-6" style={{ borderRadius: `${cardRadius}px` }}>
              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Icon Styles</p>
                <div className="flex flex-wrap gap-4">
                  {/* Home Icon */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        height: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        backgroundColor: iconBackgroundStyle !== 'none' ? `${primaryColor}15` : 'transparent',
                        borderRadius: iconBackgroundStyle === 'circle' ? '50%' : iconBackgroundStyle === 'rounded-square' ? `${buttonRadius}px` : '0',
                      }}
                    >
                      <svg width={32} height={32} fill="none" stroke={primaryColor} viewBox="0 0 24 24" strokeWidth={iconStrokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">Home</span>
                  </div>

                  {/* Phone Icon */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        height: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        backgroundColor: iconBackgroundStyle !== 'none' ? `${successColor}15` : 'transparent',
                        borderRadius: iconBackgroundStyle === 'circle' ? '50%' : iconBackgroundStyle === 'rounded-square' ? `${buttonRadius}px` : '0',
                      }}
                    >
                      <svg width={32} height={32} fill="none" stroke={successColor} viewBox="0 0 24 24" strokeWidth={iconStrokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                  </div>

                  {/* Email Icon */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        height: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        backgroundColor: iconBackgroundStyle !== 'none' ? `${accentColor}15` : 'transparent',
                        borderRadius: iconBackgroundStyle === 'circle' ? '50%' : iconBackgroundStyle === 'rounded-square' ? `${buttonRadius}px` : '0',
                      }}
                    >
                      <svg width={32} height={32} fill="none" stroke={accentColor} viewBox="0 0 24 24" strokeWidth={iconStrokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">Email</span>
                  </div>

                  {/* Check Circle Icon */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        height: iconBackgroundStyle !== 'none' ? `${32 + iconBackgroundPadding * 2}px` : '32px',
                        backgroundColor: iconBackgroundStyle !== 'none' ? `${secondaryColor}15` : 'transparent',
                        borderRadius: iconBackgroundStyle === 'circle' ? '50%' : iconBackgroundStyle === 'rounded-square' ? `${buttonRadius}px` : '0',
                      }}
                    >
                      <svg width={32} height={32} fill="none" stroke={secondaryColor} viewBox="0 0 24 24" strokeWidth={iconStrokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">Check</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandTheme;
