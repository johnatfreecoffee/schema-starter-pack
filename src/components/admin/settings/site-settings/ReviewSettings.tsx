import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function ReviewSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [settings, setSettings] = useState({
    reviews_enabled: true,
    reviews_min_rating: 1,
    reviews_default_sort: 'featured_first',
    reviews_per_page: 12,
    reviews_show_last_name: false,
    reviews_require_approval: true,
    reviews_allow_photos: true,
    reviews_spam_filter_enabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          reviews_enabled: data.reviews_enabled ?? true,
          reviews_min_rating: data.reviews_min_rating ?? 1,
          reviews_default_sort: data.reviews_default_sort ?? 'featured_first',
          reviews_per_page: data.reviews_per_page ?? 12,
          reviews_show_last_name: data.reviews_show_last_name ?? false,
          reviews_require_approval: data.reviews_require_approval ?? true,
          reviews_allow_photos: data.reviews_allow_photos ?? true,
          reviews_spam_filter_enabled: data.reviews_spam_filter_enabled ?? true
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading settings',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .single();

        if (existing) {
          const { error } = await supabase
            .from('site_settings')
            .update(settings)
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('site_settings')
            .insert([settings]);

          if (error) throw error;
        }
        
        setIsSaving(false);
      } catch (error: any) {
        toast({
          title: 'Error saving settings',
          description: error.message,
          variant: 'destructive'
        });
        setIsSaving(false);
      }
    }, 1000);
  }

  useEffect(() => {
    if (!loading) {
      handleAutoSave();
    }
  }, [settings]);

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {isSaving && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how reviews are displayed and managed on your website
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Reviews</Label>
            <p className="text-sm text-muted-foreground">
              Display reviews on your website
            </p>
          </div>
          <Switch
            checked={settings.reviews_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reviews_enabled: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Approval</Label>
            <p className="text-sm text-muted-foreground">
              Reviews must be approved before displaying publicly
            </p>
          </div>
          <Switch
            checked={settings.reviews_require_approval}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reviews_require_approval: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Photo Uploads</Label>
            <p className="text-sm text-muted-foreground">
              Let customers upload photos with their reviews
            </p>
          </div>
          <Switch
            checked={settings.reviews_allow_photos}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reviews_allow_photos: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Spam Filtering</Label>
            <p className="text-sm text-muted-foreground">
              Automatically flag suspicious reviews for moderation
            </p>
          </div>
          <Switch
            checked={settings.reviews_spam_filter_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reviews_spam_filter_enabled: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Privacy: Show Only First Name + Last Initial</Label>
            <p className="text-sm text-muted-foreground">
              Display "John D." instead of "John Doe"
            </p>
          </div>
          <Switch
            checked={settings.reviews_show_last_name}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reviews_show_last_name: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Minimum Rating to Display</Label>
          <Select
            value={settings.reviews_min_rating.toString()}
            onValueChange={(value) =>
              setSettings({ ...settings, reviews_min_rating: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Star and Above</SelectItem>
              <SelectItem value="2">2 Stars and Above</SelectItem>
              <SelectItem value="3">3 Stars and Above</SelectItem>
              <SelectItem value="4">4 Stars and Above</SelectItem>
              <SelectItem value="5">5 Stars Only</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Only show reviews with this rating or higher
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default Sort Order</Label>
          <Select
            value={settings.reviews_default_sort}
            onValueChange={(value) =>
              setSettings({ ...settings, reviews_default_sort: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured_first">Featured First</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How reviews are sorted on the public page
          </p>
        </div>

        <div className="space-y-2">
          <Label>Reviews Per Page</Label>
          <Input
            type="number"
            min={6}
            max={24}
            value={settings.reviews_per_page}
            onChange={(e) =>
              setSettings({
                ...settings,
                reviews_per_page: parseInt(e.target.value) || 12
              })
            }
          />
          <p className="text-sm text-muted-foreground">
            Number of reviews to display per page (6-24)
          </p>
        </div>
      </div>
    </div>
  );
}
