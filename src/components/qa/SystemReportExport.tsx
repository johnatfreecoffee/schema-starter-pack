import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { generateSystemReport, exportReportAsPDF, exportReportAsCSV } from '@/lib/systemReport';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const SystemReportExport = () => {
  const [generating, setGenerating] = useState(false);

  const handleExport = async (exportFormat: 'pdf' | 'csv') => {
    setGenerating(true);
    try {
      const report = await generateSystemReport();
      
      if (exportFormat === 'pdf') {
        exportReportAsPDF(report);
        toast.success('PDF report generated');
      } else {
        const csv = exportReportAsCSV(report);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const timestamp = format(now, 'yyyy-MM-dd');
        a.download = `system-report-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV report exported');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={generating} size="lg">
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Generate System Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <Download className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
