import type { ReactNode } from 'react';
import { Card } from './Card';
import { MetricValue, TelemetryLabel } from './Typography';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  change,
  changeType = 'positive',
  icon,
  subtitle,
  className,
}: MetricCardProps) {
  const changeColors = {
    positive: 'text-brand-cyan',
    negative: 'text-rose-400',
    neutral: 'text-gray-400',
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <TelemetryLabel>{label}</TelemetryLabel>
        {icon && (
          <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/15 p-2 text-brand-cyan">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <MetricValue value={value} unit={unit} size="lg" />
      </div>

      {(change || subtitle) && (
        <div className="mt-3 flex items-center justify-between border-t border-brand-teal/15 pt-2.5 text-xs">
          {change && (
            <span className={cn('font-sans font-medium', changeColors[changeType])}>{change}</span>
          )}
          {subtitle && <span className="font-sans text-xs text-gray-400">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
