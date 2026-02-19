'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Website = {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: string;
    siteType: string;
    updatedAt: string;
    deployments?: { id: string; version: number; status: string; createdAt: string }[];
};

const NAV_ITEMS = [
    { id: 'sites', icon: '🌐', label: 'Websites' },
    { id: 'email', icon: '📧', label: 'Email' },
    { id: 'git', icon: '📦', label: 'Git' },
    { id: 'workflows', icon: '🔧', label: 'Workflows' },
    { id: 'blockchain', icon: '⛓️', label: 'Blockchain' },
    { id: 'monitoring', icon: '📊', label: 'Monitoring' },
];

const STATUS_CONFIG: Record<string, { class: string; label: string }> = {
    LIVE: { class: 'badge-live', label: '● Live' },
    BUILDING: { class: 'badge-building', label: '◉ Building' },
    ERROR: { class: 'badge-error', label: '✕ Error' },
    DRAFT: { class: 'badge-draft', label: '◯ Draft' },
    DEPLOYING: { class: 'badge-building', label: '↻ Deploying' },
    SUSPENDED: { class: 'badge-error', label: '⊘ Suspended' },
};

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('sites');
    const [websites, setWebsites] = useState<Website[]>([]);
    const [user, setUser] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        else window.location.href = '/login';

        fetchWebsites();
        fetchHealth();
    }, []);

    const fetchWebsites = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/websites`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setWebsites(data.websites);
            }
        } catch {
            // Demo data for development
            setWebsites([
                { id: '1', name: 'Portfolio', slug: 'portfolio', status: 'LIVE', siteType: 'STATIC', updatedAt: new Date().toISOString(), deployments: [{ id: 'd1', version: 3, status: 'SUCCESS', createdAt: new Date().toISOString() }] },
                { id: '2', name: 'Blog', slug: 'blog', domain: 'blog.example.com', status: 'BUILDING', siteType: 'NEXTJS', updatedAt: new Date().toISOString(), deployments: [{ id: 'd2', version: 1, status: 'BUILDING', createdAt: new Date().toISOString() }] },
                { id: '3', name: 'API Docs', slug: 'api-docs', status: 'DRAFT', siteType: 'STATIC', updatedAt: new Date().toISOString(), deployments: [] },
            ]);
        }
    };

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
            if (res.ok) setHealth(await res.json());
        } catch {
            setHealth({ status: 'healthy', checks: { postgres: 'ok', redis: 'ok' }, uptime: 86400 });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ── Sidebar ───────────────────────── */}
            <motion.aside
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', padding: '20px 0',
                }}
            >
                {/* Logo */}
                <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--gradient-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                        ⛓️
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>
                        <span className="gradient-text">Chain</span> Host
                    </span>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '0 12px' }}>
                    {NAV_ITEMS.map((item) => (
                        <motion.button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            whileHover={{ x: 4 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                                background: activeTab === item.id ? 'var(--bg-tertiary)' : 'transparent',
                                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease', marginBottom: 4,
                                borderLeft: activeTab === item.id ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                            }}
                        >
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            {item.label}
                        </motion.button>
                    ))}
                </nav>

                {/* User */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                        }}>
                            👤
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username || 'Admin'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'USER'}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        Sign Out
                    </button>
                </div>
            </motion.aside>

            {/* ── Main Content ──────────────────── */}
            <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'sites' && (
                        <motion.div
                            key="sites"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <div>
                                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>Websites</h1>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {websites.length} site{websites.length !== 1 ? 's' : ''} deployed
                                    </p>
                                </div>
                                <button className="btn btn-primary">+ New Website</button>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid-4" style={{ marginBottom: 32 }}>
                                {[
                                    { label: 'Total Sites', value: websites.length, icon: '🌐', color: 'var(--accent-cyan)' },
                                    { label: 'Live', value: websites.filter(w => w.status === 'LIVE').length, icon: '✅', color: 'var(--accent-green)' },
                                    { label: 'Building', value: websites.filter(w => w.status === 'BUILDING').length, icon: '🔨', color: 'var(--accent-blue)' },
                                    { label: 'System', value: health?.status || '—', icon: '💚', color: health?.status === 'healthy' ? 'var(--accent-green)' : 'var(--accent-red)' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="card"
                                        style={{ padding: 20 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    {stat.label}
                                                </div>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 4 }}>
                                                    {stat.value}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 28 }}>{stat.icon}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Website Cards */}
                            <div className="grid-2">
                                {websites.map((site, i) => {
                                    const statusCfg = STATUS_CONFIG[site.status] || STATUS_CONFIG.DRAFT;
                                    const lastDeploy = site.deployments?.[0];
                                    return (
                                        <motion.div
                                            key={site.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 + i * 0.05 }}
                                            className="card glass-hover"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div>
                                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{site.name}</h3>
                                                    <code style={{
                                                        fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                                        background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block',
                                                    }}>
                                                        {site.domain || `${site.slug}.your-domain.com`}
                                                    </code>
                                                </div>
                                                <span className={`badge ${statusCfg.class}`}>{statusCfg.label}</span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                <span>📄 {site.siteType}</span>
                                                {lastDeploy && <span>🚀 v{lastDeploy.version}</span>}
                                                <span>🕐 {new Date(site.updatedAt).toLocaleDateString()}</span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                                <button className="btn btn-secondary btn-sm">Settings</button>
                                                <button className="btn btn-primary btn-sm">Deploy</button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'email' && (
                        <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📧 Email</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Manage email accounts and monitor deliverability.</p>
                            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📮</div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Webmail Access</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Access Roundcube webmail for your email accounts.</p>
                                <a href={`https://mail.${process.env.NEXT_PUBLIC_DOMAIN || 'your-domain.com'}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Open Webmail →
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'git' && (
                        <motion.div key="git" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📦 Git Hosting</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Self-hosted Git repositories with CI/CD.</p>
                            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔀</div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Forgejo Instance</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Manage repositories, pull requests, and CI/CD pipelines.</p>
                                <a href={`https://git.${process.env.NEXT_PUBLIC_DOMAIN || 'your-domain.com'}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Open Forgejo →
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'workflows' && (
                        <motion.div key="workflows" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🔧 Workflows</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Visual workflow automation with n8n.</p>
                            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>n8n Automation</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Create workflows for deployments, notifications, and integrations.</p>
                                <a href={`https://n8n.${process.env.NEXT_PUBLIC_DOMAIN || 'your-domain.com'}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Open n8n →
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'blockchain' && (
                        <motion.div key="blockchain" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>⛓️ Blockchain</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Content integrity and decentralized identity.</p>
                            <div className="grid-2">
                                <div className="card" style={{ padding: 32 }}>
                                    <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Content Hashing</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                                        Every deployment produces a SHA-256 hash anchored on-chain for tamper-proof verification.
                                    </p>
                                </div>
                                <div className="card" style={{ padding: 32 }}>
                                    <div style={{ fontSize: 36, marginBottom: 16 }}>🌍</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>IPFS Storage</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                                        Pin site content to IPFS for decentralized, censorship-resistant hosting.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'monitoring' && (
                        <motion.div key="monitoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📊 Monitoring</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Real-time metrics and alerting.</p>
                            <div className="grid-2" style={{ marginBottom: 32 }}>
                                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Grafana Dashboards</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>Pre-built dashboards for CPU, memory, HTTP, database, and container metrics.</p>
                                    <a href={`https://grafana.${process.env.NEXT_PUBLIC_DOMAIN || 'your-domain.com'}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                        Open Grafana →
                                    </a>
                                </div>
                                <div className="card" style={{ padding: 32 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>🎯</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>System Health</h3>
                                    {health && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {Object.entries(health.checks || {}).map(([key, val]) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
                                                    <span className={`badge ${val === 'ok' ? 'badge-live' : 'badge-error'}`}>
                                                        {val === 'ok' ? '● Healthy' : '✕ Error'}
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                                Uptime: {Math.floor((health.uptime || 0) / 3600)}h {Math.floor(((health.uptime || 0) % 3600) / 60)}m
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
