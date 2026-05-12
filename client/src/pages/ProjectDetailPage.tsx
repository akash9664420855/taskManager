import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ListTodo, Pencil, Plus, Settings, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { UserAvatar } from '@/components/common/UserAvatar';
import { TaskFilters, type TaskFilterState } from '@/components/tasks/TaskFilters';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { MembersList } from '@/components/projects/MembersList';
import { projectsApi } from '@/api/projects.api';
import { tasksApi } from '@/api/tasks.api';
import { extractApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Task } from '@/types';
import type { TaskStatus } from '@/lib/constants';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TaskFilterState>({});
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: Task | null; status?: TaskStatus }>({
    open: false,
    task: null,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', { project: id, ...filters }],
    queryFn: () =>
      tasksApi.list({
        project: id!,
        q: filters.q || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        overdue: filters.overdue === 'yes' ? true : undefined,
        limit: 200,
      }),
    enabled: !!id,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.remove(id!),
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects', { replace: true });
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <EmptyState
        title="Couldn't load this project"
        description={extractApiError(projectQuery.error).message || 'It may have been deleted, or you no longer have access.'}
        action={
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Button>
        }
      />
    );
  }

  const project = projectQuery.data;
  const isOwner = me?._id === project.owner._id;
  const canManage = me?.role === 'admin' || isOwner;
  const isMember =
    canManage || project.members.some((m) => m._id === me?._id);
  const canCreateTask = me?.role !== 'member';

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{project.name}</h1>
            {project.status === 'archived' && <Badge variant="secondary">Archived</Badge>}
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {project.members.length} member{project.members.length === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5" />
              {project.taskCounts?.total ?? 0} total
            </span>
            <span className="inline-flex items-center gap-1.5">
              Owner:
              <UserAvatar user={project.owner} size="sm" />
              {project.owner.name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canCreateTask && isMember && project.status === 'active' && (
            <Button onClick={() => setTaskDialog({ open: true, task: null })}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <TaskFilters value={filters} onChange={setFilters} />
          {tasksQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : tasksQuery.isError ? (
            <EmptyState
              title="Couldn't load tasks"
              description={extractApiError(tasksQuery.error).message}
            />
          ) : (tasksQuery.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={<ListTodo className="h-6 w-6" />}
              title="No tasks yet"
              description={
                canCreateTask
                  ? 'Create the first task to kick this project off.'
                  : 'Once a task is assigned to you, it will show here.'
              }
              action={
                canCreateTask &&
                isMember &&
                project.status === 'active' && (
                  <Button onClick={() => setTaskDialog({ open: true, task: null })}>
                    <Plus className="h-4 w-4" />
                    New task
                  </Button>
                )
              }
            />
          ) : (
            <TaskBoard
              tasks={tasksQuery.data?.items ?? []}
              onSelectTask={(t) => setTaskDialog({ open: true, task: t })}
              onCreateInColumn={
                canCreateTask && project.status === 'active'
                  ? (status) => setTaskDialog({ open: true, task: null, status })
                  : undefined
              }
              canCreate={canCreateTask && project.status === 'active'}
            />
          )}
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-6">
              <MembersList project={project} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((s) => ({ ...s, open }))}
        project={project}
        task={taskDialog.task}
        defaultStatus={taskDialog.status}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Pencil className="mr-2 inline h-4 w-4" />
              Project settings
            </DialogTitle>
            <DialogDescription>Edit details or archive the project.</DialogDescription>
          </DialogHeader>
          <ProjectSettingsForm
            project={project}
            onDone={() => {
              setSettingsOpen(false);
              queryClient.invalidateQueries({ queryKey: ['project', project._id] });
              queryClient.invalidateQueries({ queryKey: ['projects'] });
            }}
            onDelete={() => {
              if (confirm('Delete this project? All tasks and comments will be removed. This cannot be undone.'))
                deleteProjectMutation.mutate();
            }}
            isDeleting={deleteProjectMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectSettingsForm({
  project,
  onDone,
  onDelete,
  isDeleting,
}: {
  project: ReturnType<typeof projectsApi.get> extends Promise<infer T> ? T : never;
  onDone: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState<'active' | 'archived'>(project.status);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await projectsApi.update(project._id, { name, description, status });
      toast.success('Saved');
      onDone();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          value={description}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex gap-2">
          {(['active', 'archived'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                status === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-accent'
              }`}
            >
              {s === 'active' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete project
        </Button>
        <Button type="submit" disabled={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}
