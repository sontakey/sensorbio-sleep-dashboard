import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'bg-[var(--card)] border border-[var(--border)] rounded-xl transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('p-4 md:p-5', className)}>{children}</div>;
}

export function Label({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.08em] font-semibold transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return (
    <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-3 transition-colors duration-200">
      {children}
    </div>
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
) {
  const { className, variant = 'primary', ...rest } = props;
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition border focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-500/20 border-blue-400/30 text-blue-200 hover:bg-blue-500/30',
    ghost: 'bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-black/5',
    danger: 'bg-red-500/15 border-red-400/30 text-red-200 hover:bg-red-500/25',
  };
  return <button className={clsx(base, variants[variant], className)} {...rest} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={clsx(
        'w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors duration-200',
        className
      )}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={clsx(
        'w-full rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors duration-200',
        className
      )}
      {...rest}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-slate-200 animate-spin" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
