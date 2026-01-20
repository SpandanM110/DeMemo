'use client';

import { useState } from 'react';
import {
  Database,
  Clock,
  MessageSquare,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Memory } from '@/types';

interface SavedMemoriesPanelProps {
  memories: Memory[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewMemory: (memory: Memory) => void;
  onLoadAsContext: (memory: Memory) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SavedMemoriesPanel({
  memories,
  isLoading,
  onRefresh,
  onViewMemory,
  onLoadAsContext,
  isCollapsed,
  onToggleCollapse,
}: SavedMemoriesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  // Filter memories by search query
  const filteredMemories = memories.filter((memory) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    // Search in title
    if (memory.conversation.title?.toLowerCase().includes(query)) return true;
    
    // Search in messages
    return memory.conversation.messages.some((msg) =>
      msg.content.toLowerCase().includes(query)
    );
  });

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getMemoryPreview = (memory: Memory) => {
    const firstUserMessage = memory.conversation.messages.find(
      (m) => m.role === 'user'
    );
    if (firstUserMessage) {
      const preview = firstUserMessage.content.slice(0, 60);
      return preview.length < firstUserMessage.content.length
        ? `${preview}...`
        : preview;
    }
    return 'No preview available';
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium">Saved Memories</span>
            <span className="text-xs text-zinc-600">({memories.length})</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <Database className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold">Saved Memories</span>
          <span className="text-xs text-zinc-600">({memories.length})</span>
          <ChevronUp className="w-4 h-4 text-zinc-600" />
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          title="Refresh memories"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      {memories.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      )}

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 max-h-60">
        {isLoading && memories.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-6">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                <p className="text-sm text-zinc-600">No memories match your search</p>
              </>
            ) : (
              <>
                <Database className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                <p className="text-sm text-zinc-600">No saved memories yet</p>
                <p className="text-xs text-zinc-700 mt-1">
                  Save a chat session to see it here
                </p>
              </>
            )}
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <div
              key={memory.cid}
              className="rounded-lg bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all"
            >
              {/* Memory Header */}
              <button
                onClick={() =>
                  setExpandedMemoryId(
                    expandedMemoryId === memory.cid ? null : memory.cid
                  )
                }
                className="w-full p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {memory.conversation.title || getMemoryPreview(memory)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-zinc-600">
                        {formatTime(memory.timestamp)}
                      </span>
                      <span className="text-xs text-zinc-700">
                        · {memory.conversation.messages.length} msgs
                      </span>
                    </div>
                  </div>
                  {expandedMemoryId === memory.cid ? (
                    <ChevronUp className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded Actions */}
              {expandedMemoryId === memory.cid && (
                <div className="px-3 pb-3 pt-0 space-y-2">
                  {/* Preview */}
                  <div className="p-2 bg-zinc-800/50 rounded-lg text-xs text-zinc-500">
                    <p className="line-clamp-2">{getMemoryPreview(memory)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewMemory(memory)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Full
                    </button>
                    <button
                      onClick={() => onLoadAsContext(memory)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg text-xs text-teal-400 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Use as Context
                    </button>
                  </div>

                  {/* CID Link */}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${memory.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <span className="font-mono">
                      {memory.cid.slice(0, 12)}...
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      {memories.length > 0 && (
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <AlertCircle className="w-3 h-3" />
            <span>Memories are encrypted & stored on IPFS</span>
          </div>
        </div>
      )}
    </div>
  );
}
