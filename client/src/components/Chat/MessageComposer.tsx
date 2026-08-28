import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Square,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { StickerAndEmojiPicker } from './StickerAndEmojiPicker.js';
import { AudioDspService } from '../../services/audioDsp.js';
import { uploadApi } from '../../services/api.js';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const dspCleanupRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Sync editing message text
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(true);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (isUploading) return;
    const content = text.trim();
    if (!content && selectedFiles.length === 0) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, content);
      setEditingMessage(null);
      setText('');
      return;
    }

    setIsUploading(true);
    let attachments: any[] = [];

    if (selectedFiles.length > 0) {
      try {
        const uploadRes = await uploadApi.uploadFiles(selectedFiles);
        attachments = uploadRes.files;
      } catch (err: any) {
        alert('Failed to upload attachment');
        setIsUploading(false);
        return;
      }
    }

    setText('');
    setSelectedFiles([]);
    setShowPicker(false);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage(content, attachments);
    setReplyingTo(null);
    setIsUploading(false);
  };

  // Voice Note Recording via Web Audio DSP
  const startRecordingVoice = async () => {
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

  const stopRecordingVoice = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <footer className="p-3 sm:p-4 bg-[#08080A] border-t border-white/10 relative z-20 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Replying Banner in B&W */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-2xl bg-[#141416] border border-white/20 flex items-center justify-between animate-slide-up text-xs shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 rounded-full bg-white flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-white">
                Replying to {replyingTo.sender.displayName}
              </span>
              <p className="text-zinc-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                {replyingTo.content || 'Attachment'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner in B&W */}
      {editingMessage && (
        <div className="mb-2 p-2.5 rounded-2xl bg-[#141416] border border-white/20 flex items-center justify-between animate-slide-up text-xs shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 rounded-full bg-white flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-white">Editing Message</span>
              <p className="text-zinc-400 truncate mt-0.5">{editingMessage.content}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Previews in B&W */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 animate-slide-up">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#141416] border border-white/15 text-xs text-zinc-200"
            >
              <Paperclip className="w-3.5 h-3.5 text-white" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => removeSelectedFile(idx)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording HUD Overlay */}
      {isRecording ? (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#121214] border border-white/20 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide font-mono">
              Recording Voice Note {formatSeconds(recordingDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={stopRecordingVoice}
              className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <Square className="w-3 h-3 fill-black" />
              <span>Send Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Composer Dock in B&W */
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end bg-[#121214] border border-white/15 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 rounded-3xl p-1.5 px-3.5 transition-all shadow-lg min-h-[44px]">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white rounded-full transition active:scale-95 flex-shrink-0 mb-0.5"
              title="Attach photos, videos, audio & files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Sticker / Emoji Picker Button */}
            <button
              onClick={() => setShowPicker(!showPicker)}
              className={`p-2 rounded-full transition active:scale-95 flex-shrink-0 mb-0.5 ${
                showPicker
                  ? 'text-black bg-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="3D Stickers & Luxury Emojis"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Expandable Text Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Message... (Press Enter to send)"
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none resize-none py-2 px-2 max-h-36 custom-scrollbar font-normal leading-relaxed"
            />
          </div>

          {/* Action Button: Send or Voice Record in B&W */}
          {text.trim() || selectedFiles.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="p-3 bg-white hover:bg-zinc-200 active:scale-95 text-black rounded-full shadow-lg transition flex items-center justify-center flex-shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 fill-black stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={startRecordingVoice}
              className="p-3 bg-[#16161A] hover:bg-[#222228] active:scale-95 text-white border border-white/20 rounded-full shadow-md transition flex items-center justify-center flex-shrink-0"
              title="Hold to Record Studio Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Floating Sticker & Emoji Picker */}
      {showPicker && (
        <StickerAndEmojiPicker
          onSelectEmoji={(emoji) => {
            setText((prev) => prev + emoji);
            textareaRef.current?.focus();
          }}
          onSendSticker={(stickerText) => {
            sendMessage(stickerText, []);
            setReplyingTo(null);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </footer>
  );
};
