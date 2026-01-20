/**
 * DeMemo Memory Management
 * Orchestrates encryption, IPFS storage, and blockchain recording
 */

import {
  encryptData,
  decryptData,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './encryption';
import { storeMemoryOnChain, getMemoriesFromChain } from './blockchain';
import type { Conversation, EncryptedMemory, Memory, SaveMemoryResult, LoadMemoriesResult } from '@/types';

const MEMORY_VERSION = '1.0.0';

/**
 * Save a conversation as an encrypted memory
 * 1. Encrypt with user's key
 * 2. Upload to IPFS via API
 * 3. Record CID on blockchain
 */
export async function saveMemory(
  conversation: Conversation,
  encryptionKey: CryptoKey,
  walletAddress: string
): Promise<SaveMemoryResult> {
  try {
    // Step 1: Encrypt the conversation
    console.log('Encrypting conversation...');
    const { encrypted, iv } = await encryptData(conversation, encryptionKey);

    // Step 2: Prepare encrypted memory object
    const encryptedMemory: EncryptedMemory = {
      encryptedData: arrayBufferToBase64(encrypted),
      iv: uint8ArrayToBase64(iv),
      timestamp: Date.now(),
      version: MEMORY_VERSION,
      walletAddress,
    };

    // Step 3: Upload to IPFS via API route
    console.log('Uploading to IPFS...');
    const ipfsResponse = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encryptedMemory),
    });

    if (!ipfsResponse.ok) {
      const error = await ipfsResponse.json();
      throw new Error(error.error || 'Failed to upload to IPFS');
    }

    const { cid } = await ipfsResponse.json();
    console.log('Uploaded to IPFS:', cid);

    // Step 4: Store CID on blockchain
    console.log('Recording on blockchain...');
    const txHash = await storeMemoryOnChain(cid);
    console.log('Transaction confirmed:', txHash);

    return {
      success: true,
      cid,
      txHash,
    };
  } catch (error) {
    console.error('Failed to save memory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Load all memories for a wallet
 * 1. Get CIDs from blockchain
 * 2. Fetch encrypted data from IPFS
 * 3. Decrypt with user's key
 */
export async function loadMemories(
  walletAddress: string,
  encryptionKey: CryptoKey
): Promise<LoadMemoriesResult> {
  try {
    // Step 1: Get CIDs from blockchain
    console.log('Fetching memories from blockchain...');
    const cids = await getMemoriesFromChain(walletAddress);

    if (cids.length === 0) {
      return {
        success: true,
        memories: [],
      };
    }

    console.log(`Found ${cids.length} memories`);

    // Step 2: Fetch and decrypt each memory
    const memories: Memory[] = [];

    for (const cid of cids) {
      try {
        // Skip empty CIDs (deleted memories)
        if (!cid || cid === '') continue;

        // Fetch from IPFS via API
        const ipfsResponse = await fetch(`/api/ipfs/retrieve?cid=${cid}`);

        if (!ipfsResponse.ok) {
          console.warn(`Failed to fetch CID ${cid}`);
          continue;
        }

        const encryptedMemory: EncryptedMemory = await ipfsResponse.json();

        // Decrypt the memory
        const encryptedBuffer = base64ToArrayBuffer(encryptedMemory.encryptedData);
        const iv = base64ToUint8Array(encryptedMemory.iv);

        const conversation = (await decryptData(
          encryptedBuffer,
          iv,
          encryptionKey
        )) as Conversation;

        memories.push({
          cid,
          conversation,
          timestamp: encryptedMemory.timestamp,
        });
      } catch (error) {
        console.warn(`Failed to decrypt memory ${cid}:`, error);
        // Continue with other memories
      }
    }

    console.log(`Successfully loaded ${memories.length} memories`);

    return {
      success: true,
      memories: memories.sort((a, b) => b.timestamp - a.timestamp),
    };
  } catch (error) {
    console.error('Failed to load memories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a new conversation object
 */
export function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Generate a title for a conversation based on its content
 */
export function generateConversationTitle(conversation: Conversation): string {
  const firstUserMessage = conversation.messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  return `Conversation ${new Date(conversation.createdAt).toLocaleDateString()}`;
}
