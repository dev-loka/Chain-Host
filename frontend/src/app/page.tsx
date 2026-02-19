'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
    {
        icon: '🌐',
        title: 'Website Hosting',
        desc: 'Deploy static & dynamic sites with automatic SSL, CDN, and IPFS pinning.',
        gradient: 'linear-gradient(135deg, #00d4aa, #3b82f6)',
    },
    {
        icon: '📧',
        title: 'Email Server',
        desc: 'Full email stack with SPF, DKIM, DMARC, anti-spam, and webmail client.',
        gradient: 'linear-gradient(135deg, #7b2ff7, #ec4899)',
    },
    {
        icon: '🔧',
        title: 'Developer Tools',
        desc: 'Git hosting (Forgejo), CI/CD pipelines, and n8n workflow automation.',
        gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
        icon: '⛓️',
        title: 'Blockchain',
        desc: 'Content integrity hashing, DID wallet login, and IPFS decentralized storage.',
        gradient: 'linear-gradient(135deg, #3b82f6, #7b2ff7)',
    },
    {
        icon: '📊',
        title: 'Monitoring',
        desc: 'Real-time Prometheus metrics, Grafana dashboards, and intelligent alerting.',
        gradient: 'linear-gradient(135deg, #22c55e, #3b82f6)',
    },
    {
        icon: '🛡️',
        title: 'Security',
        desc: 'CrowdSec threat intelligence, Fail2Ban, rate limiting, encrypted backups.',
        gradient: 'linear-gradient(135deg, #ef4444, #7b2ff7)',
    },
];

const STATS = [
    { label: 'Services', value: '22+' },
    { label: 'Networks', value: '5' },
    { label: 'Alert Rules', value: '12' },
    { label: 'Zero Trust', value: '100%' },
];

export default function LandingPage() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    return (
        <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Animated background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                background: `
          radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 212, 170, 0.06), transparent 40%),
          radial-gradient(600px circle at 80% 20%, rgba(123, 47, 247, 0.04), transparent 40%),
          var(--bg-primary)
        `,
            }} />

            {/* Grid overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* ── Header ──────────────────────── */}
                <motion.header
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 40px', maxWidth: 1400, margin: '0 auto',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, boxShadow: 'var(--shadow-glow)',
                        }}>
                            ⛓️
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
                            <span className="gradient-text">Chain</span>
                            <span style={{ color: 'var(--text-primary)' }}> Host</span>
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
                        <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>Architecture</a>
                        <a href="https://github.com/dev-loka/chain-host" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">GitHub</a>
                        <a href="/login" className="btn btn-primary btn-sm">Dashboard →</a>
                    </nav>
                </motion.header>

                {/* ── Hero ────────────────────────── */}
                <section style={{ textAlign: 'center', padding: '100px 40px 60px', maxWidth: 900, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div style={{
                            display: 'inline-block', padding: '6px 16px', borderRadius: 20,
                            background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.2)',
                            fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 24,
                        }}>
                            🚀 Self-Hosted • Open Source • Blockchain-Powered
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -2 }}
                    >
                        Your Entire Stack,{' '}
                        <span className="gradient-text">One Platform</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        style={{ fontSize: 20, color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}
                    >
                        Deploy websites, manage workflows, send emails, and anchor data on-chain — all from one self-hosted dashboard. No vendor lock-in. No surveillance.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <a href="/register" className="btn btn-primary btn-lg" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                            Get Started Free
                        </a>
                        <a href="https://github.com/dev-loka/chain-host" className="btn btn-secondary btn-lg" target="_blank" rel="noopener noreferrer">
                            ⭐ Star on GitHub
                        </a>
                    </motion.div>

                    {/* Terminal preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        style={{
                            marginTop: 60, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)', overflow: 'hidden', textAlign: 'left',
                            boxShadow: 'var(--shadow-lg)',
                        }}
                    >
                        <div style={{
                            padding: '12px 20px', background: 'var(--bg-tertiary)',
                            display: 'flex', gap: 8, alignItems: 'center',
                        }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                            <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                terminal
                            </span>
                        </div>
                        <div style={{ padding: 24, fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 2 }}>
                            <div><span style={{ color: 'var(--accent-cyan)' }}>$</span> git clone https://github.com/dev-loka/chain-host.git</div>
                            <div><span style={{ color: 'var(--accent-cyan)' }}>$</span> cd chain-host && cp .env.example .env</div>
                            <div><span style={{ color: 'var(--accent-cyan)' }}>$</span> docker compose up -d</div>
                            <div style={{ color: 'var(--accent-green)', marginTop: 8 }}>
                                ✅ 22 services started • Dashboard at https://your-domain.com
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ── Stats ───────────────────────── */}
                <section style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                                className="card"
                                style={{ textAlign: 'center', padding: 24 }}
                            >
                                <div className="gradient-text" style={{ fontSize: 36, fontWeight: 900 }}>{stat.value}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── Features ────────────────────── */}
                <section id="features" style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: 60 }}
                    >
                        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
                            Everything You Need, <span className="gradient-text">Nothing You Don't</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
                            Six integrated modules working in harmony. No SaaS bills, no data harvesting.
                        </p>
                    </motion.div>

                    <div className="grid-3">
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="card glass-hover"
                                style={{ cursor: 'default' }}
                            >
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14, background: feature.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, marginBottom: 20, boxShadow: `0 0 20px ${feature.gradient.includes('#00d4aa') ? 'rgba(0,212,170,0.2)' : 'rgba(123,47,247,0.2)'}`,
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{feature.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── Architecture ────────────────── */}
                <section id="architecture" style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: 60 }}
                    >
                        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
                            <span className="gradient-text-accent">Production-Grade</span> Architecture
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
                            22+ Docker services, 5 isolated networks, encrypted backups, and CrowdSec threat intelligence.
                        </p>
                    </motion.div>

                    <div className="grid-2">
                        {[
                            { title: 'Network Isolation', desc: 'Backend services run on internal-only networks. Databases are never exposed to the internet.', icon: '🔒' },
                            { title: 'Auto-SSL', desc: 'Let\'s Encrypt certificates provisioned automatically via Traefik with TLS 1.2+ enforcement.', icon: '🔐' },
                            { title: 'CrowdSec WAF', desc: 'Community-driven threat intelligence blocks malicious IPs before they reach your services.', icon: '🛡️' },
                            { title: 'Encrypted Backups', desc: 'Daily AES-256 encrypted backups of databases, email, and repos with 30-day retention.', icon: '💾' },
                            { title: 'BullMQ Workers', desc: 'Async job processing for deployments, emails, and blockchain operations. No request blocking.', icon: '⚡' },
                            { title: 'Prometheus + Grafana', desc: '12 alert rules, real-time dashboards, and autoscale triggers for production readiness.', icon: '📈' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="card"
                                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                            >
                                <div style={{
                                    width: 48, height: 48, minWidth: 48, borderRadius: 12,
                                    background: 'var(--bg-tertiary)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 24,
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── CTA ─────────────────────────── */}
                <section style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="card"
                        style={{
                            maxWidth: 800, margin: '0 auto', padding: '60px 40px',
                            background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.05), rgba(123, 47, 247, 0.05))',
                            border: '1px solid rgba(0, 212, 170, 0.15)',
                        }}
                    >
                        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
                            Ready to <span className="gradient-text">Own Your Stack</span>?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto 32px' }}>
                            Deploy Chain Host in under 5 minutes. Self-host everything.
                        </p>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="/register" className="btn btn-primary btn-lg">Deploy Now</a>
                            <a href="/docs" className="btn btn-secondary btn-lg">Read Docs</a>
                        </div>
                    </motion.div>
                </section>

                {/* ── Footer ──────────────────────── */}
                <footer style={{
                    padding: '40px', textAlign: 'center', borderTop: '1px solid var(--border-color)',
                    color: 'var(--text-muted)', fontSize: 14,
                }}>
                    <p>
                        Built with ❤️ by{' '}
                        <a href="https://dev-loka.github.io" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                            Dev Loka
                        </a>
                        {' • '}
                        <a href="https://github.com/dev-loka/chain-host" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            Source Code
                        </a>
                    </p>
                </footer>
            </div>
        </main>
    );
}
