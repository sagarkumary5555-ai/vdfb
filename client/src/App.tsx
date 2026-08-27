import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useChat } from './context/ChatContext.js';
import { CallProvider } from './context/CallContext.js';
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
import { NewChatModal } from './components/Chat/NewChatModal.js';
import { ConnectionBanner } from './components/Chat/ConnectionBanner.js';
import { DragDropOverlay } from './components/Chat/DragDropOverlay.js';
import { CallModal } from './components/Chat/CallModal.js';
import { IncomingCallDialog } from './components/Chat/IncomingCallDialog.js';
import { uploadApi } from './services/api.js';

const ChatContent: React.FC = () => {
  const { sendMessage, isSidebarOpen } = useChat();
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="relative flex h-[100dvh] w-screen bg-[#000000] overflow-hidden font-sans select-none text-zinc-100">
      <div className="relative z-10 flex w-full h-full">
        {/* Left Sidebar (Desktop always visible, Mobile conditional) */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 h-full flex-shrink-0`}>
          <ChatSidebar />
        </div>

        {/* Center Main Messenger Container */}
        <main className={`${!isSidebarOpen ? 'flex' : 'hidden'} lg:flex relative flex-col flex-1 h-[100dvh] mx-auto w-full bg-[#0a0a0c] overflow-hidden`}>
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
      <NewChatModal />
      <DragDropOverlay isDragging={isDragging} />

      {/* WebRTC Live Calling Overlays */}
      <IncomingCallDialog />
      <CallModal />
    </div>
  );
};

export const ChatApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative flex h-[100dvh] w-screen items-center justify-center bg-black overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-300 tracking-wide">
            Connecting...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <CallProvider>
      <ChatContent />
    </CallProvider>
  );
};
