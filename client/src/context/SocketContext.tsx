import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionState: 'connected' | 'reconnecting' | 'offline';
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string | null) => boolean;
  getUserLastSeen: (userId?: string | null) => string | null;
  isPartnerTyping: boolean;
  emitTyping: (isTyping: boolean, conversationId?: string) => void;
  markMessagesRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userLastSeens, setUserLastSeens] = useState<Record<string, string>>({});
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionState('offline');
      setOnlineUserIds(new Set());
      return;
    }

    setConnectionState('reconnecting');

    // Create Socket.IO connection
    const newSocket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time chat gateway');
      setIsConnected(true);
      setConnectionState('connected');

      // Request latest online users list on connection/reconnection
      newSocket.emit('presence:get_online', (res: { onlineUserIds: string[] }) => {
        if (res?.onlineUserIds) {
          setOnlineUserIds(new Set(res.onlineUserIds));
        }
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from chat gateway:', reason);
      setIsConnected(false);
      setConnectionState('reconnecting');
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
      setConnectionState('reconnecting');
    });

    // Handle Presence Initialization
    newSocket.on('presence:init', (data: { onlineUserIds: string[] }) => {
      if (Array.isArray(data.onlineUserIds)) {
        setOnlineUserIds(new Set(data.onlineUserIds));
      }
    });

    // Handle Presence updates
    newSocket.on(
      'presence:update',
      (data: { userId: string; username: string; status: 'online' | 'away' | 'offline'; lastSeen?: string }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (data.status === 'online') {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });

        if (data.lastSeen) {
          setUserLastSeens((prev) => ({
            ...prev,
            [data.userId]: data.lastSeen!,
          }));
        }
      }
    );

    // Handle Typing updates
    newSocket.on('typing:status', (data: { userId: string; username: string; isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setIsPartnerTyping(data.isTyping);
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const isUserOnline = (userId?: string | null): boolean => {
    if (!userId) return false;
    return onlineUserIds.has(userId);
  };

  const getUserLastSeen = (userId?: string | null): string | null => {
    if (!userId) return null;
    return userLastSeens[userId] || null;
  };

  const emitTyping = (isTyping: boolean, conversationId?: string) => {
    if (!socketRef.current || !isConnected) return;
    if (isTyping) {
      socketRef.current.emit('typing:start', { conversationId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('typing:stop', { conversationId });
      }, 3000);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socketRef.current.emit('typing:stop', { conversationId });
    }
  };

  const markMessagesRead = () => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('messages:read', {});
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionState,
        onlineUserIds,
        isUserOnline,
        getUserLastSeen,
        isPartnerTyping,
        emitTyping,
        markMessagesRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
