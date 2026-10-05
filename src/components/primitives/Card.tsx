import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'interactive';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-brand-dark/25 border border-brand-teal/20 backdrop-blur-sm',
      elevated: 'bg-brand-dark/40 border border-brand-teal/30 shadow-card',
      outline: 'bg-transparent border border-brand-teal/30',
      interactive:
        'bg-brand-dark/25 border border-brand-teal/20 hover:border-brand-cyan/50 hover:bg-brand-dark/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-card',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl p-5 text-brand-white sm:p-6', variants[variant], className)}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-3', className)} {...props} />
  ),
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-lg font-semibold text-brand-white', className)}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm leading-relaxed text-gray-400', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-1', className)} {...props} />,
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center border-t border-brand-teal/15 pt-4', className)}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';
