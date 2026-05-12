import { Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/constants';
import { ROLE_LABELS } from '@/lib/constants';

const cls: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20',
  manager: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20',
  member: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20',
};

const Icon = { admin: ShieldCheck, manager: Shield, member: UserIcon } as const;

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const I = Icon[role];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        cls[role],
        className,
      )}
    >
      <I className="h-3 w-3" />
      {ROLE_LABELS[role]}
    </span>
  );
}
