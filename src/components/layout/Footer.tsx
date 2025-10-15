import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { LazyImage } from '@/components/ui/lazy-image';

const Footer = () => {
  const { data: company } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();

  const footerLogoSize = siteSettings?.footer_logo_size || 32;
  
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      default: return null;
    }
  };

  const getIconStyle = () => {
    const baseClasses = 'transition-colors';
    const size = siteSettings?.social_icon_size || 24;
    
    let borderClasses = '';
    if (siteSettings?.social_border_style === 'circle') {
      borderClasses = 'rounded-full';
    } else if (siteSettings?.social_border_style === 'rounded') {
      borderClasses = 'rounded-lg';
    } else if (siteSettings?.social_border_style === 'square') {
      borderClasses = 'rounded-none';
    }

    return { baseClasses, borderClasses, size };
  };

  const getIconColorClass = (platform: string) => {
    const style = siteSettings?.social_icon_style || 'colored';
    
    if (style === 'black') {
      return 'text-black hover:opacity-70';
    } else if (style === 'custom') {
      return 'text-foreground hover:text-primary';
    } else if (style === 'site-themed') {
      return 'text-primary hover:text-primary/80';
    } else {
      // colored
      const colors: Record<string, string> = {
        facebook: 'text-[#1877F2] hover:opacity-70',
        instagram: 'text-[#E4405F] hover:opacity-70',
        twitter: 'text-[#1DA1F2] hover:opacity-70',
        linkedin: 'text-[#0A66C2] hover:opacity-70',
      };
      return colors[platform.toLowerCase()] || 'text-foreground hover:text-primary';
    }
  };

  return (
    <footer 
      className="border-t mt-auto"
      style={{
        backgroundColor: siteSettings?.footer_bg_color || 'hsl(0, 0%, 96%)',
        color: siteSettings?.footer_text_color || 'hsl(0, 0%, 20%)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Section - Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {company?.logo_url && (
                <LazyImage 
                  src={company.logo_url} 
                  alt={company.business_name}
                  style={{ height: `${footerLogoSize}px` }}
                  className="w-auto"
                />
              )}
              <h3 className="text-2xl font-bold">{company?.business_name}</h3>
            </div>
            {company?.business_slogan && (
              <p className="text-lg italic opacity-90">{company.business_slogan}</p>
            )}
            {company?.description && (
              <p className="text-sm opacity-80">{company.description}</p>
            )}
            <div className="space-y-2 text-sm">
              {company?.address && <p>{company.address}</p>}
              {company?.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {company.phone}
                </p>
              )}
              {company?.email && (
                <p>
                  <span className="font-medium">Email:</span> {company.email}
                </p>
              )}
            </div>
            
            {/* Social Media Links */}
            {siteSettings?.show_social_links && Array.isArray((siteSettings as any).social_links) && (siteSettings as any).social_links.length > 0 && (
              <div className="flex gap-3 mt-4">
                {(siteSettings as any).social_links.map((link: any, index: number) => {
                  const Icon = getSocialIcon(link.platform);
                  if (!Icon) return null;
                  
                  const { baseClasses, borderClasses, size } = getIconStyle();
                  const colorClass = getIconColorClass(link.platform);
                  
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${baseClasses} ${borderClasses} ${colorClass} p-2 border border-current/20`}
                      aria-label={link.platform}
                    >
                      <Icon size={size} />
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
