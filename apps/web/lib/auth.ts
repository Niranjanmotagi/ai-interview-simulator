'use client';

import { create } from 'zustand';
import type { LoginInput, RegisterInput, UserDto } from '@ai-interview/types';
import { api, refreshSession, setAccessToken, setSessionHint } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: UserDto | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserDto) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',

  /** Silent re-auth on app mount via the httpOnly refresh cookie. */
  initialize: async () => {
    if (get().status === 'authenticated') {
      return;
    }
    const session = await refreshSession();
    if (session) {
      setSessionHint(true);
      set({ user: session.user, status: 'authenticated' });
    } else {
      setSessionHint(false);
      set({ user: null, status: 'guest' });
    }
  },

  login: async (input) => {
    const data = await api<{ accessToken: string; user: UserDto }>('/auth/login', {
      method: 'POST',
      body: input,
    });
    setAccessToken(data.accessToken);
    setSessionHint(true);
    set({ user: data.user, status: 'authenticated' });
  },

  register: async (input) => {
    const data = await api<{ accessToken: string; user: UserDto }>('/auth/register', {
      method: 'POST',
      body: input,
    });
    setAccessToken(data.accessToken);
    setSessionHint(true);
    set({ user: data.user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setSessionHint(false);
      set({ user: null, status: 'guest' });
    }
  },

  setUser: (user) => set({ user }),
}));
