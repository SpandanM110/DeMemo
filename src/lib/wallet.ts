/**
 * DeMemo Wallet Utilities
 * Handles MetaMask connection and wallet state management
 */

import { deriveKeyFromSignature, getSigningMessage } from './encryption';
import { switchToArcNetwork, ARC_NETWORK, getUSDCBalance } from './blockchain';
import type { WalletState } from '@/types';

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<{
  address: string;
  chainId: number;
}> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect a wallet.');
    }

    const address = accounts[0];

    // Get current chain ID
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;

    return {
      address,
      chainId: parseInt(chainId, 16),
    };
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 4001) {
      throw new Error('Connection rejected. Please approve the connection in MetaMask.');
    }
    throw error;
  }
}

/**
 * Disconnect wallet (clear local state)
 */
export function disconnectWallet(): void {
  // MetaMask doesn't have a disconnect method
  // We just clear local state
  console.log('Wallet disconnected from app');
}

/**
 * Get the current connected account
 */
export async function getCurrentAccount(): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as string[];

    return accounts?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Sign a message to derive encryption key
 */
export async function signForEncryption(address: string): Promise<CryptoKey> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const message = getSigningMessage(address);

  try {
    // Request signature from user
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;

    // Derive encryption key from signature
    const encryptionKey = await deriveKeyFromSignature(signature);

    return encryptionKey;
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 4001) {
      throw new Error('Signature rejected. Encryption key cannot be derived without signing.');
    }
    throw error;
  }
}

/**
 * Full wallet connection flow with encryption key
 */
export async function fullWalletConnect(): Promise<WalletState> {
  // Step 1: Connect wallet
  const { address, chainId } = await connectWallet();

  // Step 2: Check and switch to Arc Network if needed
  if (chainId !== ARC_NETWORK.chainId) {
    await switchToArcNetwork();
  }

  // Step 3: Get USDC balance
  const balance = await getUSDCBalance(address);

  // Step 4: Sign message to derive encryption key
  const encryptionKey = await signForEncryption(address);

  return {
    address,
    isConnected: true,
    chainId: ARC_NETWORK.chainId,
    balance,
    encryptionKey,
  };
}

/**
 * Listen for account changes
 */
export function onAccountChange(callback: (accounts: string[]) => void): void {
  if (!window.ethereum) return;

  window.ethereum.on('accountsChanged', callback as (...args: unknown[]) => void);
}

/**
 * Listen for chain changes
 */
export function onChainChange(callback: (chainId: string) => void): void {
  if (!window.ethereum) return;

  window.ethereum.on('chainChanged', callback as (...args: unknown[]) => void);
}

/**
 * Remove account change listener
 */
export function removeAccountChangeListener(callback: (accounts: string[]) => void): void {
  if (!window.ethereum) return;

  window.ethereum.removeListener('accountsChanged', callback as (...args: unknown[]) => void);
}

/**
 * Remove chain change listener
 */
export function removeChainChangeListener(callback: (chainId: string) => void): void {
  if (!window.ethereum) return;

  window.ethereum.removeListener('chainChanged', callback as (...args: unknown[]) => void);
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}
