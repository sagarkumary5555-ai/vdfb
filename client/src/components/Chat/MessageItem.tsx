import React, { useState } from 'react';
import {
  Reply,
  Copy,
  Edit2,
  Trash2,
  FileText,
  Download,
  Bot,
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
}

const POPULAR_REACTIONS = ['❤️', '🔥', '😂', '🥰', '🥺', '👍'];

// Check if string contains only emojis (1 to 4 emojis for Jumbo display)
const isJumboEmoji = (text: string): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length > 12) return false;
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
  return emojiRegex.test(trimmed);
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
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
  const isEmojiOnly = !message.isDeleted && isJumboEmoji(message.content) && (!message.attachments || message.attachments.length === 0);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReaction(message.id, '❤️');
    confetti({
      particleCount: 22,
      spread: 55,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#f43f5e', '#ec4899', '#a855f7'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setMobileMenuOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this message?')) {
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
          className="mt-2 overflow-hidden rounded-2xl border border-white/20 max-w-sm cursor-pointer group shadow-lg"
        >
          <img
            src={fileUrl}
            alt={att.originalName}
            onClick={() => openLightbox(fileUrl, att.originalName)}
            className="w-full max-h-64 sm:max-h-80 object-cover hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      );
    }

    // Video
    if (mime.startsWith('video/')) {
      return (
        <div key={att.id} className="mt-2 rounded-2xl overflow-hidden border border-white/20 max-w-md bg-black shadow-lg">
          <video src={fileUrl} controls className="w-full max-h-64 sm:max-h-80" />
        </div>
      );
    }

    // Audio / Voice Note
    if (mime.startsWith('audio/')) {
      return <VoiceNotePlayer key={att.id} src={fileUrl} isMe={isMe} />;
    }

    // Document / Generic File
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
        className="mt-2 p-3 rounded-2xl bg-dark-950/90 border border-white/20 flex items-center justify-between gap-3 max-w-xs hover:border-brand-pink/50 transition group shadow-lg"
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="p-2 rounded-xl bg-brand-rose/20 text-brand-pink">
            <FileText className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
              {att.originalName}
            </div>
            <div className="text-[10px] text-slate-400">{formatSize(att.size)}</div>
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-white/10 text-slate-300 group-hover:text-white group-hover:bg-brand-rose/30 transition">
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
      className={`relative group flex gap-2.5 sm:gap-3 my-2 transition-all duration-300 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      } ${isHighlighted ? 'bg-brand-rose/20 py-2 rounded-2xl px-2 ring-2 ring-brand-pink/60' : ''}`}
    >
      {/* Sender Avatar */}
      <Avatar
        name={message.sender.displayName}
        username={message.sender.username}
        avatarUrl={message.sender.avatarUrl}
        size="sm"
        className="mt-1"
      />

      {/* Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header Name on Partner Messages */}
        {!isMe && (
          <div className="text-[11px] font-bold text-slate-200 mb-1 px-1 flex items-center gap-1.5">
            <span>{message.sender.displayName}</span>
            {message.source === 'discord' && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[#5865F2] bg-[#5865F2]/20 px-1.5 py-0.2 rounded-full font-medium">
                <Bot className="w-2.5 h-2.5" />
                Discord
              </span>
            )}
          </div>
        )}

        {/* Pinned Tag */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-brand-pink bg-brand-rose/15 px-2 py-0.5 rounded-full border border-brand-rose/30 mb-1 font-semibold shadow-sm">
            <Pin className="w-2.5 h-2.5" />
            Pinned Message
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div
            className={`mb-1 p-2 rounded-xl text-xs max-w-full border-l-2 ${
              isMe
                ? 'bg-slate-900/90 border-brand-pink text-slate-300 self-end shadow'
                : 'bg-dark-950/90 border-brand-purple text-slate-300 self-start shadow'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <Reply className="w-2.5 h-2.5" />
              {message.replyTo.sender.displayName}
            </div>
            <div className="text-slate-200 text-[11px] truncate max-w-xs font-normal">
              {message.replyTo.content || '[Attachment]'}
            </div>
          </div>
        )}

        {/* Jumbo Emoji Display OR Full Bubble */}
        {isEmojiOnly ? (
          <div className="py-1 px-2 select-text text-4xl sm:text-5xl animate-scale-up tracking-wider filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
            {message.content}
            <div
              className={`flex items-center gap-1 text-[10px] select-none font-medium mt-1 ${
                isMe ? 'justify-end text-slate-400' : 'justify-start text-slate-400'
              }`}
            >
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
              {isMe && <MessageStatus status={message.status} />}
            </div>
          </div>
        ) : (
          /* Main Message Bubble */
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-xl ${
              isMe
                ? 'bg-gradient-to-r from-brand-rose via-brand-pink to-brand-purple text-white rounded-tr-xs border border-white/20 shadow-brand-rose/15'
                : 'glass-panel text-slate-100 rounded-tl-xs border border-white/20'
            } ${message.isDeleted ? 'italic text-slate-400 bg-dark-950/80 border-dashed' : ''}`}
          >
            {/* Text Body */}
            <div className="whitespace-pre-wrap break-words select-text font-normal drop-shadow-sm">
              {message.content}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {message.attachments.map((att) => renderAttachment(att))}
              </div>
            )}

            {/* Footer Metadata */}
            <div
              className={`flex items-center gap-1.5 text-[10px] mt-1.5 select-none font-medium ${
                isMe ? 'justify-end text-white/85' : 'justify-start text-slate-400'
              }`}
            >
              {message.isEdited && !message.isDeleted && (
                <span className="text-[9px] italic opacity-80">(edited)</span>
              )}
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>

              {isMe && message.source === 'discord' && (
                <span title="Bridged from Discord">
                  <Bot className="w-3 h-3 text-white/90" />
                </span>
              )}

              {isMe && <MessageStatus status={message.status} />}
            </div>
          </div>
        )}

        {/* Reaction Badges Container */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 z-10">
            {message.reactions.map((r) => {
              const hasReacted = user && r.users.includes(user.id);
              return (
                <button
                  key={r.emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReaction(message.id, r.emoji);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all active:scale-95 shadow-md ${
                    hasReacted
                      ? 'bg-brand-rose/30 border-brand-rose/60 text-brand-pink ring-1 ring-brand-pink/30'
                      : 'bg-dark-950/85 border-white/10 text-slate-300 hover:bg-white/15'
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
          className={`absolute -top-3.5 z-30 flex items-center gap-1 p-1 glass-dropdown rounded-2xl border border-white/20 shadow-2xl transition-all duration-200 ${
            mobileMenuOpen
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:pointer-events-auto'
          } ${isMe ? 'right-12' : 'left-12'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reaction Pills */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-white/10">
            {POPULAR_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-sm hover:scale-135 active:scale-90 transition-transform"
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
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition active:scale-95"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              togglePin(message.id);
              setMobileMenuOpen(false);
            }}
            className={`p-1.5 rounded-xl transition active:scale-95 ${
              message.isPinned
                ? 'text-brand-pink bg-brand-rose/20'
                : 'text-slate-300 hover:text-white hover:bg-white/15'
            }`}
            title={message.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition active:scale-95"
            title="Copy Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {isMe && (
            <button
              onClick={() => {
                setEditingMessage(message);
                setMobileMenuOpen(false);
              }}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition active:scale-95"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isMe && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition active:scale-95"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
