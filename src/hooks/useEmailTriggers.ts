import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmailTriggers } from '@/services/emailTriggers';

/**
 * Hook to automatically trigger emails on entity events
 */
export const useEmailTriggers = () => {
  useEffect(() => {
    // Subscribe to lead creation
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        async (payload) => {
          console.log('New lead created:', payload.new);
          await EmailTriggers.onLeadSubmission(payload.new);
        }
      )
      .subscribe();

    // Subscribe to appointment creation
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events'
        },
        async (payload) => {
          console.log('New appointment created:', payload.new);
          
          // Fetch account data
          if (payload.new.account_id) {
            const { data: account } = await supabase
              .from('accounts')
              .select('*')
              .eq('id', payload.new.account_id)
              .single();
            
            if (account) {
              await EmailTriggers.onAppointmentScheduled(payload.new, account);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to project status changes
    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects'
        },
        async (payload) => {
          console.log('Project updated:', payload.new);
          
          // Check if status changed
          if (payload.old && payload.old.status !== payload.new.status) {
            // Fetch account data
            if (payload.new.account_id) {
              const { data: account } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', payload.new.account_id)
                .single();
              
              if (account) {
                await EmailTriggers.onProjectUpdate(payload.new, account, payload.old.status);
              }
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
    };
  }, []);
};
