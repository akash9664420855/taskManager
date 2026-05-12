import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  accent?: 'primary' | 'emerald' | 'amber' | 'red' | 'sky';
}) {
  const accents: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none tracking-tight">{value}</p>
          {hint && <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
