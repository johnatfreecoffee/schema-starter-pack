import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useUserRole } from '@/hooks/useUserRole';
import Header from './Header';
import BottomNav from './BottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, UserPlus, Building2, CheckSquare, Calendar, FolderKanban, DollarSign, Ticket, Star, BarChart3, Users, FileText, Settings, Activity } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const { role, loading } = useUserRole();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/leads', icon: UserPlus, label: 'Leads' },
    { path: '/dashboard/accounts', icon: Building2, label: 'Accounts' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/dashboard/calendars', icon: Calendar, label: 'Calendar' },
    { path: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/dashboard/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/dashboard/reviews', icon: Star, label: 'Reviews' },
    { path: '/dashboard/money', icon: DollarSign, label: 'Money' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ...((role === 'Super Admin' || role === 'Admin') ? [
      { path: '/dashboard/team', icon: Users, label: 'Team' },
      { path: '/dashboard/logs', icon: FileText, label: 'Logs' },
      { path: '/dashboard/system-health', icon: Activity, label: 'System Health' },
      { path: '/dashboard/settings', icon: Settings, label: 'Settings' }
    ] : []),
  ];

  const SidebarContent = () => (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <div className="py-6">
                    <div className="px-6 pb-4">
                      <h2 className="text-lg font-semibold">Navigation</h2>
                    </div>
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Header session={session} />
            <div className="flex items-center gap-4 ml-auto">
              <GlobalSearch />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav isAdmin={role === 'Super Admin' || role === 'Admin'} />
    </div>
  );
};

export default AdminLayout;
