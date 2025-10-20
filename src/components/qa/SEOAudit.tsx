import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, Search, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auditPageSEO, getScoreCategory, SEOScore } from '@/lib/seoAudit';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const SEOAudit = () => {
  const [scanning, setScanning] = useState(false);
  const [auditResults, setAuditResults] = useState<SEOScore[]>([]);
  const [selectedPage, setSelectedPage] = useState<SEOScore | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['generated-pages-seo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select('id, page_title, url_path, meta_description, rendered_html, status')
        .eq('status', true);

      if (error) throw error;
      return data || [];
    }
  });

  const runBulkSEOScan = async () => {
    if (!pages || pages.length === 0) {
      toast.error('No pages to scan');
      return;
    }

    setScanning(true);
    const results: SEOScore[] = [];

    try {
      for (const page of pages) {
        if (page.rendered_html) {
          const score = auditPageSEO(page.rendered_html, page);
          results.push(score);
        }
      }

      setAuditResults(results);
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      toast.success(`SEO scan complete - Average score: ${avgScore.toFixed(0)}/100`);
    } catch (error) {
      console.error('SEO scan error:', error);
      toast.error('Failed to complete SEO scan');
    } finally {
      setScanning(false);
    }
  };

  const exportSEOReport = () => {
    if (auditResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    const csv = [
      ['Page', 'URL', 'Score', 'Meta Title', 'Meta Desc', 'H1', 'Images', 'Links', 'Words'].join(','),
      ...auditResults.map(result => [
        result.pageTitle,
        result.url,
        result.score,
        result.checks.metaTitle.pass ? 'Pass' : 'Fail',
        result.checks.metaDescription.pass ? 'Pass' : 'Fail',
        result.checks.h1Tag.pass ? 'Pass' : 'Fail',
        result.checks.imageAltText.pass ? 'Pass' : 'Fail',
        result.checks.internalLinks.pass ? 'Pass' : 'Fail',
        result.checks.wordCount.pass ? 'Pass' : 'Fail'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SEO report exported');
  };

  const scoreDistribution = {
    excellent: auditResults.filter(r => r.score >= 90).length,
    good: auditResults.filter(r => r.score >= 70 && r.score < 90).length,
    needsWork: auditResults.filter(r => r.score >= 50 && r.score < 70).length,
    poor: auditResults.filter(r => r.score < 50).length
  };

  const overallScore = auditResults.length > 0
    ? Math.round(auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length)
    : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SEO Audit Tool</CardTitle>
              <CardDescription>
                Comprehensive SEO analysis for all generated pages
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runBulkSEOScan}
                disabled={scanning || isLoading}
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan All Pages
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={exportSEOReport}
                disabled={auditResults.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : auditResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click "Scan All Pages" to start SEO audit</p>
              <p className="text-sm mt-2">{pages?.length || 0} pages available to scan</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Overall SEO Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-3xl font-bold mb-2">
                        {overallScore}/100
                      </div>
                      <Progress value={overallScore} className="h-2" />
                    </div>
                    <Badge className={getScoreCategory(overallScore).color}>
                      {getScoreCategory(overallScore).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {scoreDistribution.excellent}
                    </div>
                    <p className="text-sm text-muted-foreground">Excellent (90-100)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {scoreDistribution.good}
                    </div>
                    <p className="text-sm text-muted-foreground">Good (70-89)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">
                      {scoreDistribution.needsWork}
                    </div>
                    <p className="text-sm text-muted-foreground">Needs Work (50-69)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">
                      {scoreDistribution.poor}
                    </div>
                    <p className="text-sm text-muted-foreground">Poor (0-49)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Page Results */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Page Results</h3>
                <div className="space-y-2">
                  {auditResults.map((result) => {
                    const category = getScoreCategory(result.score);
                    return (
                      <div
                        key={result.pageId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedPage(result)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{result.pageTitle}</p>
                          <p className="text-sm text-muted-foreground">{result.url}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{result.score}</div>
                            <Badge className={category.color}>{category.label}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Page Report Dialog */}
      <Dialog open={!!selectedPage} onOpenChange={() => setSelectedPage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPage?.pageTitle}</DialogTitle>
            <DialogDescription>{selectedPage?.url}</DialogDescription>
          </DialogHeader>
          {selectedPage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-3xl font-bold">{selectedPage.score}/100</div>
                  <Badge className={getScoreCategory(selectedPage.score).color}>
                    {getScoreCategory(selectedPage.score).label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">SEO Checks</h4>
                {Object.entries(selectedPage.checks).map(([key, check]) => (
                  <div key={key} className="flex items-start gap-3 p-3 border rounded">
                    {check.pass ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                    </div>
                    <div className="text-sm font-medium">{check.score}/10</div>
                  </div>
                ))}
              </div>

              {selectedPage.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {selectedPage.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
