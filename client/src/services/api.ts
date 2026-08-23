import axios from 'axios';
import { User, Message, Attachment, BridgeStatus, SharedMediaItem } from '../types/index.js';

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

export const authApi = {
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

  updateProfile: async (data: { displayName?: string; avatarUrl?: string; customStatus?: string }): Promise<{ user: User }> => {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  getUsers: async (): Promise<{ users: User[] }> => {
    const res = await api.get('/auth/users');
    return res.data;
  },
};

export const messageApi = {
  getMessages: async (
    limit = 50,
    cursor?: string
  ): Promise<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);

    const res = await api.get(`/messages?${params.toString()}`);
    return res.data;
  },

  getPinnedMessages: async (): Promise<{ pinned: Message[] }> => {
    const res = await api.get('/messages/pinned');
    return res.data;
  },

  getSharedMedia: async (): Promise<{ media: SharedMediaItem[] }> => {
    const res = await api.get('/messages/media');
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
    senderId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ messages: Message[] }> => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('q', params.query);
    if (params.senderId) queryParams.append('senderId', params.senderId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await api.get(`/messages/search?${queryParams.toString()}`);
    return res.data;
  },

  sendMessage: async (data: {
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

  markRead: async (): Promise<{ success: boolean; count: number }> => {
    const res = await api.post('/messages/read');
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

export const systemApi = {
  getStatus: async (): Promise<{
    status: string;
    uptime: number;
    database: string;
    totalMessages: number;
    totalUsers: number;
    bridge: BridgeStatus;
  }> => {
    const res = await api.get('/system/status');
    return res.data;
  },
};
