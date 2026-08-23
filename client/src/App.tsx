import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useChat } from './context/ChatContext.js';
import { Login } from './components/Auth/Login.js';
import { ChatSidebar } from './components/Chat/ChatSidebar.js';
import { ChatHeader } from './components/Chat/ChatHeader.js';
import { PinnedMessagesBanner } from './components/Chat/PinnedMessagesBanner.js';
import { MessageList } from './components/Chat/MessageList.js';
import { MessageComposer } from './components/Chat/MessageComposer.js';
import { MediaLightbox } from './components/Chat/MediaLightbox.js';
import { SearchModal } from './components/Chat/SearchModal.js';
import { SettingsModal } from './components/Chat/SettingsModal.js';
import { SharedMediaModal } from './components/Chat/SharedMediaModal.js';
import { ConnectionBanner } from './components/Chat/ConnectionBanner.js';
import { DragDropOverlay } from './components/Chat/DragDropOverlay.js';
import { uploadApi } from './services/api.js';

export const ChatApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { sendMessage } = useChat();
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic wallpaper appearance state
  const [wallpaperBlur, setWallpaperBlur] = useState(() => localStorage.getItem('app_wallpaper_blur') || '3');
  const [wallpaperTint, setWallpaperTint] = useState(() => localStorage.getItem('app_wallpaper_tint') || '45');

  useEffect(() => {
    const handleSettingsChanged = () => {
      setWallpaperBlur(localStorage.getItem('app_wallpaper_blur') || '3');
      setWallpaperTint(localStorage.getItem('app_wallpaper_tint') || '45');
    };
    window.addEventListener('wallpaper-settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('wallpaper-settings-changed', handleSettingsChanged);
  }, []);

  // Global Drag & Drop Handler
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        try {
          const res = await uploadApi.uploadFiles(files);
          await sendMessage('', res.files);
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to upload dropped files');
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [sendMessage]);

  if (isLoading) {
    return (
      <div className="relative flex h-[100dvh] w-screen items-center justify-center app-bg overflow-hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-brand-pink border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-white/90 tracking-wide drop-shadow-md">
            Opening private duo space...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const tintOpacity = parseInt(wallpaperTint, 10) / 100;

  return (
    <div className="relative flex h-[100dvh] w-screen app-bg overflow-hidden font-sans select-none">
      {/* Dynamic Ambient Glassmorphic Tint Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          backgroundColor: `rgba(6, 9, 15, ${tintOpacity})`,
          backdropFilter: `blur(${wallpaperBlur}px)`,
          WebkitBackdropFilter: `blur(${wallpaperBlur}px)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-dark-950/20 pointer-events-none" />

      <div className="relative z-10 flex w-full h-full">
        {/* Left Desktop Sidebar */}
        <ChatSidebar />

        {/* Center Main Messenger Container */}
        <main className="relative flex flex-col flex-1 h-[100dvh] mx-auto w-full md:bg-dark-950/35 md:backdrop-blur-xl shadow-2xl overflow-hidden">
          <ChatHeader />
          <ConnectionBanner />
          <PinnedMessagesBanner />
          <MessageList />
          <MessageComposer />
        </main>
      </div>

      {/* Global Modals & Lightboxes */}
      <MediaLightbox />
      <SearchModal />
      <SettingsModal />
      <SharedMediaModal />
      <DragDropOverlay isDragging={isDragging} />
    </div>
  );
};
