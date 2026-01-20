/**
 * DeMemo Blockchain Utilities
 * Handles interaction with the MemoryStorage smart contract on Arc Network
 */

import { ethers } from 'ethers';

// Contract ABI - matches the Remix-deployed contract
const MEMORY_STORAGE_ABI = [
  {
    inputs: [{ internalType: 'string', name: '_cid', type: 'string' }],
    name: 'storeMemory',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserMemories',
    outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserMemoryCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserMemoriesDetailed',
    outputs: [
      { internalType: 'string[]', name: 'cids', type: 'string[]' },
      { internalType: 'uint256[]', name: 'timestamps', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMemoryPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'hasMemories',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'string', name: 'cid', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'MemoryStored',
    type: 'event',
  },
];

// Memory price in USDC (0.01 USDC = 10000 with 6 decimals)
const MEMORY_PRICE = '10000';

/**
 * Get the contract address from environment
 */
function getContractAddress(): string {
  const address = process.env.NEXT_PUBLIC_MEMORY_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error('Contract address not configured. Set NEXT_PUBLIC_MEMORY_CONTRACT_ADDRESS in .env.local');
  }
  return address;
}

/**
 * Get a read-only provider (doesn't require MetaMask)
 */
export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get ethers provider and signer from MetaMask
 */
export async function getProviderAndSigner(): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
}> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use DeMemo.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return { provider, signer };
}

/**
 * Store a memory CID on the blockchain
 * Requires payment of 0.01 USDC (native gas token on Arc)
 */
export async function storeMemoryOnChain(cid: string): Promise<string> {
  try {
    const { signer } = await getProviderAndSigner();
    const contractAddress = getContractAddress();

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      signer
    );

    // Send transaction with USDC payment
    const tx = await contract.storeMemory(cid, {
      value: MEMORY_PRICE,
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    return receipt.hash;
  } catch (error) {
    console.error('Blockchain storage error:', error);
    throw new Error('Failed to store memory on blockchain. Please ensure you have enough USDC for the transaction.');
  }
}

/**
 * Get all memory CIDs for a wallet address (read-only, no MetaMask needed)
 */
export async function getMemoriesFromChain(
  walletAddress: string
): Promise<string[]> {
  try {
    const provider = getReadOnlyProvider();
    const contractAddress = getContractAddress();

    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      provider
    );

    const cids = await contract.getUserMemories(walletAddress);
    return cids;
  } catch (error) {
    console.error('Blockchain query error:', error);
    throw new Error('Failed to query memories from blockchain');
  }
}

/**
 * Get memory count for a wallet (read-only, no MetaMask needed)
 */
export async function getMemoryCount(walletAddress: string): Promise<number> {
  try {
    const provider = getReadOnlyProvider();
    const contractAddress = getContractAddress();

    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      provider
    );

    const count = await contract.getUserMemoryCount(walletAddress);
    return Number(count);
  } catch (error) {
    console.error('Failed to get memory count:', error);
    return 0;
  }
}

/**
 * Get detailed memory information including timestamps (read-only, no MetaMask needed)
 */
export async function getMemoriesDetailed(
  walletAddress: string
): Promise<{ cids: string[]; timestamps: number[] }> {
  try {
    const provider = getReadOnlyProvider();
    const contractAddress = getContractAddress();

    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      provider
    );

    const [cids, timestamps] = await contract.getUserMemoriesDetailed(walletAddress);

    return {
      cids: cids,
      timestamps: timestamps.map((t: bigint) => Number(t)),
    };
  } catch (error) {
    console.error('Failed to get detailed memories:', error);
    return { cids: [], timestamps: [] };
  }
}

/**
 * Check if a wallet has any memories stored (read-only, no MetaMask needed)
 */
export async function hasMemories(walletAddress: string): Promise<boolean> {
  try {
    const provider = getReadOnlyProvider();
    const contractAddress = getContractAddress();

    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      provider
    );

    return await contract.hasMemories(walletAddress);
  } catch (error) {
    console.error('Failed to check memories:', error);
    return false;
  }
}

/**
 * Get the current memory price from the contract (read-only, no MetaMask needed)
 */
export async function getMemoryPrice(): Promise<string> {
  try {
    const provider = getReadOnlyProvider();
    const contractAddress = getContractAddress();

    const contract = new ethers.Contract(
      contractAddress,
      MEMORY_STORAGE_ABI,
      provider
    );

    const price = await contract.getMemoryPrice();
    // Convert from 6 decimals to readable format
    return (Number(price) / 1_000_000).toFixed(2);
  } catch (error) {
    console.error('Failed to get memory price:', error);
    return '0.01'; // Default fallback
  }
}

/**
 * Get the user's USDC balance on Arc Network (read-only, no MetaMask needed)
 */
export async function getUSDCBalance(walletAddress: string): Promise<string> {
  try {
    const provider = getReadOnlyProvider();
    const balance = await provider.getBalance(walletAddress);
    // USDC has 6 decimals on Arc
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0.00';
  }
}

/**
 * Arc Network configuration
 */
export const ARC_NETWORK = {
  chainId: parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '5042002'),
  chainIdHex: `0x${parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '5042002').toString(16)}`,
  name: 'Arc Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  currencySymbol: 'USDC',
  blockExplorer: 'https://testnet.arcscan.app',
};

/**
 * Switch MetaMask to Arc Network
 */
export async function switchToArcNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Try to switch to Arc Network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_NETWORK.chainIdHex }],
    });
    return true;
  } catch (switchError: unknown) {
    // If the network doesn't exist, add it
    if ((switchError as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARC_NETWORK.chainIdHex,
              chainName: ARC_NETWORK.name,
              nativeCurrency: {
                name: 'USDC',
                symbol: ARC_NETWORK.currencySymbol,
                decimals: 6,
              },
              rpcUrls: [ARC_NETWORK.rpcUrl],
              blockExplorerUrls: [ARC_NETWORK.blockExplorer],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Arc Network:', addError);
        throw new Error('Failed to add Arc Network to MetaMask');
      }
    }
    console.error('Failed to switch network:', switchError);
    throw new Error('Failed to switch to Arc Network');
  }
}
