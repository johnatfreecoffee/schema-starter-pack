import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/ui/lazy-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const Footer = () => {
  const { data: company } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();
  const footerLogoSize = siteSettings?.footer_logo_size || 32;

  // Fetch social media links
  const { data: socialMedia = [] } = useQuery({
    queryKey: ['company-social-media-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_social_media')
        .select('*, social_media_outlet_types(name, icon_url)')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

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
            <div className="space-y-2 text-sm">
              {company?.address && <p>{company.address}</p>}
              {company?.phone && <p>
                  <span className="font-medium">Phone:</span> {company.phone}
                </p>}
              {company?.email && <p>
                  <span className="font-medium">Email:</span> {company.email}
                </p>}
            </div>
            
            {/* Social Media Links */}
            {siteSettings?.show_social_links && socialMedia.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialMedia.map((item: any) => {
                  const iconUrl = item.social_media_outlet_types?.icon_url;
                  const platformName = item.social_media_outlet_types?.name || '';
                  
                  if (!iconUrl) return null;
                  
                  return (
                    <a 
                      key={item.id} 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:opacity-70 transition-opacity"
                      aria-label={item.custom_name || platformName}
                    >
                      <img 
                        src={iconUrl} 
                        alt={platformName}
                        className="h-6 w-6"
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Section - Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/services" className="hover:text-primary transition-colors">
                    View All Services
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Service Areas</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/services" className="hover:text-primary transition-colors">
                    View Coverage Areas
                  </Link>
                </li>
              </ul>
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