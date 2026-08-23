import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-slate-400 animate-pulse" />;
    case 'sent':
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    case 'read':
      return <CheckCheck className="w-3.5 h-3.5 text-brand-pink fill-brand-pink/20" />;
    case 'failed':
      return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return null;
  }
};
