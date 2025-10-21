import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calendar, 
  FileText, 
  User, 
  LogOut,
  Menu,
  Star,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';

interface CustomerLayoutProps {
  children?: ReactNode;
}

const CustomerLayout = ({ children }: CustomerLayoutProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [accountName, setAccountName] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: settings } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/customer/login');
        return;
      }

      setSession(session);

      // Fetch account name
      const { data: accountData } = await supabase
        .from('accounts')
        .select('account_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (accountData) {
        setAccountName(accountData.account_name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/customer/login');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/customer/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { path: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customer/projects', icon: FolderKanban, label: 'My Projects' },
    { path: '/customer/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/customer/invoices', icon: FileText, label: 'Payments' },
    { path: '/customer/payments', icon: CreditCard, label: 'History' },
    { path: '/customer/support', icon: MessageCircle, label: 'Support' },
    { path: '/customer/my-reviews', icon: Star, label: 'My Reviews' },
    { path: '/customer/profile', icon: User, label: 'Profile' },
  ];

  const SidebarContent = () => (
    <nav className="space-y-2 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <div className="py-6">
                      <div className="px-6 pb-4 border-b">
                        <div className="font-semibold text-lg">{accountName}</div>
                        <div className="text-sm text-muted-foreground">Customer Portal</div>
                      </div>
                      <div className="mt-4">
                        <SidebarContent />
                      </div>
                      <div className="mt-6 px-3">
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              <Link to="/customer/dashboard" className="flex items-center gap-3">
                {settings?.logo_url && (
                  <LazyImage 
                    src={settings.logo_url} 
                    alt="Logo" 
                    style={{ 
                      height: `${Math.min(siteSettings?.header_logo_size || 32, 48)}px`,
                      maxHeight: '48px'
                    }}
                    className="w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className="text-lg md:text-xl font-bold">{settings?.business_name || 'Customer Portal'}</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{accountName}</p>
                </div>
              </Link>
            </div>
            
            <Button onClick={handleLogout} variant="outline" size="sm" className="hidden lg:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation - Desktop */}
        {!isMobile && (
          <aside className="hidden lg:block w-64 border-r bg-card">
            <div className="py-6">
              <SidebarContent />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 pb-20 lg:pb-4">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 shadow-lg safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px] touch-manipulation",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground active:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Footer */}
      <footer className="bg-card border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p className="text-center md:text-left">
              &copy; {new Date().getFullYear()} {settings?.business_name}. All rights reserved.
            </p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-center">
              {settings?.phone && <p>Phone: {settings.phone}</p>}
              {settings?.email && <p>Email: {settings.email}</p>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
