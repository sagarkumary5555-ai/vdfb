import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Message, QueuedMessage, Attachment, ConversationItem, User } from '../types/index.js';
import { messageApi } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { useSocket } from './SocketContext.js';
import { soundService } from '../services/sound.js';

interface ChatContextType {
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  activePartner: User | null;
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
  isNewChatModalOpen: boolean;
  setIsNewChatModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSharedMediaOpen: boolean;
  setIsSharedMediaOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;
  offlineQueue: QueuedMessage[];
  selectConversation: (conv: ConversationItem) => void;
  startDirectChatWithUser: (user: User) => Promise<void>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<void>;
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  jumpToMessage: (messageId: string) => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [offlineQueue] = useState<QueuedMessage[]>(() => {
    try {
      const saved = localStorage.getItem('offline_queued_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch all user conversations
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await messageApi.getConversations();
      setConversations(res.conversations);

      // Auto-select first conversation if none selected
      if (!activeConversation && res.conversations.length > 0) {
        setActiveConversation(res.conversations[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [user, activeConversation]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Fetch messages when active conversation changes
  const fetchMessagesForActiveConv = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const convId = activeConversation?.id;
      const data = await messageApi.getMessages(convId, 50);
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);

      if (convId) {
        messageApi.markRead(convId).catch(() => {});
        if (socket) {
          socket.emit('conversation:join', convId);
          socket.emit('messages:read', { conversationId: convId });
        }
      }
    } catch (err) {
      console.error('Failed to load messages for conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeConversation?.id, socket]);

  useEffect(() => {
    fetchMessagesForActiveConv();
  }, [fetchMessagesForActiveConv]);

  const selectConversation = (conv: ConversationItem) => {
    if (activeConversation?.id === conv.id) return;
    if (socket && activeConversation?.id) {
      socket.emit('conversation:leave', activeConversation.id);
    }
    setActiveConversation(conv);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const startDirectChatWithUser = async (targetUser: User) => {
    try {
      const res = await messageApi.getOrCreateDirect(targetUser.id);
      const convId = res.conversation.id;

      const newConvItem: ConversationItem = {
        id: convId,
        name: targetUser.displayName,
        isGroup: false,
        otherUser: targetUser,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === convId);
        if (exists) return prev;
        return [newConvItem, ...prev];
      });

      selectConversation(newConvItem);
      setIsNewChatModalOpen(false);
    } catch (err: any) {
      alert(`Could not start chat: ${err.message || 'Error'}`);
    }
  };

  const createGroupConversation = async (name: string, participantIds: string[]) => {
    try {
      const res = await messageApi.createGroup({ name, participantIds });
      const convId = res.conversation.id;

      const newGroupItem: ConversationItem = {
        id: convId,
        name,
        isGroup: true,
        otherUser: null,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => [newGroupItem, ...prev]);
      selectConversation(newGroupItem);
      setIsNewChatModalOpen(false);
    } catch (err: any) {
      alert(`Could not create group: ${err.response?.data?.error || err.message || 'Error'}`);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const data = await messageApi.getMessages(activeConversation?.id, 50, nextCursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      if (!activeConversation || newMsg.conversationId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === newMsg.conversationId);
        if (idx !== -1) {
          const updatedConv = {
            ...prev[idx],
            lastMessage: newMsg,
            updatedAt: newMsg.createdAt,
            unreadCount:
              newMsg.senderId !== user?.id && (!activeConversation || activeConversation.id !== newMsg.conversationId)
                ? prev[idx].unreadCount + 1
                : prev[idx].unreadCount,
          };
          const nextList = [...prev];
          nextList.splice(idx, 1);
          return [updatedConv, ...nextList];
        } else {
          refreshConversations();
          return prev;
        }
      });

      if (newMsg.senderId !== user?.id) {
        soundService.playIncomingMessageSound();
        if (activeConversation && newMsg.conversationId === activeConversation.id) {
          socket.emit('messages:read', { conversationId: activeConversation.id });
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
  }, [socket, user, activeConversation]);

  // Send message
  const sendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!activeConversation) {
      alert('Please start or select a chat first!');
      setIsNewChatModalOpen(true);
      return;
    }

    const replyId = replyingTo?.id || null;
    const convId = activeConversation.id;
    const recipientId = activeConversation.otherUser?.id;
    setReplyingTo(null);

    const mappedAttachments = attachments.map((a) => ({
      filename: a.filename,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      storagePath: a.filename,
    }));

    if (!isConnected || !socket) {
      await messageApi.sendMessage({
        conversationId: convId,
        recipientId,
        content: content.trim(),
        replyToId: replyId,
        attachments: mappedAttachments,
      });
      return;
    }

    socket.emit(
      'message:send',
      {
        conversationId: convId,
        recipientId,
        content: content.trim(),
        replyToId: replyId,
        attachments: mappedAttachments,
      },
      (res: any) => {
        if (res?.error) {
          console.error('Send message error:', res.error);
        }
      }
    );
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setEditingMessage(null);

    if (socket && isConnected) {
      socket.emit('message:edit', { messageId, newContent });
    } else {
      await messageApi.editMessage(messageId, newContent);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message:delete', { messageId });
    } else {
      await messageApi.deleteMessage(messageId);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit('message:react', { messageId, emoji });
    } else {
      await messageApi.toggleReaction(messageId, emoji);
    }
  };

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
  const activePartner = activeConversation?.otherUser || null;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activePartner,
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
        isNewChatModalOpen,
        setIsNewChatModalOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isSharedMediaOpen,
        setIsSharedMediaOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        highlightedMessageId,
        setHighlightedMessageId,
        offlineQueue,
        selectConversation,
        startDirectChatWithUser,
        createGroupConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePin,
        loadMoreMessages,
        jumpToMessage,
        refreshConversations,
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
