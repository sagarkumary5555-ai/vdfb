import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  X,
  Reply,
  Edit2,
  FileText,
  Mic,
  Square,
  Sparkles,
  Heart,
  Image as ImageIcon,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { uploadApi } from '../../services/api.js';
import { AudioDspService } from '../../services/audioDsp.js';
import { Attachment } from '../../types/index.js';
import { StickerAndEmojiPicker } from './StickerAndEmojiPicker.js';

export const MessageComposer: React.FC = () => {
  const {
    activeConversation,
    sendMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
  } = useChat();
  const { emitTyping } = useSocket();

  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dspCleanupRef = useRef<(() => void) | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTyping(e.target.value.length > 0, activeConversation?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Recording with Studio Voice Isolation DSP
  const startRecording = async () => {
    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      let finalStream = rawStream;
      try {
        const dsp = AudioDspService.processMicrophoneStream(rawStream, {
          enableIsolation: true,
          enableCompressor: true,
          enableVocalBoost: true,
        });
        dspCleanupRef.current = dsp.cleanup;
        finalStream = dsp.processedStream;
      } catch (e) {
        console.warn('Voice note DSP fallback to raw stream:', e);
      }

      const mediaRecorder = new MediaRecorder(finalStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });

        setIsUploading(true);
        try {
          const res = await uploadApi.uploadFiles([audioFile]);
          await sendMessage('🎤 Voice Note', res.files);
        } catch (err: any) {
          alert('Failed to send voice note');
        } finally {
          setIsUploading(false);
        }

        if (dspCleanupRef.current) {
          dspCleanupRef.current();
          dspCleanupRef.current = null;
        }
        rawStream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (dspCleanupRef.current) {
        dspCleanupRef.current();
        dspCleanupRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && selectedFiles.length === 0) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, trimmed);
      setText('');
      emitTyping(false);
      return;
    }

    let uploadedAttachments: Attachment[] = [];
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadResult = await uploadApi.uploadFiles(selectedFiles, (percent) => {
          setUploadProgress(percent);
        });
        uploadedAttachments = uploadResult.files;
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to upload attachments');
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }
      setIsUploading(false);
      setUploadProgress(null);
      setSelectedFiles([]);
    }

    await sendMessage(trimmed, uploadedAttachments);
    setText('');
    emitTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleSendSticker = (stickerText: string) => {
    sendMessage(stickerText);
    setShowPicker(false);
  };

  return (
    <div className="p-3 sm:p-5 bg-black select-none relative z-20 flex-shrink-0">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="mb-2 px-3.5 py-1.5 rounded-2xl bg-[#262626] border border-white/10 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 rounded-lg bg-white/10 text-white">
              <Reply className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs truncate">
              <span className="text-zinc-400">Replying to </span>
              <span className="font-semibold text-white">{replyingTo.sender.displayName}</span>
              <p className="text-zinc-400 text-[11px] truncate">{replyingTo.content || '[Attachment]'}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="mb-2 px-3.5 py-1.5 rounded-2xl bg-[#262626] border border-white/15 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <Edit2 className="w-3.5 h-3.5 text-white" />
            <div className="text-xs text-white">
              <span className="font-semibold">Editing message</span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 animate-slide-up">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#262626] border border-white/15 text-xs text-zinc-200 shadow"
            >
              <FileText className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <span className="truncate max-w-[140px] text-xs">{file.name}</span>
              <button
                onClick={() => removeSelectedFile(idx)}
                className="text-zinc-400 hover:text-red-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="mb-2 w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Custom Sticker & 3D Emoji Picker */}
      {showPicker && (
        <StickerAndEmojiPicker
          onSelectEmoji={handleSelectEmoji}
          onSendSticker={handleSendSticker}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Recording Mode Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between p-3 bg-[#18181b] border border-white/20 rounded-full animate-fade-in shadow-2xl">
          <div className="flex items-center gap-3 px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                Recording voice note... ({Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-1.5 rounded-full bg-white text-black flex items-center gap-1.5 text-xs font-bold shadow active:scale-95 transition"
            >
              <Square className="w-3.5 h-3.5 fill-black" />
              <span>Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* Instagram Pill Input Bar */
        <div className="relative flex items-center gap-2 bg-[#262626] rounded-full border border-white/10 px-3.5 py-1.5 focus-within:border-white/30 transition-all shadow-md">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Left: Emoji Button */}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={`p-1.5 rounded-full text-white hover:opacity-80 active:scale-95 transition flex-shrink-0`}
            title="Emojis & Stickers"
          >
            <Smile className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Center: Expandable Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? 'Update your message...'
                : 'Message...'
            }
            className="flex-1 max-h-28 py-1.5 px-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Right Action Icons (Mic 🎙️, Gallery 🖼️, Heart 🤍 / Send) */}
          {!text.trim() && selectedFiles.length === 0 ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={startRecording}
                className="p-1.5 rounded-full text-white hover:opacity-80 active:scale-95 transition"
                title="Record voice note"
              >
                <Mic className="w-6 h-6 stroke-[1.8]" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-white hover:opacity-80 active:scale-95 transition"
                title="Send photo or video"
              >
                <ImageIcon className="w-6 h-6 stroke-[1.8]" />
              </button>

              <button
                type="button"
                onClick={() => sendMessage('❤️')}
                className="p-1.5 rounded-full text-white hover:opacity-80 active:scale-90 transition"
                title="Like"
              >
                <Heart className="w-6 h-6 stroke-[1.8]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className="px-3 py-1.5 text-sm font-bold text-blue-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 flex-shrink-0"
              title="Send (Enter)"
            >
              Send
            </button>
          )}
        </div>
      )}
    </div>
  );
};
