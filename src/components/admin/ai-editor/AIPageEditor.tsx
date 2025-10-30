import { useState, useEffect } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AIChat from './AIChat';
import PagePreview from './PagePreview';
import EditHistory from './EditHistory';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { callEdgeFunction } from '@/utils/callEdgeFunction';

interface AIPageEditorProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  pageType: 'generated' | 'static' | 'template';
  initialContent: string;
  pageTitle: string;
  onSave: (content: string) => Promise<void>;
}

const AIPageEditor = ({
  open,
  onClose,
  pageId,
  pageType,
  initialContent,
  pageTitle,
  onSave
}: AIPageEditorProps) => {
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();
  const { data: companySettings } = useCompanySettings();

  useEffect(() => {
    setCurrentContent(initialContent);
    setPreviewContent(initialContent);
  }, [initialContent, open]);

  const handleAIEdit = async (command: string) => {
    setIsLoading(true);
    try {
      // Fetch AI training data
      const { data: aiTraining } = await supabase
        .from('ai_training')
        .select('*')
        .single();

      // Build context
      const context = {
        companyInfo: companySettings || {},
        aiTraining: aiTraining || {},
        currentPage: {
          type: pageType,
          html: currentContent,
          title: pageTitle,
          url: pageId
        }
      };

      // Call AI edit function
      const data = await callEdgeFunction<{ updatedHtml: string; explanation?: string }>({
        name: 'ai-edit-page',
        body: { command, context },
        timeoutMs: 300000,
      });

      const { updatedHtml } = data;
      setPreviewContent(updatedHtml);
      setIsDraft(true);
      
      toast({
        title: 'Changes Preview Ready',
        description: 'Review the changes in the preview pane',
      });

    } catch (error) {
      console.error('AI edit error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process AI edit',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChanges = () => {
    setCurrentContent(previewContent);
    setIsDraft(true);
    toast({
      title: 'Changes Accepted',
      description: 'Changes applied. Click Publish to save.',
    });
  };

  const handleRejectChanges = () => {
    setPreviewContent(currentContent);
    setIsDraft(false);
    toast({
      title: 'Changes Rejected',
      description: 'Preview reset to current version',
    });
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);

      // AI Verification Layer
      toast({
        title: 'Validating page...',
        description: 'Running quality checks',
      });

      const validated = await callEdgeFunction<{ fixedHtml: string; issuesFixed?: string[] }>({
        name: 'validate-and-fix-html',
        body: {
          html: currentContent,
          pageType,
          pageTitle,
        },
        timeoutMs: 180000,
      });

      const finalHtml = validated.fixedHtml;

      // Save edit history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('page_edit_history').insert({
          page_id: pageId,
          page_type: pageType,
          previous_content: initialContent,
          new_content: finalHtml,
          ai_command: validated.issuesFixed?.length > 0 
            ? `Auto-fixed: ${validated.issuesFixed.join(', ')}` 
            : 'Manual publish',
          edit_description: 'Published via AI editor with validation',
          edited_by: user.id,
        });
      }

      // Save validated HTML
      await onSave(finalHtml);

      toast({
        title: 'Published Successfully',
        description: validated.issuesFixed?.length > 0
          ? `Fixed ${validated.issuesFixed.length} issues automatically`
          : 'Page changes are now live',
      });

      onClose();

    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish changes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (historyId: string, content: string) => {
    setCurrentContent(content);
    setPreviewContent(content);
    setIsDraft(true);
    toast({
      title: 'Reverted',
      description: 'Content reverted to selected version',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Editing: {pageTitle}</DialogTitle>
            <div className="flex gap-2">
              {isDraft && (
                <Button variant="outline" size="sm" onClick={handlePublish} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Publish Changes
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(100%-80px)]">
          {/* Left Panel - Preview */}
          <div className="w-3/5 border-r p-4">
            <PagePreview content={previewContent} />
            {isDraft && previewContent !== currentContent && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAcceptChanges} size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Accept Changes
                </Button>
                <Button onClick={handleRejectChanges} variant="outline" size="sm">
                  Reject
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - AI Chat & History */}
          <div className="w-2/5 flex flex-col">
            <div className="flex-1 p-4 overflow-auto">
              <AIChat onSendCommand={handleAIEdit} isLoading={isLoading} />
            </div>
            <div className="border-t p-4 max-h-[300px] overflow-auto">
              <EditHistory 
                pageId={pageId} 
                pageType={pageType}
                onRevert={handleRevert}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIPageEditor;