import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/common/UserAvatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { useAuthStore } from '@/stores/auth.store';
import { fmtDateTime } from '@/lib/format';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">Account details and permissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>This is how you appear to other people on the team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <p className="text-base font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={user.role} />
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Member since</dt>
              <dd className="mt-0.5 text-sm">{fmtDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">User ID</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{user._id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What you can do</CardTitle>
          <CardDescription>Permissions tied to your role.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {user.role === 'admin' && (
              <>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Manage all users and roles</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Create, edit, and delete any project</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> See dashboard data across the whole workspace</li>
              </>
            )}
            {user.role === 'manager' && (
              <>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Create projects and invite members</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Assign tasks, set priorities and due dates</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Comment, edit, and update tasks in your projects</li>
              </>
            )}
            {user.role === 'member' && (
              <>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> View projects you&apos;re a member of</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Update status &amp; description on tasks assigned to you</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> Comment on any task in your projects</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
