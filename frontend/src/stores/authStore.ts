import { create } from 'zustand';

interface User {
    id: string;
    username: string;
    email?: string;
    walletAddress?: string;
    role: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (emailOrUsername: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
    setUser: (user: User) => void;
    hydrate: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,

    hydrate: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            set({
                token,
                refreshToken,
                user: JSON.parse(userStr),
                isAuthenticated: true,
            });
        }
    },

    login: async (emailOrUsername, password) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({
                user: data.user,
                token: data.accessToken,
                refreshToken: data.refreshToken,
                isAuthenticated: true,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (username, email, password) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            set({
                user: data.user,
                token: data.accessToken,
                refreshToken: data.refreshToken,
                isAuthenticated: true,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    logout: () => {
        const { token, refreshToken } = get();
        if (token && refreshToken) {
            fetch(`${API_URL}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => { });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },

    refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
            const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                set({ token: data.accessToken, refreshToken: data.refreshToken });
            } else {
                get().logout();
            }
        } catch {
            get().logout();
        }
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
}));
