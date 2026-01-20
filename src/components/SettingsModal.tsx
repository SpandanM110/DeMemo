'use client';

import { useState, useEffect } from 'react';
import { X, Key, Info, Check, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

const SETTINGS_KEY_PREFIX = 'dememo_settings_';

export interface UserSettings {
  geminiApiKey: string;
}

export function getSettings(walletAddress: string): UserSettings {
  if (typeof window === 'undefined') return { geminiApiKey: '' };
  const key = `${SETTINGS_KEY_PREFIX}${walletAddress.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { geminiApiKey: '' };
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
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen && walletAddress) {
      const settings = getSettings(walletAddress);
      setGeminiKey(settings.geminiApiKey || '');
      setSaved(false);
    }
  }, [isOpen, walletAddress]);

  const handleSave = () => {
    saveSettings(walletAddress, { geminiApiKey: geminiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setGeminiKey('');
    saveSettings(walletAddress, { geminiApiKey: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Section */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <Key className="w-4 h-4" />
              Gemini API Key (BYOK)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
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
          </div>

          {/* Info Box */}
          <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-zinc-500 space-y-2">
                <p>
                  <span className="text-zinc-400">Without API key:</span> Limited to 5 messages per chat session.
                </p>
                <p>
                  <span className="text-zinc-400">With your own key:</span> Unlimited messages. Your key is stored locally and never sent to our servers.
                </p>
                <p className="text-xs">
                  Get a free API key at{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:underline"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Rate Limit Info */}
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400">
                Free tier: <span className="text-zinc-300">5 messages per session</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
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
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
