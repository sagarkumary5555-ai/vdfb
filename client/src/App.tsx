import React, { useState, useEffect } from 'react';
import { Send, SquarePen } from 'lucide-react';
import { useAuth } from './context/AuthContext.js';
import { useChat } from './context/ChatContext.js';
import { CallProvider } from './context/CallContext.js';
import { Login } from './components/Auth/Login.js';
import { InstagramNavRail } from './components/Navigation/InstagramNavRail.js';
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
        {/* Instagram Left Slim Navigation Rail (Desktop) */}
        <InstagramNavRail />

        {/* Instagram Messages Sidebar (Desktop always visible, Mobile conditional) */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-[350px] xl:w-[380px] h-full flex-shrink-0`}>
          <ChatSidebar />
        </div>

        {/* Instagram Main Messenger Container */}
        <main className={`${!isSidebarOpen ? 'flex' : 'hidden'} lg:flex relative flex-col flex-1 h-[100dvh] mx-auto w-full bg-black overflow-hidden`}>
          {activeConversation ? (
            <>
              <ChatHeader />
              <ConnectionBanner />
              <PinnedMessagesBanner />
              <MessageList />
              <MessageComposer />
            </>
          ) : (
            /* Instagram Empty Conversation State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-black">
              <div className="flex flex-col items-center max-w-sm space-y-3">
                <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-1">
                  <Send className="w-12 h-12 stroke-[1.4] text-white rotate-12 -ml-1 mt-1" />
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">
                  Your Messages
                </h2>
                <p className="text-sm text-zinc-400 leading-normal">
                  Send a message to start a chat.
                </p>

                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="mt-2 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold rounded-lg shadow transition active:scale-95 flex items-center gap-2"
                >
                  <SquarePen className="w-4 h-4" />
                  <span>Send message</span>
                </button>
              </div>
            </div>
          )}
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
