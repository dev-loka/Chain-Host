// ============================================================
// Chain Host — IPFS Service
// ============================================================

import { logger } from '../utils/logger';

class IpfsService {
    private apiUrl: string;
    private gatewayUrl: string;

    constructor() {
        this.apiUrl = process.env.IPFS_API_URL || 'http://ipfs:5001';
        this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://ipfs:8080';
    }

    /**
     * Pin content to IPFS
     */
    async pinContent(content: string | Buffer): Promise<{ cid: string; url: string }> {
        try {
            const formData = new FormData();
            const blob = new Blob([content]);
            formData.append('file', blob);

            const response = await fetch(`${this.apiUrl}/api/v0/add`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`IPFS add failed: ${response.statusText}`);
            }

            const result = await response.json();
            const cid = result.Hash;

            return {
                cid,
                url: `${this.gatewayUrl}/ipfs/${cid}`,
            };
        } catch (err) {
            logger.error('IPFS pin error:', err);
            throw new Error('Failed to pin content to IPFS');
        }
    }

    /**
     * Get content from IPFS
     */
    async getContent(cid: string): Promise<string> {
        const response = await fetch(`${this.gatewayUrl}/ipfs/${cid}`);
        if (!response.ok) {
            throw new Error(`IPFS get failed: ${response.statusText}`);
        }
        return response.text();
    }

    /**
     * Pin a file to IPFS
     */
    async pinFile(buffer: Buffer, filename: string): Promise<{ cid: string; url: string }> {
        try {
            const formData = new FormData();
            const blob = new Blob([buffer]);
            formData.append('file', blob, filename);

            const response = await fetch(`${this.apiUrl}/api/v0/add`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            return {
                cid: result.Hash,
                url: `${this.gatewayUrl}/ipfs/${result.Hash}`,
            };
        } catch (err) {
            logger.error('IPFS pin file error:', err);
            throw new Error('Failed to pin file to IPFS');
        }
    }

    /**
     * Check if IPFS node is connected
     */
    async isHealthy(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/api/v0/id`, {
                method: 'POST',
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const ipfsService = new IpfsService();
