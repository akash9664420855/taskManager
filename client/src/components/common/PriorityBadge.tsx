import { ArrowDown, ArrowRight, ArrowUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_LABELS, type TaskPriority } from '@/lib/constants';

const cls: Record<TaskPriority, string> = {
  low: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20',
  medium: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20',
};

const Icon = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
  urgent: Flame,
} as const;

export function PriorityBadge({
  priority,
  className,
  showLabel = true,
}: {
  priority: TaskPriority;
  className?: string;
  showLabel?: boolean;
}) {
  const I = Icon[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        cls[priority],
        className,
      )}
      title={`${PRIORITY_LABELS[priority]} priority`}
    >
      <I className="h-3 w-3" />
      {showLabel && <span>{PRIORITY_LABELS[priority]}</span>}
    </span>
  );
}
