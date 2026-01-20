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
 * Also caches the signature for session persistence
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

    // Cache signature for session persistence
    cacheEncryptionSignature(address, signature);

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
 * Cache encryption key signature in sessionStorage
 * This allows restoring wallet state on page reload without re-signing
 */
function cacheEncryptionSignature(address: string, signature: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `dememo_signature_${address.toLowerCase()}`;
    sessionStorage.setItem(key, signature);
  } catch (error) {
    console.warn('Failed to cache signature:', error);
  }
}

/**
 * Get cached encryption signature from sessionStorage
 */
function getCachedEncryptionSignature(address: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `dememo_signature_${address.toLowerCase()}`;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Clear cached encryption signature
 */
export function clearCachedEncryptionSignature(address: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `dememo_signature_${address.toLowerCase()}`;
    sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Restore wallet state from existing MetaMask connection (no signature required)
 * Use this on page load to check if wallet is already connected
 */
export async function restoreWalletConnection(): Promise<WalletState | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  try {
    // Check if MetaMask is already connected
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      return null; // Not connected
    }

    const address = accounts[0];

    // Get current chain ID
    const chainIdHex = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    const chainId = parseInt(chainIdHex, 16);

    // Note: We don't auto-switch chains on restore to avoid interrupting user
    // The user can switch manually if needed

    // Get balance (only if on Arc Network)
    let balance: string | null = null;
    if (chainId === ARC_NETWORK.chainId) {
      try {
        balance = await getUSDCBalance(address);
      } catch (error) {
        console.warn('Failed to get balance on restore:', error);
      }
    }

    // Try to restore encryption key from cache
    let encryptionKey: CryptoKey | null = null;
    const cachedSignature = getCachedEncryptionSignature(address);
    
    if (cachedSignature) {
      try {
        encryptionKey = await deriveKeyFromSignature(cachedSignature);
      } catch (error) {
        console.warn('Failed to restore encryption key from cache:', error);
        // Clear invalid cache
        clearCachedEncryptionSignature(address);
      }
    }

    // Only mark as connected if encryption key exists (user has authenticated)
    // This prevents showing chat interface before authentication
    return {
      address,
      isConnected: encryptionKey !== null, // Only connected if authenticated
      chainId,
      balance,
      encryptionKey, // May be null if no cached signature
    };
  } catch (error) {
    console.error('Failed to restore wallet connection:', error);
    return null;
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
  // Check cache first to avoid re-signing
  let encryptionKey: CryptoKey;
  const cachedSignature = getCachedEncryptionSignature(address);
  
  if (cachedSignature) {
    // Use cached signature to derive key (no user interaction needed)
    encryptionKey = await deriveKeyFromSignature(cachedSignature);
  } else {
    // Request new signature (will cache it automatically)
    encryptionKey = await signForEncryption(address);
  }

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
