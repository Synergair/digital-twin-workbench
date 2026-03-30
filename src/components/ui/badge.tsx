import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'info' | 'outline' | 'success' | 'warning' | 'error';

export default function Badge({
  children,
  variant = 'info',
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';
  const variants: Record<BadgeVariant, string> = {
    info: 'bg-[var(--accent-sky-soft)] text-sky-800',
    outline: 'border border-[var(--semantic-border)] text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-[var(--accent-ember-soft)] text-rose-700',
    error: 'bg-rose-100 text-rose-700',
  };

  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}
