import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Upload, X, Camera, Shield, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        username: username.trim().toLowerCase(),
        password,
        displayName: displayName.trim() || username.trim(),
        avatarUrl: avatarPreview || undefined,
        bio: bio.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-screen bg-[#060608] flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans select-none text-white overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-900/30 rounded-full blur-3xl pointer-events-none" />

      {/* 2-Column Professional Architecture */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        
        {/* LEFT COLUMN: Original Brand Identity */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-start justify-center pr-4 space-y-7">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl shadow-white/10 ring-1 ring-white/20">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>ChatUs</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400">Direct Social Messaging & Studio Calls</p>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Create your profile and start chatting instantly.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed pt-2">
              Share real-time moments, exchange lossless media, and invite friends with your unique @handle.
            </p>
          </div>

          {/* Key Feature List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Studio Voice Isolation with zero background noise</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span>Encrypted Direct Messaging & WebRTC Calling</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign Up Form */}
        <div className="w-full lg:col-span-6 mx-auto">
          <div className="bg-[#101014] rounded-3xl p-6 sm:p-8 border border-white/12 shadow-2xl backdrop-blur-2xl">
            
            <div className="mb-5">
              <div className="lg:hidden flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-base font-bold text-white tracking-tight">ChatUs</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Create an account
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Fill in your profile details to join
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Drag & Drop Avatar Uploader */}
              <div className="flex items-center gap-3.5 p-2.5 bg-zinc-900/80 rounded-2xl border border-white/10">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition overflow-hidden group flex-shrink-0 ${
                    isDragging
                      ? 'border-white bg-white/20 scale-105'
                      : avatarPreview
                      ? 'border-white/40 bg-zinc-950'
                      : 'border-white/20 bg-zinc-950 hover:border-white/50'
                  }`}
                  title="Drag & drop photo or click to upload"
                >
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">Profile Photo</div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span>Drag & drop or</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white font-semibold underline"
                    >
                      Browse Device
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => setAvatarPreview(null)}
                        className="text-red-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Username (@handle)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. alex"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-zinc-900 transition"
                />
              </div>

              {/* Full Display Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-zinc-900 transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    required
                    className="w-full px-3.5 pr-10 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-zinc-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Bio / Status <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell friends what you're working on..."
                  className="w-full px-3.5 py-2 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-zinc-900 transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Sign In */}
            <div className="pt-4 mt-4 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-400">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-white font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
