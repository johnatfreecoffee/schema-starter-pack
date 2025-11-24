import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/ui/lazy-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';
import { MapPin, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
const Footer = () => {
  const { data: company } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();
  const footerLogoSize = siteSettings?.footer_logo_size || 32;
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [areasExpanded, setAreasExpanded] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatAddress = (address: string) => {
    return address.replace(/\b[Uu]nit\b\s*/g, '');
  };

  // Fetch social media links
  const { data: socialMedia = [] } = useQuery({
    queryKey: ['company-social-media-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_social_media')
        .select('*, social_media_outlet_types(name, icon_url, icon_svg)')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch outlet types to resolve icons when link suggests a different platform
  const { data: outletTypes = [] } = useQuery({
    queryKey: ['social-media-outlet-types-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_outlet_types')
        .select('id, name, icon_url, icon_svg');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, slug')
        .eq('is_active', true)
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch service areas
  const { data: serviceAreas = [] } = useQuery({
    queryKey: ['service-areas-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('id, display_name, city_slug')
        .eq('status', true)
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
  });

  const iconByName = useMemo(() => {
    const map: Record<string, { iconUrl: string; iconSvg?: string }> = {};
    (outletTypes as any[]).forEach((ot) => {
      if (ot?.name) {
        map[ot.name.toLowerCase()] = {
          iconUrl: ot.icon_url,
          iconSvg: ot.icon_svg
        };
      }
    });
    return map;
  }, [outletTypes]);

  const detectPlatform = (url: string): string | null => {
    try {
      const host = new URL(url).host.toLowerCase();
      if (host.includes('instagram')) return 'instagram';
      if (host.includes('facebook.com') && !host.includes('m.me')) return 'facebook';
      if (host.includes('m.me') || host.includes('messenger.com')) return 'facebook messenger';
      if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
      if (host.includes('linkedin')) return 'linkedin';
      if (host.includes('tiktok')) return 'tiktok';
      if (host.includes('youtube')) return 'youtube';
      if (host.includes('google') && host.includes('business')) return 'google business';
      if (host.includes('whatsapp')) return 'whatsapp';
      return null;
    } catch {
      return null;
    }
  };

  return (
    <footer 
      className="border-t mt-auto" 
      style={{
        backgroundColor: siteSettings?.footer_bg_color || 'hsl(0, 0%, 96%)',
        color: siteSettings?.footer_text_color || 'hsl(0, 0%, 20%)'
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Section - Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {company?.logo_url && <LazyImage src={company.logo_url} alt={company.business_name} style={{
              height: `${footerLogoSize}px`
            }} className="w-auto" />}
              
            </div>
            {company?.business_slogan && <p className="text-lg italic opacity-90">{company.business_slogan}</p>}
            {company?.description && <p className="text-sm opacity-80">{company.description}</p>}
            <div className="space-y-3 text-sm">
              {company?.address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(company.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 font-bold text-primary hover:underline transition-all group"
                >
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span>{formatAddress(company.address)}</span>
                </a>
              )}
              {company?.phone && (
                <a 
                  href={`tel:${company.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 font-bold text-primary hover:underline transition-all group"
                >
                  <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{formatPhoneNumber(company.phone)}</span>
                </a>
              )}
              {company?.email && (
                <a 
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 font-bold text-primary hover:underline transition-all group"
                >
                  <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{company.email}</span>
                </a>
              )}
            </div>
            
            {/* Social Media Links */}
            {siteSettings?.show_social_links && socialMedia.length > 0 && (
              <div className="flex gap-3 mt-4">
                {(() => {
                  const seen = new Set<string>();
                  const useStandard = (siteSettings as any)?.use_standard_social_logos ?? true;
                  const style = (siteSettings as any)?.social_icon_style || 'colored';
                  const customColor = (siteSettings as any)?.social_custom_color || '#000000';
                  const size = (siteSettings as any)?.social_icon_size || 24;
                  const border = (siteSettings as any)?.social_border_style || 'circle';

                  const getBorderClass = () => {
                    if (border === 'none') return '';
                    if (border === 'circle') return 'rounded-full border border-current/20 p-2';
                    if (border === 'rounded') return 'rounded-lg border border-current/20 p-2';
                    if (border === 'square') return 'border border-current/20 p-2';
                    return '';
                  };

                  const getIconColorClass = (platform: string) => {
                    if (style === 'black') return 'text-black';
                    if (style === 'white') return 'text-white';
                    if (style === 'custom') return '';
                    
                    const colors: Record<string, string> = {
                      facebook: 'text-[#1877F2]',
                      instagram: 'text-[#E4405F]',
                      x: 'text-[#000000]',
                      twitter: 'text-[#1DA1F2]',
                      linkedin: 'text-[#0A66C2]',
                      'facebook messenger': 'text-[#0084FF]',
                      'google business': 'text-[#4285F4]',
                    };
                    return colors[platform.toLowerCase()] || 'text-foreground';
                  };

                  return socialMedia.map((item: any) => {
                    let platform = (item.social_media_outlet_types?.name || '').toLowerCase();
                    const detected = detectPlatform(item.link);
                    if (!platform || platform === '(other)') platform = detected || platform;
                    if (platform === 'x' && detected && detected !== 'x') platform = detected;

                    const iconData = platform ? iconByName[platform] : undefined;
                    const resolvedIconUrl = item.custom_icon_url || iconData?.iconUrl || item.social_media_outlet_types?.icon_url;
                    const resolvedIconSvg = item.social_media_outlet_types?.icon_svg || iconData?.iconSvg;
                    
                    if (!resolvedIconUrl && !resolvedIconSvg) return null;

                    let hostKey = '';
                    try { hostKey = new URL(item.link).hostname; } catch { hostKey = item.link; }
                    const dedupeKey = `${platform}|${hostKey}`;
                    if (seen.has(dedupeKey)) return null;
                    seen.add(dedupeKey);

                    const label = item.custom_name || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Social');

                    if (useStandard && resolvedIconUrl) {
                      return (
                        <a 
                          key={item.id} 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:opacity-70 transition-opacity"
                          aria-label={label}
                        >
                          <img 
                            src={resolvedIconUrl} 
                            alt={label}
                            style={{ width: `${size}px`, height: `${size}px` }}
                            className="object-contain"
                          />
                        </a>
                      );
                    }

                    // Styled icons mode - use SVG icons with color/border styling
                    if (!resolvedIconSvg) return null;
                    
                    const colorClass = getIconColorClass(platform);
                    const borderClass = getBorderClass();
                    const customStyle = style === 'custom' ? { color: customColor } : {};

                    return (
                      <a 
                        key={item.id} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`${colorClass} ${borderClass} hover:opacity-70 transition-opacity inline-block`}
                        style={customStyle}
                        aria-label={label}
                      >
                        <svg
                          width={size}
                          height={size}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: resolvedIconSvg }}
                        />
                      </a>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Right Section - Services and Service Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Services Section */}
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <div className={`grid ${services.length > 6 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-4`}>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {services.slice(0, servicesExpanded ? services.length : Math.min(12, services.length)).map((service: any, index: number) => {
                    // Split into columns if more than 6 items
                    if (services.length > 6 && index >= Math.ceil(Math.min(servicesExpanded ? services.length : 12, services.length) / 2)) {
                      return null;
                    }
                    return (
                      <li key={service.id}>
                        <Link to={`/services/${service.slug}`} className="hover:text-primary transition-colors">
                          {service.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {services.length > 6 && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {services.slice(0, servicesExpanded ? services.length : Math.min(12, services.length)).map((service: any, index: number) => {
                      const halfPoint = Math.ceil(Math.min(servicesExpanded ? services.length : 12, services.length) / 2);
                      if (index < halfPoint) return null;
                      return (
                        <li key={service.id}>
                          <Link to={`/services/${service.slug}`} className="hover:text-primary transition-colors">
                            {service.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {services.length > 12 && (
                <button
                  onClick={() => setServicesExpanded(!servicesExpanded)}
                  className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {servicesExpanded ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show All ({services.length}) <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>

            {/* Service Areas Section */}
            <div>
              <h4 className="font-semibold mb-4">Service Areas</h4>
              <div className={`grid ${serviceAreas.length > 6 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-4`}>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {serviceAreas.slice(0, areasExpanded ? serviceAreas.length : Math.min(12, serviceAreas.length)).map((area: any, index: number) => {
                    if (serviceAreas.length > 6 && index >= Math.ceil(Math.min(areasExpanded ? serviceAreas.length : 12, serviceAreas.length) / 2)) {
                      return null;
                    }
                    return (
                      <li key={area.id}>
                        <span>
                          {area.display_name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {serviceAreas.length > 6 && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {serviceAreas.slice(0, areasExpanded ? serviceAreas.length : Math.min(12, serviceAreas.length)).map((area: any, index: number) => {
                      const halfPoint = Math.ceil(Math.min(areasExpanded ? serviceAreas.length : 12, serviceAreas.length) / 2);
                      if (index < halfPoint) return null;
                      return (
                        <li key={area.id}>
                          <span>
                            {area.display_name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {serviceAreas.length > 12 && (
                <button
                  onClick={() => setAreasExpanded(!areasExpanded)}
                  className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {areasExpanded ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show All ({serviceAreas.length}) <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-current/20 text-center space-y-2">
          <p className="text-sm opacity-80">
            © 2025 {company?.business_name || 'CRM Platform'} - All Rights Reserved
          </p>
          <div className="flex items-center justify-center gap-4 text-xs opacity-70">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span>|</span>
            <span>Licensed, Bonded, and Insured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;