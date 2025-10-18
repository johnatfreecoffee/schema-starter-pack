import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { FilterChips } from "@/components/filters/FilterChips";
import { SavedViewsBar } from "@/components/filters/SavedViewsBar";
import { TaskAdvancedFilters } from "@/components/admin/tasks/TaskAdvancedFilters";
import { ExportButton } from "@/components/admin/ExportButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TaskStatusBadge from "@/components/admin/tasks/TaskStatusBadge";
import TaskPriorityBadge from "@/components/admin/tasks/TaskPriorityBadge";
import { format } from "date-fns";
import TaskForm from "@/components/admin/tasks/TaskForm";

const TasksAdvanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters, updateFilter, clearFilters } = useUrlFilters();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  const filterCount = Object.keys(filters).filter(
    key => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setCurrentUserId(user.id);

      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in("priority", filters.priority);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'me') {
          query = query.eq("assigned_to", user.id);
        } else if (filters.assignedTo === 'unassigned') {
          query = query.is("assigned_to", null);
        } else {
          query = query.eq("assigned_to", filters.assignedTo);
        }
      }

      if (filters.associatedType) {
        query = query.eq("related_to_type", filters.associatedType);
      }

      if (filters.dueDateFrom) {
        query = query.gte("due_date", filters.dueDateFrom);
      }

      if (filters.dueDateTo) {
        query = query.lte("due_date", filters.dueDateTo);
      }

      if (filters.isOverdue) {
        const now = new Date().toISOString();
        query = query.lt("due_date", now).neq("status", "completed");
      }

      const { data, error } = await query;
      if (error) throw error;

      setTasks(data || []);
    } catch (error: any) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      
      const usersList = (data || []).map(user => ({
        id: user.id,
        first_name: user.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Unknown',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || 'User'
      }));
      
      setUsers(usersList);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">Tasks</h1>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilterPanelOpen(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <Badge variant="default">{filterCount}</Badge>
              )}
            </Button>
            <ExportButton
              data={tasks}
              moduleName="tasks"
              filters={filters}
              isFiltered={filterCount > 0}
              filteredCount={tasks.length}
            />
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        <SavedViewsBar
          module="tasks"
          currentFilters={filters}
          onViewSelect={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key, value);
            });
          }}
        />

        <FilterChips
          filters={filters}
          onRemove={(key) => updateFilter(key, null)}
          onClearAll={clearFilters}
        />

        {loading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {filterCount > 0 ? "No tasks match the current filters" : "No tasks found"}
            </p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                  >
                    <TableCell>
                      <TaskPriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          title="Filter Tasks"
          onClearAll={clearFilters}
        >
          <TaskAdvancedFilters values={filters} onChange={updateFilter} />
        </FilterPanel>

        <TaskForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTasks();
          }}
          users={users}
          currentUserId={currentUserId}
        />
      </div>
  );
};

export default TasksAdvanced;
