/**
 * Circle Developer-Controlled Wallets Integration
 * https://developers.circle.com/wallets/dev-controlled/create-your-first-wallet
 * 
 * This provides an alternative to MetaMask using Circle's custodial wallet infrastructure.
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import crypto from 'crypto';

// Types for Circle Wallet
export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  state: string;
  walletSetId: string;
  accountType: string;
  createDate: string;
}

export interface CircleWalletBalance {
  token: {
    symbol: string;
    name: string;
    decimals: number;
  };
  amount: string;
}

/**
 * Initialize Circle SDK client (server-side only)
 */
export function getCircleClient() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey) {
    throw new Error('CIRCLE_API_KEY not configured');
  }
  
  if (!entitySecret) {
    throw new Error('CIRCLE_ENTITY_SECRET not configured');
  }

  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
}

/**
 * Get the configured Wallet Set ID
 */
export function getWalletSetId(): string {
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  if (!walletSetId) {
    throw new Error('CIRCLE_WALLET_SET_ID not configured');
  }
  return walletSetId;
}

/**
 * Create a new wallet set
 * According to Circle docs, requires:
 * - name
 * - entitySecretCiphertext (fresh for each request) - SDK handles this internally
 * - idempotencyKey
 */
export async function createWalletSet(name: string): Promise<string> {
  const client = getCircleClient();
  
  // Generate idempotency key (required by Circle API)
  const idempotencyKey = crypto.randomUUID();
  
  // SDK handles entitySecretCiphertext internally using the entitySecret from env
  const response = await client.createWalletSet({
    name,
    idempotencyKey,
  } as any); // Type assertion needed as SDK types may not include all fields

  return response.data?.walletSet?.id || '';
}

/**
 * Generate a fresh Entity Secret Ciphertext for wallet operations
 * This is required for each wallet creation request
 */
async function generateEntitySecretCiphertext(): Promise<string> {
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!entitySecret) {
    throw new Error('CIRCLE_ENTITY_SECRET not configured');
  }

  // Get Circle's public key
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    throw new Error('CIRCLE_API_KEY not configured');
  }

  const publicKeyResponse = await fetch(
    'https://api.circle.com/v1/w3s/config/entity/publicKey',
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!publicKeyResponse.ok) {
    throw new Error('Failed to get Circle public key');
  }

  const publicKeyData = await publicKeyResponse.json();
  const publicKey = publicKeyData.data.publicKey;

  // Encrypt entity secret with Circle's public key
  // Note: This uses Node.js crypto, so it must run server-side
  const entitySecretBuffer = Buffer.from(entitySecret, 'hex');
  
  const encryptedEntitySecret = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    entitySecretBuffer
  );

  return encryptedEntitySecret.toString('base64');
}

/**
 * Create a new wallet in a wallet set
 * According to Circle docs, requires:
 * - walletSetId
 * - blockchains array
 * - count
 * - accountType
 * - entitySecretCiphertext (fresh for each request)
 * - idempotencyKey
 * 
 * Note: Arc Network is not directly supported by Circle. Use a supported testnet
 * like ETH-SEPOLIA or MATIC-AMOY. Users can bridge tokens to Arc Network if needed.
 */
export async function createWallet(
  walletSetId: string,
  blockchain: 'ETH-SEPOLIA' | 'MATIC-AMOY' | 'SOL-DEVNET' | 'ARB-SEPOLIA' | 'AVAX-FUJI' | 'BASE-SEPOLIA' = 'ETH-SEPOLIA'
): Promise<CircleWallet | null> {
  const client = getCircleClient();

  // Generate fresh entity secret ciphertext (required for each wallet creation)
  const entitySecretCiphertext = await generateEntitySecretCiphertext();

  // Generate idempotency key (required by Circle API)
  const idempotencyKey = crypto.randomUUID();

  // SDK may handle entitySecretCiphertext internally, but Circle API requires it
  // Using type assertion to pass required fields
  const response = await client.createWallets({
    walletSetId,
    blockchains: [blockchain],
    count: 1,
    accountType: 'EOA', // Externally Owned Account (simpler, works for EVM chains)
    entitySecretCiphertext, // Required by Circle API
    idempotencyKey,
  } as any); // Type assertion needed as SDK types may not expose all API fields

  const wallet = response.data?.wallets?.[0];
  if (!wallet) return null;

  return {
    id: wallet.id,
    address: wallet.address,
    blockchain: wallet.blockchain,
    state: wallet.state,
    walletSetId: wallet.walletSetId,
    accountType: (wallet as any).accountType || 'EOA', // SDK types may not include this
    createDate: wallet.createDate,
  };
}

/**
 * Get wallet by ID
 */
export async function getWallet(walletId: string): Promise<CircleWallet | null> {
  const client = getCircleClient();

  const response = await client.getWallet({ id: walletId });
  const wallet = response.data?.wallet;
  
  if (!wallet) return null;

  return {
    id: wallet.id,
    address: wallet.address,
    blockchain: wallet.blockchain,
    state: wallet.state,
    walletSetId: wallet.walletSetId,
    accountType: (wallet as { accountType?: string }).accountType || 'EOA',
    createDate: wallet.createDate,
  };
}

/**
 * Get all wallets in a wallet set
 */
export async function getWallets(walletSetId: string): Promise<CircleWallet[]> {
  const client = getCircleClient();

  const response = await client.listWallets({
    walletSetId,
  });

  return (response.data?.wallets || []).map((wallet) => ({
    id: wallet.id,
    address: wallet.address,
    blockchain: wallet.blockchain,
    state: wallet.state,
    walletSetId: wallet.walletSetId,
    accountType: (wallet as { accountType?: string }).accountType || 'EOA',
    createDate: wallet.createDate,
  }));
}

/**
 * Get wallet balances
 */
export async function getWalletBalances(walletId: string): Promise<CircleWalletBalance[]> {
  const client = getCircleClient();

  const response = await client.getWalletTokenBalance({ id: walletId });
  
  return (response.data?.tokenBalances || []).map((balance) => ({
    token: {
      symbol: balance.token.symbol || '',
      name: balance.token.name || '',
      decimals: balance.token.decimals || 0,
    },
    amount: balance.amount,
  }));
}

/**
 * Create a transaction from a Circle wallet
 */
export async function createTransaction(
  walletId: string,
  destinationAddress: string,
  amount: string,
  tokenId: string
): Promise<{ id: string; state: string }> {
  const client = getCircleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await client.createTransaction({
    walletId,
    destinationAddress,
    amount: [amount],
    tokenId,
    fee: {
      type: 'level',
      config: {
        feeLevel: 'MEDIUM',
      },
    },
  } as any);

  return {
    id: response.data?.id || '',
    state: response.data?.state || '',
  };
}

/**
 * Sign a message with a Circle wallet
 */
export async function signMessage(
  walletId: string,
  message: string
): Promise<string> {
  const client = getCircleClient();

  // Convert message to hex
  const messageHex = Buffer.from(message).toString('hex');

  const response = await client.signMessage({
    walletId,
    message: messageHex,
  });

  return response.data?.signature || '';
}

/**
 * Execute a contract call from Circle wallet
 */
export async function contractExecution(
  walletId: string,
  contractAddress: string,
  abiFunctionSignature: string,
  abiParameters: string[],
  amount?: string
): Promise<{ id: string; state: string }> {
  const client = getCircleClient();

  const response = await client.createContractExecutionTransaction({
    walletId,
    contractAddress,
    abiFunctionSignature,
    abiParameters,
    amount,
    fee: {
      type: 'level',
      config: {
        feeLevel: 'MEDIUM',
      },
    },
  });

  return {
    id: response.data?.id || '',
    state: response.data?.state || '',
  };
}
