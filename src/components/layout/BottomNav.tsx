import { Link, useLocation } from 'react-router-dom';
import { 
  UserPlus, 
  CheckSquare, 
  Calendar, 
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNavMore } from './BottomNavMore';

interface BottomNavProps {
  isAdmin: boolean;
}

const BottomNav = ({ isAdmin }: BottomNavProps) => {
  const location = useLocation();

  // Show only essential items on mobile + More menu
  const mobileNavItems = [
    { path: '/dashboard/leads', icon: UserPlus, label: 'Leads' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/dashboard/calendars', icon: Calendar, label: 'Calendar' },
    { path: '/dashboard/money', icon: DollarSign, label: 'Money' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
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
        <div className="flex flex-col items-center justify-center px-3 py-2 min-w-[60px]">
          <BottomNavMore isAdmin={isAdmin} />
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
