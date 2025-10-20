/**
 * Example: How to use optimistic updates for instant UI feedback
 * 
 * This pattern provides immediate visual feedback while the server
 * processes the request, with automatic rollback on error.
 */

import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export function TaskStatusToggle({ task }: { task: Task }) {
  // Optimistic mutation for task status updates
  const { mutate: updateStatus, isPending } = useOptimisticMutation<
    void,
    { id: string; status: Task['status'] }
  >({
    queryKey: ['tasks'],
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    updateFn: (oldData: Task[], { id, status }) => {
      return oldData.map(t => 
        t.id === id ? { ...t, status } : t
      );
    },
    successMessage: 'Task updated',
    errorMessage: 'Failed to update task',
  });

  const handleToggle = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateStatus({ id: task.id, status: newStatus });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={task.status === 'completed' ? 'default' : 'outline'}
    >
      {task.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
    </Button>
  );
}

/**
 * Example: Virtual scrolling for large lists
 */

import { VirtualList } from '@/components/performance/VirtualList';

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <VirtualList
      items={tasks}
      estimateSize={72}
      className="h-[600px] border rounded-lg"
      renderItem={(task, index) => (
        <div className="p-4 border-b hover:bg-accent">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">Task #{index + 1}</p>
            </div>
            <TaskStatusToggle task={task} />
          </div>
        </div>
      )}
    />
  );
}

/**
 * Example: Prefetching data on hover
 */

import { usePrefetch } from '@/hooks/usePrefetch';

export function TaskLink({ taskId }: { taskId: string }) {
  const { prefetchOnHover } = usePrefetch();

  return (
    <a
      href={`/tasks/${taskId}`}
      {...prefetchOnHover(
        ['task', taskId],
        async () => {
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();
          return data;
        }
      )}
    >
      View Task Details
    </a>
  );
}

/**
 * Example: Form auto-save with debouncing
 */

import { useState } from 'react';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';

export function TaskForm({ taskId }: { taskId: string }) {
  const [formData, setFormData] = useState({ title: '', description: '' });

  useFormAutoSave({
    data: formData,
    onSave: async (data) => {
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId);
      
      if (error) throw error;
    },
    delay: 1000,
    storageKey: `task-draft-${taskId}`,
  });

  return (
    <div className="space-y-4">
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Task title"
        className="w-full p-2 border rounded"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Task description"
        className="w-full p-2 border rounded"
        rows={4}
      />
      <p className="text-sm text-muted-foreground">
        Changes are automatically saved
      </p>
    </div>
  );
}
