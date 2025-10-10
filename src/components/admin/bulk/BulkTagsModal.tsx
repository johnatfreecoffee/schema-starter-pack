import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BulkTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  module: string;
  onConfirm: (tags: string[], mode: 'add' | 'replace') => Promise<void>;
}

export function BulkTagsModal({
  open,
  onOpenChange,
  selectedCount,
  module,
  onConfirm,
}: BulkTagsModalProps) {
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadExistingTags();
    }
  }, [open, module]);

  useEffect(() => {
    if (tagInput) {
      const filtered = existingTags.filter(tag =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  }, [tagInput, existingTags, selectedTags]);

  const loadExistingTags = async () => {
    try {
      // Fetch all unique tags from the module
      const { data } = await supabase
        .from(module as any)
        .select('tags');

      const allTags = new Set<string>();
      data?.forEach((item: any) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      setExistingTags(Array.from(allTags));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput.trim());
    }
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) return;

    setIsLoading(true);
    try {
      await onConfirm(selectedTags, mode);
      onOpenChange(false);
      setSelectedTags([]);
      setTagInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Managing tags for {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tags">Add Tags</Label>
            <div className="relative">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search or create new tag..."
              />
              {filteredTags.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-auto">
                  {filteredTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Tags</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tag Mode</Label>
            <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="font-normal cursor-pointer">
                  Add to existing tags
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="font-normal cursor-pointer">
                  Replace all tags
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selectedTags.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Preview:</strong> Will {mode === 'add' ? 'add' : 'replace with'} {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} to {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTags.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
