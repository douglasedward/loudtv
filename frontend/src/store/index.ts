import { create } from "zustand";
import { persist } from "zustand/middleware";

import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: (token: string, user: User) => {
        localStorage.setItem("auth_token", token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        set({ token: null, user: null, isAuthenticated: false });
      },
      setUser: (user: User) => set({ user }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface StreamState {
  currentStream: any | null;
  isWatching: boolean;
  quality: string;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  setCurrentStream: (stream: any) => void;
  setWatching: (watching: boolean) => void;
  setQuality: (quality: string) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  currentStream: null,
  isWatching: false,
  quality: "auto",
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  setCurrentStream: (currentStream) => set({ currentStream }),
  setWatching: (isWatching) => set({ isWatching }),
  setQuality: (quality) => set({ quality }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
}));

interface ChatState {
  messages: any[];
  isConnected: boolean;
  isChatVisible: boolean;
  addMessage: (message: any) => void;
  clearMessages: () => void;
  setConnected: (connected: boolean) => void;
  setChatVisible: (visible: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isConnected: false,
  isChatVisible: true,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-100), message], // Keep last 100 messages
    })),
  clearMessages: () => set({ messages: [] }),
  setConnected: (isConnected) => set({ isConnected }),
  setChatVisible: (isChatVisible) => set({ isChatVisible }),
}));
