import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFormDialog } from '@/components/projects/ProjectForm';
import { EmptyState } from '@/components/common/EmptyState';
import { RoleGate } from '@/components/auth/RoleGate';
import { projectsApi } from '@/api/projects.api';
import { extractApiError } from '@/api/client';

export function ProjectsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', { q, status, page }],
    queryFn: () =>
      projectsApi.list({
        q: q || undefined,
        status: status === 'all' ? undefined : status,
        page,
        limit: 12,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            All the projects you own or collaborate on.
          </p>
        </div>
        <RoleGate allow={['admin', 'manager']}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </RoleGate>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            placeholder="Search projects…"
            className="pl-9"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status} onValueChange={(v) => {
          setStatus(v as typeof status);
          setPage(1);
        }}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projectsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : projectsQuery.isError ? (
        <EmptyState
          title="Couldn't load projects"
          description={extractApiError(projectsQuery.error).message}
        />
      ) : projectsQuery.data && projectsQuery.data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsQuery.data.items.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>

          {projectsQuery.data.pages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
              <span>
                Page {projectsQuery.data.page} of {projectsQuery.data.pages} · {projectsQuery.data.total} project
                {projectsQuery.data.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={projectsQuery.data.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={projectsQuery.data.page >= projectsQuery.data.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={q ? 'No matching projects' : 'No projects yet'}
          description={
            q
              ? 'Try a different search term or status filter.'
              : "Create your first project to start tracking work."
          }
          action={
            <RoleGate allow={['admin', 'manager']}>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </RoleGate>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Set up a workspace for a piece of work.</DialogDescription>
          </DialogHeader>
          <ProjectFormDialog
            onCancel={() => setOpen(false)}
            onDone={() => {
              setOpen(false);
              queryClient.invalidateQueries({ queryKey: ['projects'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
