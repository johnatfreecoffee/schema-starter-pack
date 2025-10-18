import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveList, MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Grid, List, CheckCircle2, AlertCircle, Download, UserCheck, FileDown, Calendar as CalendarIcon } from "lucide-react";
import { ExportService } from '@/services/exportService';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TaskFilters from "@/components/admin/tasks/TaskFilters";
import TaskForm from "@/components/admin/tasks/TaskForm";
import TaskStatusBadge from "@/components/admin/tasks/TaskStatusBadge";
import TaskPriorityBadge from "@/components/admin/tasks/TaskPriorityBadge";
import { format, isToday, isThisWeek, isPast } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar, BulkAction } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkProgressModal } from '@/components/admin/bulk/BulkProgressModal';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Tasks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Bulk operations state
  const bulkSelection = useBulkSelection(tasks);
  const [bulkOperationModal, setBulkOperationModal] = useState<{
    open: boolean;
    type: 'status' | 'assign' | 'priority' | 'due_date' | null;
  }>({ open: false, type: null });
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    open: boolean;
    operation: string;
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    isComplete: boolean;
  }>({ open: false, operation: '', total: 0, completed: 0, failed: 0, errors: [], isComplete: false });
  
  const { role } = useUserRole();
  const { undoState, saveUndoState, performUndo } = useBulkUndo();

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [relatedFilters, setRelatedFilters] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    loadData();
  }, [showMyTasks, statusFilters, priorityFilters, assignedFilter, relatedFilters, dueDateFilter, customDateRange, search]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setCurrentUserId(user.id);

      // Load users for filters
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select(`
          id,
          full_name,
          email
        `);

      if (usersError) throw usersError;

      setUsers((usersData || []).map(user => ({
        id: user.id,
        first_name: user.full_name || user.email || "Unknown",
        last_name: ""
      })));

      // Build query
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:assigned_to(id),
          created_user:created_by(id)
        `)
        .order("created_at", { ascending: false });

      // Apply filters
      if (showMyTasks) {
        query = query.eq("assigned_to", user.id);
      }

      if (statusFilters.length > 0) {
        query = query.in("status", statusFilters as any);
      }

      if (priorityFilters.length > 0) {
        query = query.in("priority", priorityFilters as any);
      }

      if (assignedFilter !== "all") {
        if (assignedFilter === "me") {
          query = query.eq("assigned_to", user.id);
        } else if (assignedFilter === "unassigned") {
          query = query.is("assigned_to", null);
        } else {
          query = query.eq("assigned_to", assignedFilter);
        }
      }

      if (relatedFilters.length > 0) {
        if (relatedFilters.includes("independent")) {
          query = query.is("related_to_type", null);
        } else {
          query = query.in("related_to_type", relatedFilters.filter(f => f !== "independent") as any);
        }
      }

      // Due date filters
      if (dueDateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query = query.gte("due_date", today.toISOString()).lt("due_date", tomorrow.toISOString());
      } else if (dueDateFilter === "week") {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query.gte("due_date", today.toISOString()).lte("due_date", nextWeek.toISOString());
      } else if (dueDateFilter === "overdue") {
        const now = new Date();
        query = query.lt("due_date", now.toISOString()).neq("status", "completed").neq("status", "cancelled");
      } else if (dueDateFilter === "no-due-date") {
        query = query.is("due_date", null);
      } else if (dueDateFilter === "custom" && (customDateRange.from || customDateRange.to)) {
        if (customDateRange.from) {
          query = query.gte("due_date", customDateRange.from.toISOString());
        }
        if (customDateRange.to) {
          query = query.lte("due_date", customDateRange.to.toISOString());
        }
      }

      // Search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: tasksData, error: tasksError } = await query;
      if (tasksError) throw tasksError;

      // Enrich tasks with related entity names and assigned user names
      const enrichedTasks = await Promise.all(
        (tasksData || []).map(async (task) => {
          let relatedEntityName = null;
          if (task.related_to_type && task.related_to_id) {
            try {
              if (task.related_to_type === "lead") {
                const { data } = await supabase
                  .from("leads")
                  .select("first_name, last_name")
                  .eq("id", task.related_to_id)
                  .single();
                if (data) relatedEntityName = `${data.first_name} ${data.last_name}`;
              } else if (task.related_to_type === "account") {
                const { data } = await supabase
                  .from("accounts")
                  .select("account_name")
                  .eq("id", task.related_to_id)
                  .single();
                if (data) relatedEntityName = data.account_name;
              } else if (task.related_to_type === "project") {
                const { data } = await supabase
                  .from("projects")
                  .select("project_name")
                  .eq("id", task.related_to_id)
                  .single();
                if (data) relatedEntityName = data.project_name;
              }
            } catch (error) {
              console.error("Error loading related entity:", error);
            }
          }

          const assignedUser = users.find(u => u.id === task.assigned_to);

          return {
            ...task,
            relatedEntityName,
            assignedUserName: assignedUser 
              ? `${assignedUser.first_name} ${assignedUser.last_name}`
              : "Unassigned"
          };
        })
      );

      setTasks(enrichedTasks);
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

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;

      await supabase.from("activity_logs").insert({
        action: "updated",
        entity_type: "task",
        entity_id: taskId,
        parent_entity_type: null,
        parent_entity_id: null
      });

      toast({
        title: "Success",
        description: "Task marked as completed"
      });

      loadData();
    } catch (error: any) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", deleteTaskId);

      if (error) throw error;

      await supabase.from("activity_logs").insert({
        action: "deleted",
        entity_type: "task",
        entity_id: deleteTaskId
      });

      toast({
        title: "Success",
        description: "Task deleted successfully"
      });

      setDeleteTaskId(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed" || status === "cancelled") return false;
    return isPast(new Date(dueDate));
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    const date = new Date(dueDate);
    if (isToday(date)) return "Due today";
    if (isThisWeek(date)) return `Due ${format(date, "EEEE")}`;
    return format(date, "MMM d, yyyy");
  };

  // Permission controls
  const canBulkEdit = role === 'Super Admin' || role === 'Admin' || bulkSelection.selectedItems.every(item => item.assigned_to === currentUserId || item.created_by === currentUserId);
  const canBulkDelete = role === 'Super Admin' || role === 'Admin';

  // Bulk operations handlers
  const bulkActions: BulkAction[] = [
    canBulkEdit && { id: 'assign', label: 'Assign to User', icon: <UserCheck className="h-4 w-4" /> },
    canBulkEdit && { id: 'status', label: 'Change Status' },
    canBulkEdit && { id: 'priority', label: 'Change Priority' },
    canBulkEdit && { id: 'due_date', label: 'Set Due Date' },
    canBulkEdit && { id: 'mark_complete', label: 'Mark Complete' },
    { id: 'export', label: 'Export Selected', icon: <FileDown className="h-4 w-4" /> },
    canBulkDelete && { id: 'delete', label: 'Delete Selected', variant: 'destructive' as const },
  ].filter(Boolean) as BulkAction[];

  const handleBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'assign':
      case 'status':
      case 'priority':
      case 'due_date':
        setBulkOperationModal({ open: true, type: actionId as any });
        break;
      case 'mark_complete':
        handleBulkMarkComplete();
        break;
      case 'delete':
        setBulkDeleteOpen(true);
        break;
      case 'export':
        handleBulkExport();
        break;
    }
  };

  const handleBulkOperationConfirm = async (formData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store previous values for undo
    const previousValues = bulkSelection.selectedItems.map(t => ({
      id: t.id,
      ...(bulkOperationModal.type === 'status' && { status: t.status }),
      ...(bulkOperationModal.type === 'assign' && { assigned_to: t.assigned_to }),
      ...(bulkOperationModal.type === 'priority' && { priority: t.priority }),
      ...(bulkOperationModal.type === 'due_date' && { due_date: t.due_date }),
    }));

    setBulkProgress({
      open: true,
      operation: `Updating ${bulkSelection.selectedCount} tasks`,
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    let changes: Record<string, any> = {};
    if (bulkOperationModal.type === 'status') changes = { status: formData.status };
    if (bulkOperationModal.type === 'assign') changes = { assigned_to: formData.assigned_to };
    if (bulkOperationModal.type === 'priority') changes = { priority: formData.priority };
    if (bulkOperationModal.type === 'due_date') changes = { due_date: formData.due_date };

    const result = await BulkOperationsService.performBulkOperation({
      type: bulkOperationModal.type === 'assign' ? 'assign' : 
            bulkOperationModal.type === 'status' ? 'status_change' :
            bulkOperationModal.type === 'priority' ? 'priority_change' : 'date_change',
      itemIds: Array.from(bulkSelection.selectedIds),
      module: 'tasks',
      changes,
      userId: user.id,
    });

    // Save undo state
    if (result.success > 0) {
      saveUndoState({
        operation: bulkOperationModal.type as any,
        module: 'tasks',
        itemIds: Array.from(bulkSelection.selectedIds),
        previousValues,
        timestamp: new Date(),
      });
    }

    setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    bulkSelection.deselectAll();
    loadData();
    
    toast({
      title: 'Success',
      description: `${result.success} tasks updated successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        bulkSelection.selectAll();
      }
      if (e.key === 'Escape' && bulkSelection.selectedCount > 0) {
        bulkSelection.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bulkSelection.selectedCount]);

  const handleBulkMarkComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await BulkOperationsService.performBulkOperation({
      type: 'status_change',
      itemIds: Array.from(bulkSelection.selectedIds),
      module: 'tasks',
      changes: { status: 'completed', completed_at: new Date().toISOString() },
      userId: user.id,
    });

    bulkSelection.deselectAll();
    loadData();
    
    toast({
      title: 'Success',
      description: `${result.success} tasks marked as complete`,
    });
  };

  const handleBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBulkProgress({
      open: true,
      operation: `Deleting ${bulkSelection.selectedCount} tasks`,
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    const result = await BulkOperationsService.bulkDelete('tasks', Array.from(bulkSelection.selectedIds), user.id);

    setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    bulkSelection.deselectAll();
    loadData();

    toast({
      title: 'Success',
      description: `${result.success} tasks deleted${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
    });
  };

  const handleBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport('tasks', Array.from(bulkSelection.selectedIds));
      toast({
        title: 'Success',
        description: `${bulkSelection.selectedCount} tasks exported`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export tasks',
        variant: 'destructive',
      });
    }
  };

  const getBulkModalTitle = () => {
    switch (bulkOperationModal.type) {
      case 'status': return 'Change Status';
      case 'assign': return 'Assign to User';
      case 'priority': return 'Change Priority';
      case 'due_date': return 'Set Due Date';
      default: return '';
    }
  };

  const getBulkModalDescription = () => {
    return `Update ${bulkSelection.selectedCount} selected tasks`;
  };

  const getBulkModalFields = () => {
    switch (bulkOperationModal.type) {
      case 'status':
        return [{
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'not_started', label: 'Not Started' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ],
          required: true,
        }];
      case 'assign':
        return [{
          name: 'assigned_to',
          label: 'Assign To',
          type: 'select' as const,
          options: users.map(u => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name}`,
          })),
          required: true,
        }];
      case 'priority':
        return [{
          name: 'priority',
          label: 'Priority',
          type: 'select' as const,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ],
          required: true,
        }];
      case 'due_date':
        return [{
          name: 'due_date',
          label: 'Due Date',
          type: 'date' as const,
          required: true,
        }];
      default:
        return [];
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-full">
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          statusFilters={statusFilters}
          onStatusChange={setStatusFilters}
          priorityFilters={priorityFilters}
          onPriorityChange={setPriorityFilters}
          assignedFilter={assignedFilter}
          onAssignedChange={setAssignedFilter}
          relatedFilters={relatedFilters}
          onRelatedChange={setRelatedFilters}
          dueDateFilter={dueDateFilter}
          onDueDateChange={setDueDateFilter}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          users={users}
          currentUserId={currentUserId}
        />

        <div className="flex-1 px-4 py-6 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Tasks</h1>
                <Badge variant="secondary">{tasks.length}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className="hidden md:flex"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("card")}
                  className="hidden md:flex"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                {!isMobile && (
                  <Button onClick={() => {
                    setSelectedTask(null);
                    setShowTaskForm(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              <Button
                variant={!showMyTasks ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyTasks(false)}
                className="whitespace-nowrap snap-start flex-shrink-0"
              >
                All Tasks
              </Button>
              <Button
                variant={showMyTasks ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyTasks(true)}
                className="whitespace-nowrap snap-start flex-shrink-0"
              >
                My Tasks
              </Button>
            </div>
          </div>

          {/* Mobile Action Button */}
          <MobileActionButton
            onClick={() => {
              setSelectedTask(null);
              setShowTaskForm(true);
            }}
            icon={<Plus className="h-5 w-5" />}
            label="Create New Task"
          />

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No tasks found</p>
              <Button onClick={() => setShowTaskForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </Card>
          ) : (
            <ResponsiveList
              items={tasks}
              emptyMessage="No tasks found"
              renderCard={(task) => (
                <MobileCard key={task.id} onClick={() => navigate(`/dashboard/tasks/${task.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={bulkSelection.isSelected(task.id)}
                            onCheckedChange={() => bulkSelection.toggleItem(task.id)}
                          />
                        </div>
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <h3 className="font-bold text-lg mb-1 truncate max-w-full">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {task.related_to_type && task.relatedEntityName && (
                    <MobileCardField 
                      label="Related To" 
                      value={<Badge variant="outline" className="text-xs">{task.related_to_type}: {task.relatedEntityName}</Badge>}
                    />
                  )}
                  <MobileCardField 
                    label="Assigned To" 
                    value={task.assignedUserName}
                  />
                  <MobileCardField 
                    label="Due Date" 
                    value={
                      <div className={isOverdue(task.due_date, task.status) ? "text-red-600 font-medium flex items-center gap-1" : ""}>
                        <CalendarIcon className="h-3 w-3 inline" />
                        {formatDueDate(task.due_date)}
                        {isOverdue(task.due_date, task.status) && <AlertCircle className="h-3 w-3" />}
                      </div>
                    }
                  />
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {task.status !== "completed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteTask(task.id);
                        }}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setShowTaskForm(true);
                      }}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                  </div>
                </MobileCard>
              )}
              renderTable={() => (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={bulkSelection.isAllSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                bulkSelection.selectAll();
                              } else {
                                bulkSelection.deselectAll();
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Related To</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={bulkSelection.isSelected(task.id)}
                              onCheckedChange={() => bulkSelection.toggleItem(task.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <TaskPriorityBadge priority={task.priority} />
                          </TableCell>
                          <TableCell>
                            <TaskStatusBadge status={task.status} />
                          </TableCell>
                          <TableCell 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
                          >
                            {task.title}
                          </TableCell>
                          <TableCell>
                            {task.related_to_type && task.relatedEntityName ? (
                              <span className="text-sm capitalize">
                                {task.related_to_type}: {task.relatedEntityName}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Independent</span>
                            )}
                          </TableCell>
                          <TableCell>{task.assignedUserName}</TableCell>
                          <TableCell>
                            <div className={isOverdue(task.due_date, task.status) ? "text-red-600 font-medium" : ""}>
                              {formatDueDate(task.due_date)}
                              {isOverdue(task.due_date, task.status) && (
                                <AlertCircle className="inline-block ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">Actions</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {task.status !== "completed" && (
                                  <DropdownMenuItem onClick={() => handleCompleteTask(task.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Complete
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskForm(true);
                                }}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            />
          )}
        </div>
      </div>

      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setSelectedTask(null);
        }}
        onSuccess={loadData}
        task={selectedTask}
        users={users}
        currentUserId={currentUserId}
      />

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Operations UI */}
      <BulkActionsBar
        selectedCount={bulkSelection.selectedCount}
        actions={bulkActions}
        onAction={handleBulkAction}
        onClear={bulkSelection.deselectAll}
      />

      <BulkOperationModal
        open={bulkOperationModal.open}
        onOpenChange={(open) => setBulkOperationModal({ open, type: null })}
        title={getBulkModalTitle()}
        description={getBulkModalDescription()}
        selectedCount={bulkSelection.selectedCount}
        onConfirm={handleBulkOperationConfirm}
        fields={getBulkModalFields()}
      />

      <BulkDeleteConfirmation
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        itemCount={bulkSelection.selectedCount}
        itemType="tasks"
        onConfirm={handleBulkDelete}
        requireTyping={bulkSelection.selectedCount > 10}
      />

      <BulkProgressModal
        open={bulkProgress.open}
        onOpenChange={(open) => setBulkProgress(prev => ({ ...prev, open }))}
        operation={bulkProgress.operation}
        total={bulkProgress.total}
        completed={bulkProgress.completed}
        failed={bulkProgress.failed}
        errors={bulkProgress.errors}
        isComplete={bulkProgress.isComplete}
      />

      {undoState && (
        <BulkUndoToast count={undoState.itemIds.length} onUndo={performUndo} />
      )}
    </AdminLayout>
  );
};

export default Tasks;
