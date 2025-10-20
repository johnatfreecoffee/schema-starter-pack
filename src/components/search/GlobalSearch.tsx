import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const moduleLabels: Record<string, string> = {
  leads: 'Leads',
  accounts: 'Accounts',
  contacts: 'Contacts',
  projects: 'Projects',
  tasks: 'Tasks',
  events: 'Calendar Events',
  quotes: 'Quotes',
  invoices: 'Invoices',
};

const moduleRoutes: Record<string, string> = {
  lead: '/dashboard/leads',
  account: '/dashboard/accounts',
  contact: '/dashboard/contacts',
  project: '/dashboard/projects',
  task: '/dashboard/tasks',
  event: '/dashboard/appointments',
  quote: '/dashboard/quotes',
  invoice: '/dashboard/invoices',
};

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 10;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading } = useGlobalSearch(query);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleResultClick = (type: string, id: string) => {
    const basePath = moduleRoutes[type];
    if (basePath) {
      saveRecentSearch(query);
      navigate(`${basePath}/${id}`);
      setOpen(false);
      setQuery('');
    }
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const totalResults = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors md:w-64 w-auto"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="ml-auto pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, accounts, contacts, projects..."
              className="flex h-11 w-full border-0 bg-transparent py-3 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="shrink-0 p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <ScrollArea className="max-h-[400px]">
            {loading && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            )}

            {!loading && query && totalResults === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No results found
              </div>
            )}

            {!loading && totalResults > 0 && (
              <div className="p-2">
                {Object.entries(results).map(([module, items]) => (
                  <div key={module} className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      {moduleLabels[module]} ({items.length})
                    </div>
                    <div className="space-y-1">
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.type, result.id)}
                          className="w-full flex items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </div>
                            {result.metadata && (
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {result.metadata}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 capitalize">
                            {result.type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !query && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Recent Searches
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && !query && recentSearches.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Start typing to search across all modules
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
