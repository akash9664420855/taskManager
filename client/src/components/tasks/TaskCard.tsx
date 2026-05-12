import { CalendarDays, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { fmtDueLabel, isOverdue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

export function TaskCard({
  task,
  onClick,
  draggable,
  ...rest
}: {
  task: Task;
  onClick?: () => void;
  draggable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      draggable={draggable}
      className={cn(
        'group cursor-pointer space-y-3 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md',
        overdue && 'ring-1 ring-red-500/40',
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} showLabel={false} />
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1',
            overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground',
          )}
        >
          <CalendarDays className="h-3 w-3" />
          {fmtDueLabel(task.dueDate)}
        </span>
        <UserAvatar user={task.assignee ?? null} size="sm" />
      </div>
    </Card>
  );
}
