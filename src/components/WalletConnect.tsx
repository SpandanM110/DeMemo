'use client';

import { useState, useEffect } from 'react';
import { Wallet, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { formatAddress } from '@/lib/wallet';
import type { WalletState } from '@/types';

interface WalletConnectProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function WalletConnect({
  walletState,
  onConnect,
  onDisconnect,
  isLoading,
  error,
}: WalletConnectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);

  // Check for MetaMask only on client side after mount
  useEffect(() => {
    setHasMetaMask(
      typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
    );
  }, []);

  // Connected state
  if (walletState.isConnected && walletState.address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all"
        >
          <div className="w-2 h-2 bg-teal-400 rounded-full" />
          <span className="text-zinc-200 font-medium">
            {formatAddress(walletState.address)}
          </span>
          <div className="text-zinc-400 text-sm">
            {parseFloat(walletState.balance || '0').toFixed(2)} USDC
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500">Connected Wallet</p>
              <p className="text-sm text-zinc-200 font-mono">
                {formatAddress(walletState.address)}
              </p>
            </div>
            <button
              onClick={() => {
                onDisconnect();
                setShowDropdown(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onConnect}
        disabled={isLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 text-zinc-900 font-medium rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
