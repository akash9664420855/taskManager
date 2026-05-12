import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskPriority, TaskStatus } from '@/lib/constants';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';

export interface TaskFilterState {
  q?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  overdue?: 'yes' | 'all';
  sort?: 'createdAt' | '-createdAt' | 'dueDate' | '-dueDate' | 'priority';
}

export function TaskFilters({
  value,
  onChange,
  showOverdue = true,
}: {
  value: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  showOverdue?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.q ?? ''}
          placeholder="Search tasks…"
          className="pl-9"
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </div>
      <Select
        value={value.status ?? 'all'}
        onValueChange={(v) => onChange({ ...value, status: v as TaskStatus | 'all' })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.priority ?? 'all'}
        onValueChange={(v) => onChange({ ...value, priority: v as TaskPriority | 'all' })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showOverdue && (
        <Select
          value={value.overdue ?? 'all'}
          onValueChange={(v) => onChange({ ...value, overdue: v as 'yes' | 'all' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Overdue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tasks</SelectItem>
            <SelectItem value="yes">Overdue only</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
