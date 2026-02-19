'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function RegisterPage() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirm) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

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
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.12,
                    background: 'radial-gradient(circle at 40% 40%, #7b2ff7, transparent 50%), radial-gradient(circle at 60% 60%, #00d4aa, transparent 50%)',
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-accent)', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, boxShadow: '0 0 30px rgba(123, 47, 247, 0.3)', marginBottom: 16,
                    }}>
                        ⛓️
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900 }}>
                        <span className="gradient-text-accent">Create Account</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Join Chain Host</p>
                </div>

                <motion.div className="card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--radius-md)', padding: 14, color: 'var(--accent-red)', fontSize: 14,
                                }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {(['username', 'email', 'password', 'confirm'] as const).map((field) => (
                            <div key={field}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    {field === 'confirm' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                                <input
                                    type={field.includes('password') || field === 'confirm' ? 'password' : field === 'email' ? 'email' : 'text'}
                                    value={form[field]}
                                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                    className="input"
                                    placeholder={
                                        field === 'username' ? 'chainmaster' :
                                            field === 'email' ? 'you@domain.com' : '••••••••'
                                    }
                                    required
                                />
                            </div>
                        ))}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 4, background: 'var(--gradient-accent)' }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
                        ← Back to landing page
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
