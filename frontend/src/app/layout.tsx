import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Chain Host — Self-Hosted All-in-One Platform',
    description: 'A self-hostable all-in-one web platform combining website hosting, workflow management, email, dev tools, and blockchain integration.',
    keywords: ['self-hosted', 'platform', 'website hosting', 'blockchain', 'devops', 'email server'],
    authors: [{ name: 'Dev Loka', url: 'https://dev-loka.github.io' }],
    openGraph: {
        title: 'Chain Host — Self-Hosted All-in-One Platform',
        description: 'Deploy websites, manage workflows, send emails, and anchor data on-chain — all from one self-hosted dashboard.',
        type: 'website',
        siteName: 'Chain Host',
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
