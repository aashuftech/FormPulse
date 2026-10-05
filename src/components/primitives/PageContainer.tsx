import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function PageContainer({
  maxWidth = '2xl',
  className,
  children,
  ...props
}: PageContainerProps) {
  const maxWidths = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 px-4 py-6 sm:px-6 md:space-y-8 md:py-8 lg:px-8',
        maxWidths[maxWidth],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
