import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_LABELS, type TaskStatus } from '@/lib/constants';

const COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8',
  in_progress: '#0ea5e9',
  in_review: '#f59e0b',
  done: '#10b981',
};

export function StatusChart({ data }: { data: Record<TaskStatus, number> }) {
  const series = (Object.keys(data) as TaskStatus[])
    .map((k) => ({ name: STATUS_LABELS[k], value: data[k], key: k }))
    .filter((s) => s.value > 0);

  const total = series.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="h-48">
            {total === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={series}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={3}
                  >
                    {series.map((s) => (
                      <Cell key={s.key} fill={COLORS[s.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="space-y-2">
            {(Object.keys(data) as TaskStatus[]).map((k) => (
              <li key={k} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[k] }} />
                  {STATUS_LABELS[k]}
                </span>
                <span className="font-mono text-muted-foreground">{data[k]}</span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t pt-2 text-sm font-medium">
              <span>Total</span>
              <span className="font-mono">{total}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
