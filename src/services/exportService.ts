import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export class ExportService {
  /**
   * Export analytics data to PDF format
   */
  static async exportToPDF(
    metrics: any,
    dateRange: { start: Date; end: Date },
    chartElements?: NodeListOf<Element>
  ): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246); // Primary color
      pdf.text('Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated: ${format(new Date(), 'PPpp')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      
      yPosition += 5;
      pdf.text(
        `Period: ${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

      yPosition += 15;

      // Add Overview Metrics
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Overview Metrics', 20, yPosition);
      yPosition += 10;

      const overviewData = [
        ['Total Revenue', this.formatCurrency(metrics.financial?.totalInvoicesValue || 0)],
        ['Active Projects', String(metrics.projects?.active || 0)],
        ['Open Leads', String((metrics.leads?.total || 0) - (metrics.leads?.converted || 0))],
        ['Pending Invoices', this.formatCurrency(metrics.financial?.outstandingInvoices || 0)],
      ];

      pdf.setFontSize(10);
      overviewData.forEach(([label, value]) => {
        pdf.text(label + ':', 20, yPosition);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, 100, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 7;
      });

      yPosition += 10;

      // Add Performance Metrics
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Performance Metrics', 20, yPosition);
      yPosition += 10;

      const performanceData = [
        ['Lead Conversion Rate', `${metrics.leads?.conversionRate || 0}%`],
        ['Tasks Completed', String(metrics.tasks?.completed || 0)],
        ['Overdue Tasks', String(metrics.tasks?.overdue || 0)],
        ['Customer Portal Logins', String(metrics.customer?.totalLogins || 0)],
      ];

      pdf.setFontSize(10);
      performanceData.forEach(([label, value]) => {
        pdf.text(label + ':', 20, yPosition);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, 100, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 7;
      });

      yPosition += 10;

      // Add charts if available
      if (chartElements && chartElements.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(14);
        pdf.text('Charts & Visualizations', 20, yPosition);
        yPosition += 10;

        for (let i = 0; i < Math.min(chartElements.length, 4); i++) {
          const chartElement = chartElements[i] as HTMLElement;
          try {
            const canvas = await html2canvas(chartElement, {
              scale: 2,
              backgroundColor: '#ffffff',
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (yPosition + imgHeight > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          } catch (error) {
            console.error('Error capturing chart:', error);
          }
        }
      }

      // Add footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Download the PDF
      const fileName = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Export analytics data to CSV format
   */
  static async exportToCSV(metrics: any, historicalData: any[]): Promise<void> {
    try {
      let csvContent = 'Analytics Report\n';
      csvContent += `Generated,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

      // Overview Metrics
      csvContent += 'Overview Metrics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,${this.formatCurrency(metrics.financial?.totalInvoicesValue || 0)}\n`;
      csvContent += `Active Projects,${metrics.projects?.active || 0}\n`;
      csvContent += `Open Leads,${(metrics.leads?.total || 0) - (metrics.leads?.converted || 0)}\n`;
      csvContent += `Pending Invoices,${this.formatCurrency(metrics.financial?.outstandingInvoices || 0)}\n`;
      csvContent += '\n';

      // Performance Metrics
      csvContent += 'Performance Metrics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Lead Conversion Rate,${metrics.leads?.conversionRate || 0}%\n`;
      csvContent += `Tasks Completed,${metrics.tasks?.completed || 0}\n`;
      csvContent += `Overdue Tasks,${metrics.tasks?.overdue || 0}\n`;
      csvContent += `Customer Portal Logins,${metrics.customer?.totalLogins || 0}\n`;
      csvContent += '\n';

      // Historical Data
      if (historicalData && historicalData.length > 0) {
        csvContent += 'Historical Trends (Last 30 Days)\n';
        csvContent += 'Date,Revenue,New Leads,Completed Tasks,Active Projects\n';
        historicalData.forEach((snapshot) => {
          csvContent += `${snapshot.snapshot_date},`;
          csvContent += `${(snapshot.revenue_today || 0) / 100},`;
          csvContent += `${snapshot.new_leads_today || 0},`;
          csvContent += `${snapshot.completed_tasks_today || 0},`;
          csvContent += `${snapshot.active_projects || 0}\n`;
        });
        csvContent += '\n';
      }

      // Lead Breakdown by Status
      if (metrics.leads?.byStatus) {
        csvContent += 'Leads by Status\n';
        csvContent += 'Status,Count\n';
        metrics.leads.byStatus.forEach((item: any) => {
          csvContent += `${item.status},${item.count}\n`;
        });
        csvContent += '\n';
      }

      // Project Breakdown by Status
      if (metrics.projects?.byStatus) {
        csvContent += 'Projects by Status\n';
        csvContent += 'Status,Count\n';
        metrics.projects.byStatus.forEach((item: any) => {
          csvContent += `${item.status},${item.count}\n`;
        });
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  }

  /**
   * Export module data to CSV format
   */
  static exportModuleToCSV(
    data: any[],
    moduleName: string,
    columns?: string[]
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // If no columns specified, use all keys from first object
    const exportColumns = columns || Object.keys(data[0]);

    // Filter data to only include specified columns
    const filteredData = data.map(row => {
      const filteredRow: any = {};
      exportColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    // Convert to CSV
    let csvContent = '';
    
    // Add headers
    csvContent += exportColumns.join(',') + '\n';
    
    // Add data rows
    filteredData.forEach(row => {
      const values = exportColumns.map(col => {
        const value = row[col];
        // Escape commas and quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${moduleName}_${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
