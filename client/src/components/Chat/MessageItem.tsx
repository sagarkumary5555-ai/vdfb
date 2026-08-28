import React, { useState } from 'react';
import {
  Reply,
  Copy,
  Edit2,
  Trash2,
  FileText,
  Download,
  Check,
  Pin,
} from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { Message, Attachment } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { MessageStatus } from './MessageStatus.js';
import { uploadApi } from '../../services/api.js';
import { Avatar } from '../Common/Avatar.js';
import { VoiceNotePlayer } from './VoiceNotePlayer.js';

interface MessageItemProps {
  message: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const POPULAR_REACTIONS = ['❤️', '🔥', '😂', '🥰', '🥺', '👍'];

const isJumboEmoji = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length > 12) return false;
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
  return emojiRegex.test(trimmed);
};

const getGifUrl = (text: string): string | null => {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith('[GIF:') && trimmed.endsWith(']')) {
    return trimmed.slice(5, -1);
  }
  if (
    /^https?:\/\/.*\.(gif|webp|png)(\?.*)?$/i.test(trimmed) &&
    (trimmed.includes('Animated-Fluent-Emojis') ||
      trimmed.includes('giphy.com') ||
      trimmed.includes('tenor.com') ||
      trimmed.includes('wikimedia.org'))
  ) {
    return trimmed;
  }
  return null;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFirstInGroup: _isFirstInGroup = true,
  isLastInGroup = true,
}) => {
  const { user } = useAuth();
  const {
    setReplyingTo,
    setEditingMessage,
    deleteMessage,
    toggleReaction,
    togglePin,
    openLightbox,
    highlightedMessageId,
  } = useChat();

  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMe = message.senderId === user?.id || message.sender.username === user?.username;
  const isHighlighted = highlightedMessageId === message.id;
  const gifUrl = !message.isDeleted ? getGifUrl(message.content) : null;
  const isEmojiOnly =
    !message.isDeleted &&
    !gifUrl &&
    isJumboEmoji(message.content) &&
    (!message.attachments || message.attachments.length === 0);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReaction(message.id, '❤️');
    confetti({
      particleCount: 24,
      spread: 60,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#ffffff', '#a1a1aa', '#52525b', '#000000'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      setIsDeleting(true);
      await deleteMessage(message.id);
      setIsDeleting(false);
    }
  };

  const handleReaction = (emoji: string) => {
    toggleReaction(message.id, emoji);
  };

  const renderAttachment = (att: Attachment) => {
    const fileUrl = att.discordUrl || uploadApi.getProtectedFileUrl(att.filename);
    const mime = att.mimeType.toLowerCase();

    // Image
    if (mime.startsWith('image/')) {
      return (
        <div
          key={att.id}
          className="mt-1 overflow-hidden rounded-2xl border border-white/20 max-w-xs sm:max-w-sm cursor-pointer group shadow-xl bg-black"
        >
          <img
            src={fileUrl}
            alt={att.originalName}
            onClick={() => openLightbox(fileUrl, att.originalName)}
            className="w-full max-h-56 sm:max-h-72 object-cover hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      );
    }

    // Video
    if (mime.startsWith('video/')) {
      return (
        <div key={att.id} className="mt-1 rounded-2xl overflow-hidden border border-white/20 max-w-xs sm:max-w-md bg-black shadow-xl">
          <video src={fileUrl} controls className="w-full max-h-56 sm:max-h-72" />
        </div>
      );
    }

    // Audio / Voice Note
    if (mime.startsWith('audio/')) {
      return <VoiceNotePlayer key={att.id} src={fileUrl} isMe={isMe} />;
    }

    // Generic Document / File
    return (
      <a
        key={att.id}
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={att.originalName}
        className={`mt-1 flex items-center gap-3 p-3 rounded-2xl border ${
          isMe
            ? 'bg-black/10 border-black/20 text-black hover:bg-black/15'
            : 'bg-[#18181A] border-white/15 text-white hover:bg-[#222226]'
        } transition group max-w-xs sm:max-w-sm`}
      >
        <div className={`p-2 rounded-xl ${isMe ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{att.originalName}</p>
          <p className={`text-[10px] ${isMe ? 'text-black/70' : 'text-zinc-400'}`}>
            {(att.size / 1024).toFixed(1)} KB • Tap to open
          </p>
        </div>
        <Download className="w-4 h-4 opacity-70 group-hover:opacity-100 flex-shrink-0" />
      </a>
    );
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`group relative flex gap-2 py-0.5 px-1 sm:px-2 rounded-xl transition-colors duration-150 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      } ${isHighlighted ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/[0.03]'}`}
    >
      {/* Sender Avatar (Only in Group Chats for others, or single DM) */}
      <div className="flex-shrink-0 self-end mb-1">
        {!isMe && isLastInGroup ? (
          <Avatar
            name={message.sender.displayName}
            username={message.sender.username}
            avatarUrl={message.sender.avatarUrl}
            size="sm"
            className="w-7 h-7 sm:w-8 sm:h-8 shadow-md ring-1 ring-white/20"
          />
        ) : (
          <div className="w-7 sm:w-8" />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[72%] md:max-w-[58%] ${isMe ? 'items-end' : 'items-start'} flex flex-col min-w-0`}>
        {/* Pinned Tag */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-white bg-white/15 px-2.5 py-0.5 rounded-full border border-white/30 mb-1 font-semibold">
            <Pin className="w-2.5 h-2.5" />
            <span>Pinned</span>
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div
            className={`mb-1 p-2 rounded-xl text-xs max-w-full border-l-2 ${
              isMe
                ? 'bg-zinc-900 border-white text-zinc-300 self-end'
                : 'bg-[#18181A] border-white text-zinc-300 self-start'
            }`}
          >
            <div className="text-[10px] font-bold text-white flex items-center gap-1">
              <Reply className="w-2.5 h-2.5" />
              <span>{message.replyTo.sender.displayName}</span>
            </div>
            <div className="text-zinc-300 text-[11px] truncate max-w-xs font-normal mt-0.5">
              {message.replyTo.content || '[Attachment]'}
            </div>
          </div>
        )}

        {/* 1. Animated Sticker / GIF Display */}
        {gifUrl ? (
          <div className="mt-1 max-w-[180px] sm:max-w-[220px] cursor-pointer group select-none">
            <img
              src={gifUrl}
              alt=""
              onClick={() => openLightbox(gifUrl, 'Sticker')}
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain hover:scale-110 transition-transform duration-200"
              loading="lazy"
            />
            <div className={`flex items-center gap-1 text-[10px] mt-0.5 select-none font-medium ${
              isMe ? 'justify-end text-zinc-400' : 'justify-start text-zinc-400'
            }`}>
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
              {isMe && <MessageStatus status={message.status} />}
            </div>
          </div>
        ) : isEmojiOnly ? (
          /* 2. Jumbo Emoji Display */
          <div className="py-0.5 px-1 select-text text-4xl sm:text-5xl tracking-wide filter drop-shadow-md">
            {message.content}
            <div
              className={`flex items-center gap-1 text-[10px] select-none font-medium mt-0.5 ${
                isMe ? 'justify-end text-zinc-400' : 'justify-start text-zinc-400'
              }`}
            >
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
              {isMe && <MessageStatus status={message.status} />}
            </div>
          </div>
        ) : (
          /* 3. Main Message Bubble in Pure Black & White */
          <div
            className={`relative px-4 py-2.5 text-sm leading-relaxed transition-all max-w-full overflow-hidden shadow-md ${
              isMe
                ? `bg-white text-black font-medium ${
                    isLastInGroup ? 'rounded-2xl rounded-br-xs' : 'rounded-2xl'
                  }`
                : `bg-[#141416] border border-white/15 text-white font-normal ${
                    isLastInGroup ? 'rounded-2xl rounded-bl-xs' : 'rounded-2xl'
                  }`
            } ${message.isDeleted ? 'italic text-zinc-500 bg-zinc-900 border border-dashed border-white/20' : ''}`}
          >
            {/* Text Body */}
            <div className="whitespace-pre-wrap break-words select-text font-normal overflow-hidden">
              {message.content}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1.5 max-w-full">
                {message.attachments.map((att) => renderAttachment(att))}
              </div>
            )}

            {/* Footer Metadata */}
            <div
              className={`flex items-center gap-1.5 text-[10px] mt-1 select-none font-medium ${
                isMe ? 'justify-end text-zinc-600' : 'justify-start text-zinc-400'
              }`}
            >
              {message.isEdited && !message.isDeleted && (
                <span className="text-[9px] italic opacity-80">(edited)</span>
              )}
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
              {isMe && <MessageStatus status={message.status} />}
            </div>
          </div>
        )}

        {/* Reaction Badges in B&W */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 z-10 max-w-full">
            {message.reactions.map((r) => {
              const hasReacted = user && r.users.includes(user.id);
              return (
                <button
                  key={r.emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(r.emoji);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition border active:scale-95 ${
                    hasReacted
                      ? 'bg-white text-black font-bold border-white shadow-sm'
                      : 'bg-[#18181A] text-zinc-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px] font-bold">{r.users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover Quick Action Toolbar (Desktop) in B&W */}
      <div
        className={`absolute top-0 ${
          isMe ? 'left-4' : 'right-4'
        } -translate-y-1/2 hidden group-hover:flex items-center bg-[#121214] border border-white/20 rounded-xl p-0.5 shadow-xl z-20 transition animate-fade-in`}
      >
        {/* Popular Reactions */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-white/10">
          {POPULAR_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-1 hover:scale-125 transition active:scale-95 text-xs"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply */}
        <button
          onClick={() => setReplyingTo(message)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          title="Copy text"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Pin */}
        <button
          onClick={() => togglePin(message.id)}
          className={`p-1.5 rounded-lg transition ${
            message.isPinned
              ? 'text-white bg-white/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title={message.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {/* Edit (Me only) */}
        {isMe && !message.isDeleted && (
          <button
            onClick={() => setEditingMessage(message)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete (Me only) */}
        {isMe && !message.isDeleted && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
