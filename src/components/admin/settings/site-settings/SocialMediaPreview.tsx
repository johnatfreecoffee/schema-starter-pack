import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

interface SocialMediaPreviewProps {
  useStandardLogos: boolean;
  iconStyle: string;
  customColor: string;
  borderStyle: string;
  iconSize: number;
}

export const SocialMediaPreview = ({
  useStandardLogos,
  iconStyle,
  customColor,
  borderStyle,
  iconSize,
}: SocialMediaPreviewProps) => {
  const { data: socialMedia = [] } = useQuery({
    queryKey: ['company-social-media-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_social_media')
        .select('*, social_media_outlet_types(name, icon_url)')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  const getSocialIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'facebook':
        return Facebook;
      case 'instagram':
        return Instagram;
      case 'twitter':
      case 'x':
        return Twitter;
      case 'linkedin':
        return Linkedin;
      default:
        return null;
    }
  };

  const getIconColorClass = (platformName: string) => {
    if (iconStyle === 'black') {
      return 'text-black';
    } else if (iconStyle === 'white') {
      return 'text-white';
    } else if (iconStyle === 'custom') {
      return '';
    } else {
      // colored
      const colors: Record<string, string> = {
        facebook: 'text-[#1877F2]',
        instagram: 'text-[#E4405F]',
        twitter: 'text-[#1DA1F2]',
        x: 'text-[#1DA1F2]',
        linkedin: 'text-[#0A66C2]',
      };
      return colors[platformName.toLowerCase()] || 'text-foreground';
    }
  };

  const getBorderClass = () => {
    if (borderStyle === 'none') return '';
    if (borderStyle === 'circle') return 'rounded-full border border-current/20 p-2';
    if (borderStyle === 'rounded') return 'rounded-lg border border-current/20 p-2';
    if (borderStyle === 'square') return 'border border-current/20 p-2';
    return '';
  };

  if (socialMedia.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
        No social media links added yet. Add some links above to see the preview.
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-4 border rounded-lg bg-background">
      {socialMedia.map((item: any) => {
        const platformName = item.social_media_outlet_types?.name || '';
        const iconUrl = item.custom_icon_url || item.social_media_outlet_types?.icon_url;
        
        if (useStandardLogos && iconUrl) {
          return (
            <div key={item.id} className="hover:opacity-70 transition-opacity">
              <img 
                src={iconUrl} 
                alt={platformName}
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                className="object-contain"
              />
            </div>
          );
        }

        const Icon = getSocialIcon(platformName);
        if (!Icon) return null;

        const colorClass = getIconColorClass(platformName);
        const borderClass = getBorderClass();
        const customStyle = iconStyle === 'custom' ? { color: customColor } : {};

        return (
          <div 
            key={item.id} 
            className={`${colorClass} ${borderClass} hover:opacity-70 transition-opacity`}
            style={customStyle}
          >
            <Icon size={iconSize} />
          </div>
        );
      })}
    </div>
  );
};