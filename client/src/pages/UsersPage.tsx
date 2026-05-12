import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/common/UserAvatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { usersApi } from '@/api/users.api';
import { extractApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { USER_ROLES, type UserRole } from '@/lib/constants';
import { fmtRelative } from '@/lib/format';

export function UsersPage() {
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', { q, page }],
    queryFn: () => usersApi.list({ q: q || undefined, page, limit: 20 }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; role: UserRole }) =>
      usersApi.update(vars.id, { role: vars.role }),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage team members and their roles.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {usersQuery.isLoading ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (usersQuery.data?.items ?? []).length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No users found"
          description={q ? 'Try a different search.' : 'No team members yet.'}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {(usersQuery.data?.items ?? []).map((u) => {
                const isSelf = u._id === me?._id;
                return (
                  <li
                    key={u._id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                  >
                    <UserAvatar user={u} showName />
                    <div className="ml-auto flex items-center gap-2">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        Joined {fmtRelative(u.createdAt)}
                      </span>
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          updateMutation.mutate({ id: u._id, role: v as UserRole })
                        }
                        disabled={isSelf || updateMutation.isPending}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue>
                            <RoleBadge role={u.role} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              <RoleBadge role={r} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isSelf || deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete ${u.name}? This cannot be undone.`)) {
                            deleteMutation.mutate(u._id);
                          }
                        }}
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {usersQuery.data && usersQuery.data.pages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <span>
            Page {usersQuery.data.page} of {usersQuery.data.pages} · {usersQuery.data.total} user
            {usersQuery.data.total === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={usersQuery.data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={usersQuery.data.page >= usersQuery.data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
