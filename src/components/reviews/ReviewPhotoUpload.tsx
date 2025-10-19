import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ReviewPhotoUploadProps {
  onPhotoUploaded: (url: string) => void;
  currentPhotoUrl?: string;
  onPhotoRemoved?: () => void;
}

export function ReviewPhotoUpload({
  onPhotoUploaded,
  currentPhotoUrl,
  onPhotoRemoved
}: ReviewPhotoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('review-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(data.path);

      onPhotoUploaded(publicUrl);
      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been uploaded successfully'
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoRemoved?.();
  };

  return (
    <div className="space-y-4">
      <Label>Photo (Optional)</Label>
      
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img
            src={preview}
            alt="Review photo preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            type="file"
            id="photo-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="photo-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <Upload className="w-8 h-8 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload a photo
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or WebP (max 5MB)
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
