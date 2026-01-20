'use client';

import { useState } from 'react';
import {
  X,
  Bot,
  User,
  Calendar,
  Hash,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Link2,
  FileText,
  Shield,
} from 'lucide-react';
import type { Memory } from '@/types';

interface MemoryViewerProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadAsContext: (memory: Memory) => void;
}

// Arc Network Explorer URL
const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

export default function MemoryViewer({
  memory,
  isOpen,
  onClose,
  onLoadAsContext,
}: MemoryViewerProps) {
  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversation' | 'details'>('conversation');

  if (!isOpen || !memory) return null;

  const handleCopyCid = () => {
    navigator.clipboard.writeText(memory.cid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const handleCopyTxHash = () => {
    if (memory.txHash) {
      navigator.clipboard.writeText(memory.txHash);
      setCopiedTxHash(true);
      setTimeout(() => setCopiedTxHash(false), 2000);
    }
  };

  const handleLoadContext = () => {
    onLoadAsContext(memory);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string, start = 10, end = 8) => {
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {memory.conversation.title || 'Saved Memory'}
              </h2>
              <p className="text-xs text-zinc-500">
                {memory.conversation.messages.length} messages • Saved on-chain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('conversation')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'conversation'
                ? 'text-zinc-100 border-b-2 border-teal-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversation
            </div>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-zinc-100 border-b-2 border-teal-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Transaction Details
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversation' ? (
            <div className="p-4 space-y-4">
              {memory.conversation.messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'bg-zinc-800/50 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Transaction Info Card */}
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <h3 className="font-medium">Blockchain Verification</h3>
                </div>

                {/* Timestamp */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500">Saved At</p>
                    <p className="text-sm text-zinc-300">{formatDate(memory.timestamp)}</p>
                  </div>
                </div>

                {/* Transaction Hash */}
                {memory.txHash && (
                  <div className="flex items-start gap-3">
                    <Link2 className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500">Transaction Hash</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded">
                          {truncateHash(memory.txHash)}
                        </code>
                        <button
                          onClick={handleCopyTxHash}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                          title="Copy transaction hash"
                        >
                          {copiedTxHash ? (
                            <Check className="w-3 h-3 text-teal-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-500" />
                          )}
                        </button>
                        <a
                          href={`${ARC_EXPLORER_URL}/tx/${memory.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                        >
                          View on Explorer
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* IPFS CID */}
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500">IPFS Content ID (CID)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded">
                        {truncateHash(memory.cid, 12, 8)}
                      </code>
                      <button
                        onClick={handleCopyCid}
                        className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        title="Copy CID"
                      >
                        {copiedCid ? (
                          <Check className="w-3 h-3 text-teal-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-500" />
                        )}
                      </button>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${memory.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                      >
                        View on IPFS
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Block Number (if available) */}
                {memory.blockNumber && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500">Block Number</p>
                      <p className="text-sm text-zinc-300 font-mono">{memory.blockNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Info */}
              <div className="p-4 bg-teal-500/5 rounded-lg border border-teal-500/10">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <div className="text-sm text-zinc-400 space-y-1">
                    <p className="text-teal-400 font-medium">Verified & Immutable</p>
                    <p>This memory is encrypted and stored on IPFS. The CID is recorded on Arc Network blockchain, making it tamper-proof and permanently verifiable.</p>
                  </div>
                </div>
              </div>

              {/* How to Verify */}
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">How to Verify</h4>
                <ol className="text-xs text-zinc-500 space-y-2 list-decimal list-inside">
                  <li>Click &quot;View on Explorer&quot; to see the transaction on Arc Network</li>
                  <li>The transaction contains the IPFS CID of your encrypted memory</li>
                  <li>Click &quot;View on IPFS&quot; to see the encrypted data (only you can decrypt it)</li>
                  <li>Your wallet signature is required to decrypt the memory</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-zinc-600">
            Permanently stored on IPFS & Arc Network
          </p>
          <button
            onClick={handleLoadContext}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg hover:bg-teal-500/20 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Load as AI Context
          </button>
        </div>
      </div>
    </div>
  );
}
