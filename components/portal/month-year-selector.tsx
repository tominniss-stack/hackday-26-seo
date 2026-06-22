'use client';

import { Calendar } from 'lucide-react';

interface MonthYearSelectorProps {
  reportingMonth: string;
}

export function MonthYearSelector({ reportingMonth }: MonthYearSelectorProps) {
  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
      <Calendar className="h-3.5 w-3.5 text-slate-400" />
      <span className="font-medium">{formatMonth(reportingMonth)}</span>
    </div>
  );
}
