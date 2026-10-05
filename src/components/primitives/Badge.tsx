import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'teal' | 'outline' | 'dark' | 'success' | 'warning';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'cyan',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    cyan: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30',
    teal: 'bg-brand-teal/20 text-brand-white border border-brand-teal/40',
    outline: 'bg-transparent text-gray-300 border border-brand-teal/30',
    dark: 'bg-brand-dark/70 text-gray-200 border border-brand-teal/20',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-sans font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
