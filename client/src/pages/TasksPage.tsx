import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ListTodo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskFilters, type TaskFilterState } from '@/components/tasks/TaskFilters';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { StatusPill } from '@/components/common/StatusPill';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { UserAvatar } from '@/components/common/UserAvatar';
import { tasksApi } from '@/api/tasks.api';
import { projectsApi } from '@/api/projects.api';
import { extractApiError } from '@/api/client';
import { fmtDueLabel, isOverdue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Task, Project } from '@/types';

export function TasksPage() {
  const [filters, setFilters] = useState<TaskFilterState>({});
  const [selected, setSelected] = useState<{ task: Task; project: Project } | null>(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'mine', filters],
    queryFn: () =>
      tasksApi.list({
        mine: true,
        q: filters.q || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        overdue: filters.overdue === 'yes' ? true : undefined,
        sort: filters.sort ?? 'dueDate',
        limit: 200,
      }),
  });

  async function openTask(task: Task) {
    const projectId = typeof task.project === 'string' ? task.project : task.project._id;
    try {
      const project = await projectsApi.get(projectId);
      setSelected({ task, project });
    } catch {
      // ignore — error toast will surface from query
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">All tasks assigned to you across every project.</p>
      </div>

      <TaskFilters value={filters} onChange={setFilters} />

      {tasksQuery.isLoading ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : tasksQuery.isError ? (
        <EmptyState
          title="Couldn't load tasks"
          description={extractApiError(tasksQuery.error).message}
        />
      ) : (tasksQuery.data?.items ?? []).length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title={
            filters.q || filters.status || filters.priority || filters.overdue === 'yes'
              ? 'No matching tasks'
              : 'No tasks assigned to you'
          }
          description={
            filters.q || filters.status || filters.priority || filters.overdue === 'yes'
              ? 'Try clearing some filters.'
              : 'Tasks assigned to you will appear here.'
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {(tasksQuery.data?.items ?? []).map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const projectName = typeof task.project === 'string' ? '' : task.project.name;
                return (
                  <li key={task._id}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{task.title}</span>
                          {overdue && (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600 dark:text-red-400">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          {projectName && (
                            <Link
                              to={`/projects/${typeof task.project === 'string' ? task.project : task.project._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate hover:text-foreground hover:underline"
                            >
                              {projectName}
                            </Link>
                          )}
                          <span className={cn(overdue && 'text-red-600 dark:text-red-400 font-medium')}>
                            {fmtDueLabel(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} />
                      <StatusPill status={task.status} />
                      <UserAvatar user={task.assignee ?? null} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {selected && (
        <TaskDialog
          open={true}
          onOpenChange={(open) => !open && setSelected(null)}
          project={selected.project}
          task={selected.task}
        />
      )}

      {tasksQuery.data && tasksQuery.data.items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {tasksQuery.data.items.length} task{tasksQuery.data.items.length === 1 ? '' : 's'} shown
        </p>
      )}
      {/* The "View task" handler uses projectsApi.get to fetch parent project. */}
      <Button className="hidden" />
    </div>
  );
}
