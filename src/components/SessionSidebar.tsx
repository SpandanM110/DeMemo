'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Save,
  Check,
  Clock,
  MoreVertical,
  Edit3,
  Coins,
  ChevronLeft,
  ChevronRight,
  Settings,
  Database,
} from 'lucide-react';
import SavedMemoriesPanel from './SavedMemoriesPanel';
import type { ChatSession, Memory } from '@/types';

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onSaveToMemory: (sessionId: string) => void;
  isSaving: boolean;
  savingSessionId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  // New memory props
  memories: Memory[];
  isLoadingMemories: boolean;
  onRefreshMemories: () => void;
  onViewMemory: (memory: Memory) => void;
  onLoadMemoryAsContext: (memory: Memory) => void;
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onSaveToMemory,
  isSaving,
  savingSessionId,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  hasApiKey,
  memories,
  isLoadingMemories,
  onRefreshMemories,
  onViewMemory,
  onLoadMemoryAsContext,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [memoriesCollapsed, setMemoriesCollapsed] = useState(false);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setMenuOpenId(null);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(sessionId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
    }
  };

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

  // Collapsed sidebar
  if (isCollapsed) {
    return (
      <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-2">
          <button
            onClick={onNewSession}
            className="w-full p-3 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-all flex items-center justify-center"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.slice(0, 10).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-3 rounded-lg transition-all flex items-center justify-center ${
                activeSessionId === session.id
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'bg-zinc-800/30 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
              }`}
              title={session.title}
            >
              {session.isSaved ? (
                <Check className="w-4 h-4 text-teal-400" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>

        {/* Memories indicator */}
        {memories.length > 0 && (
          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={onToggleCollapse}
              className="w-full p-3 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center"
              title={`${memories.length} saved memories`}
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Settings */}
        <div className="p-2 border-t border-zinc-800">
          <button
            onClick={onOpenSettings}
            className={`w-full p-3 rounded-lg transition-all flex items-center justify-center ${
              hasApiKey 
                ? 'bg-teal-500/10 text-teal-400' 
                : 'bg-zinc-800/30 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            Chats
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-600">
              No chats yet. Start a new conversation!
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative rounded-lg transition-all ${
                activeSessionId === session.id
                  ? 'bg-zinc-800 border border-zinc-700'
                  : 'bg-zinc-800/30 border border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'
              }`}
            >
              {editingId === session.id ? (
                // Edit mode
                <div className="p-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    onBlur={() => handleSaveEdit(session.id)}
                    autoFocus
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ) : (
                // Normal mode
                <button
                  onClick={() => onSelectSession(session.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      session.isSaved
                        ? 'bg-teal-500/10 text-teal-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {session.isSaved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate text-sm ${
                        activeSessionId === session.id ? 'text-zinc-100' : 'text-zinc-300'
                      }`}>
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-xs text-zinc-600">
                          {formatTime(session.updatedAt)}
                        </span>
                        {session.messages.length > 0 && (
                          <span className="text-xs text-zinc-700">
                            · {session.messages.length} msg{session.messages.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Action Menu */}
              {editingId !== session.id && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === session.id ? null : session.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpenId === session.id && (
                    <div className="absolute right-0 top-8 w-48 py-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(session);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Rename
                      </button>
                      
                      {!session.isSaved && session.messages.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onSaveToMemory(session.id);
                          }}
                          disabled={isSaving}
                          className="w-full px-4 py-2 text-left text-sm text-teal-400 hover:bg-zinc-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving && savingSessionId === session.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4" />
                              Save to Memory (0.01 USDC)
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          onDeleteSession(session.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Saved badge */}
              {session.isSaved && (
                <div className="absolute right-2 bottom-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full">
                    <Save className="w-3 h-3 text-teal-400" />
                    <span className="text-xs text-teal-400">Saved</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Saved Memories Panel */}
      <SavedMemoriesPanel
        memories={memories}
        isLoading={isLoadingMemories}
        onRefresh={onRefreshMemories}
        onViewMemory={onViewMemory}
        onLoadAsContext={onLoadMemoryAsContext}
        isCollapsed={memoriesCollapsed}
        onToggleCollapse={() => setMemoriesCollapsed(!memoriesCollapsed)}
      />

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-3">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </div>
          {hasApiKey && (
            <span className="text-xs px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full">
              API Key Set
            </span>
          )}
        </button>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">
            {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
          </span>
          <span className="text-teal-400">
            {memories.length} memor{memories.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>
    </div>
  );
}
