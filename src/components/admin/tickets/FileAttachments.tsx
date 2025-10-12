import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileIcon, Trash2, Upload, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FileAttachmentsProps {
  onFilesUploaded: (fileUrls: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
}

export const FileAttachments = ({ 
  onFilesUploaded, 
  existingFiles = [], 
  maxFiles = 5 
}: FileAttachmentsProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<string[]>(existingFiles);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Each file must be under 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress((i / selectedFiles.length) * 100);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const newFiles = [...files, ...uploadedUrls];
      setFiles(newFiles);
      onFilesUploaded(newFiles);
      
      toast({ title: 'Files uploaded successfully' });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (urlToRemove: string) => {
    const newFiles = files.filter(url => url !== urlToRemove);
    setFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop()?.split('?')[0] || 'file';
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    // You could add more specific icons based on file type
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">
          Attachments (Max {maxFiles} files, 10MB each)
        </Label>
        <Input
          id="file-upload"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          disabled={uploading || files.length >= maxFiles}
          className="mt-1"
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading...</p>
          <Progress value={uploadProgress} />
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached Files:</p>
          <div className="space-y-2">
            {files.map((url, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(url)}
                  <span className="text-sm truncate max-w-[300px]">
                    {getFileName(url)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(url)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
