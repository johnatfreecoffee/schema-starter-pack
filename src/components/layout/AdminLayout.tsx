import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useUserRole } from '@/hooks/useUserRole';
import { UserMenu } from './UserMenu';
import BottomNav from './BottomNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { LazyImage } from '@/components/ui/lazy-image';
import { 
  Menu, 
  Home, 
  UserPlus, 
  Building2, 
  CheckSquare, 
  Calendar, 
  FolderKanban, 
  DollarSign, 
  Ticket, 
  Star, 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  Activity,
  Wrench,
  Globe,
  Brain,
  Package,
  MapPin,
  FileCode,
  FileText as FileTextAlt,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  Workflow,
  LayoutTemplate,
  TestTube
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const { role, loading } = useUserRole();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'CRM': true,
    'Money': false,
    'Support': false,
    'Settings': false,
    'Automation': false,
    'System': false,
  });
  const { data: company } = useCompanySettings();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

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

  const isAdmin = role === 'Super Admin' || role === 'Admin';

  const navSections = [
    {
      title: 'Dashboard',
      items: [
        { path: '/dashboard', icon: Home, label: 'Overview' },
      ]
    },
    {
      title: 'CRM',
      items: [
        { path: '/dashboard/leads', icon: UserPlus, label: 'Leads' },
        { path: '/dashboard/accounts', icon: Building2, label: 'Accounts' },
        { path: '/dashboard/contacts', icon: User, label: 'Contacts' },
        { path: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
        { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/dashboard/calendars', icon: Calendar, label: 'Calendar' },
      ]
    },
    {
      title: 'Money',
      items: [
        { path: '/dashboard/money', icon: DollarSign, label: 'Quotes & Invoices' },
      ]
    },
    {
      title: 'Support',
      items: [
        { path: '/dashboard/tickets', icon: Ticket, label: 'Tickets' },
        { path: '/dashboard/reviews', icon: Star, label: 'Reviews' },
      ]
    },
    ...(isAdmin ? [{
      title: 'Settings',
      items: [
        { path: '/dashboard/settings/company', icon: Wrench, label: 'Company' },
        { path: '/dashboard/settings/site-settings', icon: Globe, label: 'Site Settings' },
        { path: '/dashboard/settings/ai-training', icon: Brain, label: 'AI Training' },
        { path: '/dashboard/settings/services', icon: Package, label: 'Services' },
        { path: '/dashboard/settings/service-areas', icon: MapPin, label: 'Service Areas' },
        { path: '/dashboard/settings/templates', icon: FileCode, label: 'Templates' },
        { path: '/dashboard/settings/static-pages', icon: FileTextAlt, label: 'Static Pages' },
      ]
    }] : []),
    ...(isAdmin ? [{
      title: 'Automation',
      items: [
        { path: '/dashboard/automation/workflows', icon: Workflow, label: 'Workflows' },
        { path: '/dashboard/automation/monitor', icon: Activity, label: 'Execution Log' },
        { path: '/dashboard/automation/templates', icon: LayoutTemplate, label: 'Templates' },
        { path: '/dashboard/automation/testing', icon: TestTube, label: 'Testing' },
      ]
    }] : []),
    ...(isAdmin ? [{
      title: 'System',
      items: [
        { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/dashboard/team', icon: Users, label: 'Team' },
        { path: '/dashboard/logs', icon: FileText, label: 'Logs' },
        { path: '/dashboard/system-health', icon: Activity, label: 'System Health' },
      ]
    }] : []),
  ];

  const renderNavItem = (item: any, collapsed: boolean = false) => {
    const Icon = item.icon;
    // For Overview (/dashboard), only match exact path. For others, match exact or sub-routes.
    const isActive = item.path === '/dashboard' 
      ? location.pathname === '/dashboard'
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
          collapsed && "justify-center"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const DesktopSidebar = () => (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300",
        desktopSidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!desktopSidebarCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            {company?.logo_url ? (
              <LazyImage 
                src={company.logo_url} 
                alt={company.business_name} 
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {company?.business_name || 'CRM'}
              </span>
            )}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
          className={cn("flex-shrink-0", desktopSidebarCollapsed && "mx-auto")}
        >
          {desktopSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-2 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!desktopSidebarCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span>{section.title}</span>
                  {expandedSections[section.title] ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
              {expandedSections[section.title] && section.items.map((item) => renderNavItem(item, desktopSidebarCollapsed))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );

  const MobileSidebarContent = () => (
    <nav className="space-y-2 px-3">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <span>{section.title}</span>
            {expandedSections[section.title] ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {expandedSections[section.title] && section.items.map((item) => renderNavItem(item))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="flex h-16 items-center justify-between gap-4 px-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <ScrollArea className="h-full py-6">
                    <div className="px-6 pb-4">
                      <h2 className="text-lg font-semibold">Navigation</h2>
                    </div>
                    <MobileSidebarContent />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}

            {/* Mobile Logo (shown when sidebar is hidden) */}
            {isMobile && (
              <Link to="/" className="flex items-center gap-2 md:hidden">
                {company?.logo_url ? (
                  <LazyImage 
                    src={company.logo_url} 
                    alt={company.business_name} 
                    className="h-8 w-auto"
                  />
                ) : (
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    {company?.business_name || 'CRM'}
                  </span>
                )}
              </Link>
            )}

            {/* Search and User Menu */}
            <div className="flex items-center gap-2 ml-auto">
              <GlobalSearch />
              <UserMenu userEmail={session?.user?.email} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-4 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
};

export default AdminLayout;
