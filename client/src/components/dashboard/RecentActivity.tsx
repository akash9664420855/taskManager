import { Link } from 'react-router-dom';
import { Activity, MessageSquare, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtRelative } from '@/lib/format';
import type { RecentActivity as RecentActivityData } from '@/types';

export function RecentActivity({ data }: { data: RecentActivityData | undefined }) {
  const tasks = data?.recentTasks ?? [];
  const comments = data?.recentComments ?? [];

  const events = [
    ...tasks.map((t) => ({
      kind: 'task' as const,
      id: t._id,
      title: t.title,
      timestamp: t.updatedAt,
      projectId: typeof t.project === 'string' ? t.project : t.project._id,
      projectName: typeof t.project === 'string' ? '' : t.project.name,
      author: t.assignee ?? t.createdBy,
    })),
    ...comments.map((c) => ({
      kind: 'comment' as const,
      id: c._id ?? `${c.task._id}-${c.createdAt}`,
      title: c.body,
      timestamp: c.createdAt,
      projectId: '',
      taskId: c.task._id,
      taskTitle: c.task.title,
      author: c.author,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="As people work on tasks, you'll see updates here."
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={`${e.kind}-${e.id}`} className="flex gap-3">
                <UserAvatar user={e.author as Parameters<typeof UserAvatar>[0]['user']} size="sm" />
                <div className="min-w-0 flex-1">
                  {e.kind === 'task' ? (
                    <p className="text-sm">
                      <span className="font-medium">{e.author?.name ?? 'Someone'}</span>{' '}
                      <span className="text-muted-foreground">updated task</span>{' '}
                      <Link
                        to={`/projects/${e.projectId}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {e.title}
                      </Link>
                      {e.projectName && (
                        <span className="text-muted-foreground"> in {e.projectName}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">{e.author?.name ?? 'Someone'}</span>{' '}
                      <span className="text-muted-foreground">commented on</span>{' '}
                      <span className="font-medium">{e.taskTitle}</span>
                      <span className="mt-0.5 block items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="-mt-0.5 mr-1 inline h-3 w-3" />
                        “{e.title.length > 100 ? e.title.slice(0, 100) + '…' : e.title}”
                      </span>
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{fmtRelative(e.timestamp)}</p>
                </div>
                {e.kind === 'task' && <CheckSquare className="mt-1 h-4 w-4 text-muted-foreground" />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
