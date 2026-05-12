import { Link } from 'react-router-dom';
import { CheckCircle2, ListTodo, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/common/UserAvatar';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';

export function ProjectCard({ project }: { project: Project }) {
  const total = project.taskCounts?.total ?? 0;
  const done = project.taskCounts?.done ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const archived = project.status === 'archived';

  return (
    <Link to={`/projects/${project._id}`} className="group block">
      <Card
        className={cn(
          'h-full transition-all hover:-translate-y-0.5 hover:shadow-md',
          archived && 'opacity-75',
        )}
      >
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight group-hover:text-primary">
                {project.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {project.description || 'No description yet.'}
              </p>
            </div>
            {archived && <Badge variant="secondary">Archived</Badge>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {done} / {total} done
              </span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {(project.members ?? []).slice(0, 4).map((m) => (
                <UserAvatar key={m._id} user={m} size="sm" className="ring-2 ring-card" />
              ))}
              {(project.members?.length ?? 0) > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                  +{(project.members?.length ?? 0) - 4}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.members?.length ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                {total}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
