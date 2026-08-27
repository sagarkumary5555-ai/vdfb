import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/index.js';
import { authApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  partnerUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; displayName?: string; avatarUrl?: string; bio?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarUrl?: string; customStatus?: string }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
      const usersData = await authApi.getUsers();
      setAllUsers(usersData.users);
    } catch {
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    try {
      const usersData = await authApi.getUsers();
      setAllUsers(usersData.users);
    } catch {
      // Ignore
    }
  };

  const register = async (regData: { username: string; password: string; displayName?: string; avatarUrl?: string; bio?: string }) => {
    const data = await authApi.register(regData);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    try {
      const usersData = await authApi.getUsers();
      setAllUsers(usersData.users);
    } catch {
      // Ignore
    }
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string; customStatus?: string }) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated.user);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.user.id ? updated.user : u)));
  };

  const changePassword = async (current: string, next: string) => {
    await authApi.changePassword(current, next);
  };

  const refreshUsers = async () => {
    try {
      const usersData = await authApi.getUsers();
      setAllUsers(usersData.users);
    } catch {
      // Ignore
    }
  };

  const partnerUser = allUsers.find((u) => u.id !== user?.id) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        partnerUser,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
