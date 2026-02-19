// ============================================================
// Chain Host — Blockchain Service (ethers.js v6)
// ============================================================

import { ethers } from 'ethers';
import { logger } from '../utils/logger';

class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://ganache:8545';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
        } else {
            // Generate ephemeral wallet for dev
            this.wallet = ethers.Wallet.createRandom().connect(this.provider);
            logger.warn('Using ephemeral wallet — set BLOCKCHAIN_PRIVATE_KEY for production');
        }
    }

    /**
     * Hash content and store the hash on-chain via a simple transaction
     */
    async hashContent(content: string): Promise<{
        contentHash: string;
        txHash: string;
        blockNumber: number | null;
        gasUsed: string | null;
    }> {
        const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

        try {
            // Send a transaction with the hash as data
            const tx = await this.wallet.sendTransaction({
                to: this.wallet.address, // self-transfer with data
                data: contentHash,
                value: 0,
            });

            const receipt = await tx.wait();

            return {
                contentHash,
                txHash: tx.hash,
                blockNumber: receipt?.blockNumber || null,
                gasUsed: receipt?.gasUsed?.toString() || null,
            };
        } catch (err) {
            logger.error('Blockchain hash error:', err);
            throw new Error('Failed to store hash on-chain');
        }
    }

    /**
     * Verify content matches a stored hash
     */
    verifyHash(content: string, storedHash: string): boolean {
        const computedHash = ethers.keccak256(ethers.toUtf8Bytes(content));
        return computedHash === storedHash;
    }

    /**
     * Get transaction details
     */
    async getTransaction(txHash: string) {
        return this.provider.getTransaction(txHash);
    }

    /**
     * Get current block number
     */
    async getBlockNumber(): Promise<number> {
        return this.provider.getBlockNumber();
    }

    /**
     * Get wallet balance
     */
    async getBalance(): Promise<string> {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }
}

export const blockchainService = new BlockchainService();
