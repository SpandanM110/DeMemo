'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Save, Coins, AlertTriangle, Settings, X, Key, Cpu } from 'lucide-react';
import type { Message, Memory, ChatSession } from '@/types';
import { PRESET_PERSONAS } from '@/lib/personas';
import { AVAILABLE_MODELS } from '@/lib/models';
import MarkdownMessage from './MarkdownMessage';

interface ChatInterfaceProps {
  session: ChatSession | null;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  memories: Memory[];
  activeMemoryContext?: Memory[];
  onRemoveFromContext?: (cid: string) => void;
  isConnected: boolean;
  onSaveToMemory?: () => void;
  isSaving?: boolean;
  saveError?: string | null;
  rateLimitError?: string | null;
  hasApiKey?: boolean;
  onOpenSettings?: () => void;
}

export default function ChatInterface({
  session,
  onSendMessage,
  isLoading,
  memories,
  activeMemoryContext = [],
  onRemoveFromContext,
  isConnected,
  onSaveToMemory,
  isSaving = false,
  saveError,
  rateLimitError,
  hasApiKey = false,
  onOpenSettings,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = session?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when session changes
  useEffect(() => {
    if (session && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConnected || !session) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Bot className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-zinc-500 max-w-md text-sm">
            Connect your wallet to start chatting with an AI that remembers you across sessions.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Select or Create a Chat
          </h3>
          <p className="text-zinc-500 max-w-md text-sm">
            Choose an existing conversation from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  // Get persona and model info for display
  const sessionPersona = PRESET_PERSONAS.find(p => p.id === session?.personaId) || PRESET_PERSONAS[0];
  const sessionModel = AVAILABLE_MODELS.find(m => m.id === session?.modelId) || AVAILABLE_MODELS[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Session Header */}
      <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-zinc-100 truncate max-w-md">
            {session.title}
          </h2>
          {/* Persona/Model badges */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-400" title={sessionPersona.description}>
              <span>{sessionPersona.icon}</span>
              <span className="hidden sm:inline">{sessionPersona.name}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-500" title={sessionModel.description}>
              <Cpu className="w-3 h-3" />
              <span className="hidden sm:inline">{sessionModel.name}</span>
            </span>
          </div>
          {session.isSaved && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full text-xs text-teal-400">
              <Save className="w-3 h-3" />
              On-chain
            </span>
          )}
        </div>
        
        {/* Save Button - Only show if not saved and has messages */}
        {!session.isSaved && messages.length > 0 && onSaveToMemory && (
          <button
            onClick={onSaveToMemory}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" />
                <span>Save to Memory (0.01 USDC)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Active Memory Context Banner */}
      {activeMemoryContext.length > 0 && (
        <div className="px-4 py-2 bg-teal-500/5 border-b border-teal-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-teal-400">
              <Sparkles className="w-4 h-4" />
              <span>
                Using {activeMemoryContext.length} memor{activeMemoryContext.length !== 1 ? 'ies' : 'y'} as context
              </span>
            </div>
            <div className="flex items-center gap-1">
              {activeMemoryContext.map((memory) => (
                <div
                  key={memory.cid}
                  className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full text-xs text-teal-400"
                >
                  <span className="max-w-24 truncate">
                    {memory.conversation.title || memory.cid.slice(0, 8)}
                  </span>
                  {onRemoveFromContext && (
                    <button
                      onClick={() => onRemoveFromContext(memory.cid)}
                      className="hover:bg-teal-500/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Memory Info Banner (when no active context but has saved memories) */}
      {activeMemoryContext.length === 0 && memories.length > 0 && (
        <div className="px-4 py-2 bg-zinc-800/30 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Sparkles className="w-4 h-4" />
            <span>
              {memories.length} saved memor{memories.length !== 1 ? 'ies' : 'y'} available
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">
              Load from sidebar to use as context
            </span>
          </div>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-200">{saveError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Error */}
      {rateLimitError && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-200">{rateLimitError}</p>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="mt-2 flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
                >
                  <Settings className="w-4 h-4" />
                  Open Settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Key Required Banner */}
      {!hasApiKey && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-200">Add your Groq API key in Settings to start chatting</p>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-1 text-sm bg-amber-400/20 text-amber-400 rounded-lg hover:bg-amber-400/30 transition-colors"
              >
                Open Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                {hasApiKey ? (
                  <Sparkles className="w-7 h-7 text-zinc-500" />
                ) : (
                  <Key className="w-7 h-7 text-zinc-500" />
                )}
              </div>
              <h3 className="text-base font-medium text-zinc-200 mb-1">
                {hasApiKey ? 'Start a Conversation' : 'Setup Required'}
              </h3>
              <p className="text-zinc-600 text-sm max-w-sm">
                {hasApiKey 
                  ? "Type a message below. When you're happy with this chat, save it to your on-chain memory!"
                  : "Add your free Groq API key in Settings to start chatting with AI. Get one at console.groq.com"}
              </p>
              {!hasApiKey && onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  Open Settings
                </button>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
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
              {message.role === 'assistant' ? (
                <MarkdownMessage content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}
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

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                <span className="text-zinc-500 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none text-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
