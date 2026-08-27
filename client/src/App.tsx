import React, { useState, useEffect } from 'react';
import { MessageSquare, SquarePen } from 'lucide-react';
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
import { FriendsModal } from './components/Chat/FriendsModal.js';
import { ConnectionBanner } from './components/Chat/ConnectionBanner.js';
import { DragDropOverlay } from './components/Chat/DragDropOverlay.js';
import { CallModal } from './components/Chat/CallModal.js';
import { IncomingCallDialog } from './components/Chat/IncomingCallDialog.js';
import { uploadApi } from './services/api.js';

const ChatContent: React.FC = () => {
  const { sendMessage, isSidebarOpen, activeConversation, setIsNewChatModalOpen } = useChat();
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
    <div className="relative flex h-[100dvh] w-screen bg-black overflow-hidden font-sans select-none text-zinc-100">
      <div className="relative z-10 flex w-full h-full">
        {/* Left Inbox Sidebar (Desktop always visible, Mobile conditional) */}
        <div
          className={`${
            isSidebarOpen ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-[360px] xl:w-[400px] h-full flex-shrink-0`}
        >
          <ChatSidebar />
        </div>

        {/* Main Chat Workspace */}
        <main
          className={`${
            !isSidebarOpen ? 'flex' : 'hidden'
          } lg:flex relative flex-col flex-1 h-[100dvh] mx-auto w-full bg-[#0a0a0c] overflow-hidden`}
        >
          {activeConversation ? (
            <>
              <ChatHeader />
              <ConnectionBanner />
              <PinnedMessagesBanner />
              <MessageList />
              <MessageComposer />
            </>
          ) : (
            /* Clean Empty Conversation State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-[#0a0a0c]">
              <div className="flex flex-col items-center max-w-sm space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-xl">
                  <MessageSquare className="w-9 h-9 text-white stroke-[1.8]" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Select a conversation
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose an existing conversation or start a new encrypted direct or group chat.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2"
                >
                  <SquarePen className="w-4 h-4" />
                  <span>Start New Chat</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <MediaLightbox />
      <SearchModal />
      <SettingsModal />
      <SharedMediaModal />
      <NewChatModal />
      <FriendsModal />
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
