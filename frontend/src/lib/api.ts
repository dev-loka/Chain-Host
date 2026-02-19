const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });

        if (res.status === 401) {
            // Try refresh
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                const refreshRes = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    localStorage.setItem('token', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retryRes = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
                    if (!retryRes.ok) throw new Error('Unauthorized');
                    return retryRes.json();
                }
            }
            // Clear auth and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${res.status}`);
        }

        return res.json();
    }

    get<T>(path: string) {
        return this.request<T>(path);
    }

    post<T>(path: string, body: any) {
        return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
    }

    patch<T>(path: string, body: any) {
        return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
    }

    delete<T>(path: string) {
        return this.request<T>(path, { method: 'DELETE' });
    }

    async upload<T>(path: string, file: File, additionalData?: Record<string, string>): Promise<T> {
        const token = this.getToken();
        const formData = new FormData();
        formData.append('file', file);
        if (additionalData) {
            Object.entries(additionalData).forEach(([key, val]) => formData.append(key, val));
        }

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error);
        }

        return res.json();
    }
}

export const api = new ApiClient(API_URL);
