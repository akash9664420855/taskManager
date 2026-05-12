import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Loader2 } from 'lucide-react';
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
import { UserAvatar } from '@/components/common/UserAvatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { projectsApi } from '@/api/projects.api';
import { usersApi } from '@/api/users.api';
import { extractApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Project } from '@/types';

export function MembersList({ project }: { project: Project }) {
  const me = useAuthStore((s) => s.user);
  const canManage =
    me?.role === 'admin' || me?._id === project.owner._id;
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => usersApi.list({ q: search, limit: 20 }),
    enabled: addOpen && me?.role === 'admin',
  });

  const addMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.addMember(project._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Member added');
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(project._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  const existingIds = new Set(project.members.map((m) => m._id));
  const candidates = (usersQuery.data?.items ?? []).filter((u) => !existingIds.has(u._id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Members</h3>
          <p className="text-xs text-muted-foreground">{project.members.length} on this project</p>
        </div>
        {canManage && me?.role === 'admin' && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add member
          </Button>
        )}
      </div>

      <ul className="divide-y rounded-lg border bg-card">
        {project.members.map((m) => {
          const isOwner = m._id === project.owner._id;
          return (
            <li key={m._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <UserAvatar user={m} showName />
              <div className="flex items-center gap-2">
                {isOwner && <span className="text-xs font-medium text-muted-foreground">Owner</span>}
                <RoleBadge role={m.role} />
                {canManage && !isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${m.name} from this project?`)) removeMutation.mutate(m._id);
                    }}
                    disabled={removeMutation.isPending}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>Pick a user to invite to this project.</DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border scrollbar-thin">
            {usersQuery.isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : candidates.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matching users.</p>
            ) : (
              candidates.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => {
                    addMutation.mutate(u._id);
                    setAddOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent"
                  disabled={addMutation.isPending}
                >
                  <UserAvatar user={u} showName />
                  <RoleBadge role={u.role} />
                </button>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Close
            </Button>
            {addMutation.isPending && (
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding…
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
