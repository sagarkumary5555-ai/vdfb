import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Heart, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../Common/Avatar.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState<'sagar' | 'something'>('sagar');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(selectedUser, password);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-screen items-center justify-center app-bg overflow-y-auto p-4 sm:p-6 font-sans select-none">
      {/* Deep dark luxury overlay */}
      <div className="absolute inset-0 bg-[#090d16]/75 backdrop-blur-[8px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090d16]/50 via-transparent to-[#090d16]/90 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Glass Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl border border-white/12">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-rose/15 border border-brand-rose/30 mb-3 shadow-inner">
              <Heart className="w-7 h-7 text-brand-pink fill-brand-pink/50" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 drop-shadow-sm">
              Private Duo Space
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center justify-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-brand-emerald" />
              Exclusively for <span className="text-white font-semibold">Sagar</span> & <span className="text-white font-semibold">Something</span>
            </p>
          </div>

          {/* Account Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-dark-950/80 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedUser('sagar');
                setError(null);
              }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 ${
                selectedUser === 'sagar'
                  ? 'bg-slate-800 text-white shadow-md border border-white/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Avatar
                name="Sagar"
                username="sagar"
                avatarUrl="https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=1e293b"
                size="sm"
              />
              <div className="text-left truncate">
                <div className="text-xs font-semibold truncate text-white">Sagar</div>
                <div className="text-[10px] text-slate-400">@sagar</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedUser('something');
                setError(null);
              }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 ${
                selectedUser === 'something'
                  ? 'bg-brand-rose/25 text-white shadow-md border border-brand-rose/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Avatar
                name="Something"
                username="something"
                avatarUrl="https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=31102f"
                size="sm"
              />
              <div className="text-left truncate">
                <div className="text-xs font-semibold flex items-center gap-1 truncate text-white">
                  Something <span className="text-brand-pink text-xs">❤️</span>
                </div>
                <div className="text-[10px] text-slate-400">@something</div>
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-dark-950/80 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-pink transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-rose via-brand-pink to-brand-purple hover:opacity-95 text-white font-semibold rounded-xl shadow-lg shadow-brand-rose/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
