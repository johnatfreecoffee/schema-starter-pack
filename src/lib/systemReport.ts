import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface SystemReport {
  generatedAt: string;
  summary: {
    totalLeads: number;
    totalAccounts: number;
    totalContacts: number;
    totalProjects: number;
    totalInvoices: number;
    totalQuotes: number;
    totalPages: number;
    systemHealthScore: number;
    criticalIssues: number;
  };
  recentActivity: any[];
  errors: any[];
  recommendations: string[];
}

export const generateSystemReport = async (): Promise<SystemReport> => {
  // Fetch all counts
  const [
    { count: leadsCount },
    { count: accountsCount },
    { count: contactsCount },
    { count: projectsCount },
    { count: invoicesCount },
    { count: quotesCount },
    { count: pagesCount },
    { data: recentActivity },
    { data: errors }
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('accounts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('generated_pages').select('*', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'system')
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const recommendations: string[] = [];
  const criticalIssues = errors?.length || 0;

  // Generate recommendations based on data
  if ((leadsCount || 0) < 10) {
    recommendations.push('Low lead count - consider implementing lead generation campaigns');
  }
  if ((pagesCount || 0) < 5) {
    recommendations.push('Generate more service pages to improve SEO coverage');
  }
  if (criticalIssues > 0) {
    recommendations.push(`${criticalIssues} critical errors need attention - check error logs`);
  }

  // Calculate health score (simple algorithm)
  let healthScore = 100;
  if (criticalIssues > 0) healthScore -= criticalIssues * 10;
  if ((leadsCount || 0) === 0) healthScore -= 20;
  if ((pagesCount || 0) === 0) healthScore -= 15;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalLeads: leadsCount || 0,
      totalAccounts: accountsCount || 0,
      totalContacts: contactsCount || 0,
      totalProjects: projectsCount || 0,
      totalInvoices: invoicesCount || 0,
      totalQuotes: quotesCount || 0,
      totalPages: pagesCount || 0,
      systemHealthScore: healthScore,
      criticalIssues
    },
    recentActivity: recentActivity || [],
    errors: errors || [],
    recommendations
  };
};

export const exportReportAsPDF = (report: SystemReport, companyName: string = 'System') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Title
  doc.setFontSize(20);
  doc.text('System Health Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(report.generatedAt), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });
  
  // Executive Summary
  doc.setFontSize(14);
  doc.text('Executive Summary', 14, 40);
  
  const summaryData = [
    ['Metric', 'Value'],
    ['System Health Score', `${report.summary.systemHealthScore}/100`],
    ['Critical Issues', report.summary.criticalIssues.toString()],
    ['Total Leads', report.summary.totalLeads.toString()],
    ['Total Accounts', report.summary.totalAccounts.toString()],
    ['Total Contacts', report.summary.totalContacts.toString()],
    ['Total Projects', report.summary.totalProjects.toString()],
    ['Total Pages', report.summary.totalPages.toString()]
  ];

  autoTable(doc, {
    startY: 45,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Recommendations
  if (report.recommendations.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(14);
    doc.text('Recommendations', 14, finalY + 15);
    
    doc.setFontSize(10);
    report.recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, 14, finalY + 25 + (i * 7));
    });
  }

  // Save
  doc.save(`system-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportReportAsCSV = (report: SystemReport): string => {
  const rows = [
    ['System Health Report'],
    ['Generated', format(new Date(report.generatedAt), 'PPpp')],
    [''],
    ['Metric', 'Value'],
    ['System Health Score', `${report.summary.systemHealthScore}/100`],
    ['Critical Issues', report.summary.criticalIssues.toString()],
    ['Total Leads', report.summary.totalLeads.toString()],
    ['Total Accounts', report.summary.totalAccounts.toString()],
    ['Total Contacts', report.summary.totalContacts.toString()],
    ['Total Projects', report.summary.totalProjects.toString()],
    ['Total Pages', report.summary.totalPages.toString()],
    [''],
    ['Recommendations'],
    ...report.recommendations.map(r => [r])
  ];

  return rows.map(row => row.join(',')).join('\n');
};
