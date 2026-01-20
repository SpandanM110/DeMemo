/**
 * API Route: Circle Developer-Controlled Wallet Operations
 * Handles wallet creation and management via Circle's API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createWallet,
  getWallet,
  getWallets,
  getWalletBalances,
  signMessage,
  getWalletSetId,
} from '@/lib/circleWallet';

/**
 * GET - Get wallet(s) info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const walletSetId = searchParams.get('walletSetId');
    const action = searchParams.get('action');

    // Get specific wallet
    if (walletId && action === 'info') {
      const wallet = await getWallet(walletId);
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, wallet });
    }

    // Get wallet balances
    if (walletId && action === 'balance') {
      const balances = await getWalletBalances(walletId);
      return NextResponse.json({ success: true, balances });
    }

    // Get all wallets in wallet set
    if (walletSetId) {
      const wallets = await getWallets(walletSetId);
      return NextResponse.json({ success: true, wallets });
    }

    // Use default wallet set from env
    const defaultWalletSetId = process.env.CIRCLE_WALLET_SET_ID;
    if (defaultWalletSetId) {
      const wallets = await getWallets(defaultWalletSetId);
      return NextResponse.json({ success: true, wallets });
    }

    return NextResponse.json(
      { error: 'Wallet ID or Wallet Set ID required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Circle wallet GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet info' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create wallet or sign message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Create new wallet
    if (action === 'create') {
      let walletSetId: string;
      
      try {
        walletSetId = body.walletSetId || process.env.CIRCLE_WALLET_SET_ID || '';
        if (!walletSetId) {
          throw new Error('Missing wallet set ID');
        }
      } catch {
        return NextResponse.json(
          { error: 'Wallet Set ID not configured. Please check your .env.local file and restart the server.' },
          { status: 400 }
        );
      }

      // Use Arc Testnet or fallback to ETH-SEPOLIA
      const blockchain = body.blockchain || 'ETH-SEPOLIA';
      const wallet = await createWallet(walletSetId, blockchain);

      if (!wallet) {
        return NextResponse.json(
          { error: 'Failed to create wallet' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        wallet,
      });
    }

    // Sign a message (for encryption key derivation)
    if (action === 'sign') {
      const { walletId, message } = body;

      if (!walletId || !message) {
        return NextResponse.json(
          { error: 'Wallet ID and message required' },
          { status: 400 }
        );
      }

      const signature = await signMessage(walletId, message);

      return NextResponse.json({
        success: true,
        signature,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Circle wallet POST error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
