import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        .select('*, social_media_outlet_types(name, icon_url, icon_svg)')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

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
        const iconSvg = item.social_media_outlet_types?.icon_svg;
        
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

        if (!iconSvg) return null;

        const colorClass = getIconColorClass(platformName);
        const borderClass = getBorderClass();
        const customStyle = iconStyle === 'custom' ? { color: customColor } : {};

        return (
          <div 
            key={item.id} 
            className={`${colorClass} ${borderClass} hover:opacity-70 transition-opacity`}
            style={customStyle}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: iconSvg }}
            />
          </div>
        );
      })}
    </div>
  );
};