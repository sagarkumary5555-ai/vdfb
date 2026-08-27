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
    /^https?:\/\/.*\.(gif|webp)(\?.*)?$/i.test(trimmed) ||
    trimmed.includes('media.giphy.com') ||
    trimmed.includes('tenor.com') ||
    trimmed.includes('c.tenor.com')
  ) {
    return trimmed;
  }
  return null;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFirstInGroup = true,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      particleCount: 20,
      spread: 50,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#ffffff', '#a1a1aa', '#52525b'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setMobileMenuOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      setIsDeleting(true);
      await deleteMessage(message.id);
      setIsDeleting(false);
      setMobileMenuOpen(false);
    }
  };

  const handleReaction = (emoji: string) => {
    toggleReaction(message.id, emoji);
    setMobileMenuOpen(false);
  };

  const renderAttachment = (att: Attachment) => {
    const fileUrl = att.discordUrl || uploadApi.getProtectedFileUrl(att.filename);
    const mime = att.mimeType.toLowerCase();

    // Image
    if (mime.startsWith('image/')) {
      return (
        <div
          key={att.id}
          className="mt-1 overflow-hidden rounded-2xl border border-white/10 max-w-xs sm:max-w-sm cursor-pointer group shadow-lg"
        >
          <img
            src={fileUrl}
            alt={att.originalName}
            onClick={() => openLightbox(fileUrl, att.originalName)}
            className="w-full max-h-56 sm:max-h-72 object-cover hover:scale-[1.015] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      );
    }

    // Video
    if (mime.startsWith('video/')) {
      return (
        <div key={att.id} className="mt-1 rounded-2xl overflow-hidden border border-white/10 max-w-xs sm:max-w-md bg-black shadow-lg">
          <video src={fileUrl} controls className="w-full max-h-56 sm:max-h-72" />
        </div>
      );
    }

    // Audio / Voice Note
    if (mime.startsWith('audio/')) {
      return <VoiceNotePlayer key={att.id} src={fileUrl} isMe={isMe} />;
    }

    // Document
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
      <a
        key={att.id}
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={att.originalName}
        className="mt-1 p-2.5 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-2.5 max-w-xs hover:border-white/30 transition group shadow-md"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-xl bg-white/10 text-white flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
              {att.originalName}
            </div>
            <div className="text-[10px] text-zinc-400">{formatSize(att.size)}</div>
          </div>
        </div>
        <div className="p-1 rounded-xl bg-white/5 text-zinc-300 group-hover:text-white group-hover:bg-white/20 transition flex-shrink-0">
          <Download className="w-3.5 h-3.5" />
        </div>
      </a>
    );
  };

  return (
    <div
      id={`msg-${message.id}`}
      onDoubleClick={handleDoubleClick}
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className={`relative group flex gap-2 sm:gap-2.5 transition-all duration-150 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      } ${isLastInGroup ? 'mb-2' : 'mb-0.5'} ${isFirstInGroup ? 'mt-1' : ''} ${
        isHighlighted ? 'bg-white/10 py-1.5 rounded-2xl px-2 ring-1 ring-white/30' : ''
      }`}
    >
      {/* Sender Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 self-end">
        {!isMe && isLastInGroup ? (
          <Avatar
            name={message.sender.displayName}
            username={message.sender.username}
            avatarUrl={message.sender.avatarUrl}
            size="sm"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
        ) : (
          <div className="w-7 sm:w-8" />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[72%] md:max-w-[58%] ${isMe ? 'items-end' : 'items-start'} flex flex-col min-w-0`}>
        {/* Pinned Tag */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-white bg-white/15 px-2 py-0.5 rounded-full border border-white/20 mb-1 font-semibold shadow-xs">
            <Pin className="w-2.5 h-2.5" />
            Pinned
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div
            className={`mb-1 p-2 rounded-xl text-xs max-w-full border-l-2 ${
              isMe
                ? 'bg-zinc-800 border-white text-zinc-300 self-end shadow-xs'
                : 'bg-zinc-900 border-zinc-500 text-zinc-300 self-start shadow-xs'
            }`}
          >
            <div className="text-[10px] font-semibold text-zinc-300 flex items-center gap-1">
              <Reply className="w-2.5 h-2.5" />
              {message.replyTo.sender.displayName}
            </div>
            <div className="text-zinc-200 text-[11px] truncate max-w-xs font-normal">
              {message.replyTo.content || '[Attachment]'}
            </div>
          </div>
        )}

        {/* 1. Animated GIF Display */}
        {gifUrl ? (
          <div className="mt-1 overflow-hidden rounded-2xl border border-white/10 max-w-xs sm:max-w-sm cursor-pointer group shadow-xl">
            <img
              src={gifUrl}
              alt="Animated GIF"
              onClick={() => openLightbox(gifUrl, 'Animated GIF')}
              className="w-full max-h-64 sm:max-h-80 object-cover hover:scale-[1.015] transition-transform duration-200 rounded-2xl"
              loading="lazy"
            />
            <div className={`flex items-center gap-1 text-[10px] mt-1 select-none font-medium ${
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
          /* 3. Main Instagram Rounded Message Bubble */
          <div
            className={`relative px-4 py-2.5 text-sm leading-relaxed transition-all max-w-full overflow-hidden ${
              isMe
                ? `bg-white text-black font-normal ${isLastInGroup ? 'rounded-2xl rounded-br-xs' : 'rounded-2xl'}`
                : `bg-[#262626] text-white ${isLastInGroup ? 'rounded-2xl rounded-bl-xs' : 'rounded-2xl'}`
            } ${message.isDeleted ? 'italic text-zinc-400 bg-zinc-900 border border-dashed border-white/20' : ''}`}
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
                isMe ? 'justify-end text-zinc-500' : 'justify-start text-zinc-400'
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

        {/* Reaction Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 z-10 max-w-full">
            {message.reactions.map((r) => {
              const hasReacted = user && r.users.includes(user.id);
              return (
                <button
                  key={r.emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReaction(message.id, r.emoji);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all active:scale-95 shadow-xs ${
                    hasReacted
                      ? 'bg-white text-black border-white ring-1 ring-white/50'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{r.emoji}</span>
                  <span className="text-[10px]">{r.users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Menu */}
      {!message.isDeleted && (
        <div
          className={`absolute -top-3.5 z-30 flex items-center gap-0.5 p-1 bg-black/90 rounded-2xl border border-white/15 shadow-xl transition-all duration-200 max-w-[calc(100vw-2rem)] overflow-x-auto ${
            mobileMenuOpen
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:pointer-events-auto'
          } ${isMe ? 'right-4 sm:right-12' : 'left-4 sm:left-12'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5 pr-1 border-r border-white/10">
            {POPULAR_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg text-base sm:text-sm hover:scale-130 active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setReplyingTo(message);
              setMobileMenuOpen(false);
            }}
            className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/15 transition active:scale-95"
            title="Reply"
          >
            <Reply className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => {
              togglePin(message.id);
              setMobileMenuOpen(false);
            }}
            className={`p-1.5 rounded-xl transition active:scale-95 ${
              message.isPinned
                ? 'text-white bg-white/20'
                : 'text-zinc-300 hover:text-white hover:bg-white/15'
            }`}
            title={message.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/15 transition active:scale-95"
            title="Copy Text"
          >
            {copied ? <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          </button>

          {isMe && (
            <button
              onClick={() => {
                setEditingMessage(message);
                setMobileMenuOpen(false);
              }}
              className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/15 transition active:scale-95"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          {isMe && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-xl text-zinc-300 hover:text-red-400 hover:bg-red-500/20 transition active:scale-95"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
