'use client';

import { useState, useEffect } from 'react';
import { X, Key, Info, Check, ExternalLink, Zap, Shield, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

const SETTINGS_KEY_PREFIX = 'dememo_settings_';

export interface UserSettings {
  groqApiKey: string;
}

export function getSettings(walletAddress: string): UserSettings {
  if (typeof window === 'undefined') return { groqApiKey: '' };
  const key = `${SETTINGS_KEY_PREFIX}${walletAddress.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Migration: rename geminiApiKey to groqApiKey if exists
    if (parsed.geminiApiKey && !parsed.groqApiKey) {
      parsed.groqApiKey = '';
      delete parsed.geminiApiKey;
    }
    return {
      groqApiKey: parsed.groqApiKey || '',
    };
  }
  return { groqApiKey: '' };
}

export function saveSettings(walletAddress: string, settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  const key = `${SETTINGS_KEY_PREFIX}${walletAddress.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(settings));
}

export default function SettingsModal({
  isOpen,
  onClose,
  walletAddress,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen && walletAddress) {
      const settings = getSettings(walletAddress);
      setApiKey(settings.groqApiKey || '');
      setSaved(false);
    }
  }, [isOpen, walletAddress]);

  const handleSave = () => {
    saveSettings(walletAddress, { groqApiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey('');
    saveSettings(walletAddress, { groqApiKey: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Key className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">API Settings</h2>
              <p className="text-xs text-zinc-500">Manage your AI access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`p-3 rounded-lg border ${
            hasKey 
              ? 'bg-teal-500/5 border-teal-500/20' 
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {hasKey ? (
                <>
                  <Check className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-teal-400">API key configured</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">API key required to chat</span>
                </>
              )}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Key className="w-4 h-4" />
              Groq API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 pr-20 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
            >
              Get a free API key at console.groq.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Info Boxes */}
          <div className="space-y-3">
            <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500">
                  <span className="text-teal-400">Groq is super fast!</span> Free tier with generous limits. No credit card required.
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500">
                  Choose your AI persona and model when starting a new chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear key
          </button>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-teal-400">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
