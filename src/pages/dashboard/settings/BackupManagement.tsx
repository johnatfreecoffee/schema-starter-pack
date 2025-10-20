import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackupTab from '@/components/admin/backup/BackupTab';
import RestoreTab from '@/components/admin/backup/RestoreTab';
import ScheduleTab from '@/components/admin/backup/ScheduleTab';
import ArchiveTab from '@/components/admin/backup/ArchiveTab';
import DataHealthTab from '@/components/admin/backup/DataHealthTab';
import StorageTab from '@/components/admin/backup/StorageTab';
import ExportImportTab from '@/components/admin/backup/ExportImportTab';

const BackupManagement = () => {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Backup & Data Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage backups, restore data, archive old records, and monitor data health
          </p>
        </div>

        <Tabs defaultValue="backups" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
            <TabsTrigger value="health">Data Health</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="export">Export/Import</TabsTrigger>
          </TabsList>

          <TabsContent value="backups">
            <BackupTab />
          </TabsContent>

          <TabsContent value="restore">
            <RestoreTab />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTab />
          </TabsContent>

          <TabsContent value="archive">
            <ArchiveTab />
          </TabsContent>

          <TabsContent value="health">
            <DataHealthTab />
          </TabsContent>

          <TabsContent value="storage">
            <StorageTab />
          </TabsContent>

          <TabsContent value="export">
            <ExportImportTab />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default BackupManagement;
