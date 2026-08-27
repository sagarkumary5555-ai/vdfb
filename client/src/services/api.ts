import axios from 'axios';
import { User, Message, Attachment, SharedMediaItem, ConversationItem } from '../types/index.js';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FriendOverviewData {
  friends: User[];
  incomingRequests: Array<{ id: string; user: User; createdAt: string }>;
  outgoingRequests: Array<{ id: string; user: User; createdAt: string }>;
  pendingCount: number;
}

export const friendsApi = {
  getOverview: async (): Promise<FriendOverviewData> => {
    const res = await api.get('/friends');
    return res.data;
  },

  sendRequest: async (target: string): Promise<{ success: boolean; message: string; friendUser?: User }> => {
    const res = await api.post('/friends/request', { target });
    return res.data;
  },

  acceptRequest: async (requesterId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/friends/accept', { requesterId });
    return res.data;
  },

  declineRequest: async (requesterId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/friends/decline', { requesterId });
    return res.data;
  },

  removeFriend: async (friendId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/friends/remove', { friendId });
    return res.data;
  },
};

export const authApi = {
  register: async (data: {
    username: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  me: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    }
  },

  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    const res = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  updateProfile: async (data: { displayName?: string; avatarUrl?: string; customStatus?: string }): Promise<{ user: User }> => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/password', { currentPassword, newPassword });
  },

  getUsers: async (): Promise<{ users: User[] }> => {
    const res = await api.get('/auth/users');
    return res.data;
  },
};

export const messageApi = {
  getConversations: async (): Promise<{ conversations: ConversationItem[] }> => {
    const res = await api.get('/messages/conversations');
    return res.data;
  },

  getOrCreateDirect: async (targetUserId: string): Promise<{ conversation: any }> => {
    const res = await api.post('/messages/conversations/direct', { targetUserId });
    return res.data;
  },

  createGroup: async (data: { name: string; participantIds: string[] }): Promise<{ conversation: any }> => {
    const res = await api.post('/messages/conversations/group', data);
    return res.data;
  },

  getParticipants: async (conversationId: string): Promise<{ participants: Array<{ role: string; user: User }> }> => {
    const res = await api.get(`/messages/conversations/${conversationId}/participants`);
    return res.data;
  },

  getMessages: async (
    conversationId?: string,
    limit = 50,
    cursor?: string
  ): Promise<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversationId', conversationId);
    if (limit) params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);

    const res = await api.get(`/messages?${params.toString()}`);
    return res.data;
  },

  getPinnedMessages: async (conversationId?: string): Promise<{ pinned: Message[] }> => {
    const url = conversationId ? `/messages/pinned?conversationId=${conversationId}` : '/messages/pinned';
    const res = await api.get(url);
    return res.data;
  },

  getSharedMedia: async (conversationId?: string): Promise<{ media: SharedMediaItem[] }> => {
    const url = conversationId ? `/messages/media?conversationId=${conversationId}` : '/messages/media';
    const res = await api.get(url);
    return res.data;
  },

  toggleReaction: async (messageId: string, emoji: string): Promise<{ message: Message }> => {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  togglePin: async (messageId: string): Promise<{ message: Message }> => {
    const res = await api.post(`/messages/${messageId}/pin`);
    return res.data;
  },

  searchMessages: async (params: {
    query?: string;
    conversationId?: string;
    senderId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ messages: Message[] }> => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('q', params.query);
    if (params.conversationId) queryParams.append('conversationId', params.conversationId);
    if (params.senderId) queryParams.append('senderId', params.senderId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await api.get(`/messages/search?${queryParams.toString()}`);
    return res.data;
  },

  sendMessage: async (data: {
    conversationId?: string;
    recipientId?: string;
    content: string;
    replyToId?: string | null;
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      storagePath: string;
    }>;
  }): Promise<{ message: Message }> => {
    const res = await api.post('/messages', data);
    return res.data;
  },

  editMessage: async (id: string, content: string): Promise<{ message: Message }> => {
    const res = await api.put(`/messages/${id}`, { content });
    return res.data;
  },

  deleteMessage: async (id: string): Promise<{ message: Message }> => {
    const res = await api.delete(`/messages/${id}`);
    return res.data;
  },

  markRead: async (conversationId?: string): Promise<{ success: boolean; count: number }> => {
    const res = await api.post('/messages/read', { conversationId });
    return res.data;
  },
};

export const uploadApi = {
  uploadFiles: async (
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<{ files: Attachment[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },

  getProtectedFileUrl: (filename: string): string => {
    const token = localStorage.getItem('auth_token');
    return `/api/uploads/${filename}?token=${encodeURIComponent(token || '')}`;
  },
};
