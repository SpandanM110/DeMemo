// DeMemo Type Definitions

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  title?: string;
}

// Chat Session - stored locally in localStorage
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isSaved: boolean; // Whether it's been saved to blockchain
  savedCid?: string; // IPFS CID if saved
  savedTxHash?: string; // Transaction hash if saved
  // Per-session AI configuration
  personaId?: string; // Selected persona for this chat
  modelId?: string; // Selected model for this chat
  customPrompt?: string; // Optional custom instructions for this chat
}

export interface EncryptedMemory {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  timestamp: number;
  version: string;
  walletAddress?: string;
}

export interface Memory {
  cid: string;
  conversation: Conversation;
  timestamp: number;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
}

// Transaction record for saved memories
export interface MemoryTransaction {
  cid: string;
  txHash: string;
  timestamp: number;
  title?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string | null;
  encryptionKey: CryptoKey | null;
}

export interface MemoryStats {
  totalMemories: number;
  totalConversations: number;
  storageUsed: string;
  lastUpdated: number | null;
}

// Ethereum window type augmentation
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
    };
  }
}

export interface SaveMemoryResult {
  success: boolean;
  cid?: string;
  txHash?: string;
  error?: string;
}

export interface LoadMemoriesResult {
  success: boolean;
  memories?: Memory[];
  error?: string;
}

// Circle Wallet Types
export interface CircleWalletState {
  walletId: string | null;
  address: string | null;
  isConnected: boolean;
  balance: string | null;
  blockchain: string | null;
  encryptionKey: CryptoKey | null;
}

export type WalletType = 'metamask' | 'circle' | null;
