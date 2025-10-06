import { Link, useLocation } from 'react-router-dom';
import { 
  UserPlus, 
  Building2, 
  CheckSquare, 
  Calendar, 
  FolderKanban, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  isAdmin: boolean;
}

const BottomNav = ({ isAdmin }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: company } = useCompanySettings();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  const navItems = [
    { path: '/dashboard/leads', icon: UserPlus, label: 'Leads' },
    { path: '/dashboard/accounts', icon: Building2, label: 'Accounts' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/dashboard/calendars', icon: Calendar, label: 'Calendars' },
    { path: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/dashboard/money', icon: DollarSign, label: 'Money' },
    { path: '/dashboard/logs', icon: FileText, label: 'Logs' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/dashboard/settings', icon: Settings, label: 'Settings' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 px-2">
          {/* Navigation Items */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[70px]",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 border-l pl-4">
            {company?.phone && (
              <div className="hidden lg:flex items-center gap-2 text-sm font-medium px-3">
                <Phone className="h-4 w-4" />
                {company.phone}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex flex-col items-center justify-center px-3 py-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs mt-1">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
