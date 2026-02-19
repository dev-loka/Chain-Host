'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
            {/* Animated background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />
                <motion.div
                    style={{
                        position: 'absolute', inset: 0, opacity: 0.15,
                        background: 'radial-gradient(circle at 30% 50%, #00d4aa, transparent 50%), radial-gradient(circle at 70% 50%, #7b2ff7, transparent 50%)',
                    }}
                    animate={{
                        background: [
                            'radial-gradient(circle at 30% 50%, #00d4aa, transparent 50%), radial-gradient(circle at 70% 50%, #7b2ff7, transparent 50%)',
                            'radial-gradient(circle at 70% 30%, #3b82f6, transparent 50%), radial-gradient(circle at 30% 70%, #00d4aa, transparent 50%)',
                            'radial-gradient(circle at 50% 70%, #7b2ff7, transparent 50%), radial-gradient(circle at 50% 30%, #3b82f6, transparent 50%)',
                        ],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-primary)', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, boxShadow: 'var(--shadow-glow)', marginBottom: 16,
                    }}>
                        ⛓️
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text">Chain Host</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Sign in to your dashboard</p>
                </div>

                {/* Form */}
                <motion.div
                    className="card"
                    style={{ padding: 32 }}
                    whileHover={{ borderColor: 'rgba(0, 212, 170, 0.2)' }}
                >
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--radius-md)', padding: 14, color: 'var(--accent-red)', fontSize: 14,
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                Email or Username
                            </label>
                            <input
                                type="text"
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                className="input"
                                placeholder="admin@your-domain.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 4 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </motion.button>
                    </form>

                    {/* Wallet login divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                    </div>

                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => alert('Wallet login coming soon!')}
                    >
                        🔗 Sign In with Wallet (SIWE)
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            Don't have an account?{' '}
                            <Link href="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>
                                Register
                            </Link>
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ textAlign: 'center', marginTop: 24 }}
                >
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
                        ← Back to landing page
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
