import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchResult {
  id: string;
  type: 'lead' | 'account' | 'contact' | 'project' | 'task' | 'event' | 'quote' | 'invoice';
  title: string;
  subtitle: string;
  metadata?: string;
}

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({});
      return;
    }

    const searchAll = async () => {
      setLoading(true);
      try {
        const searchTerm = `%${debouncedQuery}%`;
        
        // Search leads
        const { data: leads } = await supabase
          .from('leads')
          .select('id, first_name, last_name, email, phone, service_needed')
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .limit(5);

        // Search accounts
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, account_name, industry, website')
          .ilike('account_name', searchTerm)
          .limit(5);

        // Search contacts
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, title')
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .limit(5);

        // Search projects
        const { data: projects } = await supabase
          .from('projects')
          .select('id, project_name, status, description')
          .or(`project_name.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(5);

        // Search tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, status, priority, description')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(5);

        // Search calendar events
        const { data: events } = await supabase
          .from('calendar_events')
          .select('id, title, description, start_time, location')
          .or(`title.ilike.${searchTerm},location.ilike.${searchTerm}`)
          .limit(5);

        // Search quotes
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id, quote_number, total_amount, status')
          .ilike('quote_number', searchTerm)
          .limit(5);

        // Search invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, status')
          .ilike('invoice_number', searchTerm)
          .limit(5);

        // Format results
        const formattedResults: Record<string, SearchResult[]> = {};

        if (leads && leads.length > 0) {
          formattedResults.leads = leads.map(l => ({
            id: l.id,
            type: 'lead',
            title: `${l.first_name} ${l.last_name}`,
            subtitle: l.email,
            metadata: l.service_needed,
          }));
        }

        if (accounts && accounts.length > 0) {
          formattedResults.accounts = accounts.map(a => ({
            id: a.id,
            type: 'account',
            title: a.account_name,
            subtitle: a.industry || '',
            metadata: a.website,
          }));
        }

        if (contacts && contacts.length > 0) {
          formattedResults.contacts = contacts.map(c => ({
            id: c.id,
            type: 'contact',
            title: `${c.first_name} ${c.last_name}`,
            subtitle: c.email,
            metadata: c.title,
          }));
        }

        if (projects && projects.length > 0) {
          formattedResults.projects = projects.map(p => ({
            id: p.id,
            type: 'project',
            title: p.project_name,
            subtitle: p.status,
            metadata: p.description,
          }));
        }

        if (tasks && tasks.length > 0) {
          formattedResults.tasks = tasks.map(t => ({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: `${t.status} - ${t.priority}`,
            metadata: t.description,
          }));
        }

        if (events && events.length > 0) {
          formattedResults.events = events.map(e => ({
            id: e.id,
            type: 'event',
            title: e.title,
            subtitle: new Date(e.start_time).toLocaleDateString(),
            metadata: e.location,
          }));
        }

        if (quotes && quotes.length > 0) {
          formattedResults.quotes = quotes.map(q => ({
            id: q.id,
            type: 'quote',
            title: q.quote_number,
            subtitle: q.status,
            metadata: `$${(q.total_amount / 100).toFixed(2)}`,
          }));
        }

        if (invoices && invoices.length > 0) {
          formattedResults.invoices = invoices.map(i => ({
            id: i.id,
            type: 'invoice',
            title: i.invoice_number,
            subtitle: i.status,
            metadata: `$${(i.total_amount / 100).toFixed(2)}`,
          }));
        }

        setResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults({});
      } finally {
        setLoading(false);
      }
    };

    searchAll();
  }, [debouncedQuery]);

  return { results, loading };
}
