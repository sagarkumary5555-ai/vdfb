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
    <div className="flex items-center justify-center my-5 select-none">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="mx-4 text-[10px] font-extrabold tracking-widest text-zinc-400 bg-[#0C101A]/90 px-3.5 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
        {label}
      </span>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};
