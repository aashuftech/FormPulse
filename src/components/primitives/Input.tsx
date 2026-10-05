import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', label, helperText, error, startIcon, endIcon, id, ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block font-sans text-sm font-medium text-gray-200">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-brand-teal">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-md border border-brand-teal/40 bg-brand-dark/50 px-3 py-2 text-sm text-brand-white placeholder-gray-500 transition-colors',
              'focus:border-brand-cyan focus:bg-brand-dark/80 focus:outline-none focus:ring-1 focus:ring-brand-cyan/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              startIcon && 'pl-9',
              endIcon && 'pr-9',
              error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30',
              className,
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 flex items-center text-gray-400">{endIcon}</div>
          )}
        </div>

        {error ? (
          <p className="font-sans text-xs text-red-400">{error}</p>
        ) : helperText ? (
          <p className="font-sans text-xs text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
