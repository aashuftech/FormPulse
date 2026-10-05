import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-sans transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan/40';

    const variants = {
      primary:
        'bg-brand-cyan text-brand-black hover:bg-[#4396a5] active:bg-brand-teal font-semibold shadow-sm',
      secondary:
        'bg-brand-dark text-brand-white border border-brand-teal/40 hover:bg-[#1a4246] hover:border-brand-cyan/50',
      outline:
        'bg-transparent border border-brand-teal/40 text-brand-white hover:bg-brand-dark/40 hover:border-brand-cyan',
      ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-brand-dark/30',
      danger: 'bg-red-950/60 border border-red-800/50 text-red-200 hover:bg-red-900/60',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5 font-medium',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
