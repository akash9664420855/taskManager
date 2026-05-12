import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsOf } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export interface UserAvatarProps {
  user?: Pick<User, 'name' | 'email' | 'avatarUrl'> | null;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function UserAvatar({ user, className, showName = false, size = 'md' }: UserAvatarProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Avatar className={cn(sizeMap[size], className)}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm">Unassigned</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar className={cn(sizeMap[size], className)}>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
        <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
      </Avatar>
      {showName && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}
    </div>
  );
}
