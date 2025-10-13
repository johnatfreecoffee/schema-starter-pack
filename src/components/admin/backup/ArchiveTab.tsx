import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { archiveService } from '@/services/archiveService';
import { Loader2, Archive, ArchiveRestore } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MODULES = [
  { value: 'leads', label: 'Leads' },
  { value: 'projects', label: 'Projects' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'quotes', label: 'Quotes' },
];

const ArchiveTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [archiveModule, setArchiveModule] = useState('leads');
  const [archiveDays, setArchiveDays] = useState(90);

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['archive_rules'],
    queryFn: () => archiveService.getArchiveRules(),
  });

  const { data: archivedData, isLoading: loadingArchived } = useQuery({
    queryKey: ['archived_data'],
    queryFn: () => archiveService.getArchivedData(),
  });

  const saveRuleMutation = useMutation({
    mutationFn: (rule: any) => archiveService.saveArchiveRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive_rules'] });
      toast({ title: 'Archive rule saved' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ module, days }: { module: string; days: number }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return archiveService.archiveRecords(module, cutoffDate);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['archived_data'] });
      toast({
        title: 'Records archived',
        description: `${count} records moved to archive`,
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => archiveService.unarchiveRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived_data'] });
      toast({ title: 'Record restored from archive' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Archive Settings</CardTitle>
          <CardDescription>Configure automatic archiving rules by module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MODULES.map((module) => {
            const rule = rules?.find((r) => r.module === module.value);
            return (
              <div key={module.value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">{module.label}</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Archive after</Label>
                      <Input
                        type="number"
                        value={rule?.days_threshold || 90}
                        onChange={(e) => {
                          const newRule = {
                            ...rule,
                            module: module.value,
                            days_threshold: parseInt(e.target.value),
                            auto_archive: rule?.auto_archive || false,
                          };
                          saveRuleMutation.mutate(newRule);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm">days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule?.auto_archive || false}
                        onCheckedChange={(checked) => {
                          const newRule = {
                            ...rule,
                            module: module.value,
                            days_threshold: rule?.days_threshold || 90,
                            auto_archive: checked,
                          };
                          saveRuleMutation.mutate(newRule);
                        }}
                      />
                      <Label className="text-sm">Auto-archive</Label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archive Now</CardTitle>
          <CardDescription>Manually archive records older than specified days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={archiveModule} onValueChange={setArchiveModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days Old</Label>
              <Input
                type="number"
                value={archiveDays}
                onChange={(e) => setArchiveDays(parseInt(e.target.value))}
              />
            </div>
          </div>
          <Button
            onClick={() => archiveMutation.mutate({ module: archiveModule, days: archiveDays })}
            disabled={archiveMutation.isPending}
            className="w-full"
          >
            {archiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archived Data</CardTitle>
          <CardDescription>View and restore archived records</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingArchived ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !archivedData || archivedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No archived data</div>
          ) : (
            <div className="space-y-2">
              {archivedData.slice(0, 20).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{item.original_table}</div>
                    <div className="text-sm text-muted-foreground">
                      Archived: {new Date(item.archived_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unarchiveMutation.mutate(item.id)}
                    disabled={unarchiveMutation.isPending}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchiveTab;
