export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  customStatus: string | null;
  bio?: string | null;
  lastSeen: string | null;
}

export interface ConversationItem {
  id: string;
  name: string;
  isGroup: boolean;
  otherUser: User | null;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  discordUrl?: string | null;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  source: 'website' | 'discord';
  discordMessageId: string | null;
  replyToId: string | null;
  replyTo?: {
    id: string;
    sender: {
      displayName: string;
      username: string;
    };
    content: string;
  } | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  reactions: MessageReaction[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  localId?: string;
}

export interface SharedMediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  discordUrl?: string | null;
  createdAt: string;
  sender: User;
  messageId: string;
}

export interface QueuedMessage {
  localId: string;
  content: string;
  replyToId: string | null;
  attachments: Attachment[];
  createdAt: string;
}
