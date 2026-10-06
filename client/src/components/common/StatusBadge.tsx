import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || '').toUpperCase().trim();

  let styles = 'bg-slate-100 text-slate-800 border-slate-300';

  // Contract & User statuses
  if (norm === 'ACTIVE') {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (norm === 'COMPLETED' || norm === 'APPROVED' || norm === 'LOCKED') {
    styles = 'bg-blue-50 text-blue-800 border-blue-300';
  } else if (norm === 'NEAR_COMPLETION' || norm === 'WARNING') {
    styles = 'bg-amber-50 text-amber-800 border-amber-300';
  } else if (norm === 'CRITICAL' || norm === 'OVERDUE' || norm === 'SUSPENDED' || norm === 'BLACKLISTED') {
    styles = 'bg-red-50 text-red-800 border-red-300';
  } else if (norm === 'DRAFT' || norm === 'IN_PROGRESS') {
    styles = 'bg-slate-100 text-slate-700 border-slate-300';
  } else if (norm === 'SUBMITTED') {
    styles = 'bg-indigo-50 text-indigo-800 border-indigo-300';
  } else if (norm === 'RETURNED') {
    styles = 'bg-orange-50 text-orange-800 border-orange-300';
  } else if (norm === 'REVISED') {
    styles = 'bg-teal-50 text-teal-800 border-teal-300';
  }

  // Rating Grades
  if (norm === 'EXCELLENT') {
    styles = 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold';
  } else if (norm === 'VERY_GOOD') {
    styles = 'bg-blue-100 text-blue-900 border-blue-400 font-semibold';
  } else if (norm === 'GOOD') {
    styles = 'bg-slate-100 text-slate-900 border-slate-400 font-semibold';
  } else if (norm === 'SATISFACTORY') {
    styles = 'bg-amber-100 text-amber-900 border-amber-400 font-semibold';
  } else if (norm === 'UNSATISFACTORY') {
    styles = 'bg-red-100 text-red-900 border-red-400 font-semibold';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center border rounded font-mono uppercase tracking-wide ${padding} ${styles}`}>
      {norm.replace(/_/g, ' ')}
    </span>
  );
};
