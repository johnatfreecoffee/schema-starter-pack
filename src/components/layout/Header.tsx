import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  session: Session | null;
}

const Header = ({ session }: HeaderProps) => {
  const { data: company } = useCompanySettings();
  
  const { data: staticPages } = useQuery({
    queryKey: ['static-pages-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .from('static_pages')
        .select('id, title, slug, display_order')
        .eq('show_in_menu', true)
        .eq('status', true)
        .order('display_order', { ascending: true });
      return data || [];
    }
  });

  return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <Link to="/" className="flex items-center gap-2">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.business_name} className="h-8 md:h-10" />
                ) : (
                  <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    {company?.business_name || 'CRM Platform'}
                  </span>
                )}
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors touch-manipulation">
                  Home
                </Link>
                {staticPages?.map(page => (
                  <Link 
                    key={page.id} 
                    to={`/${page.slug}`} 
                    className="text-sm font-medium hover:text-primary transition-colors touch-manipulation"
                  >
                    {page.title}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {company?.phone && (
                <span className="hidden lg:inline text-sm font-medium">
                  {company.phone}
                </span>
              )}
              
              {session ? (
                <Button asChild variant="outline" size="sm" className="min-h-touch min-w-touch">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Account</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="min-h-touch min-w-touch">
                  <Link to="/auth" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
