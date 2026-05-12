import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusPill } from '@/components/common/StatusPill';
import { CommentThread } from '@/components/comments/CommentThread';
import { Separator } from '@/components/ui/separator';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/constants';
import { taskFormSchema, type TaskFormValues } from '@/schemas/task.schema';
import { tasksApi } from '@/api/tasks.api';
import { extractApiError } from '@/api/client';
import { fmtDateInput } from '@/lib/format';
import { useAuthStore } from '@/stores/auth.store';
import type { Project, Task } from '@/types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  task?: Task | null;
  defaultStatus?: TaskFormValues['status'];
}

export function TaskDialog({ open, onOpenChange, project, task, defaultStatus }: TaskDialogProps) {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isEdit = Boolean(task);
  const canFullEdit =
    me?.role === 'admin' ||
    project.owner._id === me?._id ||
    (task ? task.createdBy._id === me?._id : true);
  const isAssignee = task?.assignee?._id === me?._id;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      project: project._id,
      assignee: task?.assignee?._id ?? null,
      status: task?.status ?? defaultStatus ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ? fmtDateInput(task.dueDate) : '',
    },
  });

  useEffect(() => {
    form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      project: project._id,
      assignee: task?.assignee?._id ?? null,
      status: task?.status ?? defaultStatus ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ? fmtDateInput(task.dueDate) : '',
    });
  }, [task?._id, defaultStatus, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const dueDate = values.dueDate ? new Date(values.dueDate).toISOString() : null;
      if (isEdit) {
        const patch = canFullEdit
          ? {
              title: values.title,
              description: values.description,
              assignee: values.assignee || null,
              status: values.status,
              priority: values.priority,
              dueDate,
            }
          : { status: values.status, description: values.description };
        return tasksApi.update(task!._id, patch);
      }
      return tasksApi.create({
        title: values.title,
        description: values.description,
        project: project._id,
        assignee: values.assignee || null,
        status: values.status,
        priority: values.priority,
        dueDate,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    },
    onError: (err) => {
      const { message, fieldErrors } = extractApiError(err);
      if (fieldErrors) {
        for (const [k, v] of Object.entries(fieldErrors)) {
          form.setError(k as keyof TaskFormValues, {
            message: Array.isArray(v) ? v[0] : String(v),
          });
        }
      }
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(task!._id),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  const canEditAtAll = canFullEdit || isAssignee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Task details' : 'New task'}
            {task && (
              <span className="ml-3 inline-flex">
                <StatusPill status={task.status} />
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? canEditAtAll
                ? canFullEdit
                  ? 'Edit any field below.'
                  : "You're the assignee — you can update status and description."
                : 'Read-only — you don’t have edit access.'
              : `Adding a new task to “${project.name}”.`}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Short, action-oriented title"
              aria-invalid={!!form.formState.errors.title}
              disabled={!canFullEdit && isEdit}
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What needs to happen?"
              rows={4}
              disabled={!canEditAtAll && isEdit}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canEditAtAll && isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canFullEdit && isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Controller
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <Select
                    value={field.value ?? '__none'}
                    onValueChange={(v) => field.onChange(v === '__none' ? null : v)}
                    disabled={!canFullEdit && isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Unassigned</SelectItem>
                      {project.members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                disabled={!canFullEdit && isEdit}
                {...form.register('dueDate')}
              />
            </div>
          </div>

          {isEdit && canEditAtAll && (
            <DialogFooter className="!justify-between sm:!justify-between">
              {canFullEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm('Delete this task? This cannot be undone.')) deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </DialogFooter>
          )}

          {!isEdit && (
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create task
              </Button>
            </DialogFooter>
          )}
        </form>

        {task && (
          <>
            <Separator />
            <div>
              <h4 className="mb-3 text-sm font-semibold">Activity</h4>
              <CommentThread taskId={task._id} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
