import type { HTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md border border-brand-teal/20 bg-brand-dark/60',
        className,
      )}
      {...props}
    />
  );
}

export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={cn('animate-spin text-brand-cyan', sizes[size], className)} />
    </div>
  );
}

export function FullPageLoader({ message = 'Loading FormPulse...' }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-teal/30 border-t-brand-cyan" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="shadow-cyan-glow h-3 w-3 rounded-full bg-brand-cyan" />
        </div>
      </div>
      <p className="animate-pulse font-sans text-xs uppercase tracking-wider text-brand-cyan">
        {message}
      </p>
    </div>
  );
}
