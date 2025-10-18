import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, Trash2, Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSavedViews } from '@/hooks/useSavedViews';
import { getSystemDefaultViews } from '@/lib/systemDefaultViews';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SavedViewsBarProps {
  module: string;
  currentFilters: Record<string, any>;
  onViewSelect: (filters: Record<string, any>) => void;
}

export function SavedViewsBar({ module, currentFilters, onViewSelect }: SavedViewsBarProps) {
  const { views, saveView, deleteView, setDefaultView } = useSavedViews(module);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [systemViews, setSystemViews] = useState<any[]>([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setSystemViews(getSystemDefaultViews(module, user.id));
      }
    };
    getCurrentUser();
  }, [module]);

  const handleSave = () => {
    if (!viewName.trim()) return;
    saveView(viewName, currentFilters, isDefault);
    setShowSaveDialog(false);
    setViewName('');
    setIsDefault(false);
  };

  return (
    <div className="mb-4">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 pb-2 snap-x snap-mandatory">
          {/* System Default Views */}
          {systemViews.length > 0 && (
            <>
              {systemViews.map((view) => (
                <Button
                  key={view.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewSelect(view.filters)}
                  className="whitespace-nowrap snap-start flex-shrink-0"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {view.name}
                </Button>
              ))}
              {views.length > 0 && (
                <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
              )}
            </>
          )}

          {/* User Saved Views */}
          {views.map((view) => (
            <div key={view.id} className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant={JSON.stringify(view.filters) === JSON.stringify(currentFilters) ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewSelect(view.filters)}
                className="gap-2 whitespace-nowrap snap-start flex-shrink-0"
              >
                {view.is_default && <Star className="h-3 w-3 fill-current" />}
                {view.view_name}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete View</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{view.view_name}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteView(view.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {!view.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setDefaultView(view.id)}
                >
                  <Star className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap snap-start flex-shrink-0">
                <Plus className="h-3 w-3" />
                Save View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current View</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="view-name">View Name</Label>
                  <Input
                    id="view-name"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="e.g., High Priority Tasks"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-default"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                  />
                  <label
                    htmlFor="is-default"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Set as default view
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!viewName.trim()}>
                  Save View
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
