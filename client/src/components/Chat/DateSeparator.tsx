import React from 'react';
import { isToday, isYesterday, format } from 'date-fns';

interface DateSeparatorProps {
  date: Date | string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const d = new Date(date);

  let label = '';
  if (isToday(d)) {
    label = 'TODAY';
  } else if (isYesterday(d)) {
    label = 'YESTERDAY';
  } else {
    label = format(d, 'EEEE, MMMM d, yyyy').toUpperCase();
  }

  return (
    <div className="flex items-center justify-center my-6 select-none">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="mx-4 text-[11px] font-semibold tracking-wider text-slate-400 bg-dark-900/90 px-3 py-1 rounded-full border border-white/5 shadow-sm">
        {label}
      </span>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};
