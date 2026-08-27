import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Reply,
  Edit2,
  FileText,
  Mic,
  Square,
  Heart,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { uploadApi } from '../../services/api.js';
import { AudioDspService } from '../../services/audioDsp.js';
import { Attachment } from '../../types/index.js';
import { StickerAndEmojiPicker } from './StickerAndEmojiPicker.js';

export const MessageComposer: React.FC = () => {
  const {
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick Heart Burst
  const triggerHeartBurst = () => {
    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.9 },
      colors: ['#e11d48', '#f43f5e', '#ec4899'],
    });
    sendMessage('❤️');
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

    if (trimmed.includes('❤️') || trimmed.includes('💖')) {
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.9 },
        colors: ['#e11d48', '#f43f5e', '#ec4899'],
      });
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
    <div className="p-2.5 sm:p-4 glass-panel border-t border-white/10 select-none relative z-20 flex-shrink-0 pb-safe">
      {/* Reply or Edit Banner */}
      {replyingTo && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-dark-950/95 border border-white/15 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1 rounded-lg bg-brand-rose/20 text-brand-pink">
              <Reply className="w-3 h-3" />
            </div>
            <div className="text-xs truncate">
              <span className="text-slate-400">Replying to </span>
              <span className="font-semibold text-slate-200">{replyingTo.sender.displayName}</span>
              <p className="text-slate-400 text-[10px] truncate">{replyingTo.content || '[Attachment]'}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <Edit2 className="w-3 h-3 text-amber-400" />
            <div className="text-xs text-amber-200">
              <span className="font-semibold">Editing message</span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected File Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 animate-slide-up">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-dark-950/90 border border-white/15 text-xs text-slate-200 shadow"
            >
              <FileText className="w-3 h-3 text-brand-pink flex-shrink-0" />
              <span className="truncate max-w-[120px] text-[11px]">{file.name}</span>
              <button
                onClick={() => removeSelectedFile(idx)}
                className="text-slate-400 hover:text-red-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="mb-2 w-full bg-dark-950 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-rose to-brand-purple h-full transition-all duration-200"
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
        <div className="flex items-center justify-between p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl animate-fade-in shadow-lg">
          <div className="flex items-center gap-3 px-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-pink" />
                Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-400">Studio Voice Isolation active</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 text-xs font-bold shadow-lg active:scale-95 transition"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Send Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Handcrafted Composer Input Box */
        <div className="relative flex items-end gap-1.5 sm:gap-2 bg-dark-950/80 rounded-2xl border border-white/12 p-1.5 sm:p-2 focus-within:border-brand-pink/50 transition-all shadow-xl">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition flex-shrink-0"
            title="Attach files (images, audio, video, docs)"
          >
            <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={`p-2 sm:p-2.5 rounded-xl active:scale-95 transition flex-shrink-0 ${
              showPicker ? 'text-brand-pink bg-brand-rose/20' : 'text-slate-400 hover:text-brand-pink hover:bg-white/10'
            }`}
            title="Stickers & 3D Emojis"
          >
            <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? 'Update your message...'
                : 'Write a message... (Enter to send)'
            }
            className="flex-1 max-h-32 py-2 px-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
          />

          {/* Voice Note Button or Quick Heart */}
          {!text.trim() && selectedFiles.length === 0 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startRecording}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition flex-shrink-0"
                title="Record studio voice note"
              >
                <Mic className="w-4 h-4 text-slate-400 hover:text-brand-pink" />
              </button>

              <button
                type="button"
                onClick={triggerHeartBurst}
                className="p-2 sm:p-2.5 rounded-xl bg-brand-rose/15 hover:bg-brand-rose/25 text-brand-pink border border-brand-rose/25 active:scale-90 transition flex-shrink-0 shadow-sm"
                title="Send Heart"
              >
                <Heart className="w-4 h-4 fill-brand-pink" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-brand-rose via-brand-pink to-brand-purple hover:opacity-90 text-white shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-90 flex-shrink-0"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
