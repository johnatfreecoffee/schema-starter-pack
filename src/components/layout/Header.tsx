import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, ChevronDown, Menu, X } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LazyImage } from '@/components/ui/lazy-image';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  session: Session | null;
}

const Header = ({ session }: HeaderProps) => {
  const { data: company } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();
  const location = useLocation();
  
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActivePath = (path: string) => location.pathname === path;

  const { data: staticPages } = useQuery({
    queryKey: ['static-pages-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .from('static_pages')
        .select('id, title, slug, display_order, parent_page_id')
        .eq('show_in_menu', true)
        .eq('status', true)
        .order('display_order', { ascending: true });
      
      // Organize into parent and child pages
      const parentPages = data?.filter(p => !p.parent_page_id) || [];
      const childPages = data?.filter(p => p.parent_page_id) || [];
      
      return parentPages.map(parent => ({
        ...parent,
        children: childPages.filter(child => child.parent_page_id === parent.id)
      }));
    }
  });

  const logoSize = siteSettings?.header_logo_size || 32;

  return (
      <header 
        className="border-b sticky top-0 z-50"
        style={{
          backgroundColor: siteSettings?.header_bg_color || 'hsl(0, 0%, 100%)',
          borderBottomColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <Link to="/" className="flex items-center gap-2">
                {company?.logo_url ? (
                  <LazyImage 
                    src={company.logo_url} 
                    alt={company.business_name} 
                    style={{ 
                      height: `${Math.min(logoSize, 56)}px`,
                      maxHeight: '56px'
                    }}
                    className="w-auto object-contain"
                    loading="eager"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    {company?.business_name || 'CRM Platform'}
                  </span>
                )}
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors touch-manipulation px-4 py-2 rounded-full ${
                    isActivePath('/') 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:text-primary'
                  }`}
                >
                  Home
                </Link>
                {staticPages?.map(page => {
                  const hasChildren = page.children && page.children.length > 0;
                  
                  if (hasChildren) {
                    return (
                      <div 
                        key={page.id}
                        className="relative"
                        onMouseEnter={() => setOpenDropdown(page.id)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <Link 
                          to={`/${page.slug}`} 
                          className="text-sm font-medium hover:text-primary transition-colors touch-manipulation flex items-center gap-1"
                        >
                          {page.title}
                          <ChevronDown className="h-3 w-3" />
                        </Link>
                        {openDropdown === page.id && (
                          <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg py-2 min-w-[200px] z-[9999]">
                            {page.children?.map(child => (
                              <Link
                                key={child.id}
                                to={`/${child.slug}`}
                                className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <Link 
                      key={page.id} 
                      to={`/${page.slug}`} 
                      className={`text-sm font-medium transition-colors touch-manipulation px-4 py-2 rounded-full ${
                        isActivePath(`/${page.slug}`)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:text-primary'
                      }`}
                    >
                      {page.title}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {company?.phone && (
                <a 
                  href={`tel:${company.phone.replace(/\D/g, '')}`}
                  className="hidden lg:inline text-sm font-medium hover:text-primary transition-colors"
                >
                  {formatPhoneNumber(company.phone)}
                </a>
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
              
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden min-h-touch min-w-touch">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link 
                      to="/" 
                      className={`text-base font-medium transition-colors py-2 px-4 rounded-full ${
                        isActivePath('/')
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:text-primary'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    {staticPages?.map(page => (
                      <div key={page.id}>
                        <Link 
                          to={`/${page.slug}`}
                          className={`text-base font-medium transition-colors py-2 px-4 rounded-full block ${
                            isActivePath(`/${page.slug}`)
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:text-primary'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {page.title}
                        </Link>
                        {page.children && page.children.length > 0 && (
                          <div className="ml-4 mt-2 flex flex-col gap-2">
                            {page.children.map(child => (
                              <Link
                                key={child.id}
                                to={`/${child.slug}`}
                                className={`text-sm transition-colors py-1 px-3 rounded-full block ${
                                  isActivePath(`/${child.slug}`)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-primary'
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
