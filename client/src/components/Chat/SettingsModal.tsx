import React, { useState, useEffect, useRef } from 'react';
import { X, User, Key, Volume2, VolumeX, ShieldCheck, LogOut, Sliders, Sparkles, Mic, MicOff, Waves, Upload, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { soundService } from '../../services/sound.js';
import { AudioDspService } from '../../services/audioDsp.js';
import { Avatar } from '../Common/Avatar.js';

export const SettingsModal: React.FC = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { isSettingsOpen, setIsSettingsOpen } = useChat();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());

  // Background customization settings
  const [blurLevel, setBlurLevel] = useState(() => localStorage.getItem('app_wallpaper_blur') || '3');
  const [tintLevel, setTintLevel] = useState(() => localStorage.getItem('app_wallpaper_tint') || '45');

  // Audio Studio & Voice Isolation settings
  const [voiceIsolation, setVoiceIsolation] = useState(() => localStorage.getItem('voice_isolation') !== 'false');
  const [noiseGateStrength, setNoiseGateStrength] = useState(() => localStorage.getItem('voice_noise_gate') || '20');
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const testStreamRef = useRef<MediaStream | null>(null);
  const dspCleanupRef = useRef<(() => void) | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      setDisplayName(user?.displayName || '');
      setCustomStatus(user?.customStatus || '');
      setAvatarUrl(user?.avatarUrl || '');
      setProfileMsg(null);
      setPasswordMsg(null);
    } else {
      stopMicTest();
    }
  }, [isSettingsOpen, user]);

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Please select an image file (PNG, JPG, WebP)' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (dspCleanupRef.current) {
      dspCleanupRef.current();
      dspCleanupRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    setMicTesting(false);
    setMicLevel(0);
  };

  const startMicTest = async () => {
    if (micTesting) {
      stopMicTest();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AudioDspService.getOptimalAudioConstraints(),
      });

      testStreamRef.current = stream;
      setMicTesting(true);

      const dsp = AudioDspService.processMicrophoneStream(stream, {
        enableIsolation: voiceIsolation,
        enableCompressor: true,
        enableVocalBoost: true,
        gateThreshold: parseInt(noiseGateStrength, 10) || 20,
      });

      dspCleanupRef.current = dsp.cleanup;

      const updateMeter = () => {
        setMicLevel(dsp.getVolumeLevel());
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err: any) {
      alert(`Could not start mic test: ${err.message || 'Permission denied'}`);
      stopMicTest();
    }
  };

  const handleVoiceIsolationToggle = () => {
    const nextVal = !voiceIsolation;
    setVoiceIsolation(nextVal);
    localStorage.setItem('voice_isolation', nextVal.toString());
    if (micTesting) {
      stopMicTest();
    }
  };

  const handleNoiseGateChange = (val: string) => {
    setNoiseGateStrength(val);
    localStorage.setItem('voice_noise_gate', val);
    if (micTesting) {
      stopMicTest();
    }
  };

  const handleBlurChange = (val: string) => {
    setBlurLevel(val);
    localStorage.setItem('app_wallpaper_blur', val);
    window.dispatchEvent(new Event('wallpaper-settings-changed'));
  };

  const handleTintChange = (val: string) => {
    setTintLevel(val);
    localStorage.setItem('app_wallpaper_tint', val);
    window.dispatchEvent(new Event('wallpaper-settings-changed'));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileMsg(null);
    try {
      await updateProfile({ displayName, customStatus, avatarUrl });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 4 characters' });
      return;
    }

    setIsSaving(true);
    setPasswordMsg(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#121214] rounded-3xl border border-white/12 shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Settings</span>
            <span className="text-[10px] text-zinc-400 font-normal bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
              Account & Audio
            </span>
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-zinc-100">
          {/* Section 1: Profile */}
          <form onSubmit={handleProfileSave} className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Profile Photo & Details
            </h3>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                }`}
              >
                <span>{profileMsg.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Drag & Drop Avatar Uploader */}
            <div className="flex items-center gap-4 p-3 bg-zinc-900/90 rounded-2xl border border-white/10">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && processAvatarFile(e.target.files[0])}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsAvatarDragging(true);
                }}
                onDragLeave={() => setIsAvatarDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsAvatarDragging(false);
                  if (e.dataTransfer.files?.[0]) processAvatarFile(e.dataTransfer.files[0]);
                }}
                onClick={() => avatarFileInputRef.current?.click()}
                className={`relative w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden group flex-shrink-0 ${
                  isAvatarDragging
                    ? 'border-white bg-white/20 scale-105'
                    : 'border-white/20 bg-zinc-950 hover:border-white/50'
                }`}
              >
                {avatarUrl ? (
                  <>
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition">
                      <Camera className="w-4 h-4 text-white mb-0.5" />
                      <span className="text-[8px] text-white">Change</span>
                    </div>
                  </>
                ) : (
                  <Avatar
                    name={displayName || 'User'}
                    username={user?.username}
                    size="lg"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white mb-0.5">Profile Photo</div>
                <div className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                  Drag & drop image from PC, or browse device files.
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Custom Status</label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="e.g. Available"
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl transition active:scale-95"
              >
                Save Profile
              </button>
            </div>
          </form>

          {/* Section 2: Studio Voice Isolation & Dynamic Noise Gate */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Studio Voice Isolation & Noise Suppression
            </h3>

            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>Dynamic Noise Gate & Isolation</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30 font-bold">
                      PRO DSP
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Cuts AC drone, fan hum, keyboard clicks, and room echo
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVoiceIsolationToggle}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    voiceIsolation
                      ? 'bg-white text-black shadow'
                      : 'bg-zinc-800 text-zinc-400 border border-white/10'
                  }`}
                >
                  {voiceIsolation ? 'Active' : 'Disabled'}
                </button>
              </div>

              {voiceIsolation && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-[11px] flex items-center gap-1">
                      <Waves className="w-3 h-3 text-white" />
                      Noise Gate Cutoff Strength
                    </span>
                    <span className="text-[10px] font-bold text-white">
                      {parseInt(noiseGateStrength, 10) < 15 ? 'Soft' : parseInt(noiseGateStrength, 10) < 30 ? 'Balanced (Recommended)' : 'Deep Isolation'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={noiseGateStrength}
                    onChange={(e) => handleNoiseGateChange(e.target.value)}
                    className="w-full accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Gentle</span>
                    <span>Standard</span>
                    <span>Deep Isolation</span>
                  </div>
                </div>
              )}

              {/* Real-time Mic Test Meter */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-[11px]">Live Microphone Level Test</span>
                  <button
                    type="button"
                    onClick={startMicTest}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
                      micTesting
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {micTesting ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    {micTesting ? 'Stop Test' : 'Test Mic'}
                  </button>
                </div>

                <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/10 relative">
                  <div
                    className="h-full bg-white transition-all duration-75 rounded-full"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Wallpaper & Glass Visuals */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Atmosphere & Blur
            </h3>

            <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs">
              <div>
                <div className="flex items-center justify-between text-zinc-300 mb-1.5">
                  <span>Background Blur</span>
                  <span className="font-bold text-white">{blurLevel}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={blurLevel}
                  onChange={(e) => handleBlurChange(e.target.value)}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-zinc-300 mb-1.5">
                  <span>Tint Darkness</span>
                  <span className="font-bold text-white">{tintLevel}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  step="5"
                  value={tintLevel}
                  onChange={(e) => handleTintChange(e.target.value)}
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Preferences */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Audio & Alerts
            </h3>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-white/10">
              <div className="flex items-center gap-2.5">
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-zinc-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
                <div>
                  <div className="text-xs font-medium text-white">Notification Sounds</div>
                  <div className="text-[10px] text-zinc-400">Chime for incoming and sent messages</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  isMuted
                    ? 'bg-zinc-800 text-zinc-400 border border-white/10'
                    : 'bg-white text-black'
                }`}
              >
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>
          </div>

          {/* Section 5: Security & Password */}
          <form onSubmit={handlePasswordChange} className="pt-3 border-t border-white/10 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Change Password
            </h3>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                }`}
              >
                <span>{passwordMsg.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-white/15 transition active:scale-95"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 flex items-center justify-between bg-[#0e0e10] flex-shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Encrypted Room</span>
          </div>

          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 active:scale-95 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
