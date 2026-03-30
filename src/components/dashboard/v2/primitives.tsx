import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

type MetricTone = 'accent' | 'warning' | 'success' | 'neutral';

export function V2Surface({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('surface-card surface-card-strong p-6', className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--semantic-text)]">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      <div className={title ? 'mt-4' : undefined}>{children}</div>
    </div>
  );
}

export function V2StatusPill({ label, variant = 'neutral' }: { label: string; variant?: StatusVariant }) {
  const variants: Record<StatusVariant, string> = {
    info: 'bg-[var(--accent-sky-soft)] text-sky-800',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-[var(--accent-ember-soft)] text-rose-700',
    danger: 'bg-rose-100 text-rose-700',
    neutral: 'bg-slate-100 text-slate-700',
  };

  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', variants[variant])}>{label}</span>;
}

export function V2MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function V2MetricTile({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: MetricTone;
}) {
  const tones: Record<MetricTone, string> = {
    accent: 'bg-sky-50 text-sky-700',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    neutral: 'bg-slate-50 text-slate-700',
  };

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--semantic-text)]">{value}</p>
          {hint ? <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">{hint}</p> : null}
        </div>
        {icon ? <div className={cn('rounded-full p-2 text-xs', tones[tone])}>{icon}</div> : null}
      </div>
    </div>
  );
}

export function V2DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyLabel,
}: {
  columns: Array<{
    key: string;
    header: string;
    render: (row: Row) => ReactNode;
  }>;
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-[var(--semantic-text-subtle)]">{emptyLabel ?? 'Aucune donnée disponible.'}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--semantic-border)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-t border-[var(--semantic-border)]">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
