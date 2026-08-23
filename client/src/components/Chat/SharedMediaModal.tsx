import React, { useState, useEffect } from 'react';
import { X, Image, Video, Music, FileText, Download, ArrowRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { messageApi, uploadApi } from '../../services/api.js';
import { SharedMediaItem } from '../../types/index.js';
import { format } from 'date-fns';

export const SharedMediaModal: React.FC = () => {
  const { isSharedMediaOpen, setIsSharedMediaOpen, openLightbox, jumpToMessage } = useChat();
  const [mediaList, setMediaList] = useState<SharedMediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'audio' | 'docs'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSharedMediaOpen) {
      setIsLoading(true);
      messageApi
        .getSharedMedia()
        .then((res) => setMediaList(res.media))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isSharedMediaOpen]);

  if (!isSharedMediaOpen) return null;

  const filteredMedia = mediaList.filter((item) => {
    const mime = item.mimeType.toLowerCase();
    if (activeTab === 'images') return mime.startsWith('image/');
    if (activeTab === 'videos') return mime.startsWith('video/');
    if (activeTab === 'audio') return mime.startsWith('audio/');
    if (activeTab === 'docs') return !mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl glass-dropdown rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Shared Media & Files</h2>
            <span className="text-xs bg-brand-rose/20 text-brand-pink px-2.5 py-0.5 rounded-full border border-brand-rose/30 font-medium">
              {filteredMedia.length}
            </span>
          </div>
          <button
            onClick={() => setIsSharedMediaOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'images', label: 'Photos', icon: Image },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'audio', label: 'Voice / Audio', icon: Music },
            { id: 'docs', label: 'Documents', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Media Grid */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[60vh]">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading shared media...
            </div>
          ) : filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMedia.map((item) => {
                const fileUrl = item.discordUrl || uploadApi.getProtectedFileUrl(item.filename);
                const isImg = item.mimeType.startsWith('image/');
                const isVid = item.mimeType.startsWith('video/');

                return (
                  <div
                    key={item.id}
                    className="relative group rounded-2xl overflow-hidden border border-white/10 bg-dark-950/80 hover:border-brand-pink/40 transition-all flex flex-col"
                  >
                    {isImg ? (
                      <div
                        onClick={() => openLightbox(fileUrl, item.originalName)}
                        className="h-32 sm:h-36 overflow-hidden cursor-pointer bg-black"
                      >
                        <img
                          src={fileUrl}
                          alt={item.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : isVid ? (
                      <div className="h-32 sm:h-36 bg-black flex items-center justify-center relative">
                        <Video className="w-8 h-8 text-white/60" />
                        <video src={fileUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      </div>
                    ) : (
                      <div className="h-32 sm:h-36 flex flex-col items-center justify-center p-4 text-center bg-slate-900/60">
                        <FileText className="w-8 h-8 text-brand-pink mb-2" />
                        <span className="text-xs font-semibold text-slate-200 truncate w-full">
                          {item.originalName}
                        </span>
                      </div>
                    )}

                    <div className="p-2.5 bg-dark-950/90 flex items-center justify-between border-t border-white/5">
                      <div className="truncate pr-2">
                        <div className="text-[11px] font-medium text-slate-200 truncate">{item.originalName}</div>
                        <div className="text-[9px] text-slate-400">{format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setIsSharedMediaOpen(false);
                            jumpToMessage(item.messageId);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="Jump to message"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={fileUrl}
                          download={item.originalName}
                          className="p-1 rounded-lg text-slate-400 hover:text-brand-pink hover:bg-white/10 transition"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              No shared media files found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
