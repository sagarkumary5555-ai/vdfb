import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

interface DateSeparatorProps {
  date: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const messageDate = new Date(date);

  const getDateLabel = () => {
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-center my-4 select-none">
      <div className="px-3.5 py-1 rounded-full bg-[#121214] border border-white/15 text-[11px] font-semibold text-zinc-300 shadow-md">
        {getDateLabel()}
      </div>
    </div>
  );
};
