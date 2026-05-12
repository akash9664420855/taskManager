import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, isThisYear } from 'date-fns';

export function fmtDate(input?: string | Date | null): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return isThisYear(d) ? format(d, 'MMM d') : format(d, 'MMM d, yyyy');
}

export function fmtDateTime(input?: string | Date | null): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM d, yyyy · h:mm a');
}

export function fmtDateInput(input?: string | Date | null): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM-dd');
}

export function fmtDueLabel(input?: string | Date | null): string {
  if (!input) return 'No due date';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return 'No due date';
  if (isYesterday(d)) return 'Due yesterday';
  if (isToday(d)) return 'Due today';
  if (isTomorrow(d)) return 'Due tomorrow';
  return `Due ${fmtDate(d)}`;
}

export function fmtRelative(input?: string | Date | null): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function isOverdue(due?: string | Date | null, status?: string): boolean {
  if (!due) return false;
  if (status === 'done') return false;
  const d = typeof due === 'string' ? new Date(due) : due;
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}
