import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import { TASK_STATUSES, STATUS_LABELS, type TaskStatus } from '@/lib/constants';
import { tasksApi } from '@/api/tasks.api';
import { extractApiError } from '@/api/client';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

const statusAccent: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-sky-500',
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

export function TaskBoard({
  tasks,
  onSelectTask,
  onCreateInColumn,
  canCreate,
}: {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onCreateInColumn?: (status: TaskStatus) => void;
  canCreate: boolean;
}) {
  const queryClient = useQueryClient();
  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      const keys = [['tasks'], ['project']];
      await Promise.all(keys.map((k) => queryClient.cancelQueries({ queryKey: k })));
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  function onDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === status) return;
    statusMutation.mutate({ id: taskId, status });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const items = byStatus[status];
        return (
          <div
            key={status}
            className="flex min-h-[200px] flex-col rounded-xl border bg-card/40 transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', statusAccent[status])} />
                <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              {canCreate && onCreateInColumn && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onCreateInColumn(status)}
                  aria-label={`Add task to ${STATUS_LABELS[status]}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 space-y-2 p-3">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Nothing here
                </p>
              ) : (
                items.map((task) => (
                  <div
                    key={task._id}
                    onDragStart={(e) => onDragStart(e, task._id)}
                    draggable
                  >
                    <TaskCard task={task} onClick={() => onSelectTask(task)} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
