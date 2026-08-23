import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Message, QueuedMessage, Attachment } from '../types/index.js';
import { messageApi } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { useSocket } from './SocketContext.js';
import { soundService } from '../services/sound.js';

interface ChatContextType {
  messages: Message[];
  pinnedMessages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  lightboxImage: { url: string; name: string } | null;
  openLightbox: (url: string, name: string) => void;
  closeLightbox: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSharedMediaOpen: boolean;
  setIsSharedMediaOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;
  offlineQueue: QueuedMessage[];
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  jumpToMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected, markMessagesRead } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [offlineQueue, setOfflineQueue] = useState<QueuedMessage[]>(() => {
    try {
      const saved = localStorage.getItem('offline_queued_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('offline_queued_messages', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const fetchInitialMessages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await messageApi.getMessages(50);
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
      markMessagesRead();
    } catch (err) {
      console.error('Failed to load initial messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, markMessagesRead]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const data = await messageApi.getMessages(50, nextCursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Offline queue resend
  useEffect(() => {
    if (isConnected && offlineQueue.length > 0 && socket) {
      const queueToProcess = [...offlineQueue];
      setOfflineQueue([]);

      queueToProcess.forEach(async (queued) => {
        try {
          socket.emit('message:send', {
            content: queued.content,
            replyToId: queued.replyToId,
            attachments: queued.attachments,
          });
        } catch (err) {
          console.error('Failed to send queued message:', err);
        }
      });
    }
  }, [isConnected, socket, offlineQueue]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (newMsg.senderId !== user?.id) {
        soundService.playIncomingMessageSound();
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(newMsg.sender.displayName, {
              body: newMsg.content || 'Sent an attachment',
              icon: newMsg.sender.avatarUrl || undefined,
            });
          } catch {
            // Ignore
          }
        }
        if (!document.hidden) {
          markMessagesRead();
        }
      } else {
        soundService.playSentMessageSound();
      }
    };

    const handleMessageUpdated = (updatedMsg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
      );
    };

    const handleMessageDeleted = (deletedMsg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === deletedMsg.id ? deletedMsg : m))
      );
    };

    const handleStatusUpdated = (data: { messageIds: string[]; status: 'delivered' | 'read' }) => {
      setMessages((prev) =>
        prev.map((m) => (data.messageIds.includes(m.id) ? { ...m, status: data.status } : m))
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('messages:status_updated', handleStatusUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('messages:status_updated', handleStatusUpdated);
    };
  }, [socket, user, markMessagesRead]);

  // Send message
  const sendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!content.trim() && attachments.length === 0) return;

    const replyId = replyingTo?.id || null;
    setReplyingTo(null);

    if (!isConnected || !socket) {
      const localId = `local_${Date.now()}_${Math.random()}`;
      const queuedItem: QueuedMessage = {
        localId,
        content: content.trim(),
        replyToId: replyId,
        attachments,
        createdAt: new Date().toISOString(),
      };
      setOfflineQueue((prev) => [...prev, queuedItem]);

      if (user) {
        const optimisticMsg: Message = {
          id: localId,
          conversationId: 'duo_conversation',
          senderId: user.id,
          sender: user,
          content: content.trim(),
          source: 'website',
          discordMessageId: null,
          replyToId: replyId,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                sender: {
                  displayName: replyingTo.sender.displayName,
                  username: replyingTo.sender.username,
                },
                content: replyingTo.content,
              }
            : null,
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          reactions: [],
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachments,
        };
        setMessages((prev) => [...prev, optimisticMsg]);
      }
      return;
    }

    socket.emit(
      'message:send',
      {
        content: content.trim(),
        replyToId: replyId,
        attachments,
      },
      (res: any) => {
        if (res?.error) {
          console.error('Send message error:', res.error);
        }
      }
    );
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setEditingMessage(null);

    if (socket && isConnected) {
      socket.emit('message:edit', { messageId, newContent });
    } else {
      await messageApi.editMessage(messageId, newContent);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message:delete', { messageId });
    } else {
      await messageApi.deleteMessage(messageId);
    }
  };

  // Toggle reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit('message:react', { messageId, emoji });
    } else {
      await messageApi.toggleReaction(messageId, emoji);
    }
  };

  // Toggle pin
  const togglePin = async (messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message:pin', { messageId });
    } else {
      await messageApi.togglePin(messageId);
    }
  };

  const jumpToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2500);
  };

  const openLightbox = (url: string, name: string) => {
    setLightboxImage({ url, name });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  return (
    <ChatContext.Provider
      value={{
        messages,
        pinnedMessages,
        isLoading,
        isLoadingMore,
        hasMore,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        lightboxImage,
        openLightbox,
        closeLightbox,
        isSearchOpen,
        setIsSearchOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isSharedMediaOpen,
        setIsSharedMediaOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        highlightedMessageId,
        setHighlightedMessageId,
        offlineQueue,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePin,
        loadMoreMessages,
        jumpToMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
