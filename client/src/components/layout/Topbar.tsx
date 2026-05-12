import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/UserAvatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';
import { extractApiError } from '@/api/client';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (err) {
      // even if server logout fails, clear locally
      console.warn('logout error:', extractApiError(err).message);
    }
    clear();
    navigate('/login', { replace: true });
    toast.success('Signed out');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <ThemeToggle />

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5">
              <UserAvatar user={user} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs leading-tight text-muted-foreground">{user.email}</div>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Signed in as</span>
              <RoleBadge role={user.role} />
            </DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-foreground normal-case">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
