import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pin, PinOff, Edit2, Trash2, Save, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { CRUDLogger } from '@/lib/crudLogger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type RelatedEntityType = Database['public']['Enums']['related_entity_type'];

interface Note {
  id: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

interface NotesSectionProps {
  entityType: RelatedEntityType;
  entityId: string;
}

const MAX_CHARS = 5000;

const NotesSection = ({ entityType, entityId }: NotesSectionProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
    getCurrentUser();
  }, [entityType, entityId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', user.id)
        .single();
      setIsAdmin((roleData as any)?.roles?.name === 'Super Admin' || (roleData as any)?.roles?.name === 'Admin');
    }
  };

  const fetchNotes = async () => {
    try {
      // First get the notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('related_to_type', entityType)
        .eq('related_to_id', entityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Get unique user IDs
      const userIds = [...new Set(notesData.map(note => note.created_by))];
      
      // Fetch user names from user_roles table
      const { data: usersData } = await supabase
        .from('user_roles')
        .select('user_id, users(first_name, last_name)')
        .in('user_id', userIds);

      // Create a map of user IDs to names
      const userNameMap = new Map();
      usersData?.forEach((userData: any) => {
        if (userData.users) {
          userNameMap.set(
            userData.user_id,
            `${userData.users.first_name || ''} ${userData.users.last_name || ''}`.trim() || 'Unknown User'
          );
        }
      });

      const notesWithNames = notesData.map((note: any) => ({
        ...note,
        author_name: userNameMap.get(note.created_by) || 'Unknown User'
      }));

      setNotes(notesWithNames);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('notes').insert({
        related_to_type: entityType as RelatedEntityType,
        related_to_id: entityId,
        content: newNote.trim(),
        is_pinned: isPinned,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      // Log the activity with parent entity context
      const { error: logError } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        entity_type: 'note',
        entity_id: data.id,
        entity_name: `Note on ${entityType}`,
        parent_entity_type: entityType,
        parent_entity_id: entityId,
        action: 'created',
        new_values: {
          is_pinned: isPinned,
          content_preview: newNote.trim().substring(0, 100)
        },
        metadata: {
          related_to_type: entityType,
          related_to_id: entityId
        }
      });
      if (logError) {
        console.error('Failed to log note creation activity:', logError);
      }

      toast({
        title: 'Success',
        description: 'Note added successfully',
      });

      setNewNote('');
      setIsPinned(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the old note content for logging
      const oldNote = notes.find(n => n.id === noteId);
      
      const { error } = await supabase
        .from('notes')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      // Log the activity with parent entity context
      if (oldNote) {
        const { error: logError } = await supabase.from('activity_logs').insert({
          user_id: user.id,
          entity_type: 'note',
          entity_id: noteId,
          entity_name: `Note on ${entityType}`,
          parent_entity_type: entityType,
          parent_entity_id: entityId,
          action: 'updated',
          old_values: { content: oldNote.content },
          new_values: { content: editContent.trim() },
          changes: {
            content: {
              old: oldNote.content,
              new: editContent.trim()
            }
          },
          metadata: {
            related_to_type: entityType,
            related_to_id: entityId
          }
        });
        if (logError) {
          console.error('Failed to log note update activity:', logError);
        }
      }

      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });

      setEditingId(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: note.is_pinned ? 'Note unpinned' : 'Note pinned',
      });

      fetchNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the note before deleting for logging
      const noteToDelete = notes.find(n => n.id === deleteId);

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      // Log the activity with parent entity context
      if (noteToDelete) {
        const { error: logError } = await supabase.from('activity_logs').insert({
          user_id: user.id,
          entity_type: 'note',
          entity_id: deleteId,
          entity_name: `Note on ${entityType}`,
          parent_entity_type: entityType,
          parent_entity_id: entityId,
          action: 'deleted',
          old_values: {
            content: noteToDelete.content,
            is_pinned: noteToDelete.is_pinned
          },
          metadata: {
            related_to_type: entityType,
            related_to_id: entityId,
            content_preview: noteToDelete.content.substring(0, 100)
          }
        });
        if (logError) {
          console.error('Failed to log note delete activity:', logError);
        }
      }

      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });

      setDeleteId(null);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    }
  };

  const canEditDelete = (note: Note) => {
    return isAdmin || note.created_by === currentUserId;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="note-content">Add Note</Label>
            <Textarea
              id="note-content"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Type your note here..."
              className="mt-2"
              rows={4}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {newNote.length}/{MAX_CHARS} characters
              </span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pin-note"
                  checked={isPinned}
                  onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                />
                <Label htmlFor="pin-note" className="cursor-pointer">Pin Note</Label>
              </div>
            </div>
          </div>
          <Button onClick={handleAddNote} disabled={!newNote.trim()}>
            Add Note
          </Button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No notes yet. Add your first note above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`p-4 ${note.is_pinned ? 'border-primary bg-accent/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(note.author_name || 'U')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {note.is_pinned && (
                      <Pin className="h-4 w-4 text-primary" fill="currentColor" />
                    )}
                    <span className="font-medium text-sm">{note.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                    {note.updated_at !== note.created_at && (
                      <span className="text-xs text-muted-foreground italic">
                        (edited)
                      </span>
                    )}
                  </div>

                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CHARS))}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(note.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePin(note)}
                        >
                          {note.is_pinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-1" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-1" />
                              Pin
                            </>
                          )}
                        </Button>
                        {canEditDelete(note) && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(note)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(note.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotesSection;
