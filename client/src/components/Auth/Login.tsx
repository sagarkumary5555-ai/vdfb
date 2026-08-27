import React, { useState } from 'react';
import { Eye, EyeOff, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Register } from './Register.js';
import { Avatar } from '../Common/Avatar.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isRegisterMode) {
    return <Register onSwitchToLogin={() => setIsRegisterMode(false)} />;
  }

  const handleQuickSelect = (userType: 'sagar' | 'something') => {
    if (userType === 'sagar') {
      setUsername('sagar');
      setPassword('99313935287549051214');
    } else {
      setUsername('something');
      setPassword('<yaade>');
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(username.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-screen bg-[#000000] flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans select-none text-white overflow-y-auto">
      {/* 2-Column Luxury Instagram Layout Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center my-auto">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Instagram Visual Showcase & Hero Mockup      */}
        {/* ========================================================= */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8 pr-4">
          {/* Official Pro Gradient Instagram Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] shadow-2xl shadow-[#dc2743]/20 flex items-center justify-center animate-fade-in">
              <div className="w-full h-full bg-black/10 backdrop-blur-xs rounded-[20px] flex items-center justify-center">
                <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight max-w-sm">
              See everyday moments from your{' '}
              <span className="bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] bg-clip-text text-transparent">
                close friends
              </span>
              .
            </h1>
          </div>

          {/* Cascading Visual Phone / Story Cards Mockup */}
          <div className="relative w-72 h-80 flex items-center justify-center mt-2">
            {/* Background Card 1 (Tilted Left) */}
            <div className="absolute -left-6 top-6 w-44 h-64 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl -rotate-12 overflow-hidden opacity-75">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                alt="Story Left"
                className="w-full h-full object-cover filter contrast-105"
              />
              <div className="absolute top-3 left-3 p-1 rounded-full bg-black/50 backdrop-blur-md">
                <span className="text-xs">✨</span>
              </div>
            </div>

            {/* Background Card 2 (Tilted Right) */}
            <div className="absolute -right-6 top-4 w-44 h-64 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl rotate-12 overflow-hidden opacity-75">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                alt="Story Right"
                className="w-full h-full object-cover filter contrast-105"
              />
              <div className="absolute top-3 right-3 p-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 shadow">
                ★
              </div>
            </div>

            {/* Foreground Main Phone Card */}
            <div className="relative z-10 w-48 h-72 rounded-[28px] bg-zinc-950 border-2 border-white/20 shadow-2xl overflow-hidden shadow-black">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80"
                alt="Story Center"
                className="w-full h-full object-cover"
              />

              {/* Floating Top Emoji Pill */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-lg">
                <span className="text-xs">🔮</span>
                <span className="text-xs">🤯</span>
                <span className="text-xs">🔥</span>
              </div>

              {/* Floating Bottom Like Heart */}
              <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg">
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Official Instagram Style Login Form Card   */}
        {/* ========================================================= */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
            
            {/* Mobile Header Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] shadow-lg mb-3">
                <div className="w-full h-full bg-black/10 rounded-[14px] flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white">Log into Instagram</h2>
            </div>

            <h2 className="hidden lg:block text-xl font-bold text-white mb-6">
              Log into Instagram
            </h2>

            {/* Quick 1-Tap Account Switcher (Sagar & Something) */}
            <div className="mb-5 p-2 bg-[#09090b] rounded-2xl border border-white/10 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 px-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-white" />
                <span>Quick Master Account</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('sagar')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition text-left ${
                    username === 'sagar'
                      ? 'bg-zinc-800 border-white text-white shadow'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <Avatar
                    name="Sagar"
                    username="sagar"
                    avatarUrl="https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=18181b"
                    size="sm"
                  />
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold truncate">Sagar</div>
                    <div className="text-[10px] text-zinc-500">@sagar</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('something')}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition text-left ${
                    username === 'something'
                      ? 'bg-zinc-800 border-white text-white shadow'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <Avatar
                    name="Something"
                    username="something"
                    avatarUrl="https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=18181b"
                    size="sm"
                  />
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold truncate">Something</div>
                    <div className="text-[10px] text-zinc-500">@something</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Mobile number, username or email"
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-[#000000]/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 pr-11 py-3 bg-[#000000]/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:bg-[#000000] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Primary Log In Button (Instagram Blue / Vibrant Accent) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs sm:text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => alert('Please contact administrator or re-register with a new username.')}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#121214] px-3 text-zinc-500 font-bold">or</span>
              </div>
            </div>

            {/* Create New Account Button */}
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold rounded-xl transition text-xs sm:text-sm"
            >
              Create new account
            </button>

            {/* Meta Branding */}
            <div className="text-center pt-6 text-zinc-500 text-[11px] flex items-center justify-center gap-1.5 font-medium">
              <span>♾️</span>
              <span>Meta</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
