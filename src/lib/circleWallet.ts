/**
 * Circle Developer-Controlled Wallets Integration
 * https://developers.circle.com/wallets/dev-controlled/create-your-first-wallet
 * 
 * This provides an alternative to MetaMask using Circle's custodial wallet infrastructure.
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

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
 */
export async function createWalletSet(name: string): Promise<string> {
  const client = getCircleClient();
  
  const response = await client.createWalletSet({
    name,
  });

  return response.data?.walletSet?.id || '';
}

/**
 * Create a new wallet in a wallet set
 */
export async function createWallet(
  walletSetId: string,
  blockchain: string = 'ETH-SEPOLIA'
): Promise<CircleWallet | null> {
  const client = getCircleClient();

  const response = await client.createWallets({
    walletSetId,
    blockchains: [blockchain],
    count: 1,
    accountType: 'EOA', // Externally Owned Account
  });

  const wallet = response.data?.wallets?.[0];
  if (!wallet) return null;

  return {
    id: wallet.id,
    address: wallet.address,
    blockchain: wallet.blockchain,
    state: wallet.state,
    walletSetId: wallet.walletSetId,
    accountType: wallet.accountType,
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
    accountType: wallet.accountType,
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
    accountType: wallet.accountType,
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
      symbol: balance.token.symbol,
      name: balance.token.name,
      decimals: balance.token.decimals,
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
  tokenId?: string
): Promise<{ id: string; state: string }> {
  const client = getCircleClient();

  const response = await client.createTransaction({
    walletId,
    destinationAddress,
    amounts: [amount],
    tokenId, // If undefined, sends native token
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
