import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'warning' | 'critical' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default'
}) => {
  let borderClass = 'border-corporate-200';
  let iconBgClass = 'bg-corporate-100 text-corporate-700';

  if (variant === 'warning') {
    borderClass = 'border-amber-300 bg-amber-50/30';
    iconBgClass = 'bg-amber-100 text-amber-800';
  } else if (variant === 'critical') {
    borderClass = 'border-red-300 bg-red-50/30';
    iconBgClass = 'bg-red-100 text-red-800';
  } else if (variant === 'success') {
    borderClass = 'border-emerald-300 bg-emerald-50/30';
    iconBgClass = 'bg-emerald-100 text-emerald-800';
  }

  return (
    <div className={`bg-white border rounded p-4 shadow-sm ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-corporate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-corporate-900 mt-1 font-mono tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-corporate-600 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded border border-corporate-200/50 ${iconBgClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
