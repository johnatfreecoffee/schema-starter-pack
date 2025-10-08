import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectNotesProps {
  projectId: string;
}

const ProjectNotes = ({ projectId }: ProjectNotesProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          users!notes_created_by_fkey(first_name, last_name)
        `)
        .eq('related_to_type', 'project')
        .eq('related_to_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No updates have been posted for this project yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-4">
              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {note.users
                    ? getInitials(note.users.first_name, note.users.last_name)
                    : 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Note Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold">
                    {note.users
                      ? `${note.users.first_name} ${note.users.last_name}`
                      : 'Unknown User'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectNotes;
