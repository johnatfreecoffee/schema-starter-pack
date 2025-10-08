import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

interface ProjectTimelineProps {
  projectId: string;
}

const ProjectTimeline = ({ projectId }: ProjectTimelineProps) => {
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhases();
  }, [projectId]);

  const fetchPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseStatus = (phase: any) => {
    if (phase.status === 'completed') return 'completed';
    if (phase.status === 'in_progress') return 'current';
    if (phase.end_date && isPast(new Date(phase.end_date)) && phase.status !== 'completed') {
      return 'overdue';
    }
    return 'upcoming';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'current':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (phases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No milestones have been added to this project yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-8">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-border hidden sm:block" />

          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase);
            return (
              <div key={phase.id} className="relative flex gap-4 sm:gap-6">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {getStatusIcon(status)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8 sm:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{phase.phase_name}</h4>
                    <Badge className={getStatusColor(status)}>
                      {phase.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {phase.description && (
                    <p className="text-muted-foreground mb-3">{phase.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {phase.start_date && (
                      <div>
                        <span className="font-medium">Start:</span>{' '}
                        {format(new Date(phase.start_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {phase.end_date && (
                      <div>
                        <span className="font-medium">Target:</span>{' '}
                        {format(new Date(phase.end_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTimeline;
