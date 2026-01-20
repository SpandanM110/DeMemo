/**
 * API Route: Circle Wallet Transactions
 * Handles blockchain transactions via Circle's developer-controlled wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { contractExecution, createTransaction } from '@/lib/circleWallet';

/**
 * POST - Execute transactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Store memory on blockchain using Circle wallet
    if (action === 'storeMemory') {
      const { walletId, contractAddress, cid } = body;

      if (!walletId || !contractAddress || !cid) {
        return NextResponse.json(
          { error: 'Wallet ID, contract address, and CID required' },
          { status: 400 }
        );
      }

      // Call storeMemory function on the contract
      const result = await contractExecution(
        walletId,
        contractAddress,
        'storeMemory(string)',
        [cid],
        '10000' // 0.01 USDC (6 decimals)
      );

      return NextResponse.json({
        success: true,
        transactionId: result.id,
        state: result.state,
      });
    }

    // Simple token transfer
    if (action === 'transfer') {
      const { walletId, destinationAddress, amount, tokenId } = body;

      if (!walletId || !destinationAddress || !amount) {
        return NextResponse.json(
          { error: 'Wallet ID, destination, and amount required' },
          { status: 400 }
        );
      }

      const result = await createTransaction(
        walletId,
        destinationAddress,
        amount,
        tokenId
      );

      return NextResponse.json({
        success: true,
        transactionId: result.id,
        state: result.state,
      });
    }

    // Generic contract call
    if (action === 'contractCall') {
      const {
        walletId,
        contractAddress,
        functionSignature,
        parameters,
        value,
      } = body;

      if (!walletId || !contractAddress || !functionSignature) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      const result = await contractExecution(
        walletId,
        contractAddress,
        functionSignature,
        parameters || [],
        value
      );

      return NextResponse.json({
        success: true,
        transactionId: result.id,
        state: result.state,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Circle transaction error:', error);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 }
    );
  }
}
