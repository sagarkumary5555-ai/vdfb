import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Shield, PhoneCall, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Register } from './Register.js';

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
    <div className="relative min-h-[100dvh] w-screen bg-black flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans select-none text-white overflow-x-hidden overflow-y-auto">
      {/* 2-Column Responsive Architecture Container */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        
        {/* LEFT COLUMN: Brand Identity & 3D Mockup */}
        <div className="hidden lg:flex lg:col-span-7 flex-col items-start justify-center pr-4 space-y-7">
          {/* Custom Monochrome Brand Logo & Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-2xl ring-1 ring-white/20">
              CU
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>ChatUs</span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-black bg-white px-2 py-0.5 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400">Social Messenger, Verified Friends & HD Studio Calling</p>
            </div>
          </div>

          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
              Real-time messaging with studio voice isolation.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed pt-1">
              Connect instantly with friends, create private squads, share lossless media, and enjoy lossless WebRTC voice & video calls.
            </p>
          </div>

          {/* Native Self-Contained 3D Vector Phone Mockup in Noir */}
          <div className="relative w-full max-w-md pt-1">
            <div className="relative bg-[#0E0E10] border border-white/20 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-white text-black border border-white flex items-center justify-center text-xs font-bold">
                      AL
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-black" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Alex Rivera</div>
                    <div className="text-[10px] text-zinc-400 font-medium">Active now • Studio Voice DSP</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-bold flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    <span>04:12</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 py-1">
                <div className="flex flex-col items-start max-w-[82%]">
                  <div className="px-3.5 py-2 rounded-2xl rounded-tl-sm bg-[#18181A] border border-white/15 text-xs text-zinc-100 shadow-sm">
                    Hey! Voice Isolation is super crisp, zero background noise! 🎧✨
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1 pl-1">10:42 PM</span>
                </div>

                <div className="flex flex-col items-end ml-auto max-w-[82%]">
                  <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-white text-black font-semibold text-xs shadow-md">
                    Yes! Built with real-time DSP filters & WebRTC 🚀
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1 pr-1">10:43 PM • Read</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                <div className="flex-1 bg-[#18181A] border border-white/15 rounded-xl px-3 py-2 text-xs text-zinc-400">
                  Message Alex...
                </div>
                <div className="p-2 rounded-xl bg-white text-black">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Key Feature Badges */}
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-white" />
              <span>Friend Privacy Guard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Real-Time WebSockets</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Monochrome Sign In Form Card */}
        <div className="w-full lg:col-span-5 mx-auto max-w-md">
          <div className="bg-[#0E0E10] rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
            
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold shadow-lg">
                  CU
                </div>
                <div>
                  <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    <span>ChatUs</span>
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-black bg-white px-1.5 py-0.5 rounded-md">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Secure Social Messenger</p>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your username and password to sign in
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Username (@handle)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Enter your @username"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141416] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-[#1A1A1E] transition"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-zinc-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-3.5 pr-10 py-2.5 bg-[#141416] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-[#1A1A1E] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#0E0E10] px-3 text-zinc-500 font-bold">or</span>
              </div>
            </div>

            {/* Create New Account Button */}
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className="w-full py-2.5 px-4 bg-[#141416] hover:bg-[#1E1E22] border border-white/15 text-white font-semibold rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Create an Account</span>
            </button>

            {/* Footer Trust Signal */}
            <div className="text-center pt-5 text-zinc-500 text-[10px] flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-white" />
              <span>Encrypted Session • High-Speed WebSockets</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
