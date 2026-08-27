import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Upload, X, Camera } from 'lucide-react';
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
    <div className="relative min-h-[100dvh] w-screen bg-[#000000] flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans select-none text-white overflow-y-auto">
      {/* 2-Column Luxury Instagram Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center my-auto">
        
        {/* LEFT COLUMN: Visual Showcase */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8 pr-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] shadow-2xl shadow-[#dc2743]/20 flex items-center justify-center animate-fade-in">
              <div className="w-full h-full bg-black/10 rounded-[20px] flex items-center justify-center">
                <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight max-w-sm">
              Connect with friends, share moments &{' '}
              <span className="bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] bg-clip-text text-transparent">
                live calls
              </span>
              .
            </h1>
          </div>

          {/* Phone Card Mockup */}
          <div className="relative w-72 h-80 flex items-center justify-center mt-2">
            <div className="absolute -left-6 top-6 w-44 h-64 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl -rotate-12 overflow-hidden opacity-75">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                alt="Story Left"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 w-48 h-72 rounded-[28px] bg-zinc-950 border-2 border-white/20 shadow-2xl overflow-hidden shadow-black">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                alt="Story Center"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg">
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign Up Form Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
            
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-white mb-1">
                Sign up to see photos and videos from your friends.
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Drag & Drop Avatar Uploader */}
              <div className="flex flex-col items-center gap-2 pb-1">
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
                  className={`relative w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden group ${
                    isDragging
                      ? 'border-white bg-white/20 scale-105'
                      : avatarPreview
                      ? 'border-white/40 bg-zinc-900'
                      : 'border-white/20 bg-zinc-900 hover:border-white/50 hover:bg-zinc-800'
                  }`}
                  title="Drag & drop or click to upload photo from PC/Phone"
                >
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition">
                        <Camera className="w-4 h-4 text-white mb-0.5" />
                        <span className="text-[8px] text-white">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center p-2">
                      <Upload className="w-4 h-4 text-zinc-400 mb-1 group-hover:text-white" />
                      <span className="text-[9px] text-zinc-300 font-semibold leading-tight">
                        Upload Photo
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span>Drag & drop photo or</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white font-semibold underline"
                  >
                    Browse PC / Phone
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarPreview(null);
                      }}
                      className="text-red-400 hover:text-red-300 ml-1 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Username Input */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Username (@handle)"
                autoFocus
                required
                className="w-full px-4 py-2.5 bg-[#000000]/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition"
              />

              {/* Display Name Input */}
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 bg-[#000000]/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition"
              />

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 pr-11 py-2.5 bg-[#000000]/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Bio Input */}
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio / Status (Optional)"
                className="w-full px-4 py-2 bg-[#000000]/60 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition resize-none"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs sm:text-sm mt-1"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            {/* Back to Log in */}
            <div className="pt-4 mt-4 border-t border-white/10 text-center">
              <p className="text-xs text-zinc-400">
                Have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-[#0095f6] font-semibold hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>

            {/* Meta Branding */}
            <div className="text-center pt-5 text-zinc-500 text-[11px] flex items-center justify-center gap-1.5 font-medium">
              <span>♾️</span>
              <span>Meta</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
