export interface UserJWTPayload {
  userId: string;
  username: string;
  displayName: string;
  sessionId: string;
}

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  customStatus: string | null;
  lastSeen: Date | null;
}

export interface AttachmentResponse {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  discordUrl?: string | null;
  createdAt: Date;
}

export interface MessageReaction {
  emoji: string;
  users: string[]; // userIds who reacted
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  sender: UserResponse;
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
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
  attachments: AttachmentResponse[];
}

export interface PresenceState {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date | null;
  isTyping: boolean;
}

export interface BridgeStatus {
  discordEnabled: boolean;
  sagarBotReady: boolean;
  somethingBotReady: boolean;
  channelAccessible: boolean;
  channelId: string | null;
  pendingSyncCount: number;
}
