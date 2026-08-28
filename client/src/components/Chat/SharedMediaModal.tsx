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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#0C101A] rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#080B12]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Shared Media & Files</h2>
            <span className="text-xs bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/10 font-bold">
              {filteredMedia.length}
            </span>
          </div>
          <button
            onClick={() => setIsSharedMediaOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-[#0C101A]">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-md font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Media Grid */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[60vh] custom-scrollbar bg-[#121215]">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                    className="relative group rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 hover:border-white/30 transition-all flex flex-col shadow-md"
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
                      <div className="h-32 sm:h-36 flex flex-col items-center justify-center p-4 text-center bg-zinc-900">
                        <FileText className="w-8 h-8 text-white mb-2" />
                        <span className="text-xs font-semibold text-zinc-200 truncate w-full">
                          {item.originalName}
                        </span>
                      </div>
                    )}

                    <div className="p-2.5 bg-zinc-950 flex items-center justify-between border-t border-white/5">
                      <div className="truncate pr-2">
                        <div className="text-[11px] font-medium text-zinc-200 truncate">{item.originalName}</div>
                        <div className="text-[9px] text-zinc-500">{format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setIsSharedMediaOpen(false);
                            jumpToMessage(item.messageId);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
                          title="Jump to message"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={fileUrl}
                          download={item.originalName}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
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
            <div className="py-16 text-center text-xs text-zinc-500">
              No shared media files found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
