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
   * Export module data to CSV format with optional filtering
   */
  static exportModuleToCSV(
    data: any[],
    moduleName: string,
    columns?: string[],
    filters?: Record<string, any>
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Technical fields to exclude from exports
    const excludedFields = ['__lovable_token', 'user_id', 'company_id'];
    
    // If no columns specified, use all keys from first object, excluding technical fields
    let exportColumns = columns || Object.keys(data[0]);
    
    // Filter out technical fields and fields starting with underscore
    exportColumns = exportColumns.filter(col => 
      !excludedFields.includes(col) && !col.startsWith('_')
    );

    // Filter data to only include specified columns
    const filteredData = data.map(row => {
      const filteredRow: any = {};
      exportColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    // Convert to CSV - start directly with headers (no extra text)
    let csvContent = exportColumns.join(',') + '\n';
    
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
    const hasFilters = filters && Object.keys(filters).length > 0;
    const filename = hasFilters ? `${moduleName}_filtered_${today}.csv` : `${moduleName}_${today}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export module data to PDF format with landscape orientation and text wrapping
   */
  static async exportModuleToPDF(
    data: any[],
    moduleName: string,
    columns?: string[],
    filters?: Record<string, any>
  ): Promise<void> {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    try {
      // Use LANDSCAPE orientation for better column visibility
      const pdf = new jsPDF('l', 'mm', 'letter'); // 'l' = landscape, letter = 8.5" x 11"
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12.7; // 0.5 inch margins
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Technical fields to exclude from PDF exports
      const excludedFields = ['__lovable_token', 'user_id', 'company_id'];
      
      // Get columns and filter out technical fields
      let exportColumns = columns || (data[0] ? Object.keys(data[0]) : []);
      exportColumns = exportColumns.filter(col => 
        !excludedFields.includes(col) && !col.startsWith('_')
      );

      // Header
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text(`${moduleName} Export`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated: ${format(new Date(), 'PPpp')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

      yPosition += 6;
      pdf.text(
        `Total Records: ${data.length}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

      yPosition += 10;

      // Calculate optimal font size and column width based on number of columns
      const numColumns = exportColumns.length;
      let fontSize = 8;
      if (numColumns > 15) fontSize = 6;
      else if (numColumns > 10) fontSize = 7;
      
      const colWidth = contentWidth / numColumns;
      const maxRecords = 100; // Increased from 50
      const recordsToExport = data.slice(0, maxRecords);

      // Helper function to wrap text within column width
      const wrapText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = pdf.getTextWidth(testLine);
          
          if (textWidth > maxWidth - 2) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Table headers (bold)
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      exportColumns.forEach((col, i) => {
        const headerText = String(col).replace(/_/g, ' ').toUpperCase();
        const lines = wrapText(headerText, colWidth);
        lines.forEach((line, lineIndex) => {
          pdf.text(line, margin + (i * colWidth), yPosition + (lineIndex * 4), { maxWidth: colWidth - 2 });
        });
      });
      
      yPosition += Math.max(6, exportColumns.length > 10 ? 8 : 10);

      // Table rows
      pdf.setFont('helvetica', 'normal');
      let rowIndex = 0;
      
      recordsToExport.forEach((row) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 20) {
          pdf.addPage();
          yPosition = margin;
        }

        // Alternate row background for readability
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, yPosition - 3, contentWidth, fontSize + 2, 'F');
        }

        // Calculate row height needed for wrapped text
        let maxLines = 1;
        exportColumns.forEach((col, i) => {
          const value = row[col];
          let text = '';
          
          if (value === null || value === undefined) {
            text = '';
          } else if (typeof value === 'boolean') {
            text = value ? 'Yes' : 'No';
          } else if (value instanceof Date) {
            text = format(value, 'PP');
          } else {
            text = String(value);
          }
          
          const lines = wrapText(text, colWidth);
          maxLines = Math.max(maxLines, lines.length);
        });

        // Render each column with wrapped text
        exportColumns.forEach((col, i) => {
          const value = row[col];
          let text = '';
          
          if (value === null || value === undefined) {
            text = '';
          } else if (typeof value === 'boolean') {
            text = value ? 'Yes' : 'No';
          } else if (value instanceof Date) {
            text = format(value, 'PP');
          } else {
            text = String(value);
          }
          
          const lines = wrapText(text, colWidth);
          lines.forEach((line, lineIndex) => {
            pdf.text(line, margin + (i * colWidth), yPosition + (lineIndex * (fontSize - 2)), { maxWidth: colWidth - 2 });
          });
        });
        
        yPosition += maxLines * (fontSize - 2) + 2;
        rowIndex++;
      });

      if (data.length > maxRecords) {
        yPosition += 5;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Note: Showing first ${maxRecords} of ${data.length} records. Export to CSV for complete data.`,
          pageWidth / 2,
          yPosition,
          { align: 'center' }
        );
      }

      // Footer with page numbers
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - (margin / 2),
          { align: 'center' }
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const filename = `${moduleName}_${today}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }
}
