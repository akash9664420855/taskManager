import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIORITY_LABELS, type TaskPriority } from '@/lib/constants';

const COLORS: Record<TaskPriority, string> = {
  low: '#94a3b8',
  medium: '#0ea5e9',
  high: '#f97316',
  urgent: '#ef4444',
};

export function PriorityChart({ data }: { data: Record<TaskPriority, number> }) {
  const series = (Object.keys(data) as TaskPriority[]).map((k) => ({
    name: PRIORITY_LABELS[k],
    value: data[k],
    key: k,
    fill: COLORS[k],
  }));
  const total = series.reduce((s, x) => s + x.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By priority</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
