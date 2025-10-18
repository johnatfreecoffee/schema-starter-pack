import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AutomatedEmailTriggers } from '@/services/automatedEmailTriggers';

/**
 * Hook to automatically trigger emails on entity events via Supabase Realtime
 */
export const useEmailTriggers = () => {
  useEffect(() => {
    // Subscribe to lead creation and updates
    const leadsChannel = supabase
      .channel('leads-email-triggers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        async (payload) => {
          console.log('🔔 New lead created, checking for email trigger:', payload.new);
          await AutomatedEmailTriggers.onLeadCreated(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        async (payload) => {
          // Check if status changed
          if (payload.old && payload.old.status !== payload.new.status) {
            console.log('🔔 Lead status changed, checking for email trigger');
            await AutomatedEmailTriggers.onLeadStatusChanged(payload.new, payload.old.status);
          }
        }
      )
      .subscribe();

    // Subscribe to appointment creation
    const appointmentsChannel = supabase
      .channel('appointments-email-triggers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events'
        },
        async (payload) => {
          console.log('🔔 New appointment created, checking for email trigger:', payload.new);
          
          if (payload.new.account_id) {
            await AutomatedEmailTriggers.onAppointmentScheduled(payload.new, payload.new.account_id);
          }
        }
      )
      .subscribe();

    // Subscribe to project status changes
    const projectsChannel = supabase
      .channel('projects-email-triggers')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects'
        },
        async (payload) => {
          // Check if status changed
          if (payload.old && payload.old.status !== payload.new.status) {
            console.log('🔔 Project status changed, checking for email trigger');
            
            if (payload.new.account_id) {
              await AutomatedEmailTriggers.onProjectStatusChanged(
                payload.new,
                payload.old.status,
                payload.new.account_id
              );
            }
          }
        }
      )
      .subscribe();

    // Subscribe to invoice status changes
    const invoicesChannel = supabase
      .channel('invoices-email-triggers')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices'
        },
        async (payload) => {
          // Check if status changed to 'sent'
          if (payload.old && payload.old.status !== 'sent' && payload.new.status === 'sent') {
            console.log('🔔 Invoice sent, checking for email trigger');
            
            if (payload.new.account_id) {
              await AutomatedEmailTriggers.onInvoiceSent(payload.new, payload.new.account_id);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(invoicesChannel);
    };
  }, []);
};
