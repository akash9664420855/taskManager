import { cn } from '@/lib/utils';
import { STATUS_LABELS, type TaskStatus } from '@/lib/constants';

const cls: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
  in_progress: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20',
  in_review: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  done: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
};

const dotCls: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-sky-500',
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        cls[status],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotCls[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
