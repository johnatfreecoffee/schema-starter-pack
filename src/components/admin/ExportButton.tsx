import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExportService } from '@/services/exportService';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  moduleName: string;
  columns?: string[];
  filters?: Record<string, any>;
  isFiltered?: boolean;
  filteredCount?: number;
}

export function ExportButton({
  data,
  moduleName,
  columns,
  filters,
  isFiltered = false,
  filteredCount,
}: ExportButtonProps) {
  const { toast } = useToast();

  const handleExportCSV = () => {
    try {
      ExportService.exportModuleToCSV(data, moduleName, columns, filters);
      toast({
        title: 'Success',
        description: `Exported ${data.length} records to CSV`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await ExportService.exportModuleToPDF(data, moduleName, columns, filters);
      toast({
        title: 'Success',
        description: `Exported ${Math.min(data.length, 50)} records to PDF`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
          {isFiltered && (
            <Badge variant="secondary" className="ml-1">
              {filteredCount || data.length} filtered
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
