import React from 'react';
import { UploadCloud } from 'lucide-react';

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-dark-950/80 backdrop-blur-md animate-fade-in pointer-events-none p-6">
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-brand-pink/60 bg-brand-rose/5 max-w-lg w-full text-center shadow-2xl glow-pink">
        <div className="p-4 rounded-2xl bg-brand-rose/20 text-brand-pink mb-4 animate-bounce">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Drop files here to send
        </h3>
        <p className="text-sm text-slate-400">
          Images, videos, audio, documents, and archives up to 50MB
        </p>
      </div>
    </div>
  );
};
