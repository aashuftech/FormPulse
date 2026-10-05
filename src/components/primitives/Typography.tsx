import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeading({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-4 border-b border-brand-teal/20 pb-6 md:flex-row md:items-center',
        className,
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 font-sans text-sm text-gray-400">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'flex items-center gap-2.5 font-display text-lg font-semibold text-brand-white',
        className,
      )}
      {...props}
    >
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand-cyan" />
      {children}
    </h2>
  );
}

export function MetricValue({
  value,
  unit,
  size = 'md',
  className,
}: {
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
  };

  return (
    <div
      className={cn(
        'flex items-baseline gap-1.5 font-display font-bold text-brand-white',
        className,
      )}
    >
      <span className={sizeClasses[size]}>{value}</span>
      {unit && <span className="font-sans text-sm font-medium text-gray-400">{unit}</span>}
    </div>
  );
}

export function TelemetryLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'select-none font-sans text-xs font-medium uppercase tracking-wider text-gray-400',
        className,
      )}
    >
      {children}
    </span>
  );
}
