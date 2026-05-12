import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDueLabel } from '@/lib/format';
import type { Task } from '@/types';

export function OverdueList({ items }: { items: Task[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Overdue tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing overdue"
            description="Nice — everything is on track."
            className="py-8"
          />
        ) : (
          <ul className="divide-y">
            {items.map((task) => {
              const projectId = typeof task.project === 'string' ? task.project : task.project._id;
              const projectName = typeof task.project === 'string' ? '' : task.project.name;
              return (
                <li key={task._id} className="py-2">
                  <Link
                    to={`/projects/${projectId}`}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {projectName && <span className="truncate">{projectName}</span>}
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {fmtDueLabel(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} showLabel={false} />
                    <UserAvatar user={task.assignee ?? null} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
