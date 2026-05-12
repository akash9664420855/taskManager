import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/common/UserAvatar';
import { projectFormSchema, type ProjectForm } from '@/schemas/project.schema';
import { projectsApi } from '@/api/projects.api';
import { usersApi } from '@/api/users.api';
import { extractApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Project } from '@/types';

export function ProjectFormDialog({
  project,
  onDone,
  onCancel,
}: {
  project?: Project;
  onDone: (p: Project) => void;
  onCancel: () => void;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const isEdit = Boolean(project);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      members: project ? project.members.map((m) => m._id) : [],
    },
  });

  // Only admins can list all users; for managers we fall back to "owner + manual ids" via input
  const isAdmin = currentUser?.role === 'admin';
  const usersQuery = useQuery({
    queryKey: ['users', 'list-for-project'],
    queryFn: () => usersApi.list({ limit: 100 }),
    enabled: isAdmin,
  });

  async function onSubmit(values: ProjectForm) {
    try {
      const saved = isEdit
        ? await projectsApi.update(project!._id, {
            name: values.name,
            description: values.description,
          })
        : await projectsApi.create({
            name: values.name,
            description: values.description,
            members: values.members,
          });
      toast.success(isEdit ? 'Project updated' : 'Project created');
      onDone(saved);
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err);
      if (fieldErrors) {
        for (const [k, v] of Object.entries(fieldErrors)) {
          form.setError(k as keyof ProjectForm, { message: Array.isArray(v) ? v[0] : String(v) });
        }
      }
      toast.error(message);
    }
  }

  const selectableUsers = (usersQuery.data?.items ?? []).filter((u) => u._id !== currentUser?._id);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          placeholder="e.g. Website Relaunch"
          aria-invalid={!!form.formState.errors.name}
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What is this project about?"
          rows={3}
          aria-invalid={!!form.formState.errors.description}
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {!isEdit && isAdmin && (
        <div className="space-y-2">
          <Label>Invite members</Label>
          <Controller
            control={form.control}
            name="members"
            render={({ field }) => (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2 scrollbar-thin">
                {usersQuery.isLoading ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Loading users…</p>
                ) : selectableUsers.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No other users yet.</p>
                ) : (
                  selectableUsers.map((u) => {
                    const checked = field.value.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) field.onChange([...field.value, u._id]);
                            else field.onChange(field.value.filter((id) => id !== u._id));
                          }}
                        />
                        <UserAvatar user={u} size="sm" showName />
                      </label>
                    );
                  })
                )}
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground">
            You can also add members from the project page after creating it.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={form.formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
