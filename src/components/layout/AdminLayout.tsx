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
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { LazyImage } from '@/components/ui/lazy-image';
import { useUserPreferences } from '@/hooks/useUserPreferences';
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
  TestTube,
  Map
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
  const { sidebarState, saveSidebarState, isLoading: prefsLoading } = useUserPreferences();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
    sidebarState.desktopCollapsed ?? false
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sidebarState.expandedSections ?? {
      'CRM': true,
      'Money': false,
      'Support': false,
      'Settings': false,
      'Automation': false,
      'System': false,
    }
  );
  
  const { data: company } = useCompanySettings();
  const { data: siteSettings } = useSiteSettings();

  // Load saved preferences when they become available
  useEffect(() => {
    if (!prefsLoading && sidebarState) {
      if (sidebarState.desktopCollapsed !== undefined) {
        setDesktopSidebarCollapsed(sidebarState.desktopCollapsed);
      }
      if (sidebarState.expandedSections) {
        setExpandedSections(sidebarState.expandedSections);
      }
    }
  }, [prefsLoading, sidebarState]);

  // Redirect to last visited route if landing on /dashboard
  useEffect(() => {
    if (!prefsLoading && !hasRedirected && location.pathname === '/dashboard') {
      if (sidebarState.lastRoute && sidebarState.lastRoute !== '/dashboard') {
        setHasRedirected(true);
        navigate(sidebarState.lastRoute, { replace: true });
      }
    }
  }, [prefsLoading, hasRedirected, location.pathname, sidebarState.lastRoute, navigate]);

  // Save current route as last visited (but debounce to avoid too many saves)
  useEffect(() => {
    if (!prefsLoading && location.pathname.startsWith('/dashboard')) {
      const timeoutId = setTimeout(() => {
        saveSidebarState({ lastRoute: location.pathname });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, prefsLoading]);

  // Save desktop sidebar state when it changes
  useEffect(() => {
    if (!prefsLoading) {
      saveSidebarState({ desktopCollapsed: desktopSidebarCollapsed });
    }
  }, [desktopSidebarCollapsed]);

  // Save expanded sections when they change
  useEffect(() => {
    if (!prefsLoading) {
      saveSidebarState({ expandedSections });
    }
  }, [expandedSections]);

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

  const dashboardItem = { path: '/dashboard', icon: Home, label: 'Dashboard' };
  
  const navSections = [
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
        { path: '/dashboard/settings/ai-training', icon: Brain, label: 'AI Training' },
        { path: '/dashboard/settings/site-settings', icon: Globe, label: 'Site Settings' },
        { path: '/dashboard/settings/services', icon: Package, label: 'Services' },
        { path: '/dashboard/settings/service-areas', icon: MapPin, label: 'Service Areas' },
        { path: '/dashboard/settings/static-pages', icon: FileTextAlt, label: 'Static Pages' },
        { path: '/dashboard/settings/sitemap', icon: Map, label: 'Site Map' },
        
        { path: '/dashboard/settings/email-templates', icon: FileText, label: 'Email Templates' },
        { path: '/dashboard/settings/email-settings', icon: Settings, label: 'Email Settings' },
        { path: '/dashboard/settings/notifications', icon: Settings, label: 'Notifications' },
        { path: '/dashboard/settings/permissions', icon: Settings, label: 'Permissions & Roles' },
        { path: '/dashboard/settings/ai-config', icon: Brain, label: 'AI Configuration' },
        { path: '/dashboard/settings/backup-management', icon: Settings, label: 'Backup & Data' },
        { path: '/dashboard/settings/qa-testing', icon: TestTube, label: 'QA Testing' },
      ]
    }] : []),
    ...(isAdmin ? [{
      title: 'Automation',
      items: [
        { path: '/admin/automation/workflows', icon: Workflow, label: 'Workflows' },
        { path: '/admin/automation/monitor', icon: Activity, label: 'Execution Log' },
        { path: '/admin/automation/templates', icon: LayoutTemplate, label: 'Templates' },
        { path: '/admin/automation/testing', icon: TestTube, label: 'Testing' },
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
            ? "bg-blue-600 text-white" 
            : "bg-transparent text-slate-700 hover:bg-slate-100",
          collapsed && "justify-center"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-slate-700")} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const DesktopSidebar = () => (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        desktopSidebarCollapsed ? "w-16" : "w-60"
      )}
      style={{
        backgroundColor: siteSettings?.header_bg_color || 'hsl(0, 0%, 100%)',
        borderRightColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
      }}
    >
      <div 
        className="flex items-center justify-between h-16 px-4 border-b"
        style={{
          borderBottomColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
        }}
      >
        <div className="w-full flex items-center justify-between">
          {!desktopSidebarCollapsed ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                {company?.logo_url ? (
                  <LazyImage 
                    src={company.logo_url} 
                    alt={company.business_name} 
                    style={{ 
                      height: `${Math.min(siteSettings?.header_logo_size || 32, 48)}px`,
                      maxHeight: '48px'
                    }}
                    className="w-auto object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    {company?.business_name || 'CRM'}
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDesktopSidebarCollapsed(true)}
                className="flex-shrink-0 h-8 w-8"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {company?.icon_url && (
                <Link to="/" className="flex items-center justify-center">
                  <LazyImage 
                    src={company.icon_url} 
                    alt={company.business_name} 
                    style={{ 
                      height: `${Math.min(siteSettings?.header_logo_size || 32, 32)}px`,
                      width: `${Math.min(siteSettings?.header_logo_size || 32, 32)}px`,
                      maxHeight: '32px',
                      maxWidth: '32px'
                    }}
                    className="object-contain"
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 min-h-0">
        <nav className="space-y-2 px-3 py-4">
          {desktopSidebarCollapsed ? (
            // When collapsed, show all items as flat list
            <>
              {renderNavItem(dashboardItem, true)}
              {navSections.map((section) => (
                section.items.map((item) => renderNavItem(item, true))
              ))}
            </>
          ) : (
            // When expanded, show dashboard first, then grouped sections
            <>
              {renderNavItem(dashboardItem, false)}
              <div className="pt-2">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground uppercase tracking-wider rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors border"
                      style={{
                        borderColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
                      }}
                    >
                      <span>{section.title}</span>
                      {expandedSections[section.title] ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {expandedSections[section.title] && section.items.map((item) => renderNavItem(item, false))}
                  </div>
                ))}
              </div>
            </>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );

  const MobileSidebarContent = () => (
    <nav className="space-y-2 px-3">
      {renderNavItem(dashboardItem)}
      <div className="pt-2">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground uppercase tracking-wider rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors border"
              style={{
                borderColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
              }}
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
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          desktopSidebarCollapsed ? "md:ml-16" : "md:ml-60"
        )}
      >
        {/* Header */}
        <header 
          className="border-b backdrop-blur sticky top-0 z-50"
          style={{
            backgroundColor: siteSettings?.header_bg_color || 'hsl(0, 0%, 100%)',
            borderBottomColor: siteSettings?.header_border_color || 'hsl(0, 0%, 89%)',
          }}
        >
          <div className="flex h-16 items-center justify-between gap-4 px-4">
            {/* Desktop Expand Button (when sidebar is collapsed) */}
            {!isMobile && desktopSidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setDesktopSidebarCollapsed(false)}
                className="flex-shrink-0"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

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
                    style={{ 
                      height: `${Math.min(siteSettings?.header_logo_size || 32, 48)}px`,
                      maxHeight: '48px'
                    }}
                    className="w-auto object-contain"
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
        <main className="flex-1 pb-20 md:pb-4 p-6">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
};

export default AdminLayout;
