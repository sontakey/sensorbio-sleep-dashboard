import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('bg-[#111827] border border-[#1e293b] rounded-xl', className)}>{children}</div>;
}

export function CardBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('p-4 md:p-5', className)}>{children}</div>;
}

export function Label({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'text-[10px] text-slate-500 uppercase tracking-[0.08em] font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">{children}</div>;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
) {
  const { className, variant = 'primary', ...rest } = props;
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition border focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-500/20 border-blue-400/30 text-blue-200 hover:bg-blue-500/30',
    ghost: 'bg-transparent border-[#1e293b] text-slate-200 hover:bg-white/5',
    danger: 'bg-red-500/15 border-red-400/30 text-red-200 hover:bg-red-500/25',
  };
  return <button className={clsx(base, variants[variant], className)} {...rest} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={clsx(
        'w-full rounded-lg bg-[#0f172a] border border-[#1e293b] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40',
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
        'w-full rounded-lg bg-[#0f172a] border border-[#1e293b] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40',
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
