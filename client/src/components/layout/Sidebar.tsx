import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ListTodo, Users, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'member'] as const },
  { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'manager', 'member'] as const },
  { to: '/tasks', label: 'My Tasks', icon: ListTodo, roles: ['admin', 'manager', 'member'] as const },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] as const },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold tracking-tight">TaskFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems
          .filter((item) => !role || (item.roles as readonly string[]).includes(role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>

      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        TaskFlow · v1.0
      </div>
    </aside>
  );
}
