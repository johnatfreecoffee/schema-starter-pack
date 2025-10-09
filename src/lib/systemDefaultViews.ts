import { startOfWeek, endOfWeek, startOfMonth, startOfDay } from 'date-fns';

export interface SystemDefaultView {
  id: string;
  name: string;
  filters: Record<string, any>;
  icon?: string;
}

export const getSystemDefaultViews = (module: string, currentUserId?: string): SystemDefaultView[] => {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);

  const viewsByModule: Record<string, SystemDefaultView[]> = {
    leads: [
      {
        id: 'my-leads',
        name: 'My Leads',
        filters: { assignedTo: currentUserId },
        icon: 'user'
      },
      {
        id: 'new-this-week',
        name: 'New This Week',
        filters: { 
          status: ['new'],
          createdFrom: weekStart.toISOString()
        },
        icon: 'calendar'
      },
      {
        id: 'needs-followup',
        name: 'Needs Follow-up',
        filters: { status: ['new', 'contacted'] },
        icon: 'phone'
      }
    ],
    accounts: [
      {
        id: 'my-accounts',
        name: 'My Accounts',
        filters: { assignedTo: currentUserId },
        icon: 'user'
      },
      {
        id: 'active-clients',
        name: 'Active Clients',
        filters: { 
          accountType: 'client',
          status: 'active'
        },
        icon: 'building'
      },
      {
        id: 'new-this-month',
        name: 'New This Month',
        filters: { createdFrom: monthStart.toISOString() },
        icon: 'calendar'
      }
    ],
    contacts: [
      {
        id: 'missing-email',
        name: 'Missing Email',
        filters: { hasEmail: false },
        icon: 'mail'
      },
      {
        id: 'missing-phone',
        name: 'Missing Phone',
        filters: { hasPhone: false },
        icon: 'phone'
      }
    ],
    projects: [
      {
        id: 'my-projects',
        name: 'My Projects',
        filters: { assignedTo: currentUserId },
        icon: 'user'
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        filters: { status: ['in_progress'] },
        icon: 'activity'
      },
      {
        id: 'overdue',
        name: 'Overdue',
        filters: { 
          endDateTo: today.toISOString(),
          status: ['planning', 'in_progress', 'on_hold']
        },
        icon: 'alert-circle'
      }
    ],
    tasks: [
      {
        id: 'my-tasks',
        name: 'My Tasks',
        filters: { assignedTo: 'me' },
        icon: 'user'
      },
      {
        id: 'overdue',
        name: 'Overdue',
        filters: { isOverdue: true },
        icon: 'alert-circle'
      },
      {
        id: 'high-priority',
        name: 'High Priority',
        filters: { priority: ['high', 'urgent'] },
        icon: 'alert-triangle'
      },
      {
        id: 'due-this-week',
        name: 'Due This Week',
        filters: { 
          dueDateFrom: weekStart.toISOString(),
          dueDateTo: weekEnd.toISOString()
        },
        icon: 'calendar'
      }
    ],
    calendar_events: [
      {
        id: 'my-events',
        name: 'My Events',
        filters: { assignedTo: 'me' },
        icon: 'user'
      },
      {
        id: 'this-week',
        name: 'This Week',
        filters: { 
          startDateFrom: weekStart.toISOString(),
          startDateTo: weekEnd.toISOString()
        },
        icon: 'calendar'
      },
      {
        id: 'upcoming',
        name: 'Upcoming',
        filters: { startDateFrom: today.toISOString() },
        icon: 'clock'
      }
    ],
    quotes: [
      {
        id: 'pending',
        name: 'Pending',
        filters: { status: 'sent' },
        icon: 'clock'
      },
      {
        id: 'this-month',
        name: 'This Month',
        filters: { createdFrom: monthStart.toISOString() },
        icon: 'calendar'
      },
      {
        id: 'expiring-soon',
        name: 'Expiring Soon',
        filters: { 
          validUntilFrom: today.toISOString(),
          validUntilTo: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        icon: 'alert-triangle'
      }
    ],
    invoices: [
      {
        id: 'overdue',
        name: 'Overdue',
        filters: { status: 'overdue' },
        icon: 'alert-circle'
      },
      {
        id: 'unpaid',
        name: 'Unpaid',
        filters: { paymentStatus: 'unpaid' },
        icon: 'dollar-sign'
      },
      {
        id: 'this-month',
        name: 'This Month',
        filters: { issueDateFrom: monthStart.toISOString() },
        icon: 'calendar'
      }
    ]
  };

  return viewsByModule[module] || [];
};
