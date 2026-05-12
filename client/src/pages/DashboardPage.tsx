import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { PriorityChart } from '@/components/dashboard/PriorityChart';
import { OverdueList } from '@/components/dashboard/OverdueList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { dashboardApi } from '@/api/dashboard.api';
import { useAuthStore } from '@/stores/auth.store';
import { extractApiError } from '@/api/client';

export function DashboardPage() {
  const me = useAuthStore((s) => s.user);
  const stats = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
  const overdue = useQuery({ queryKey: ['dashboard', 'overdue'], queryFn: dashboardApi.overdue });
  const recent = useQuery({ queryKey: ['dashboard', 'recent'], queryFn: dashboardApi.recent });

  if (stats.isError) {
    return (
      <EmptyState
        title="Couldn't load the dashboard"
        description={extractApiError(stats.error).message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {me?.name ? `Hi ${me.name.split(' ')[0]} 👋` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across {me?.role === 'admin' ? 'all projects' : 'your projects'}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[88px] w-full" />)
        ) : (
          <>
            <StatCard
              label="My open tasks"
              value={stats.data?.myOpenTasks ?? 0}
              icon={ListTodo}
              accent="primary"
            />
            <StatCard
              label="Overdue"
              value={stats.data?.overdueCount ?? 0}
              icon={AlertTriangle}
              accent={stats.data?.overdueCount ? 'red' : 'emerald'}
              hint={stats.data?.overdueCount ? 'Needs attention' : 'All caught up'}
            />
            <StatCard
              label="Completed this week"
              value={stats.data?.completedThisWeek ?? 0}
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              label="Total projects"
              value={stats.data?.totalProjects ?? 0}
              icon={FolderKanban}
              accent="sky"
            />
            <StatCard
              label="Total tasks"
              value={stats.data?.totalTasks ?? 0}
              icon={Sparkles}
              accent="amber"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {stats.isLoading ? (
          <>
            <Skeleton className="h-[260px] w-full" />
            <Skeleton className="h-[260px] w-full" />
          </>
        ) : stats.data ? (
          <>
            <StatusChart data={stats.data.byStatus} />
            <PriorityChart data={stats.data.byPriority} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {overdue.isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <OverdueList items={overdue.data ?? []} />
        )}
        {recent.isLoading ? <Skeleton className="h-72 w-full" /> : <RecentActivity data={recent.data} />}
      </div>

      {stats.data && stats.data.totalTasks === 0 && stats.data.totalProjects === 0 && (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="Nothing here yet"
              description={
                me?.role === 'member'
                  ? 'Once a project owner adds you and assigns tasks, this dashboard will fill up.'
                  : 'Create your first project to see stats and activity show up here.'
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
