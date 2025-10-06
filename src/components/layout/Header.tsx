import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Session } from '@supabase/supabase-js';

interface HeaderProps {
  session: Session | null;
}

const Header = ({ session }: HeaderProps) => {
  const { data: company } = useCompanySettings();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.business_name} className="h-10" />
              ) : (
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  {company?.business_name || 'CRM Platform'}
                </span>
              )}
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/services" className="text-sm font-medium hover:text-primary transition-colors">
                Services
              </Link>
              <Link to="/about-us" className="text-sm font-medium hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {company?.phone && (
              <span className="hidden lg:inline text-sm font-medium">
                {company.phone}
              </span>
            )}
            
            {session ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Account
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign In
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
