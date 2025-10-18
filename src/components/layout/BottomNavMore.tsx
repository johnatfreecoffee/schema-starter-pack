import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Building2,
  Users,
  FolderKanban,
  FileText,
  Ticket,
  Star,
  BarChart3,
  ChartBar,
  Settings,
  LogOut,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BottomNavMoreProps {
  isAdmin: boolean;
}

export const BottomNavMore = ({ isAdmin }: BottomNavMoreProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  const moreItems = [
    { path: '/dashboard/accounts', icon: Building2, label: 'Accounts' },
    { path: '/dashboard/contacts', icon: Phone, label: 'Contacts' },
    { path: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/dashboard/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/dashboard/reviews', icon: Star, label: 'Reviews' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/dashboard/reports', icon: ChartBar, label: 'Reports' },
    { path: '/dashboard/logs', icon: FileText, label: 'Logs' },
    ...(isAdmin ? [{ path: '/dashboard/team', icon: Users, label: 'Team' }] : []),
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="flex flex-col items-center justify-center p-0 h-auto">
          <div className="h-5 w-5 flex items-center justify-center">•••</div>
          <span className="text-xs mt-1 font-medium">More</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>More Options</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg",
                  "bg-muted/50 hover:bg-muted transition-colors touch-manipulation"
                )}
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="text-xs text-center font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg",
              "bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors touch-manipulation"
            )}
          >
            <LogOut className="h-6 w-6 mb-2" />
            <span className="text-xs text-center font-medium">Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
