import React, { useState, useEffect } from 'react';
import { X, User, Key, Volume2, VolumeX, Bot, ShieldCheck, LogOut, CheckCircle2, AlertTriangle, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { soundService } from '../../services/sound.js';
import { systemApi } from '../../services/api.js';
import { BridgeStatus } from '../../types/index.js';
import { Avatar } from '../Common/Avatar.js';

export const SettingsModal: React.FC = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { isSettingsOpen, setIsSettingsOpen } = useChat();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);

  // Background customization settings
  const [blurLevel, setBlurLevel] = useState(() => localStorage.getItem('app_wallpaper_blur') || '3');
  const [tintLevel, setTintLevel] = useState(() => localStorage.getItem('app_wallpaper_tint') || '45');

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setDisplayName(user?.displayName || '');
      setCustomStatus(user?.customStatus || '');
      setAvatarUrl(user?.avatarUrl || '');
      setProfileMsg(null);
      setPasswordMsg(null);

      systemApi
        .getStatus()
        .then((data) => setBridgeStatus(data.bridge))
        .catch(() => {});
    }
  }, [isSettingsOpen, user]);

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
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
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
      <div className="relative w-full max-w-lg glass-dropdown rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Room Settings</span>
            <span className="text-[10px] text-brand-pink font-normal bg-brand-rose/15 px-2 py-0.5 rounded-full border border-brand-rose/20">
              Private Space
            </span>
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Section 1: Profile */}
          <form onSubmit={handleProfileSave} className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Profile Details
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

            <div className="flex items-center gap-3.5">
              <Avatar
                name={displayName || 'User'}
                username={user?.username}
                avatarUrl={avatarUrl}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] text-slate-400 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-dark-950/80 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-950/80 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-pink"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Custom Status</label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="e.g. In my own little world 🌸"
                  className="w-full px-3 py-2 bg-dark-950/80 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-white/15 transition active:scale-95"
              >
                Save Profile
              </button>
            </div>
          </form>

          {/* Section 2: Wallpaper & Glass Visuals */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Wallpaper Glass & Atmosphere
            </h3>

            <div className="space-y-3 p-3.5 rounded-2xl bg-dark-950/70 border border-white/10 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1.5">
                  <span>Background Blur</span>
                  <span className="font-bold text-brand-pink">{blurLevel}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={blurLevel}
                  onChange={(e) => handleBlurChange(e.target.value)}
                  className="w-full accent-brand-pink cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1.5">
                  <span>Tint Darkness</span>
                  <span className="font-bold text-brand-pink">{tintLevel}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  step="5"
                  value={tintLevel}
                  onChange={(e) => handleTintChange(e.target.value)}
                  className="w-full accent-brand-pink cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Preferences */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audio & Alerts
            </h3>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-dark-950/70 border border-white/10">
              <div className="flex items-center gap-2.5">
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-brand-pink" />
                )}
                <div>
                  <div className="text-xs font-medium text-white">Notification Sounds</div>
                  <div className="text-[10px] text-slate-400">Chime for incoming and sent messages</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  isMuted
                    ? 'bg-slate-800 text-slate-400 border border-white/10'
                    : 'bg-brand-rose/20 text-brand-pink border border-brand-rose/30'
                }`}
              >
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>
          </div>

          {/* Section 4: Discord Bridge Diagnostics */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#5865F2]" />
              Discord Bridge Diagnostics
            </h3>
            <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sagar Discord Bot (Bot 1):</span>
                <span className="flex items-center gap-1">
                  {bridgeStatus?.sagarBotReady ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Connecting...
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Something Discord Bot (Bot 2):</span>
                <span className="flex items-center gap-1">
                  {bridgeStatus?.somethingBotReady ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Connecting...
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-slate-400">Channel ID:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {bridgeStatus?.channelId || '1541061558753300603'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Security & Password */}
          <form onSubmit={handlePasswordChange} className="pt-3 border-t border-white/10 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
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
                <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-950/80 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-pink"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-950/80 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-pink"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-white/15 transition active:scale-95"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 flex items-center justify-between bg-dark-950/80 flex-shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
            <span>Private Space</span>
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
