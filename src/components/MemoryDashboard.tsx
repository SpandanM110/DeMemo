'use client';

import { useState } from 'react';
import {
  Brain,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Save,
  Loader2,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { Memory, Conversation } from '@/types';
import { generateConversationTitle } from '@/lib/memory';

interface MemoryDashboardProps {
  memories: Memory[];
  currentConversation: Conversation | null;
  onSaveMemory: () => Promise<void>;
  isSaving: boolean;
  saveResult: { success: boolean; txHash?: string } | null;
  isConnected: boolean;
  memoryCount: number;
}

export default function MemoryDashboard({
  memories,
  currentConversation,
  onSaveMemory,
  isSaving,
  saveResult,
  isConnected,
  memoryCount,
}: MemoryDashboardProps) {
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [showAllMemories, setShowAllMemories] = useState(false);

  const displayedMemories = showAllMemories ? memories : memories.slice(0, 3);

  const canSave = currentConversation && currentConversation.messages.length >= 2;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border-l border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neural-500/20 to-memory-500/20 flex items-center justify-center border border-neural-500/30">
            <Brain className="w-5 h-5 text-neural-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Memory Bank</h2>
            <p className="text-sm text-slate-400">Your encrypted AI memories</p>
          </div>
        </div>

        {/* Stats */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Database className="w-3 h-3" />
                <span>Stored</span>
              </div>
              <p className="text-xl font-bold text-white">{memoryCount}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MessageSquare className="w-3 h-3" />
                <span>Current</span>
              </div>
              <p className="text-xl font-bold text-white">
                {currentConversation?.messages.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      {isConnected && (
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={onSaveMemory}
            disabled={!canSave || isSaving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              canSave
                ? 'bg-gradient-to-r from-neural-500 to-memory-500 text-white hover:from-neural-400 hover:to-memory-400 shadow-lg shadow-neural-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving to Blockchain...</span>
              </>
            ) : saveResult?.success ? (
              <>
                <Check className="w-5 h-5" />
                <span>Memory Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Memory (0.01 USDC)</span>
              </>
            )}
          </button>
          
          {saveResult?.success && saveResult.txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${saveResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 mt-2 text-sm text-neural-400 hover:text-neural-300"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {!canSave && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Have a conversation first to save a memory
            </p>
          )}
        </div>
      )}

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-400">
            Previous Memories
          </h3>
          {memories.length > 3 && (
            <button
              onClick={() => setShowAllMemories(!showAllMemories)}
              className="text-xs text-neural-400 hover:text-neural-300"
            >
              {showAllMemories ? 'Show Less' : `Show All (${memories.length})`}
            </button>
          )}
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">
              {isConnected
                ? 'No memories yet. Start a conversation and save it!'
                : 'Connect wallet to see your memories'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedMemories.map((memory) => (
              <div
                key={memory.cid}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedMemory(
                      expandedMemory === memory.cid ? null : memory.cid
                    )
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {generateConversationTitle(memory.conversation)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(memory.timestamp).toLocaleDateString()} •{' '}
                      {memory.conversation.messages.length} messages
                    </p>
                  </div>
                  {expandedMemory === memory.cid ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {expandedMemory === memory.cid && (
                  <div className="px-3 pb-3 border-t border-slate-700/50">
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {memory.conversation.messages.slice(0, 4).map((msg) => (
                        <div
                          key={msg.id}
                          className={`text-xs p-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-neural-500/10 text-neural-300'
                              : 'bg-slate-700/50 text-slate-300'
                          }`}
                        >
                          <span className="font-medium">
                            {msg.role === 'user' ? 'You: ' : 'AI: '}
                          </span>
                          <span className="line-clamp-2">{msg.content}</span>
                        </div>
                      ))}
                      {memory.conversation.messages.length > 4 && (
                        <p className="text-xs text-slate-500 text-center">
                          +{memory.conversation.messages.length - 4} more messages
                        </p>
                      )}
                    </div>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${memory.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-2 text-xs text-neural-400 hover:text-neural-300"
                    >
                      <span>View on IPFS</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
