'use client';

import { useState } from 'react';
import { Wallet, Shield, Loader2, X } from 'lucide-react';
import type { WalletType } from '@/types';

interface WalletSelectorProps {
  onSelectMetaMask: () => Promise<void> | void;
  onSelectCircle: () => Promise<void> | void;
  isLoading: boolean;
  onClose: () => void;
}

export default function WalletSelector({
  onSelectMetaMask,
  onSelectCircle,
  isLoading,
  onClose,
}: WalletSelectorProps) {
  const [selectedType, setSelectedType] = useState<WalletType>(null);

  const handleSelect = async (type: WalletType) => {
    if (isLoading) return;
    setSelectedType(type);
    try {
      if (type === 'metamask') {
        await onSelectMetaMask();
      } else if (type === 'circle') {
        await onSelectCircle();
      }
    } catch (error) {
      console.error('Wallet selection error:', error);
      setSelectedType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-zinc-500 text-sm mb-6">
          Choose how you want to connect to DeMemo
        </p>

        {/* Wallet Options */}
        <div className="space-y-3">
          {/* MetaMask Option */}
          <button
            onClick={() => handleSelect('metamask')}
            disabled={isLoading}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
              selectedType === 'metamask'
                ? 'border-zinc-600 bg-zinc-800/50'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-zinc-100 font-medium">MetaMask</h3>
              <p className="text-sm text-zinc-500">
                Connect your own wallet
              </p>
            </div>
            {isLoading && selectedType === 'metamask' && (
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            )}
          </button>

          {/* Circle Wallet Option */}
          <button
            onClick={() => handleSelect('circle')}
            disabled={isLoading}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
              selectedType === 'circle'
                ? 'border-zinc-600 bg-zinc-800/50'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-zinc-100 font-medium">Circle Wallet</h3>
              <p className="text-sm text-zinc-500">
                Developer-controlled wallet
              </p>
            </div>
            {isLoading && selectedType === 'circle' && (
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">What&apos;s the difference?</h4>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• <span className="text-zinc-400">MetaMask:</span> You control your private keys</li>
            <li>• <span className="text-zinc-400">Circle:</span> Managed wallet, no browser extension needed</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-600 text-center mt-4">
          By connecting, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
