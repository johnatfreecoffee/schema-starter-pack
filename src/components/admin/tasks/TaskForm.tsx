import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: any;
  relatedTo?: { type: string; id: string; name: string };
  users: Array<{ id: string; first_name: string; last_name: string }>;
  currentUserId: string;
}

export default function TaskForm({ open, onClose, onSuccess, task, relatedTo, users, currentUserId }: TaskFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed" | "cancelled">("pending");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [relatedToType, setRelatedToType] = useState<string>("none");
  const [relatedToId, setRelatedToId] = useState<string>("");
  const [relatedEntities, setRelatedEntities] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "pending");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setAssignedTo(task.assigned_to || currentUserId);
      setRelatedToType(task.related_to_type || "none");
      setRelatedToId(task.related_to_id || "");
    } else if (relatedTo) {
      setRelatedToType(relatedTo.type);
      setRelatedToId(relatedTo.id);
    } else {
      resetForm();
    }
  }, [task, relatedTo, currentUserId]);

  useEffect(() => {
    if (relatedToType !== "none" && relatedToType !== "independent") {
      loadRelatedEntities();
    }
  }, [relatedToType]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("pending");
    setPriority("medium");
    setDueDate(undefined);
    setAssignedTo(currentUserId);
    setRelatedToType("none");
    setRelatedToId("");
  };

  const loadRelatedEntities = async () => {
    try {
      let query;
      if (relatedToType === "lead") {
        query = supabase.from("leads").select("id, first_name, last_name");
      } else if (relatedToType === "account") {
        query = supabase.from("accounts").select("id, account_name");
      } else if (relatedToType === "project") {
        query = supabase.from("projects").select("id, project_name");
      }

      if (query) {
        const { data, error } = await query;
        if (error) throw error;
        
        const formatted = data.map(item => ({
          id: item.id,
          name: relatedToType === "lead" 
            ? `${item.first_name} ${item.last_name}`
            : item.account_name || item.project_name
        }));
        setRelatedEntities(formatted);
      }
    } catch (error: any) {
      console.error("Error loading related entities:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
        assigned_to: assignedTo || null,
        related_to_type: relatedToType === "none" || relatedToType === "independent" ? null : relatedToType,
        related_to_id: relatedToId || null,
        updated_at: new Date().toISOString()
      };

      if (task) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);

        if (error) throw error;

        // Log activity
        await supabase.from("activity_logs").insert({
          action: "updated",
          entity_type: "task",
          entity_id: task.id,
          parent_entity_type: taskData.related_to_type as any,
          parent_entity_id: taskData.related_to_id
        });

        toast({
          title: "Success",
          description: "Task updated successfully"
        });
      } else {
        // Create new task
        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert(taskData)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabase.from("activity_logs").insert({
          action: "created",
          entity_type: "task",
          entity_id: newTask.id,
          parent_entity_type: taskData.related_to_type as any,
          parent_entity_id: taskData.related_to_id
        });

        toast({
          title: "Success",
          description: "Task created successfully"
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Follow up with John Smith about quote"
          required
          maxLength={255}
          className="min-h-[44px]"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add task details, notes, or instructions..."
          rows={6}
          className="min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as any)}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🟢 Low</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="high">🔴 High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Due Date</Label>
          {isMobile ? (
            <Input
              type="date"
              value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : undefined)}
              className="min-h-[44px]"
            />
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal min-h-[44px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "No due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
          {dueDate && !isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDueDate(undefined)}
              className="mt-1"
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!relatedTo && (
        <div>
          <Label>Relate to</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={relatedToType} onValueChange={(value) => {
              setRelatedToType(value);
              setRelatedToId("");
            }}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="None (Independent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Independent)</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>

            {relatedToType !== "none" && relatedToType !== "independent" && (
              <Select value={relatedToId} onValueChange={setRelatedToId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder={`Select ${relatedToType}`} />
                </SelectTrigger>
                <SelectContent>
                  {relatedEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-end'} gap-2 pt-4`}>
        <Button type="button" variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{task ? "Edit Task" : "Create New Task"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up with John Smith about quote"
              required
              maxLength={255}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details, notes, or instructions..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDueDate(undefined)}
                  className="mt-1"
                >
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!relatedTo && (
            <div>
              <Label>Relate to</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select value={relatedToType} onValueChange={(value) => {
                  setRelatedToType(value);
                  setRelatedToId("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (Independent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Independent)</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>

                {relatedToType !== "none" && relatedToType !== "independent" && (
                  <Select value={relatedToId} onValueChange={setRelatedToId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${relatedToType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {relatedEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
