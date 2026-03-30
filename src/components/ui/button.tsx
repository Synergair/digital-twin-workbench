import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[linear-gradient(135deg,_var(--semantic-primary),_var(--semantic-primary-strong))] text-white shadow-[0_12px_26px_rgba(11,107,107,0.24)] hover:brightness-95',
    secondary:
      'border border-[var(--semantic-border)] bg-[var(--surface-glass)] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-white/80',
    ghost: 'text-slate-700 hover:bg-slate-100',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type="button"
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
      {children}
    </button>
  );
}
