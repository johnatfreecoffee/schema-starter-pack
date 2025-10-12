import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CannedResponseSelectorProps {
  onSelect: (content: string) => void;
  customerName?: string;
  ticketNumber?: string;
}

export const CannedResponseSelector = ({ 
  onSelect, 
  customerName = '',
  ticketNumber = '' 
}: CannedResponseSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: responses } = useQuery({
    queryKey: ['canned-responses-selector', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('canned_responses')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('business_name')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const updateUsageCount = useMutation({
    mutationFn: async (id: string) => {
      const response = responses?.find(r => r.id === id);
      if (response) {
        const { error } = await supabase
          .from('canned_responses')
          .update({ usage_count: response.usage_count + 1 })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      queryClient.invalidateQueries({ queryKey: ['canned-responses-selector'] });
    }
  });

  const replaceVariables = (content: string): string => {
    let result = content;
    result = result.replace(/\{customer_name\}/g, customerName || '[Customer Name]');
    result = result.replace(/\{ticket_number\}/g, ticketNumber || '[Ticket Number]');
    result = result.replace(/\{company_name\}/g, companySettings?.business_name || '[Company Name]');
    return result;
  };

  const handleSelect = (response: any) => {
    const processedContent = replaceVariables(response.content);
    onSelect(processedContent);
    updateUsageCount.mutate(response.id);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Use Template
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search templates..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No templates found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {responses?.map((response) => (
              <CommandItem
                key={response.id}
                onSelect={() => handleSelect(response)}
                className="flex flex-col items-start gap-2 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{response.title}</span>
                  <Badge variant="outline" className="capitalize ml-auto">
                    {response.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {response.content}
                </p>
                {response.usage_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Used {response.usage_count} times
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
